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
