import asyncio
from typing import Any

from app.models.knowledge_map import KnowledgeMapResponse
from app.repositories.graph import (
    _CONCEPT_EDGES,
    _CONCEPTS,
    _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS,
    _KNOWLEDGE_MAP_MAPPING_COUNTS,
    _KNOWLEDGE_MAP_NODES,
    _KNOWLEDGE_MAP_ONTOLOGY_CONCEPT_MAPPINGS,
    _KNOWLEDGE_MAP_TOPIC,
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


def test_knowledge_map_keeps_prerequisite_paths_pending_without_explicit_mapping() -> None:
    repository = StaticGraphRepository(
        {
            _KNOWLEDGE_MAP_TOPIC: [
                {
                    "id": "topic-vectors",
                    "subjectId": "physics",
                    "concepts": [{"id": "concept-vector", "name": "Vector", "order": 1}],
                }
            ],
            _KNOWLEDGE_MAP_NODES: [
                {
                    "id": "concept-vector",
                    "name": "Vector",
                    "contexts": [
                        {
                            "subjectId": "physics",
                            "topicId": "topic-vectors",
                            "conceptOrder": 1,
                        }
                    ],
                    "hasLesson": True,
                }
            ],
            _KNOWLEDGE_MAP_MAPPING_COUNTS: [
                {"id": "concept-vector", "mappingCount": 0}
            ],
        }
    )

    result = asyncio.run(repository.knowledge_map_topic("topic-vectors"))

    assert result is not None
    assert result["mappingStatus"] == "pending"
    assert result["nodes"][0]["id"] == "concept-vector"
    assert result["edges"] == []
    assert "verified Concept" in result["mappingMessage"]
    assert _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS not in repository.queries


def test_knowledge_map_queries_only_verified_ontology_mappings() -> None:
    assert "ONTOLOGY_MAPS_TO" in _KNOWLEDGE_MAP_MAPPING_COUNTS
    assert "reviewStatus: 'VERIFIED_MAPPING_V1'" in _KNOWLEDGE_MAP_MAPPING_COUNTS
    assert "ONTOLOGY_MAPS_TO" in _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS
    assert "ONTOLOGY_EQUIVALENT" not in _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS


def test_knowledge_map_maps_verified_endpoints_and_preserves_edge_direction() -> None:
    repository = StaticGraphRepository(
        {
            _KNOWLEDGE_MAP_TOPIC: [
                {
                    "id": "topic-motion",
                    "subjectId": "physics",
                    "concepts": [
                        {"id": "concept-distance", "name": "Distance", "order": 1},
                        {"id": "concept-speed", "name": "Speed", "order": 2},
                    ],
                }
            ],
            _KNOWLEDGE_MAP_NODES: [
                {
                    "id": concept_id,
                    "name": name,
                    "contexts": [
                        {
                            "subjectId": "physics",
                            "topicId": "topic-motion",
                            "conceptOrder": order,
                        }
                    ],
                    "hasLesson": True,
                }
                for concept_id, name, order in (
                    ("concept-distance", "Distance", 1),
                    ("concept-speed", "Speed", 2),
                )
            ],
            _KNOWLEDGE_MAP_MAPPING_COUNTS: [
                {"id": "concept-distance", "mappingCount": 1},
                {"id": "concept-speed", "mappingCount": 1},
            ],
            _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS: [
                {
                    "focusId": "concept-speed",
                    "focusOntologyId": "ontology-speed",
                    "focusOntologyName": "Speed",
                    "prerequisites": [{"id": "ontology-distance", "name": "Distance"}],
                    "dependents": [],
                }
            ],
            _KNOWLEDGE_MAP_ONTOLOGY_CONCEPT_MAPPINGS: [
                {
                    "ontologyId": "ontology-speed",
                    "name": "Speed",
                    "conceptIds": ["concept-speed"],
                },
                {
                    "ontologyId": "ontology-distance",
                    "name": "Distance",
                    "conceptIds": ["concept-distance"],
                },
            ],
        }
    )

    result = asyncio.run(
        repository.knowledge_map_topic(
            "topic-motion",
            focus_id="concept-speed",
            include_connected_topics=True,
        )
    )

    assert result is not None
    assert result["mappingStatus"] == "ready"
    assert result["edges"] == [
        {
            "source": "concept-distance",
            "target": "concept-speed",
            "type": "PREREQUISITE_OF",
        }
    ]


def test_knowledge_map_supports_multiple_verified_canonical_mappings() -> None:
    repository = StaticGraphRepository(
        {
            _KNOWLEDGE_MAP_TOPIC: [
                {
                    "id": "topic-motion",
                    "subjectId": "physics",
                    "concepts": [
                        {"id": "concept-distance", "name": "Distance", "order": 1},
                        {"id": "concept-distance-alias", "name": "Distance variant", "order": 2},
                        {"id": "concept-speed", "name": "Speed", "order": 3},
                    ],
                }
            ],
            _KNOWLEDGE_MAP_NODES: [
                {
                    "id": concept_id,
                    "name": name,
                    "contexts": [
                        {
                            "subjectId": "physics",
                            "topicId": "topic-motion",
                            "conceptOrder": order,
                        }
                    ],
                    "hasLesson": True,
                }
                for concept_id, name, order in (
                    ("concept-distance", "Distance", 1),
                    ("concept-distance-alias", "Distance variant", 2),
                    ("concept-speed", "Speed", 3),
                )
            ],
            _KNOWLEDGE_MAP_MAPPING_COUNTS: [
                {"id": "concept-distance", "mappingCount": 1},
                {"id": "concept-distance-alias", "mappingCount": 1},
                {"id": "concept-speed", "mappingCount": 1},
            ],
            _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS: [
                {
                    "focusId": "concept-speed",
                    "focusOntologyId": "ontology-speed",
                    "focusOntologyName": "Speed",
                    "prerequisites": [{"id": "ontology-distance", "name": "Distance"}],
                    "dependents": [],
                }
            ],
            _KNOWLEDGE_MAP_ONTOLOGY_CONCEPT_MAPPINGS: [
                {
                    "ontologyId": "ontology-speed",
                    "name": "Speed",
                    "conceptIds": ["concept-speed"],
                },
                {
                    "ontologyId": "ontology-distance",
                    "name": "Distance",
                    "conceptIds": ["concept-distance", "concept-distance-alias"],
                }
            ],
        }
    )

    result = asyncio.run(
        repository.knowledge_map_topic(
            "topic-motion",
            focus_id="concept-speed",
            include_connected_topics=True,
        )
    )

    assert result is not None
    assert result["mappingStatus"] == "ready"
    assert {(edge["source"], edge["target"]) for edge in result["edges"]} == {
        ("concept-distance", "concept-speed"),
        ("concept-distance-alias", "concept-speed"),
    }


def test_knowledge_map_returns_unmapped_ontology_nodes_without_app_content() -> None:
    repository = StaticGraphRepository(
        {
            _KNOWLEDGE_MAP_TOPIC: [
                {
                    "id": "topic-motion",
                    "subjectId": "physics",
                    "concepts": [{"id": "concept-speed", "name": "Speed", "order": 1}],
                }
            ],
            _KNOWLEDGE_MAP_NODES: [
                {
                    "id": "concept-speed",
                    "name": "Speed",
                    "contexts": [
                        {
                            "subjectId": "physics",
                            "topicId": "topic-motion",
                            "conceptOrder": 1,
                        }
                    ],
                    "hasLesson": True,
                }
            ],
            _KNOWLEDGE_MAP_MAPPING_COUNTS: [
                {"id": "concept-speed", "mappingCount": 1},
            ],
            _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS: [
                {
                    "focusId": "concept-speed",
                    "focusOntologyId": "ontology-speed",
                    "focusOntologyName": "Speed",
                    "prerequisites": [
                        {"id": "ontology-unmapped", "name": "Ontology-only topic"}
                    ],
                    "dependents": [],
                }
            ],
            _KNOWLEDGE_MAP_ONTOLOGY_CONCEPT_MAPPINGS: [
                {
                    "ontologyId": "ontology-speed",
                    "name": "Speed",
                    "conceptIds": ["concept-speed"],
                },
                {
                    "ontologyId": "ontology-unmapped",
                    "name": "Ontology-only topic",
                    "conceptIds": [],
                },
            ],
        }
    )

    result = asyncio.run(
        repository.knowledge_map_topic("topic-motion", focus_id="concept-speed")
    )

    assert result is not None
    ontology_node = next(node for node in result["nodes"] if node["type"] == "ontology_only")
    assert ontology_node["id"] == "ontology:ontology-unmapped"
    assert ontology_node["name"] == "Ontology-only topic"
    assert ontology_node["hasLesson"] is False
    assert result["edges"] == [
        {
            "source": "ontology:ontology-unmapped",
            "target": "concept-speed",
            "type": "PREREQUISITE_OF",
        }
    ]
    response = KnowledgeMapResponse(**result)
    assert next(
        node for node in response.nodes if node.id == "ontology:ontology-unmapped"
    ).type == "ontology_only"


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
        "lessons": [
            {
                "type": "learning_objective",
                "contentText": "Read a measuring instrument",
            },
            {
                "type": "prerequisite_note",
                "contentText": "Decimals",
            },
            {
                "type": "definition",
                "contentText": "Length is the distance between two points.",
            },
            {"type": "explanation", "contentText": "Explanation one"},
            {"type": "explanation", "contentText": "Explanation two"},
            {
                "type": "key_term",
                "title": "Least count",
                "contentText": "Smallest readable division.",
                "contentData": (
                    '{"term":"Least count","definition":"Smallest readable division."}'
                ),
            },
            {
                "type": "illustration",
                "title": "Readings",
                "contentText": "",
                "contentData": (
                    '{"type":"table","caption":"Readings","table":{"headers":'
                    '["Instrument","Reading"],"rows":[["Rule","10 cm"]]}}'
                ),
            },
            {
                "type": "worked_example",
                "title": "Worked example 1",
                "contentText": "Read the scale.",
                "contentData": (
                    '{"problem":"Read the scale.","steps":["Align zero","Read the mark"],'
                    '"answer":"10 cm"}'
                ),
            },
            {"type": "real_world_application", "contentText": "Measure an object"},
            {"type": "common_mistake", "contentText": "Misreading the zero mark"},
            {"type": "summary", "contentText": "Use the instrument scale carefully."},
        ],
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
                    "lessons": [],
                    "contexts": [],
                    "prerequisites": [],
                    "relatedConcepts": [],
                }
            ]
        }
    )

    assert asyncio.run(repository.get_structured_lesson("phys-ss1-03-03")) is None
    assert repository.queries == [_STRUCTURED_LESSON]
