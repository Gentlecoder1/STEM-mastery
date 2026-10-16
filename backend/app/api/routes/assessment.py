"""Server-side quiz checking and submission.

The client never receives answer keys; it submits a response and the backend
grades it (``/check``) and, on completion, grades the whole attempt and persists
the resulting mastery state to Supabase (``/submit``).
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
    QuizSubmitRequest,
    QuizSubmitResponse,
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


@router.post("/concepts/{concept_id}/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    concept_id: str,
    request: QuizSubmitRequest,
    repo: RepositoryDep,
    learner_state: LearnerStateDep,
    user: CurrentUserDep,
) -> QuizSubmitResponse:
    concept = await repo.get_concept(concept_id)
    if concept is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found.")

    answers = await repo.list_question_answers(concept_id)
    results: list[bool | None] = []
    for item in request.responses:
        question = answers.get(item.questionId)
        if question is None:
            continue
        results.append(grading.grade_response(question, item.response))

    summary = grading.summarise(results)
    passed = bool(summary["passed"])
    score_pct = int(summary["scorePct"])
    topic_id = concept.get("topicId")

    try:
        if passed:
            await learner_state.mark_concepts_completed(user.user_id, [concept_id])
        if topic_id:
            await learner_state.upsert_topic_assessment(
                user.user_id, topic_id, score_pct, passed
            )
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Progress store is not configured.",
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Failed to persist quiz result for user %s", user.user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not persist progress.",
        ) from exc

    next_concept_id: str | None = None
    if topic_id:
        ordered = await repo.ordered_concept_ids(topic_id)
        if concept_id in ordered:
            index = ordered.index(concept_id)
            if index + 1 < len(ordered):
                next_concept_id = ordered[index + 1]

    return QuizSubmitResponse(
        conceptId=concept_id,
        topicId=topic_id,
        correct=int(summary["correct"]),
        total=int(summary["total"]),
        scorePct=score_pct,
        passed=passed,
        nextConceptId=next_concept_id,
    )
