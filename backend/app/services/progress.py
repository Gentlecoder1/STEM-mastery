"""Last-write-wins merge for lesson reading progress.

Guarantees: ``progress_percent`` never decreases, ``lesson_completed`` and
``completed_offline`` are monotonic (never revert true→false), and the newer
``updated_at`` wins for fields that can legitimately change either way
(``last_section``, ``quiz_pending``). Timestamps are clamped to their extremes
so a stale client clock cannot move ``started_at``/``last_opened_at`` backwards.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app.models.progress import LessonProgressItem


def _parse_ts(value: object) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip().replace("Z", "+00:00")
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed


def _iso(value: datetime | None) -> str | None:
    return value.astimezone(UTC).isoformat() if value else None


def merge_lesson_progress(
    existing: dict | None, incoming: LessonProgressItem
) -> dict[str, object]:
    now = datetime.now(UTC)
    existing = existing or {}

    incoming_updated = _parse_ts(incoming.updatedAt) or now
    existing_updated = _parse_ts(existing.get("updated_at"))
    incoming_newer = existing_updated is None or incoming_updated >= existing_updated

    progress_percent = max(
        int(existing.get("progress_percent") or 0), int(incoming.progressPercent or 0)
    )
    lesson_completed = bool(existing.get("lesson_completed")) or bool(incoming.lessonCompleted)
    completed_offline = bool(existing.get("completed_offline")) or bool(incoming.completedOffline)

    last_section = incoming.lastSection if incoming_newer else existing.get("last_section")
    quiz_pending = (
        bool(incoming.quizPending) if incoming_newer else bool(existing.get("quiz_pending"))
    )

    started_candidates = [
        ts for ts in (_parse_ts(existing.get("started_at")), _parse_ts(incoming.startedAt)) if ts
    ]
    opened_candidates = [
        ts
        for ts in (_parse_ts(existing.get("last_opened_at")), _parse_ts(incoming.lastOpenedAt))
        if ts
    ]
    updated_candidates = [ts for ts in (incoming_updated, existing_updated) if ts]

    return {
        "concept_id": incoming.conceptId,
        "lesson_id": incoming.lessonId or existing.get("lesson_id") or incoming.conceptId,
        "progress_percent": progress_percent,
        "last_section": last_section,
        "lesson_completed": lesson_completed,
        "quiz_pending": quiz_pending,
        "completed_offline": completed_offline,
        "started_at": _iso(min(started_candidates)) if started_candidates else None,
        "last_opened_at": _iso(max(opened_candidates)) if opened_candidates else None,
        "updated_at": _iso(max(updated_candidates)),
    }
