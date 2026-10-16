"""Request/response models for syncing offline lesson reading progress."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LessonProgressItem(BaseModel):
    conceptId: str
    lessonId: str | None = None
    progressPercent: int = 0
    lastSection: str | None = None
    lessonCompleted: bool = False
    quizPending: bool = False
    completedOffline: bool = False
    startedAt: str | None = None
    lastOpenedAt: str | None = None
    updatedAt: str | None = None


class ProgressSyncRequest(BaseModel):
    items: list[LessonProgressItem] = Field(default_factory=list)


class ProgressSyncResponse(BaseModel):
    synced: list[str] = Field(default_factory=list)
    serverState: list[LessonProgressItem] = Field(default_factory=list)
