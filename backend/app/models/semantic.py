"""Response models for the semantic (SciBERT) endpoints.

Mirrors the machine learning contract the React Native app consumes. Entity
``type`` values are plain ``SUBJECT`` / ``TOPIC`` / ``CONCEPT`` — BIO prefixes
never leave the backend. ``graph`` is populated only for matched concepts and
preserves Neo4j many-to-many topic memberships.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    text: str


class Entity(BaseModel):
    text: str
    type: str
    score: float
    start: int
    end: int


class ExtractResponse(BaseModel):
    entities: list[Entity] = Field(default_factory=list)


class EntityCandidate(BaseModel):
    """One of possibly several equally plausible graph matches."""

    id: str
    name: str | None = None


class ResolvedEntity(Entity):
    matched: bool
    graphId: str | None = None
    graphName: str | None = None
    ambiguous: bool = False
    candidates: list[EntityCandidate] = Field(default_factory=list)
    graph: dict[str, Any] | None = None


class ResolveResponse(BaseModel):
    entities: list[ResolvedEntity] = Field(default_factory=list)


class SemanticStatusResponse(BaseModel):
    configured: bool
    loaded: bool
    model: str | None = None
