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


def test_knowledge_map_reports_pending_mappings_without_edges(client: TestClient) -> None:
    response = client.get("/api/v1/knowledge-map/topics/topic-speed-velocity")

    assert response.status_code == 200
    body = response.json()
    assert body["mappingStatus"] == "pending"
    assert body["edges"] == []
    assert body["nodes"][0]["id"] == "concept-displacement"
    assert "verified Concept" in body["mappingMessage"]


def test_knowledge_map_root_starts_with_cross_subject_concepts(client: TestClient) -> None:
    response = client.get("/api/v1/knowledge-map/root")

    assert response.status_code == 200
    body = response.json()
    assert body["root"]["id"] == "STEM"
    assert body["mode"] == "overview"
    assert body["mappingStatus"] == "not_applicable"
    assert {subject for node in body["nodes"] for subject in node["subjectIds"]} == {
        "mathematics",
        "physics",
        "chemistry",
    }
    assert {edge["type"] for edge in body["edges"]} == {"STEM_ROOT"}
    assert all(edge["source"] == "STEM" for edge in body["edges"])


def test_knowledge_map_depth_is_bounded(client: TestClient) -> None:
    response = client.get(
        "/api/v1/knowledge-map/topics/topic-speed-velocity",
        params={"depth": 4},
    )
    assert response.status_code == 422


def test_knowledge_map_search_returns_catalog_contexts(client: TestClient) -> None:
    response = client.get("/api/v1/knowledge-map/search", params={"q": "vector"})

    assert response.status_code == 200
    assert response.json()[0]["id"] == "concept-vector"


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


def test_topic_packet_includes_concept_content_and_optional_overview(client: TestClient) -> None:
    response = client.get("/api/v1/topics/topic-speed-velocity/packet")

    assert response.status_code == 200
    body = response.json()
    assert body["topic"]["id"] == "topic-speed-velocity"
    assert body["overviewContent"] == []
    assert [concept["id"] for concept in body["concepts"]] == [
        "concept-displacement",
        "concept-velocity",
    ]
    assert body["concepts"][0]["learningContent"][0]["contentText"] == (
        "Velocity is a vector quantity."
    )


def test_topic_packet_returns_not_found_for_unknown_topic(client: TestClient) -> None:
    response = client.get("/api/v1/topics/missing/packet")
    assert response.status_code == 404


def test_topic_questions_include_mcq_and_theory_without_answer_keys(client: TestClient) -> None:
    response = client.get("/api/v1/topics/topic-speed-velocity/questions")

    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 4
    mcq = next(question for question in questions if question["id"] == "q-velocity-1")
    assert mcq["type"] == "mcq"
    assert mcq["options"][0] == {
        "id": "a",
        "label": "A",
        "text": "How far an object travels",
    }
    theory = next(question for question in questions if question["type"] == "theoretical")
    assert theory["prompt"] == "Which statement best describes velocity?"
    assert theory["options"] == []
    for question in questions:
        for leaked in ("correctOption", "correctAnswer", "modelAnswer"):
            assert leaked not in question


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


def test_catalog_returns_503_without_database(monkeypatch) -> None:
    # Force-unconfigured settings so the test is independent of backend/.env;
    # a real Aura instance is exercised by tests/test_live_graph.py instead.
    monkeypatch.setattr("app.core.config.settings.neo4j_uri", "")
    app.state.db = None
    # No dependency override: with no Neo4j configured, the dependency yields 503.
    with TestClient(app) as bare_client:
        response = bare_client.get("/api/v1/subjects")
    assert response.status_code == 503


def test_questions_carry_hashed_offline_keys_not_answers(client: TestClient) -> None:
    """Offline marking: the app gets one-way hashes, never the answer text."""
    import hashlib

    def h(question_id: str, value: str) -> str:
        return hashlib.sha256(f"{question_id}:{value}".encode()).hexdigest()

    questions = client.get("/api/v1/concepts/concept-velocity/questions").json()
    mcq = next(question for question in questions if question["id"] == "q-velocity-1")
    assert mcq["offlineKey"]["answerHash"] == h("q-velocity-1", "b")
    assert mcq["offlineKey"]["answerHash"] != h("q-velocity-1", "a")

    theory = next(question for question in questions if question["id"] == "q-velocity-3")
    assert theory["offlineKey"]["keywordHashes"] == [
        h("q-velocity-3", "velocity"),
        h("q-velocity-3", "vector"),
    ]
    assert theory["offlineKey"]["minCoverage"] == 0.5
    assert "Velocity is a vector" not in str(theory)


def test_keyword_stems_match_frontend_rules() -> None:
    from app.services.grading import keyword_stems

    assert keyword_stems("The forces acting on a body: Forces, mass and acceleration") == [
        "force",
        "acting",
        "body",
        "mass",
        "acceleration",
    ]
