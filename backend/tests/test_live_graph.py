"""Live integration smoke tests against a reachable Neo4j AuraDB.

Skipped unless ``STEM_NEO4J_URI`` is set. Run with:
    uv run pytest -m live
"""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

pytestmark = pytest.mark.live

requires_db = pytest.mark.skipif(
    not settings.neo4j_uri,
    reason="Set STEM_NEO4J_URI (and credentials) in backend/.env to run live Neo4j tests.",
)


@requires_db
def test_live_schema() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/graph/schema")
    assert response.status_code == 200
    assert "Subject" in response.json()["labels"]


@requires_db
def test_live_subjects() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/subjects")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
