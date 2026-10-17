"""Server-side quiz checking and submission.

The client never receives answer keys; it submits a response and the backend
grades it (``/check``) and, on completion, grades the full topic quiz and
persists the topic result to Supabase.
"""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, status

from app.api.deps import LearnerStateDep, RepositoryDep
from app.core.auth import CurrentUserDep
from app.models.assessment import (
    CheckRequest,
    CheckResponse,
    TopicQuizSubmitRequest,
    TopicQuizSubmitResponse,
)
from app.repositories.learner_state import SupabaseNotConfiguredError
from app.services import grading

logger = logging.getLogger("stem_mastery")

router = APIRouter(tags=["assessment"])


@router.post("/concepts/{concept_id}/quiz/check", response_model=CheckResponse)
async def check_question(
    concept_id: str,
    request: CheckRequest,
    repo: RepositoryDep,
    user: CurrentUserDep,
) -> CheckResponse:
    question = await repo.get_question_answer(request.questionId)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    correct = grading.grade_response(question, request.response)
    correct_option = grading.resolve_correct_option(question) if correct is not None else None
    return CheckResponse(
        questionId=request.questionId,
        correct=correct,
        correctOptionId=correct_option,
        explanation=None,
    )


@router.post("/topics/{topic_id}/quiz/submit", response_model=TopicQuizSubmitResponse)
async def submit_topic_quiz(
    topic_id: str,
    request: TopicQuizSubmitRequest,
    repo: RepositoryDep,
    learner_state: LearnerStateDep,
    user: CurrentUserDep,
) -> TopicQuizSubmitResponse:
    concept_ids = await repo.ordered_concept_ids(topic_id)
    if not concept_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")

    answers: dict[str, dict] = {}
    for concept_id in concept_ids:
        answers.update(await repo.list_question_answers(concept_id))
    if not answers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz questions are available for this topic.",
        )

    responses = {item.questionId: item.response for item in request.responses}
    results = [
        grading.grade_response(question, responses.get(question_id))
        for question_id, question in answers.items()
    ]
    summary = grading.summarise(results)
    total = int(summary["total"])
    score_pct = int(summary["scorePct"]) if total else 0
    correct = int(summary["correct"])
    passed = total > 0 and correct / total >= grading.QUIZ_PASS_RATIO

    try:
        await learner_state.upsert_topic_assessment(user.user_id, topic_id, score_pct, passed)
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Progress store is not configured.",
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Failed to persist topic quiz result for user %s", user.user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not persist progress.",
        ) from exc

    return TopicQuizSubmitResponse(
        topicId=topic_id,
        correct=correct,
        total=total,
        scorePct=score_pct,
        passed=passed,
    )
