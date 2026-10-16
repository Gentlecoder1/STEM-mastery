"""Request/response models for the placement diagnostic."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.catalog import QuestionOption


class PlacementQuestion(BaseModel):
    id: str
    type: str | None = None
    prompt: str | None = None
    difficultyLevel: str | None = None
    options: list[QuestionOption] = Field(default_factory=list)
    conceptId: str | None = None
    subjectId: str | None = None


class PlacementAnswer(BaseModel):
    questionId: str
    response: str | None = None


class PlacementSubmitRequest(BaseModel):
    answers: list[PlacementAnswer] = Field(default_factory=list)


class PlacementSubjectResult(BaseModel):
    subjectId: str
    correct: int
    total: int
    scorePct: int
    passed: bool


class PlacementSubmitResponse(BaseModel):
    results: list[PlacementSubjectResult] = Field(default_factory=list)
    conceptMastery: dict[str, float] = Field(default_factory=dict)
    recommendedStartConceptId: str | None = None
