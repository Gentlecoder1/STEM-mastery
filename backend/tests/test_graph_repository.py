import asyncio
from typing import Any

from app.repositories.graph import (
    _CONCEPT_EDGES,
    _CONCEPTS,
    _PREREQUISITES,
    _SUBJECT_CONCEPTS,
    _TOPICS,
    GraphRepository,
)


class StaticGraphRepository(GraphRepository):
    def __init__(self, responses: dict[str, list[dict[str, Any]]]) -> None:
        self.responses = responses
        self.queries: list[str] = []

    async def _read(self, query: str, **params: Any) -> list[dict[str, Any]]:
        self.queries.append(query)
        return self.responses[query]


def test_curriculum_queries_use_relationship_order_and_prerequisite_direction() -> None:
    assert "ORDER BY r.order ASC" in _TOPICS
    assert "ORDER BY r.order ASC" in _CONCEPTS
    assert "(p:Concept)-[:PREREQUISITE_OF]->(c:Concept {id: $concept_id})" in _PREREQUISITES
    assert "MATCH (p:Concept)-[:PREREQUISITE_OF]->(c:Concept)" in _CONCEPT_EDGES
    assert "RETURN c.id AS conceptId, p.id AS prerequisiteId" in _CONCEPT_EDGES
    assert "ORDER BY tr.order ASC, cr.order ASC" in _SUBJECT_CONCEPTS


def test_list_concepts_preserves_curriculum_order_and_prerequisites() -> None:
    rows = [
        {
            "id": "concept-velocity",
            "name": "Velocity",
            "prerequisites": [{"id": "concept-displacement", "name": "Displacement"}, None],
        },
        {"id": "concept-displacement", "name": "Displacement", "prerequisites": [None]},
    ]
    repository = StaticGraphRepository({_CONCEPTS: rows})

    concepts = asyncio.run(repository.list_concepts("topic-speed-velocity"))

    assert [concept["id"] for concept in concepts] == [
        "concept-velocity",
        "concept-displacement",
    ]
    assert concepts[0]["prerequisites"] == [
        {"id": "concept-displacement", "name": "Displacement"}
    ]
    assert concepts[1]["prerequisites"] == []
    assert repository.queries == [_CONCEPTS]


def test_ordered_subject_concepts_deduplicates_without_reordering() -> None:
    rows = [
        {"id": "concept-velocity", "name": "Velocity"},
        {"id": "concept-displacement", "name": "Displacement"},
        {"id": "concept-velocity", "name": "Velocity"},
        {"id": "concept-acceleration", "name": "Acceleration"},
    ]
    repository = StaticGraphRepository({_SUBJECT_CONCEPTS: rows})

    concepts = asyncio.run(repository.ordered_subject_concepts("physics"))

    assert [concept["id"] for concept in concepts] == [
        "concept-velocity",
        "concept-displacement",
        "concept-acceleration",
    ]
    assert repository.queries == [_SUBJECT_CONCEPTS]
