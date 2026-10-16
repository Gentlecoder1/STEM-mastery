"""Request/response models for server-side assessment.

Answer keys never appear in these models. A ``/check`` call returns correctness
for a single already-answered question (feedback), and ``/submit`` returns the
aggregate grade after the backend has persisted the mastery result.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class CheckRequest(BaseModel):
    questionId: str
    response: str | None = None


class CheckResponse(BaseModel):
    questionId: str
    correct: bool | None = None
    correctOptionId: str | None = None
    explanation: str | None = None


class QuizResponseItem(BaseModel):
    questionId: str
    response: str | None = None


class QuizSubmitRequest(BaseModel):
    responses: list[QuizResponseItem] = Field(default_factory=list)
    mode: str = "lesson"
    targetConceptId: str | None = None


class QuizSubmitResponse(BaseModel):
    conceptId: str
    topicId: str | None = None
    correct: int
    total: int
    scorePct: int
    passed: bool
    nextConceptId: str | None = None
