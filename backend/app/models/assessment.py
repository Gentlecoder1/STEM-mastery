"""Request/response models for server-side assessment.

Answer keys never appear in these models. A ``/check`` call returns correctness
for a single already-answered question (feedback), and topic quiz submission
returns the aggregate grade after the backend has persisted the topic result.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.catalog import ConceptRef


class CheckRequest(BaseModel):
    questionId: str
    selectedOption: str | None = None
    response: str | None = None


class CheckResponse(BaseModel):
    questionId: str
    conceptId: str
    correct: bool | None = None
    correctOptionId: str | None = None
    explanation: str | None = None
    prerequisites: list[ConceptRef] = Field(default_factory=list)
    relatedConcepts: list[ConceptRef] = Field(default_factory=list)


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


class ConceptQuizSubmitRequest(BaseModel):
    responses: list[QuizResponseItem] = Field(default_factory=list)


class ConceptQuestionResult(BaseModel):
    questionId: str
    conceptId: str
    correct: bool


class ConceptQuizSubmitResponse(BaseModel):
    conceptId: str
    correct: int
    total: int
    scorePct: int
    passed: bool
    questionResults: list[ConceptQuestionResult] = Field(default_factory=list)
    prerequisites: list[ConceptRef] = Field(default_factory=list)
    relatedConcepts: list[ConceptRef] = Field(default_factory=list)
