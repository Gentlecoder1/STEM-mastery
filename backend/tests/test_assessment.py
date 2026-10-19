from fastapi.testclient import TestClient

from tests.conftest import FakeLearnerState


def test_check_correct(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "q-velocity-1", "selectedOption": "b"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["correct"] is True
    assert body["conceptId"] == "concept-velocity"
    assert body["correctOptionId"] == "b"
    assert body["explanation"] == "Velocity is speed in a particular direction."
    assert "correctOption" not in body


def test_check_incorrect(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "q-velocity-1", "selectedOption": "a"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["correct"] is False
    assert body["correctOptionId"] == "b"
    assert body["explanation"] == "Velocity is speed in a particular direction."
    assert body["prerequisites"] == [
        {"id": "concept-displacement", "name": "Distance and displacement"}
    ]


def test_concept_quiz_pass_persists_mastery(
    client: TestClient, learner_state: FakeLearnerState
) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/submit",
        json={
            "responses": [
                {"questionId": "q-velocity-1", "response": "b"},
                {"questionId": "q-velocity-2", "response": "a"},
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["passed"] is True
    assert response.json()["scorePct"] == 100
    assert learner_state.completed == ["concept-velocity"]
    assert learner_state.concept_assessments[0]["questionResults"] == [
        {"questionId": "q-velocity-1", "conceptId": "concept-velocity", "correct": True},
        {"questionId": "q-velocity-2", "conceptId": "concept-velocity", "correct": True},
    ]


def test_concept_quiz_failure_returns_graph_remediation(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/submit",
        json={
            "responses": [
                {"questionId": "q-velocity-1", "response": "a"},
                {"questionId": "q-velocity-2", "response": "b"},
            ]
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["passed"] is False
    assert body["prerequisites"] == [
        {"id": "concept-displacement", "name": "Distance and displacement"}
    ]
    assert body["relatedConcepts"] == [
        {"id": "concept-acceleration", "name": "Acceleration"}
    ]


def test_check_theory_is_ungraded(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "q-velocity-3", "response": "Velocity is a vector."},
    )
    assert response.status_code == 200
    assert response.json()["correct"] is None
    assert response.json()["explanation"] == (
        "Reference answer: Velocity is a vector.\n\n"
        "Velocity has both magnitude and direction."
    )


def test_check_without_submitted_response_does_not_return_feedback(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "q-velocity-1"},
    )
    assert response.status_code == 200
    assert response.json()["explanation"] is None


def test_check_unknown_question(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "missing", "response": "b"},
    )
    assert response.status_code == 404


def test_submit_topic_quiz_grades_questions_across_topic_and_persists_only_topic(
    client: TestClient, learner_state: FakeLearnerState
) -> None:
    response = client.post(
        "/api/v1/topics/topic-speed-velocity/quiz/submit",
        json={
            "responses": [
                {"questionId": "q-velocity-1", "response": "b"},
                {"questionId": "q-velocity-2", "response": "a"},
                {"questionId": "q-velocity-3", "response": "A vector"},
                {"questionId": "q-displacement-1", "response": "b"},
            ]
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "topicId": "topic-speed-velocity",
        "correct": 3,
        "total": 3,
        "scorePct": 100,
        "passed": True,
    }
    assert learner_state.completed == []
    assert learner_state.topic_assessments["topic-speed-velocity"]["passed"] is True


def test_topic_quiz_requires_sixty_percent_for_the_whole_topic(
    client: TestClient, learner_state: FakeLearnerState
) -> None:
    response = client.post(
        "/api/v1/topics/topic-speed-velocity/quiz/submit",
        json={
            "responses": [
                {"questionId": "q-velocity-1", "response": "b"},
                {"questionId": "q-velocity-2", "response": "a"},
                {"questionId": "q-displacement-1", "response": "a"},
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["scorePct"] == 67
    assert response.json()["passed"] is True
    assert learner_state.completed == []

    failed = client.post(
        "/api/v1/topics/topic-speed-velocity/quiz/submit",
        json={
            "responses": [
                {"questionId": "q-velocity-1", "response": "a"},
                {"questionId": "q-velocity-2", "response": "a"},
                {"questionId": "q-displacement-1", "response": "a"},
            ]
        },
    )
    assert failed.status_code == 200
    assert failed.json()["scorePct"] == 33
    assert failed.json()["passed"] is False
    assert learner_state.completed == []
    assert learner_state.topic_assessments["topic-speed-velocity"]["passed"] is False


def test_submit_requires_auth(monkeypatch) -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    # Force-unconfigured auth so the test is independent of backend/.env.
    monkeypatch.setattr("app.core.config.settings.supabase_url", "")
    monkeypatch.setattr("app.core.config.settings.supabase_jwks_url", "")

    with TestClient(app) as bare_client:
        response = bare_client.post(
            "/api/v1/topics/topic-speed-velocity/quiz/submit", json={"responses": []}
        )
    # Auth is not configured in tests, so the dependency reports 503.
    assert response.status_code == 503
