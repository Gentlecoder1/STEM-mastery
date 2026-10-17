"""Request/response models for server-side assessment.

Answer keys never appear in these models. A ``/check`` call returns correctness
for a single already-answered question (feedback), and topic quiz submission
returns the aggregate grade after the backend has persisted the topic result.
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


class TopicQuizSubmitRequest(BaseModel):
    responses: list[QuizResponseItem] = Field(default_factory=list)


class TopicQuizSubmitResponse(BaseModel):
    topicId: str
    correct: int
    total: int
    scorePct: int
    passed: bool
