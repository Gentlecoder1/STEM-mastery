"""The app must boot and degrade gracefully when Neo4j is not configured.

Vercel deployment target: no AuraDB credentials are set yet. The API still has
to start and answer health plus non-graph routes; graph-dependent catalog
endpoints return a clear 503 instead of crashing. No mock curriculum is served.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

API = "/api/v1"


def _bare_client(monkeypatch) -> TestClient:
    monkeypatch.setattr(settings, "neo4j_uri", "")
    app.state.db = None
    return TestClient(app)


def test_app_boots_without_neo4j(monkeypatch) -> None:
    with _bare_client(monkeypatch) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_catalog_subjects_return_503_without_neo4j(monkeypatch) -> None:
    with _bare_client(monkeypatch) as client:
        response = client.get(f"{API}/subjects")
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]


def test_catalog_topics_return_503_without_neo4j(monkeypatch) -> None:
    with _bare_client(monkeypatch) as client:
        response = client.get(f"{API}/subjects/physics/topics")
    assert response.status_code == 503


def test_concept_detail_returns_503_without_neo4j(monkeypatch) -> None:
    with _bare_client(monkeypatch) as client:
        response = client.get(f"{API}/concepts/concept-velocity")
    assert response.status_code == 503


def test_no_mock_curriculum_is_served_without_neo4j(monkeypatch) -> None:
    with _bare_client(monkeypatch) as client:
        response = client.get(f"{API}/subjects")
    assert response.status_code == 503
    body = response.json()
    assert "detail" in body
    assert isinstance(body["detail"], str)
