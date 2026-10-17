"""Semantic (SciBERT) endpoints, exercised with fakes only.

The real 418 MB model is never loaded here: an ExtractedEntity-producing fake
is injected through the existing dependency-override pattern, exactly like
FakeGraphRepository. Unit tests additionally cover output normalization,
confidence filtering and conservative graph matching as pure functions.
"""

from __future__ import annotations

import asyncio
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_semantic_extractor
from app.main import app
from app.services.scibert_service import normalize_entities
from app.services.semantic_extractor import (
    ExtractedEntity,
    SemanticExtractor,
    SemanticUnavailableError,
)
from app.services.semantic_resolver import GraphEntityResolver


class FakeExtractor(SemanticExtractor):
    def __init__(
        self,
        entities: list[ExtractedEntity] | None = None,
        error: Exception | None = None,
    ) -> None:
        self._entities = entities or []
        self._error = error
        self.calls: list[str] = []
        self.is_configured = True
        self.is_loaded = True
        self.model_name = "stem_scibert_final"

    async def extract(self, text: str) -> list[ExtractedEntity]:
        self.calls.append(text)
        if self._error is not None:
            raise self._error
        return list(self._entities)


class UnloadingFakeExtractor(FakeExtractor):
    """Simulates the pre-first-inference state for /semantic/status."""

    def __init__(self) -> None:
        super().__init__(entities=[])
        self.is_loaded = False

    async def extract(self, text: str) -> list[ExtractedEntity]:
        self.calls.append(text)
        self.is_loaded = True
        return []


def velocity() -> ExtractedEntity:
    return ExtractedEntity("velocity", "CONCEPT", 0.995, 0, 8)


def physics() -> ExtractedEntity:
    return ExtractedEntity("physics", "SUBJECT", 0.99, 25, 32)


def time_entity() -> ExtractedEntity:
    return ExtractedEntity("time", "CONCEPT", 0.91, 43, 47)


@pytest.fixture
def override_extractor():
    def _override(extractor: SemanticExtractor) -> SemanticExtractor:
        app.dependency_overrides[get_semantic_extractor] = lambda: extractor
        return extractor

    yield _override
    app.dependency_overrides.pop(get_semantic_extractor, None)


# --------------------------------------------------------------------------
# Output normalization / confidence filtering (pure, no model load)
# --------------------------------------------------------------------------


def test_normalize_strips_bio_prefix_and_converts_types() -> None:
    raw = [
        {
            "entity_group": "B-CONCEPT",
            "word": "velocity",
            "score": 0.995,
            "start": 0,
            "end": 8,
        }
    ]
    entities = normalize_entities(raw, min_confidence=0.80)
    assert entities == [ExtractedEntity("velocity", "CONCEPT", 0.995, 0, 8)]


def test_normalize_drops_low_confidence_and_unknown_labels() -> None:
    raw = [
        {"entity_group": "B-CONCEPT", "word": "velocity", "score": 0.70, "start": 0, "end": 8},
        {"entity_group": "B-DATE", "word": "yesterday", "score": 0.99, "start": 10, "end": 19},
        {"entity_group": "O", "word": "junk", "score": 0.99, "start": 20, "end": 24},
    ]
    assert normalize_entities(raw, min_confidence=0.80) == []


def test_normalize_flattens_batched_output() -> None:
    raw = [
        [
            {"entity_group": "B-CONCEPT", "word": "velocity", "score": 0.9, "start": 0, "end": 8},
            {"entity_group": "I-CONCEPT", "word": "gradient", "score": 0.8, "start": 9, "end": 17},
        ]
    ]
    entities = normalize_entities(raw, min_confidence=0.80)
    assert [entity.text for entity in entities] == ["velocity", "gradient"]


def test_normalize_merges_adjacent_same_type_spans() -> None:
    raw = [
        {"entity_group": "CONCEPT", "word": "displacement", "score": 0.9, "start": 30, "end": 42},
        {"entity_group": "CONCEPT", "word": " with time", "score": 0.85, "start": 42, "end": 52},
    ]
    entities = normalize_entities(raw, min_confidence=0.80)
    assert len(entities) == 1
    assert entities[0].start == 30 and entities[0].end == 52


# --------------------------------------------------------------------------
# Conservative graph resolution (pure matching logic over fake graph rows)
# --------------------------------------------------------------------------


class FakeGraphLookup:
    """Minimal stand-in for GraphRepository.find_entity / get_concept."""

    def __init__(self, nodes: dict[str, list[dict[str, Any]]]) -> None:
        self._nodes = nodes
        self.find_calls: list[tuple[str, str]] = []

    async def find_entity(self, entity_type: str, text: str) -> list[dict[str, Any]]:
        self.find_calls.append((entity_type, text))
        normalized = text.strip().lower()
        nodes = self._nodes.get(entity_type, [])
        primary = [row for row in nodes if row["name"].strip().lower() == normalized]
        if primary:
            return primary[:2]
        aliases = [
            row
            for row in nodes
            for alias in row.get("aliases", [])
            if alias.strip().lower() == normalized
        ]
        return aliases[:2]

    async def get_concept(self, concept_id: str) -> dict[str, Any] | None:
        assert concept_id == "c-1"  # only used by the concept-context test
        return {
            "topicIds": ["t-1", "t-2"],
            "subjectIds": ["physics"],
            "prerequisites": [{"id": "c-0", "name": "Speed"}],
            "related": [{"id": "c-9", "name": "Acceleration"}],
        }


