from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class KnowledgeMapNode(BaseModel):
    id: str
    name: str
    type: Literal["concept", "ontology_only"] = "concept"
    subjectIds: list[str] = Field(default_factory=list)
    topicIds: list[str] = Field(default_factory=list)
    conceptOrder: int | None = None
    contentPreview: str | None = None
    hasLesson: bool = False
    prerequisiteCount: int | None = None
    dependentCount: int | None = None


class KnowledgeMapEdge(BaseModel):
    source: str
    target: str
    type: Literal["PREREQUISITE_OF"] = "PREREQUISITE_OF"


class KnowledgeMapResponse(BaseModel):
    focusId: str | None = None
    subjectId: str | None = None
    topicId: str | None = None
    nodes: list[KnowledgeMapNode] = Field(default_factory=list)
    edges: list[KnowledgeMapEdge] = Field(default_factory=list)
    mappingStatus: Literal["pending", "partial", "ready"]
    mappingMessage: str | None = None
    depth: int = 1
    truncated: bool = False
