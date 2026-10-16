"""Offline lesson reading-progress sync.

The mobile app queues reading progress while offline and flushes it here on
reconnect. Identity comes from the verified JWT (never the body). The merge is
last-write-wins with monotonic guarantees (see ``app.services.progress``).
"""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, status

from app.api.deps import LearnerStateDep
from app.core.auth import CurrentUserDep
from app.models.progress import LessonProgressItem, ProgressSyncRequest, ProgressSyncResponse
from app.repositories.learner_state import SupabaseNotConfiguredError
from app.services.progress import merge_lesson_progress

logger = logging.getLogger("stem_mastery")

router = APIRouter(tags=["progress"])


def _to_item(row: dict) -> LessonProgressItem:
    return LessonProgressItem(
        conceptId=str(row.get("concept_id")),
        lessonId=row.get("lesson_id"),
        progressPercent=int(row.get("progress_percent") or 0),
        lastSection=row.get("last_section"),
        lessonCompleted=bool(row.get("lesson_completed")),
        quizPending=bool(row.get("quiz_pending")),
        completedOffline=bool(row.get("completed_offline")),
        startedAt=row.get("started_at"),
        lastOpenedAt=row.get("last_opened_at"),
        updatedAt=row.get("updated_at"),
    )


@router.post("/progress/sync", response_model=ProgressSyncResponse)
async def sync_progress(
    request: ProgressSyncRequest,
    learner_state: LearnerStateDep,
    user: CurrentUserDep,
) -> ProgressSyncResponse:
    try:
        existing = await learner_state.load_lesson_progress(user.user_id)
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Progress store is not configured.",
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Failed to load lesson progress for user %s", user.user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not load progress.",
        ) from exc

    merged: list[dict] = []
    for item in request.items:
        if not item.conceptId:
            continue
        merged.append(merge_lesson_progress(existing.get(item.conceptId), item))

    try:
        await learner_state.upsert_lesson_progress(user.user_id, merged)
    except SupabaseNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Progress store is not configured.",
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Failed to sync lesson progress for user %s", user.user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not sync progress.",
        ) from exc

    return ProgressSyncResponse(
        synced=[str(row["concept_id"]) for row in merged],
        serverState=[_to_item(row) for row in merged],
    )
