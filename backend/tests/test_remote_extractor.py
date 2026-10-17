"""``RemoteSciBERTExtractor`` and the mode-driven factory, no real service needed.

The remote service runs over ``httpx.MockTransport`` here; the real 417 MB
model is only exercised in ``scibert_service/tests`` (skipped when the
weights are absent).
"""

from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from app.api.deps import _build_semantic_extractor
from app.core.config import settings
from app.services.remote_scibert_service import RemoteSciBERTExtractor
from app.services.semantic_extractor import (
    ExtractedEntity,
    SemanticUnavailableError,
    UnconfiguredSemanticExtractor,
)

SERVICE_PAYLOAD = {
    "model": "stem_scibert_final",
    "entities": [
        {"text": "Velocity", "type": "CONCEPT", "score": 0.9977, "start": 0, "end": 8},
        {"text": "junk", "type": "DATE", "score": 0.99, "start": 10, "end": 14},
    ],
}


@pytest.fixture
def remote_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "semantic_mode", "remote")
    monkeypatch.setattr(settings, "scibert_remote_url", "https://scibert.example.test")
    monkeypatch.setattr(settings, "scibert_remote_timeout_seconds", 5.0)


def _extractor(handler) -> RemoteSciBERTExtractor:
    return RemoteSciBERTExtractor(transport=httpx.MockTransport(handler))


# --------------------------------------------------------------------------
# Extraction behaviour
# --------------------------------------------------------------------------


def test_extract_round_trip(remote_env) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert str(request.url) == "https://scibert.example.test/extract"
        assert json.loads(request.content) == {"text": "Velocity is fast."}
        return httpx.Response(200, json=SERVICE_PAYLOAD)

    entities = asyncio.run(_extractor(handler).extract("Velocity is fast."))

    assert entities == [ExtractedEntity("Velocity", "CONCEPT", 0.9977, 0, 8)]


def test_extract_strips_bio_prefixes_and_unknown_types(remote_env) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "model": "stem_scibert_final",
                "entities": [
                    {"text": "force", "type": "B-SUBJECT", "score": 0.9, "start": 0, "end": 5},
                    {"text": "yesterday", "type": "DATE", "score": 0.99, "start": 6, "end": 15},
                ],
            },
        )

    extractor = _extractor(handler)
    entities = asyncio.run(extractor.extract("force yesterday"))

    assert [entity.type for entity in entities] == ["SUBJECT"]
    assert extractor.model_name == "stem_scibert_final"


def test_extract_drops_malformed_entries_and_keeps_rest(remote_env) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "entities": [
                    "not-a-dict",
                    {"text": "", "type": "CONCEPT", "score": 0.9},
                    {"text": "drag", "type": "CONCEPT", "score": "oops"},
                    {"text": "friction", "type": "CONCEPT", "score": 0.88, "start": 3, "end": 11},
                ]
            },
        )

    assert asyncio.run(_extractor(handler).extract("drag friction")) == [
        ExtractedEntity("friction", "CONCEPT", 0.88, 3, 11)
    ]


# --------------------------------------------------------------------------
# Every failure mode collapses to SemanticUnavailableError (-> HTTP 503)
# --------------------------------------------------------------------------


def test_unreachable_service_raises_unavailable(remote_env) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    extractor = _extractor(handler)
    with pytest.raises(SemanticUnavailableError):
        asyncio.run(extractor.extract("Velocity is fast."))


def test_non_200_answer_raises_unavailable(remote_env) -> None:
    for code in (422, 500, 503):
        def handler(request: httpx.Request, _code: int = code) -> httpx.Response:
            return httpx.Response(_code, json={"detail": "boom"})

        with pytest.raises(SemanticUnavailableError):
            asyncio.run(_extractor(handler).extract("Velocity is fast."))


def test_malformed_json_raises_unavailable(remote_env) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=b"<html>oops</html>")

    with pytest.raises(SemanticUnavailableError):
        asyncio.run(_extractor(handler).extract("Velocity is fast."))


# --------------------------------------------------------------------------
# Factory wiring (_build_semantic_extractor)
# --------------------------------------------------------------------------


def test_factory_remote_with_url_builds_remote_extractor(remote_env) -> None:
    extractor = _build_semantic_extractor()
    assert isinstance(extractor, RemoteSciBERTExtractor)
    assert extractor.is_configured is True


def test_factory_remote_without_url_is_unconfigured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "semantic_mode", "remote")
    monkeypatch.setattr(settings, "scibert_remote_url", "")
    extractor = _build_semantic_extractor()
    assert isinstance(extractor, UnconfiguredSemanticExtractor)


def test_factory_local_mode_builds_local_extractor(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "semantic_mode", "local")
    monkeypatch.setattr(settings, "scibert_model_path", "models/stem_scibert_final")
    from app.services.scibert_service import LocalSciBERTExtractor

    assert isinstance(_build_semantic_extractor(), LocalSciBERTExtractor)


def test_factory_local_mode_without_path_is_unconfigured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "semantic_mode", "local")
    monkeypatch.setattr(settings, "scibert_model_path", "")
    assert isinstance(_build_semantic_extractor(), UnconfiguredSemanticExtractor)
