"""Response models for the public catalog.

Field names intentionally mirror the React Native app's existing TypeScript
types (``frontend/src/data/learning.ts``) so screens can switch from bundled
mock data to the API with minimal change.

Assessment-integrity note: correct answers (``correctOption``,
``correctAnswer``, ``referenceAnswer``) are deliberately NOT part of these
models — grading happens server-side.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Subject(BaseModel):
    id: str
    name: str
    iri: str | None = None


class Topic(BaseModel):
    id: str
    name: str
    iri: str | None = None


class ConceptRef(BaseModel):
    id: str
    name: str | None = None


class ConceptSummary(BaseModel):
    id: str
    name: str | None = None
    prefLabel: str | None = None
    iri: str | None = None
    prerequisites: list[ConceptRef] = Field(default_factory=list)


class LearningContent(BaseModel):
    id: str
    conceptId: str
    title: str | None = None
    contentText: str | None = None
    contentType: str | None = None
    chapterOrder: int | None = None
    mediaURI: str | None = None


class QuestionOption(BaseModel):
    id: str
    label: str | None = None
    text: str | None = None


class Question(BaseModel):
    """A catalog question with answers withheld (graded server-side)."""

    id: str
    type: str | None = None
    prompt: str | None = None
    difficultyLevel: str | None = None
    options: list[QuestionOption] = Field(default_factory=list)
    # Not yet sourced from the graph; kept for frontend type compatibility.
    explanation: str | None = None
    hint: str | None = None


class Concept(BaseModel):
    id: str
    name: str | None = None
    prefLabel: str | None = None
    aliases: list[str] = Field(default_factory=list)
    iri: str | None = None
    topicId: str | None = None
    subjectId: str | None = None
    # Derived from the concept's Definition LearningContent; null when absent.
    definition: str | None = None
    # Never inferred; null until explicit content exists in the graph.
    whyItMatters: str | None = None
    prerequisites: list[ConceptRef] = Field(default_factory=list)
    related: list[ConceptRef] = Field(default_factory=list)
    content: list[LearningContent] = Field(default_factory=list)
    questions: list[Question] = Field(default_factory=list)


class GraphSchema(BaseModel):
    labels: list[str] = Field(default_factory=list)
    relationshipTypes: list[str] = Field(default_factory=list)
    propertyKeys: list[str] = Field(default_factory=list)
