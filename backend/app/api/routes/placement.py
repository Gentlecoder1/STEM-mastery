"""Placement diagnostic: balanced question selection and server-side scoring.

Questions are sampled from the graph's question bank with controlled randomness
(spread across concepts, at most two per concept, difficulty mix) and graded on
the server. The response includes a per-concept mastery estimate and the
recommended starting concept derived from prerequisite order.
"""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import LearnerStateDep, RepositoryDep
from app.core.auth import CurrentUserDep
from app.models.catalog import QuestionOption
from app.models.placement import (
    PlacementQuestion,
    PlacementSubjectResult,
    PlacementSubmitRequest,
    PlacementSubmitResponse,
)
from app.repositories.learner_state import SupabaseNotConfiguredError
from app.services import grading
from app.services.placement import select_placement_questions

logger = logging.getLogger("stem_mastery")

router = APIRouter(tags=["placement"])

_PASS_RATIO = 0.6


@router.get("/placement/questions", response_model=list[PlacementQuestion])
async def placement_questions(
    repo: RepositoryDep,
    subjects: str | None = Query(default=None, description="Comma-separated subject ids"),
    count: int = Query(default=10, ge=1, le=50),
) -> list[PlacementQuestion]:
    if subjects:
        subject_ids = [part.strip() for part in subjects.split(",") if part.strip()]
    else:
        subject_ids = [str(row["id"]) for row in await repo.list_subjects()]

    candidates: list[dict] = []
    for subject_id in subject_ids:
        candidates.extend(await repo.placement_candidates(subject_id))

    selected = select_placement_questions(candidates, count)
    return [
        PlacementQuestion(
            id=item["id"],
            type=item.get("type"),
            prompt=item.get("prompt"),
            difficultyLevel=item.get("difficultyLevel"),
            options=[QuestionOption(**option) for option in item.get("options", [])],
            conceptId=item.get("conceptId"),
            subjectId=item.get("subjectId"),
        )
        for item in selected
    ]


@router.post("/placement/submit", response_model=PlacementSubmitResponse)
async def submit_placement(
    request: PlacementSubmitRequest,
    repo: RepositoryDep,
    learner_state: LearnerStateDep,
    user: CurrentUserDep,
) -> PlacementSubmitResponse:
    subject_correct: dict[str, int] = {}
    subject_total: dict[str, int] = {}
    concept_correct: dict[str, int] = {}
    concept_total: dict[str, int] = {}

    for answer in request.answers:
        question = await repo.get_question_answer(answer.questionId)
        if question is None:
            continue
        correct = grading.grade_response(question, answer.response)
        if correct is None:
            continue
        subject_id = question.get("subjectId") or "unknown"
        concept_id = question.get("conceptId") or "unknown"
        subject_total[subject_id] = subject_total.get(subject_id, 0) + 1
        concept_total[concept_id] = concept_total.get(concept_id, 0) + 1
        if correct:
            subject_correct[subject_id] = subject_correct.get(subject_id, 0) + 1
            concept_correct[concept_id] = concept_correct.get(concept_id, 0) + 1

    results: list[PlacementSubjectResult] = []
    for subject_id, total in subject_total.items():
        correct = subject_correct.get(subject_id, 0)
        score_pct = round((correct / total) * 100) if total else 0
        results.append(
            PlacementSubjectResult(
                subjectId=subject_id,
                correct=correct,
                total=total,
                scorePct=score_pct,
                passed=score_pct >= _PASS_RATIO * 100,
            )
        )

    concept_mastery = {
        concept_id: round(concept_correct.get(concept_id, 0) / total, 3)
        for concept_id, total in concept_total.items()
        if total
    }

    recommended: str | None = None
    if results:
        weakest = min(results, key=lambda result: result.scorePct)
        ordered = await repo.ordered_subject_concepts(weakest.subjectId)
        for concept in ordered:
            if concept_mastery.get(str(concept["id"]), 0.0) < 1.0:
                recommended = str(concept["id"])
                break
        if recommended is None and ordered:
            recommended = str(ordered[0]["id"])

    placement_payload = {
        "subjects": {
            result.subjectId: {
                "subjectId": result.subjectId,
                "correct": result.correct,
                "total": result.total,
                "scorePct": result.scorePct,
                "passed": result.passed,
            }
            for result in results
        },
        "conceptMastery": concept_mastery,
        "recommendedStartConceptId": recommended,
    }

    try:
        await learner_state.save_placement(user.user_id, placement_payload)
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Progress store is not configured.",
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Failed to persist placement for user %s", user.user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not persist placement.",
        ) from exc

    return PlacementSubmitResponse(
        results=results,
        conceptMastery=concept_mastery,
        recommendedStartConceptId=recommended,
    )
