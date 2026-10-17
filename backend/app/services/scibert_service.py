"""Local SciBERT inference for STEM entity extraction (BIO token classification).

Encapsulates the fine-tuned ``BertForTokenClassification`` model. Key
guarantees:

* **Lazy, once-only loading.** The 418 MB weights are loaded on the first
  inference, guarded by a lock, and reused afterwards. Startup, health and
  ordinary catalog requests never pay for SciBERT.
* **Import-isolated.** ``transformers``/``torch`` are imported inside the load
  path only, so test runs and model-free deployments (e.g. Vercel without the
  weights) never need the ML stack installed at import time.
* **Safe failures.** Any load/inference problem raises
  ``SemanticUnavailableError``; real diagnostics go to the log, the API only
  sees a generic 503, and the rest of the app keeps running.
* **Normalized output.** HF pipeline entities are converted to plain Python
  types, BIO prefixes are stripped, adjacent same-type spans are merged, and
  results below ``scibert_min_confidence`` are dropped.

Later, moving SciBERT to a separate service means swapping this class for a
``RemoteSciBERTExtractor`` implementing the same ``SemanticExtractor``
interface — routes, models and the mobile app contract stay unchanged.
"""

from __future__ import annotations

import asyncio
import logging
import threading
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.services.semantic_extractor import (
    ExtractedEntity,
    SemanticExtractor,
    SemanticUnavailableError,
)

logger = logging.getLogger("stem_mastery")

# HF aggregation output label may be BIO-tagged; strip down to the plain type.
_BIO_PREFIXES = ("B-", "I-")
_KNOWN_TYPES = ("SUBJECT", "TOPIC", "CONCEPT")
# Files that must exist before transformers is even imported.
_REQUIRED_FILES = ("config.json", "model.safetensors")


def normalize_entities(raw: Any, min_confidence: float) -> list[ExtractedEntity]:
    """Turn a HF token-classification pipeline result into clean entities.

    Accepts either ``list[dict]`` (single input) or ``list[list[dict]]``
    (batched input), strips BIO prefixes, drops unknown labels and
    low-confidence spans, merges adjacent spans of the same type, and sorts
    by position in the original text.
    """
    if raw is None:
        return []
    items: list[dict[str, Any]] = []
    for entry in raw:
        if isinstance(entry, list):
            items.extend(item for item in entry if isinstance(item, dict))
        elif isinstance(entry, dict):
            items.append(entry)

    extracted: list[ExtractedEntity] = []
    for item in items:
        label = str(item.get("entity_group") or item.get("entity") or "")
        entity_type = label.strip()
        if entity_type.startswith(_BIO_PREFIXES):
            entity_type = entity_type[2:]
        if entity_type not in _KNOWN_TYPES:
            continue
        try:
            score = float(item.get("score"))
        except (TypeError, ValueError):
            continue
        if score < min_confidence:
            continue
        text = str(item.get("word") or item.get("text") or "").strip()
        if not text:
            continue
        extracted.append(
            ExtractedEntity(
                text=text,
                type=entity_type,
                score=round(score, 4),
                start=int(item.get("start") or 0),
                end=int(item.get("end") or 0),
            )
        )

    return _merge_adjacent(sorted(extracted, key=lambda e: (e.start, e.end)))


def _merge_adjacent(entities: list[ExtractedEntity]) -> list[ExtractedEntity]:
    """Merge spans of the same type that overlap or touch (aggregator safety)."""
    merged: list[ExtractedEntity] = []
    for entity in entities:
        if merged:
            previous = merged[-1]
            if entity.type == previous.type and entity.start <= previous.end:
                text = previous.text if previous.end >= entity.end else (
                    previous.text + entity.text[previous.end - entity.start :]
                )
                merged[-1] = ExtractedEntity(
                    text=text,
                    type=previous.type,
                    score=round(max(previous.score, entity.score), 4),
                    start=previous.start,
                    end=max(previous.end, entity.end),
                )
                continue
        merged.append(entity)
    return merged


class LocalSciBERTExtractor(SemanticExtractor):
    """SciBERT running in-process behind the SemanticExtractor interface."""

    def __init__(self) -> None:
        self._min_confidence = settings.scibert_min_confidence
        self._model_path = settings.resolved_scibert_model_path
        self._pipeline: Any | None = None
        self._lock = threading.Lock()
        self.is_configured = bool(settings.scibert_model_path)
        self.is_loaded = False
        self.model_name = settings.scibert_model_name or None

    def _ensure_loaded(self) -> None:
        """Load tokenizer + model once (blocking; run inside a worker thread)."""
        if self._pipeline is not None:
            return
        with self._lock:
            if self._pipeline is not None:
                return
            if not self.is_configured:
                raise SemanticUnavailableError("Semantic service is not configured.")
            self._check_model_files()
            try:
                from transformers import (
                    AutoModelForTokenClassification,
                    AutoTokenizer,
                    pipeline,
                )

                tokenizer = AutoTokenizer.from_pretrained(str(self._model_path))
                model = AutoModelForTokenClassification.from_pretrained(
                    str(self._model_path)
                )
                self._pipeline = pipeline(
                    "token-classification",
                    model=model,
                    tokenizer=tokenizer,
                    aggregation_strategy="simple",
                    device="cpu",
                )
            except SemanticUnavailableError:
                raise
            except Exception:  # noqa: BLE001 - every load failure maps to 503
                logger.exception("SciBERT model or tokenizer failed to load.")
                raise SemanticUnavailableError("Semantic model failed to load.") from None
            self.is_loaded = True
            logger.info("SciBERT model '%s' loaded (lazy, once).", self.model_name)

    def _check_model_files(self) -> None:
        if not self.is_configured:
            return
        path = Path(self._model_path)
        missing = [name for name in _REQUIRED_FILES if not (path / name).is_file()]
        if not path.is_dir():
            logger.error("SciBERT model directory not found: %s", path)
            raise SemanticUnavailableError("Semantic model is not available.")
        if missing:
            logger.error("SciBERT model files missing (%s) in %s", missing, path)
            raise SemanticUnavailableError("Semantic model is not available.")

    async def extract(self, text: str) -> list[ExtractedEntity]:
        if not self.is_configured:
            raise SemanticUnavailableError("Semantic service is not configured.")
        try:
            await asyncio.to_thread(self._ensure_loaded)
            raw = await asyncio.to_thread(self._pipeline, text)
        except SemanticUnavailableError:
            raise
        except Exception:  # noqa: BLE001 - inference failure maps to 503
            logger.exception("SciBERT inference failed.")
            raise SemanticUnavailableError("Semantic inference failed.") from None
        return normalize_entities(raw, self._min_confidence)
