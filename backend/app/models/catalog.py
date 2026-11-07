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


class ConceptContext(BaseModel):
    subjectId: str | None = None
    subjectName: str | None = None
    topicId: str | None = None
    topicName: str | None = None


class ConceptSearchResult(BaseModel):
    id: str
    name: str
    shortDescription: str | None = None
    contexts: list[ConceptContext] = Field(default_factory=list)


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
    """Concept metadata only.

    Lesson payload lives on ``GET /concepts/{id}/lesson`` and quizzes on
    ``GET /concepts/{id}/questions`` — neither belongs here. A concept may sit
    under several topics, so membership is returned as arrays.
    """

    id: str
    title: str | None = None
    shortDescription: str | None = None
    topicIds: list[str] = Field(default_factory=list)
    subjectIds: list[str] = Field(default_factory=list)
    prerequisiteIds: list[str] = Field(default_factory=list)
    relatedConceptIds: list[str] = Field(default_factory=list)
    hasLesson: bool = False
    # Display companions for the id lists above (names are not resolvable from
    # the mobile app's concept store when the related concept is not cached).
    prerequisites: list[ConceptRef] = Field(default_factory=list)
    related: list[ConceptRef] = Field(default_factory=list)
    # Raw graph fields kept for compatibility with existing screens.
    name: str | None = None
    prefLabel: str | None = None
    aliases: list[str] = Field(default_factory=list)
    iri: str | None = None


class GraphSchema(BaseModel):
    labels: list[str] = Field(default_factory=list)
    relationshipTypes: list[str] = Field(default_factory=list)
    propertyKeys: list[str] = Field(default_factory=list)
