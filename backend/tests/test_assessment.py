from fastapi.testclient import TestClient

from tests.conftest import FakeLearnerState


def test_check_correct(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "q-velocity-1", "response": "b"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["correct"] is True
    assert body["correctOptionId"] == "b"
    assert "correctOption" not in body


def test_check_incorrect(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "q-velocity-1", "response": "a"},
    )
    assert response.status_code == 200
    assert response.json()["correct"] is False


def test_check_theory_is_ungraded(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "q-velocity-3", "response": "Velocity is a vector."},
    )
    assert response.status_code == 200
    assert response.json()["correct"] is None


def test_check_unknown_question(client: TestClient) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/check",
        json={"questionId": "missing", "response": "b"},
    )
    assert response.status_code == 404


def test_submit_pass_persists_mastery(
    client: TestClient, learner_state: FakeLearnerState
) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/submit",
        json={
            "responses": [
                {"questionId": "q-velocity-1", "response": "b"},
                {"questionId": "q-velocity-2", "response": "a"},
                {"questionId": "q-velocity-3", "response": "vectors have direction"},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["correct"] == 2
    assert body["total"] == 2  # theory excluded
    assert body["scorePct"] == 100
    assert body["passed"] is True
    assert body["topicId"] == "topic-speed-velocity"
    assert body["nextConceptId"] is None
    assert "concept-velocity" in learner_state.completed
    assert learner_state.topic_assessments["topic-speed-velocity"]["passed"] is True


def test_submit_fail_does_not_complete_concept(
    client: TestClient, learner_state: FakeLearnerState
) -> None:
    response = client.post(
        "/api/v1/concepts/concept-velocity/quiz/submit",
        json={
            "responses": [
                {"questionId": "q-velocity-1", "response": "a"},
                {"questionId": "q-velocity-2", "response": "a"},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["scorePct"] == 50
    assert body["passed"] is False
    assert learner_state.completed == []
    assert learner_state.topic_assessments["topic-speed-velocity"]["passed"] is False


def test_submit_requires_auth() -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as bare_client:
        response = bare_client.post(
            "/api/v1/concepts/concept-velocity/quiz/submit", json={"responses": []}
        )
    # Auth is not configured in tests, so the dependency reports 503.
    assert response.status_code == 503
