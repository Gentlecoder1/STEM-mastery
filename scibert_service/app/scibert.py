"""SciBERT loading and inference for the standalone inference service.

This module is intentionally self-contained (no imports from the backend
``app`` package): the service must run on Cloud Run or anywhere else with no
FastAPI-backend code deployed alongside it.

Guarantees (mirrors the backend's original ``LocalSciBERTExtractor``, which
this replaces in production):

* **Lazy, once-only loading.** Weights load on the first ``/extract`` request,
  guarded by a lock, and are reused afterwards; ``/health`` never loads them.
* **Import-isolated.** ``transformers``/``torch`` are imported inside the load
  path, so the module imports cheaply for health/readiness checks.
* **Normalized, stable output.** HF pipeline entities are converted to plain
  Python types, BIO prefixes are stripped, unknown labels dropped, adjacent
  same-type spans merged, results filtered by ``SCIBERT_MIN_CONFIDENCE``.
* **Safe failures.** Any load/inference problem is logged with full detail
  here and surfaced to HTTP as a generic 503 (paths never leak in responses).
"""

from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import Any

logger = logging.getLogger("scibert_service")

_BIO_PREFIXES = ("B-", "I-")
_KNOWN_TYPES = ("SUBJECT", "TOPIC", "CONCEPT")
_REQUIRED_FILES = ("config.json", "model.safetensors")

SERVICE_ROOT = Path(__file__).resolve().parents[2]


def model_config() -> dict[str, Any]:
    """Environment-driven configuration, resolved at call time (test-friendly)."""
    configured_path = os.getenv("SCIBERT_MODEL_PATH", "models/stem_scibert_final")
    path = Path(configured_path)
    if not path.is_absolute():
        path = SERVICE_ROOT / path
    return {
        "path": path,
        "min_confidence": float(os.getenv("SCIBERT_MIN_CONFIDENCE", "0.80")),
        "max_text_chars": int(os.getenv("SCIBERT_MAX_TEXT_CHARS", "5000")),
        "name": Path(configured_path.replace("\\", "/")).name,
    }


class SciBERTServerError(RuntimeError):
    """Internal failure marker; the HTTP layer maps this to a clean 503."""


class SciBERT:
    """Lazy-loading wrapper around the fine-tuned token classifier."""

    def __init__(self) -> None:
        self._pipeline: Any | None = None
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self._pipeline is not None

    def _check_model_files(self, config: dict[str, Any]) -> None:
        path: Path = config["path"]
        if not path.is_dir():
            logger.error("SciBERT model directory not found: %s", path)
            raise SciBERTServerError("model directory not found")
        missing = [name for name in _REQUIRED_FILES if not (path / name).is_file()]
        if missing:
            logger.error("SciBERT model files missing (%s) in %s", missing, path)
            raise SciBERTServerError(f"model files missing: {', '.join(missing)}")

    def ensure_loaded(self) -> Any:
        """Blocking load (must run in a worker thread); returns the pipeline."""
        if self._pipeline is not None:
            return self._pipeline
        config = model_config()
        with self._lock:
            if self._pipeline is not None:
                return self._pipeline
            self._check_model_files(config)
            try:
                from transformers import (
                    AutoModelForTokenClassification,
                    AutoTokenizer,
                    pipeline,
                )

                path = str(config["path"])
                tokenizer = AutoTokenizer.from_pretrained(path)
                model = AutoModelForTokenClassification.from_pretrained(path)
                self._pipeline = pipeline(
                    "token-classification",
                    model=model,
                    tokenizer=tokenizer,
                    aggregation_strategy="simple",
                    device="cpu",
                )
            except Exception:  # noqa: BLE001 - every load failure maps to 503
                logger.exception("SciBERT model or tokenizer failed to load.")
                raise SciBERTServerError("model failed to load") from None
            logger.info("SciBERT model '%s' loaded (lazy, once).", config["name"])
            return self._pipeline

    def extract_sync(self, text: str) -> list[dict[str, Any]]:
        """Blocking inference; the HTTP layer runs this via a thread executor."""
        config = model_config()
        if max_text_chars := config["max_text_chars"]:
            if len(text) > int(max_text_chars):
                raise ValueError("text too long")
        result = self.ensure_loaded()(text)
        return normalize_pipeline_result(result, float(config["min_confidence"]))


def normalize_pipeline_result(
    raw: Any, min_confidence: float
) -> list[dict[str, Any]]:
    """HF token-classification aggregator output -> stable, sorted entity JSON.

    Accepts ``list[dict]`` (single input) or ``list[list[dict]]`` (batched),
    strips BIO prefixes, drops unknown labels and low-confidence spans, and
    merges adjacent spans of the same type.
    """
    items: list[dict[str, Any]] = []
    if raw:
        for entry in raw:
            if isinstance(entry, list):
                items.extend(item for item in entry if isinstance(item, dict))
            elif isinstance(entry, dict):
                items.append(entry)

    spans: list[tuple[str, str, float, int, int]] = []
    for item in items:
        label = str(item.get("entity_group") or item.get("entity") or "").strip()
        if label.startswith(_BIO_PREFIXES):
            label = label[2:]
        if label not in _KNOWN_TYPES:
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
        spans.append(
            (text, label, round(score, 4), int(item.get("start") or 0), int(item.get("end") or 0))
        )
    return _merge_adjacent(spans)


def _merge_adjacent(
    spans: list[tuple[str, str, float, int, int]]
) -> list[dict[str, Any]]:
    """Sort by position, then merge overlapping/touching spans of the same type."""
    merged: list[dict[str, Any]] = []
    for text, label, score, start, end in sorted(spans, key=lambda s: (s[3], s[4])):
        if merged:
            previous = merged[-1]
            if previous["type"] == label and start <= previous["end"]:
                if end > previous["end"]:
                    previous["text"] = previous["text"] + text[previous["end"] - start :]
                    previous["end"] = end
                previous["score"] = max(previous["score"], score)
                continue
        merged.append(
            {"text": text, "type": label, "score": score, "start": start, "end": end}
        )
    return merged