def test_match_exact_normalized_name_and_id() -> None:
    repo = FakeGraphLookup(
        {"CONCEPT": [{"id": "c-1", "name": "Velocity"}, {"id": "c-2", "name": "Speed"}]}
    )
    resolver = GraphEntityResolver(repo)  # type: ignore[arg-type]
    row = asyncio.run(resolver.resolve_entity(ExtractedEntity("VELOCITY ", "CONCEPT", 0.9, 0, 9)))
    assert row["matched"] is True and row["graphId"] == "c-1"


def test_match_is_conservative_and_skips_substrings() -> None:
    repo = FakeGraphLookup(
        {"CONCEPT": [{"id": "c-1", "name": "Velocity"}, {"id": "c-2", "name": "Angular velocity"}]}
    )
    resolver = GraphEntityResolver(repo)  # type: ignore[arg-type]
    row = asyncio.run(resolver.resolve_entity(ExtractedEntity("velocity", "CONCEPT", 0.9, 0, 8)))
    assert row["matched"] is True and row["graphId"] == "c-1"
    assert repo.find_calls == [("CONCEPT", "velocity")]


def test_match_ambiguous_returns_candidates_without_guessing() -> None:
    repo = FakeGraphLookup(
        {"CONCEPT": [{"id": "a", "name": "Force"}, {"id": "b", "name": "Force"}]}
    )
    resolver = GraphEntityResolver(repo)  # type: ignore[arg-type]
    row = asyncio.run(resolver.resolve_entity(ExtractedEntity("force", "CONCEPT", 0.9, 0, 5)))
    assert row["matched"] is False
    assert row["ambiguous"] is True
    assert [candidate["id"] for candidate in row["candidates"]] == ["a", "b"]


def test_match_alias_fallback() -> None:
    repo = FakeGraphLookup(
        {"CONCEPT": [{"id": "c-1", "name": "Velocity", "aliases": ["speed"]}]}
    )
    resolver = GraphEntityResolver(repo)  # type: ignore[arg-type]
    row = asyncio.run(resolver.resolve_entity(ExtractedEntity("speed", "CONCEPT", 0.9, 0, 5)))
    assert row["matched"] is True and row["graphId"] == "c-1"


def test_match_unresolved() -> None:
    resolver = GraphEntityResolver(FakeGraphLookup({}))  # type: ignore[arg-type]
    row = asyncio.run(resolver.resolve_entity(ExtractedEntity("example", "CONCEPT", 0.91, 0, 7)))
    assert (row["matched"], row["graphId"], row["graphName"]) == (False, None, None)


def test_concept_context_preserves_many_to_many_topics() -> None:
    repo = FakeGraphLookup({"CONCEPT": [{"id": "c-1", "name": "Velocity"}]})
    resolver = GraphEntityResolver(repo)  # type: ignore[arg-type]
    row = asyncio.run(resolver.resolve_entity(ExtractedEntity("velocity", "CONCEPT", 0.9, 0, 8)))
    assert row["graph"]["topicIds"] == ["t-1", "t-2"]


# --------------------------------------------------------------------------
# HTTP contract
# --------------------------------------------------------------------------


