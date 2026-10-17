"""Abstraction layer for STEM semantic extraction.

Routes and callers depend only on :class:`SemanticExtractor` plus the small
value types here. Today the only implementation is the local SciBERT model
(:mod:`app.services.scibert_service`); later a ``RemoteSciBERTExtractor`` can
call a dedicated inference service without any API-contract change.

Design notes:

* The heavy 418 MB model is **never** loaded by constructing an extractor —
  weights load lazily on the first inference inside the implementation.
* Implementations must raise :class:`SemanticUnavailableError` for every
  failure case (not configured, model files missing, load failure, inference
  failure). Routes translate that into a clean HTTP 503; ordinary curriculum
  endpoints are never affected because they never touch extractors.
* Entity types returned are plain ``SUBJECT`` / ``TOPIC`` / ``CONCEPT``
  labels with BIO prefixes already stripped.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class ExtractedEntity:
    """One extracted STEM entity with character offsets and confidence."""

    text: str
    type: str
    score: float
    start: int
    end: int


class SemanticUnavailableError(RuntimeError):
    """The extractor cannot serve a request right now.

    Never carries filesystem diagnostics — internal paths and stack traces
    stay in the server log only.
    """


class SemanticExtractor(ABC):
    """Interface a semantic extraction backend must satisfy."""

    #: False until weights are actually loaded (or always False if remote).
    is_loaded: bool = False
    #: False when no model is configured for the current environment.
    is_configured: bool = False
    #: Short identifier such as ``stem_scibert_final``.
    model_name: str | None = None

    @abstractmethod
    async def extract(self, text: str) -> list[ExtractedEntity]:
        """Extract entities from ``text``, confidence-filtered and normalized.

        Implementations may raise :class:`SemanticUnavailableError` when the
        backend is missing or fails; the caller translates that to HTTP 503.
        """


class UnconfiguredSemanticExtractor(SemanticExtractor):
    """No-op extractor for deployments without SciBERT.

    Keeps the DI graph simple: the semantic endpoints answer 503 while every
    other route (catalog, assessment, learner state) keeps working untouched.
    """

    async def extract(self, text: str) -> list[ExtractedEntity]:
        raise SemanticUnavailableError("Semantic service is not configured.")
