"""Resolution of extracted entities against the Neo4j curriculum graph.

SciBERT predictions never create, modify or guess graph nodes. This layer
asks the read-only repository for conservative matches and decorates each
extracted entity with graph identity (or an ambiguity) instead:

    SciBERT prediction -> normalize text -> type-based graph lookup
    -> exactly one match => matched
    -> several matches   => ambiguous (all candidates returned, no guessing)
    -> none              => unmatched

Concept matches keep their full graph semantics: topic memberships stay
many-to-many (``HAS_CONCEPT``), prerequisites, related concepts and subject
associations are copied from the graph — never flattened into a tree.
"""

from __future__ import annotations

from typing import Any

from app.repositories.graph import GraphRepository
from app.services.semantic_extractor import ExtractedEntity

_MAX_CANDIDATES = 5


class GraphEntityResolver:
    """Decorate extracted entities with (optional) Neo4j identity."""

    def __init__(self, repository: GraphRepository) -> None:
        self._repository = repository

    async def resolve_entity(self, entity: ExtractedEntity) -> dict[str, Any]:
        rows = await self._repository.find_entity(entity.type, entity.text)
        resolved: dict[str, Any] = {
            "text": entity.text,
            "type": entity.type,
            "score": entity.score,
            "start": entity.start,
            "end": entity.end,
            "matched": False,
            "graphId": None,
            "graphName": None,
            "ambiguous": False,
            "candidates": [],
            "graph": None,
        }
        distinct_ids = {row["id"] for row in rows if row.get("id")}
        if len(distinct_ids) > 1:
            resolved["ambiguous"] = True
            resolved["candidates"] = [
                {"id": row["id"], "name": row.get("name")}
                for row in rows[:_MAX_CANDIDATES]
            ]
            return resolved
        if not rows:
            return resolved

        node = rows[0]
        resolved["matched"] = True
        resolved["graphId"] = node["id"]
        resolved["graphName"] = node.get("name")
        if entity.type == "CONCEPT":
            resolved["graph"] = await self._concept_context(node["id"])
        return resolved

    async def resolve_all(
        self, entities: list[ExtractedEntity]
    ) -> list[dict[str, Any]]:
        return [await self.resolve_entity(entity) for entity in entities]

    async def _concept_context(self, concept_id: str) -> dict[str, Any] | None:
        """Graph context for a matched concept, straight from relationships.

        ``GraphRepository.get_concept`` collects topic memberships via
        ``HAS_CONCEPT`` so a concept can belong to several topics — that
        many-to-many structure is intentionally preserved here.
        """
        concept = await self._repository.get_concept(concept_id)
        if concept is None:
            return None
        return {
            "topicIds": concept.get("topicIds") or [],
            "subjectIds": concept.get("subjectIds") or [],
            "prerequisiteIds": concept.get("prerequisites")
            and [item["id"] for item in concept["prerequisites"]]
            or [],
            "relatedConceptIds": concept.get("related")
            and [item["id"] for item in concept["related"]]
            or [],
        }
