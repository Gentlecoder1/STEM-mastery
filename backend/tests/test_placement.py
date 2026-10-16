from fastapi.testclient import TestClient

from tests.conftest import FakeLearnerState


def test_placement_questions_have_no_answers(client: TestClient) -> None:
    params = {"subjects": "physics", "count": 10}
    response = client.get("/api/v1/placement/questions", params=params)
    assert response.status_code == 200
    questions = response.json()
    assert questions
    for question in questions:
        for leaked in ("correctOption", "correctAnswer", "referenceAnswer", "answerId"):
            assert leaked not in question


def test_placement_questions_respect_count(client: TestClient) -> None:
    response = client.get("/api/v1/placement/questions", params={"subjects": "physics", "count": 1})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_placement_submit_recommends_start(
    client: TestClient, learner_state: FakeLearnerState
) -> None:
    response = client.post(
        "/api/v1/placement/submit",
        json={
            "answers": [
                {"questionId": "q-velocity-1", "response": "b"},
                {"questionId": "q-displacement-1", "response": "a"},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["results"][0]["subjectId"] == "physics"
    assert body["results"][0]["correct"] == 1
    assert body["results"][0]["total"] == 2
    assert body["conceptMastery"]["concept-velocity"] == 1.0
    assert body["conceptMastery"]["concept-displacement"] == 0.0
    assert body["recommendedStartConceptId"] == "concept-displacement"
    assert learner_state.placement is not None
    assert learner_state.placement["recommendedStartConceptId"] == "concept-displacement"


def test_placement_submit_all_correct_recommends_first(client: TestClient) -> None:
    response = client.post(
        "/api/v1/placement/submit",
        json={
            "answers": [
                {"questionId": "q-velocity-1", "response": "b"},
                {"questionId": "q-displacement-1", "response": "b"},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["results"][0]["scorePct"] == 100
    assert body["recommendedStartConceptId"] == "concept-displacement"
