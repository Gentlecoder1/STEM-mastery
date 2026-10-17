"""Remote SciBERT extraction over HTTP.

The heavy model lives in a dedicated inference service (see
``scibert_service/`` at the repo root, deployed on Cloud Run). This class
implements the same :class:`SemanticExtractor` interface, so routes, models
and the mobile-app contract stay unchanged when the deployment mode flips from
``local`` to ``remote``.

Design notes:

* **No ML imports.** This module (and the whole backend) never imports
  torch/transformers — inference happens in the separate service.
* **State by contract.** ``is_configured``/``is_loaded`` are ``True`` because
  the factory only constructs this class when a service URL is set; loading
  and warming are the remote service's concern.
* **Single failure type.** Any failure (unreachable, non-200, malformed
  payload) raises :class:`SemanticUnavailableError`, which routes translate
  into HTTP 503. Internal details stay in the log.
* **Response normalization is defensive.** The service already returns clean
  entity JSON, but entries are still re-validated here so a malformed
  upstream can never crash a route.
* **Test-injectable.** ``transport`` accepts any ``httpx.AsyncBaseTransport``
  (e.g. ``MockTransport``) so tests run without a real service.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.services.semantic_extractor import (
    ExtractedEntity,
    SemanticExtractor,
    SemanticUnavailableError,
)

logger = logging.getLogger("stem_mastery")

_KNOWN_TYPES = ("SUBJECT", "TOPIC", "CONCEPT")
_BIO_PREFIXES = ("B-", "I-")


class RemoteSciBERTExtractor(SemanticExtractor):
    """Calls the standalone SciBERT inference service over HTTP."""

    is_configured: bool = True
    is_loaded: bool = True  # weights live in the remote service, not here
    model_name: str | None = None

    def __init__(self, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._transport = transport
        self._timeout = settings.scibert_remote_timeout_seconds
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=settings.scibert_remote_url.rstrip("/"),
                timeout=self._timeout,
                transport=self._transport,
            )
        return self._client

    async def extract(self, text: str) -> list[ExtractedEntity]:
        try:
            client = self._get_client()
        except Exception:  # noqa: BLE001 - invalid URL config surfaces as 503
            logger.exception("Invalid SciBERT service URL configuration.")
            raise SemanticUnavailableError("Semantic service is unavailable.") from None
        try:
            response = await client.post("/extract", json={"text": text})
        except httpx.HTTPError:
            logger.exception("Remote SciBERT service unreachable.")
            raise SemanticUnavailableError("Semantic service is unavailable.") from None
        if response.status_code != 200:
            logger.error(
                "Remote SciBERT service answered %s for /extract.",
                response.status_code,
            )
            raise SemanticUnavailableError("Semantic service is unavailable.")
        try:
            payload = response.json()
        except ValueError:
            logger.error("Remote SciBERT service returned a malformed payload.")
            raise SemanticUnavailableError("Semantic service is unavailable.") from None
        return self._normalize(payload)

    def _normalize(self, payload: Any) -> list[ExtractedEntity]:
        if isinstance(payload, dict) and isinstance(payload.get("model"), str):
            self.model_name = payload.get("model")
        entities_raw = payload.get("entities", []) if isinstance(payload, dict) else []
        entities: list[ExtractedEntity] = []
        for item in entities_raw:
            if not isinstance(item, dict):
                continue
            entity_type = str(item.get("type") or "").strip()
            if entity_type.startswith(_BIO_PREFIXES):
                entity_type = entity_type[2:]
            entity_type = entity_type.upper()
            if entity_type not in _KNOWN_TYPES:
                continue
            text = str(item.get("text") or "").strip()
            if not text:
                continue
            try:
                score = float(item.get("score"))
            except (TypeError, ValueError):
                continue
            entities.append(
                ExtractedEntity(
                    text=text,
                    type=entity_type,
                    score=round(score, 4),
                    start=int(item.get("start") or 0),
                    end=int(item.get("end") or 0),
                )
            )
        return entities
