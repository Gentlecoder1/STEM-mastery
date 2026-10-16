from fastapi.testclient import TestClient

from app.main import app


def test_list_subjects(client: TestClient) -> None:
    response = client.get("/api/v1/subjects")
    assert response.status_code == 200
    assert response.json()[0]["id"] == "physics"


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
    assert body["subjectId"] == "physics"
    assert body["topicId"] == "topic-speed-velocity"
    assert body["definition"].startswith("Velocity")
    assert body["whyItMatters"] is None
    assert body["prerequisites"] == [
        {"id": "concept-displacement", "name": "Distance and displacement"}
    ]
    assert body["content"][0]["contentType"] == "Definition"
    assert body["questions"][0]["prompt"].startswith("Which statement")


def test_get_concept_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/missing")
    assert response.status_code == 404


def test_content_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/concepts/concept-velocity/content")
    assert response.status_code == 200
    assert response.json()[0]["id"] == "c-velocity-def"


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


def test_catalog_returns_503_without_database() -> None:
    # No dependency override: with no Neo4j configured, the dependency yields 503.
    with TestClient(app) as bare_client:
        response = bare_client.get("/api/v1/subjects")
    assert response.status_code == 503
