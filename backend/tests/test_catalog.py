from fastapi.testclient import TestClient

from app.main import app


def test_list_subjects(client: TestClient) -> None:
    response = client.get("/api/v1/subjects")
    assert response.status_code == 200
    assert response.json()[0]["id"] == "physics"


def test_search_concepts_preserves_all_graph_contexts(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/search", params={"q": "Vector"})

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": "concept-vector",
            "name": "Vector",
            "shortDescription": "A quantity with magnitude and direction.",
            "contexts": [
                {
                    "subjectId": "mathematics",
                    "subjectName": "Mathematics",
                    "topicId": "topic-vectors-math",
                    "topicName": "Vectors",
                },
                {
                    "subjectId": "physics",
                    "subjectName": "Physics",
                    "topicId": "topic-scalars-vectors",
                    "topicName": "Scalars and vectors",
                },
            ],
        }
    ]


def test_search_concepts_requires_two_characters(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/search", params={"q": "V"})
    assert response.status_code == 422


def test_list_topics(client: TestClient) -> None:
    response = client.get("/api/v1/subjects/physics/topics")
    assert response.status_code == 200
    assert response.json() == [
        {"id": "topic-speed-velocity", "name": "Speed and velocity", "iri": None}
    ]


def test_list_concepts_ordered_with_prerequisites(client: TestClient) -> None:
    response = client.get("/api/v1/topics/topic-speed-velocity/concepts")
    assert response.status_code == 200
    body = response.json()
    assert [concept["id"] for concept in body] == ["concept-displacement", "concept-velocity"]
    assert body[0]["prerequisites"] == []
    assert body[1]["prerequisites"] == [
        {"id": "concept-displacement", "name": "Distance and displacement"}
    ]


def test_get_concept(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/concept-velocity")
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Velocity"
    assert body["subjectIds"] == ["physics"]
    assert body["topicIds"] == ["topic-speed-velocity"]
    assert body["shortDescription"].startswith("Velocity")
    assert body["hasLesson"] is True
    assert body["prerequisiteIds"] == ["concept-displacement"]
    assert body["relatedConceptIds"] == ["concept-acceleration"]
    assert body["prerequisites"] == [
        {"id": "concept-displacement", "name": "Distance and displacement"}
    ]


def test_get_concept_excludes_lesson_payload(client: TestClient) -> None:
    """The metadata endpoint must not bundle content or quiz questions."""
    response = client.get("/api/v1/concepts/concept-velocity")
    assert response.status_code == 200
    body = response.json()
    excluded = ("content", "questions", "whyItMatters", "definition", "topicId", "subjectId")
    for payload_key in excluded:
        assert payload_key not in body


def test_get_concept_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/missing")
    assert response.status_code == 404


def test_lesson_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/concept-velocity/lesson")
    assert response.status_code == 200
    assert response.json() == {
        "concept": {
            "id": "concept-velocity",
            "title": "Velocity",
            "subjectId": "physics",
            "topicId": "topic-speed-velocity",
            "order": 2,
            "estimatedMinutes": 30,
        },
        "learningObjectives": [],
        "definition": None,
        "explanation": [],
        "keyTerms": [],
        "illustrations": [],
        "workedExamples": [],
        "realWorldApplications": [],
        "commonMistakes": [],
        "summary": [],
        "prerequisiteNotes": [],
        "prerequisites": [{"id": "concept-displacement", "name": "Distance and displacement"}],
        "relatedConcepts": [{"id": "concept-acceleration", "name": "Acceleration"}],
        "practiceAvailable": True,
        "questionCount": 3,
    }
    for internal_field in (
        "image_prompt",
        "sourceFile",
        "structureVersion",
        "exercises",
        "answer",
        "correctOption",
        "correctAnswer",
    ):
        assert internal_field not in response.json()


def test_lesson_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/missing/lesson")
    assert response.status_code == 404


def test_questions_withhold_answers(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/concept-velocity/questions")
    assert response.status_code == 200
    question = response.json()[0]
    assert question["id"] == "q-velocity-1"
    assert question["options"][0] == {"id": "a", "label": "A", "text": "How far an object travels"}
    for leaked in ("correctOption", "correctAnswer", "referenceAnswer", "answerId"):
        assert leaked not in question


def test_graph_schema_dev_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/graph/schema")
    assert response.status_code == 200
    assert "Concept" in response.json()["labels"]


def test_catalog_returns_503_without_database(monkeypatch) -> None:
    # Force-unconfigured settings so the test is independent of backend/.env;
    # a real Aura instance is exercised by tests/test_live_graph.py instead.
    monkeypatch.setattr("app.core.config.settings.neo4j_uri", "")
    app.state.db = None
    # No dependency override: with no Neo4j configured, the dependency yields 503.
    with TestClient(app) as bare_client:
        response = bare_client.get("/api/v1/subjects")
    assert response.status_code == 503
