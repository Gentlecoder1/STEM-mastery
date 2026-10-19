import asyncio
from typing import Any

from app.repositories.graph import (
    _CONCEPT_EDGES,
    _CONCEPTS,
    _PREREQUISITES,
    _SEARCH_CONCEPTS,
    _STRUCTURED_LESSON,
    _STRUCTURED_QUESTION_COUNT,
    _SUBJECT_CONCEPTS,
    _TOPICS,
    GraphRepository,
)


class StaticGraphRepository(GraphRepository):
    def __init__(self, responses: dict[str, list[dict[str, Any]]]) -> None:
        self.responses = responses
        self.queries: list[str] = []
        self.params: list[dict[str, Any]] = []

    async def _read(self, query: str, **params: Any) -> list[dict[str, Any]]:
        self.queries.append(query)
        self.params.append(params)
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


def test_search_concepts_uses_distinct_search_parameter_and_filters_empty_contexts() -> None:
    rows = [
        {
            "id": "concept-exponent",
            "name": "Exponent",
            "shortDescription": "An exponent indicates a power.",
            "contexts": [
                {"subjectId": "mathematics", "topicId": "topic-indices"},
                None,
            ],
        }
    ]
    repository = StaticGraphRepository({_SEARCH_CONCEPTS: rows})

    results = asyncio.run(repository.search_concepts("  ExPonent  "))

    assert results[0]["contexts"] == [
        {"subjectId": "mathematics", "topicId": "topic-indices"}
    ]
    assert repository.queries == [_SEARCH_CONCEPTS]
    assert repository.params == [{"search_term": "exponent", "limit": 20}]


def test_structured_lesson_decodes_content_and_keeps_graph_relationships_separate() -> None:
    row = {
        "id": "phys-ss1-03-03",
        "title": "Measuring length",
        "subjectId": "Physics",
        "topicId": "Physics_Position_Distance_and_Displacement",
        "conceptOrder": 3,
        "estimatedMinutes": 55,
        "prerequisiteNotes": ["Decimals"],
        "contexts": [
            {
                "subjectId": "Physics",
                "topicId": "Physics_Position_Distance_and_Displacement",
                "topicOrder": 3,
            }
        ],
        "lesson": {
            "learningObjectives": '["Read a measuring instrument"]',
            "definition": '"Length is the distance between two points."',
            "explanation": '["Explanation one", "Explanation two"]',
            "keyTerms": '[{"term":"Least count","definition":"Smallest readable division."}]',
            "illustrations": (
                '[{"type":"table","caption":"Readings","table":'
                '{"headers":["Instrument","Reading"],"rows":[["Rule","10 cm"]]}}]'
            ),
            "workedExamples": (
                '[{"problem":"Read the scale.","steps":["Align zero","Read the mark"],'
                '"answer":"10 cm"}]'
            ),
            "realWorldApplications": '["Measure an object"]',
            "commonMistakes": '["Misreading the zero mark"]',
            "summary": '["Use the instrument scale carefully."]',
            "image_prompt": "must not be exposed",
            "repositoryFile": "internal.json",
        },
        "prerequisites": [{"id": "math-ss1-03-03", "name": "Decimals"}],
        "relatedConcepts": [{"id": "phys-ss1-03-04", "name": "Displacement"}],
    }
    repository = StaticGraphRepository(
        {
            _STRUCTURED_LESSON: [row],
            _STRUCTURED_QUESTION_COUNT: [{"questionCount": 5}],
        }
    )

    lesson = asyncio.run(repository.get_structured_lesson("phys-ss1-03-03"))

    assert lesson is not None
    assert lesson["concept"] == {
        "id": "phys-ss1-03-03",
        "title": "Measuring length",
        "subjectId": "Physics",
        "topicId": "Physics_Position_Distance_and_Displacement",
        "order": 3,
        "estimatedMinutes": 55,
    }
    assert lesson["keyTerms"] == [
        {"term": "Least count", "definition": "Smallest readable division."}
    ]
    assert lesson["workedExamples"][0]["steps"] == ["Align zero", "Read the mark"]
    assert lesson["illustrations"][0]["table"]["headers"] == ["Instrument", "Reading"]
    assert lesson["prerequisites"] == [{"id": "math-ss1-03-03", "name": "Decimals"}]
    assert lesson["relatedConcepts"] == [{"id": "phys-ss1-03-04", "name": "Displacement"}]
    assert lesson["practiceAvailable"] is True
    assert lesson["questionCount"] == 5
    assert "image_prompt" not in lesson
    assert "repositoryFile" not in lesson
    assert repository.queries == [_STRUCTURED_LESSON, _STRUCTURED_QUESTION_COUNT]


def test_structured_lesson_returns_none_when_v3_content_is_missing() -> None:
    repository = StaticGraphRepository(
        {
            _STRUCTURED_LESSON: [
                {
                    "id": "phys-ss1-03-03",
                    "title": "Measuring length",
                    "lesson": None,
                    "contexts": [],
                    "prerequisites": [],
                    "relatedConcepts": [],
                }
            ]
        }
    )

    assert asyncio.run(repository.get_structured_lesson("phys-ss1-03-03")) is None
    assert repository.queries == [_STRUCTURED_LESSON]