def test_extract_returns_normalized_entities(client, override_extractor) -> None:
    extractor = override_extractor(FakeExtractor([velocity(), physics(), time_entity()]))

    with client as http:
        response = http.post(
            "/api/v1/semantic/extract",
            json={"text": "Velocity is the rate of change of displacement with time."},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["entities"][0] == {
        "text": "velocity",
        "type": "CONCEPT",
        "score": 0.995,
        "start": 0,
        "end": 8,
    }
    assert [entity["type"] for entity in body["entities"]] == ["CONCEPT", "SUBJECT", "CONCEPT"]
    assert extractor.model_name == "stem_scibert_final"


def test_extract_validates_empty_and_blank_text(client, override_extractor) -> None:
    extractor = override_extractor(FakeExtractor([velocity()]))
    with client as http:
        for payload in ({}, {"text": ""}, {"text": "   \n\t "}):
            response = http.post("/api/v1/semantic/extract", json=payload)
            assert response.status_code == 422
    assert extractor.calls == []  # model-side code never ran


def test_extract_rejects_overlong_text(
    client, override_extractor, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.scibert_max_text_chars", 10)
    override_extractor(FakeExtractor())
    with client as http:
        response = http.post("/api/v1/semantic/extract", json={"text": "a" * 11})
    assert response.status_code == 422
    assert "character limit" in response.json()["detail"]


def test_extract_returns_503_when_service_unavailable(client, override_extractor) -> None:
    override_extractor(FakeExtractor(error=SemanticUnavailableError("boom")))
    with client as http:
        response = http.post(
            "/api/v1/semantic/extract", json={"text": "Velocity is fast."}
        )
    assert response.status_code == 503
    assert response.json()["detail"] == "Semantic service is unavailable."


def test_local_extractor_missing_model_files_fail_cleanly(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No filesystem paths leak; load failure stays a SemanticUnavailableError."""
    from app.services.scibert_service import LocalSciBERTExtractor

    monkeypatch.setattr(
        "app.core.config.settings.scibert_model_path", "models/does_not_exist"
    )
    extractor = LocalSciBERTExtractor()
    with pytest.raises(SemanticUnavailableError):
        asyncio.run(extractor.extract("Velocity is fast."))
    assert extractor.is_loaded is False


class _NullExtractor(SemanticExtractor):
    async def extract(self, text: str) -> list[ExtractedEntity]:
        raise SemanticUnavailableError("Semantic service is not configured.")


def test_unconfigured_environment_returns_503_with_catalog_intact(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.scibert_model_path", "")
    app.state.semantic_extractor = None  # force a rebuild from settings
    app.dependency_overrides[get_semantic_extractor] = _NullExtractor
    try:
        with client as http:
            failed = http.post(
                "/api/v1/semantic/extract", json={"text": "Velocity is fast."}
            )
            assert failed.status_code == 503

            status_body = http.get("/api/v1/semantic/status").json()
            assert status_body == {"configured": False, "loaded": False, "model": None}

            # Ordinary catalog routes keep working (conftest fakes).
            subjects = http.get("/api/v1/subjects")
            assert subjects.status_code == 200
    finally:
        app.dependency_overrides.pop(get_semantic_extractor, None)
        app.state.semantic_extractor = None


def test_catalog_routes_never_invoke_scibert(client, override_extractor) -> None:
    extractor = override_extractor(FakeExtractor([velocity()]))
    with client as http:
        for path in (
            "/api/v1/subjects",
            "/api/v1/subjects/physics/topics",
            "/api/v1/topics/topic-speed-velocity/concepts",
            "/api/v1/concepts/concept-velocity",
            "/api/v1/concepts/concept-velocity/lesson",
        ):
            assert http.get(path).status_code == 200
    assert extractor.calls == []


def test_resolve_matches_graph_entities(client, override_extractor) -> None:
    override_extractor(FakeExtractor([velocity(), physics(), time_entity()]))
    with client as http:
        response = http.post(
            "/api/v1/semantic/resolve",
            json={"text": "Velocity is a concept in Physics."},
        )

    assert response.status_code == 200
    entities = {entity["text"]: entity for entity in response.json()["entities"]}

    assert entities["velocity"] == {
        "text": "velocity",
        "type": "CONCEPT",
        "score": 0.995,
        "start": 0,
        "end": 8,
        "matched": True,
        "graphId": "concept-velocity",
        "graphName": "Velocity",
        "ambiguous": False,
        "candidates": [],
        "graph": {
            "topicIds": ["topic-speed-velocity"],
            "subjectIds": ["physics"],
            "prerequisiteIds": ["concept-displacement"],
            "relatedConceptIds": ["concept-acceleration"],
        },
    }
    assert entities["physics"] == {
        "text": "physics",
        "type": "SUBJECT",
        "score": 0.99,
        "start": 25,
        "end": 32,
        "matched": True,
        "graphId": "physics",
        "graphName": "Physics",
        "ambiguous": False,
        "candidates": [],
        "graph": None,
    }
    assert entities["time"] == {
        "text": "time",
        "type": "CONCEPT",
        "score": 0.91,
        "start": 43,
        "end": 47,
        "matched": False,
        "graphId": None,
        "graphName": None,
        "ambiguous": False,
        "candidates": [],
        "graph": None,
    }


def test_resolve_503_without_neo4j(
    override_extractor, monkeypatch: pytest.MonkeyPatch
) -> None:
    override_extractor(FakeExtractor([velocity()]))
    monkeypatch.setattr("app.core.config.settings.neo4j_uri", "")
    app.state.db = None
    try:
        with TestClient(app) as http:
            response = http.post(
                "/api/v1/semantic/resolve", json={"text": "Velocity is fast."}
            )
        assert response.status_code == 503
        assert "not configured" in response.json()["detail"].lower()
    finally:
        app.state.db = None


def test_status_never_loads_the_model(client, override_extractor) -> None:
    lazy = UnloadingFakeExtractor()
    override_extractor(lazy)
    with client as http:
        first = http.get("/api/v1/semantic/status").json()
        second = http.get("/api/v1/semantic/status").json()

    assert first == {"configured": True, "loaded": False, "model": "stem_scibert_final"}
    assert second == first  # status alone must not flip loaded
    assert lazy.calls == []  # and must never run inference on anything


def test_status_configured_before_model_load(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.semantic_mode", "local")
    monkeypatch.setattr(
        "app.core.config.settings.scibert_model_path", "models/stem_scibert_final"
    )
    app.state.semantic_extractor = None
    try:
        with TestClient(app) as http:
            body = http.get("/api/v1/semantic/status").json()
    finally:
        app.state.semantic_extractor = None
    assert body["configured"] is True
    assert body["loaded"] is False
    assert body["model"] == "stem_scibert_final"
