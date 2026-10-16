from fastapi.testclient import TestClient


def _sync(client: TestClient, **item: object) -> dict:
    payload = {"conceptId": "concept-velocity", **item}
    response = client.post("/api/v1/progress/sync", json={"items": [payload]})
    assert response.status_code == 200
    return response.json()


def test_sync_stores_progress(client: TestClient) -> None:
    body = _sync(client, progressPercent=40, lastSection="definition", lessonCompleted=False)
    assert body["synced"] == ["concept-velocity"]
    assert body["serverState"][0]["progressPercent"] == 40
    assert body["serverState"][0]["lastSection"] == "definition"


def test_progress_percent_never_decreases(client: TestClient) -> None:
    _sync(client, progressPercent=70)
    body = _sync(client, progressPercent=30)
    assert body["serverState"][0]["progressPercent"] == 70


def test_lesson_completed_is_monotonic(client: TestClient) -> None:
    _sync(client, lessonCompleted=True)
    body = _sync(client, lessonCompleted=False)
    assert body["serverState"][0]["lessonCompleted"] is True


def test_quiz_pending_can_clear_with_newer_update(client: TestClient) -> None:
    _sync(client, quizPending=True, updatedAt="2026-01-01T00:00:00Z")
    body = _sync(client, quizPending=False, updatedAt="2026-01-02T00:00:00Z")
    assert body["serverState"][0]["quizPending"] is False


def test_requires_auth() -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as bare_client:
        response = bare_client.post("/api/v1/progress/sync", json={"items": []})
    assert response.status_code == 503
