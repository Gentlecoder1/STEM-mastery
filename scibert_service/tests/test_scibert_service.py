"""End-to-end tests for the standalone SciBERT service with the real weights.

No mocks: the fixture boots the actual FastAPI service (``app.main``) with
``SCIBERT_MODEL_PATH`` pointed at the fine-tuned weights in this repo and
exercises one real inference (the 417 MB model loads once, lazily).

Run from the backend venv (it carries fastapi + CPU torch + transformers):

    .venv\\Scripts\\python.exe -m pytest ../scibert_service/tests -v

Skipped automatically when the weights are missing or the ML stack is not
installed.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

SERVICE_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = SERVICE_ROOT / "models" / "stem_scibert_final"


def _weights_present() -> bool:
    return (MODEL_DIR / "config.json").is_file() and (
        MODEL_DIR / "model.safetensors"
    ).is_file()


def _ml_available() -> bool:
    try:
        import transformers
        import torch  # noqa: F401

        return True
    except ImportError:
        return False


pytestmark = [
    pytest.mark.skipif(not _weights_present(), reason="model weights not present"),
    pytest.mark.skipif(not _ml_available(), reason="torch/transformers not installed"),
]

if _weights_present() or _ml_available():
    sys.path.insert(0, str(SERVICE_ROOT))


@pytest.fixture()
def service() -> "TestClient":  # noqa: F821 - fastapi imported lazily, inside ML guard
    from fastapi.testclient import TestClient
    from app.main import app

    os.environ["SCIBERT_MODEL_PATH"] = str(MODEL_DIR)
    client = TestClient(app)
    with client as http:
        yield http


def test_health_reports_status_and_model(service) -> None:
    body = service.get("/health").json()
    assert body == {
        "status": "ok",
        "configured": True,
        "loaded": False,
        "model": "stem_scibert_final",
    }


def test_extract_runs_real_inference(service) -> None:
    response = service.post(
        "/extract",
        json={"text": "Velocity is the rate of change of displacement."},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["model"] == "stem_scibert_final"
    concepts = [e for e in payload["entities"] if e["type"] == "CONCEPT"]
    texts = [e["text"].lower() for e in concepts]
    assert any("velocity" in t for t in texts)
    assert any("displacement" in t for t in texts)
    for entity in payload["entities"]:
        assert entity["score"] >= 0.80
        assert entity["type"] in ("SUBJECT", "TOPIC", "CONCEPT")
        assert entity["text"]


def test_extract_validates_input(service) -> None:
    assert service.post("/extract", json={"text": "   "}).status_code == 422
    from app.scibert import model_config

    limit = int(model_config()["max_text_chars"])
    assert service.post("/extract", json={"text": "x" * (limit + 1)}).status_code == 422


def test_merger_never_drops_earlier_spans() -> None:
    """Regression: alphabetical pre-sorting once discarded the first span.

    ``displacement`` sorted before ``velocity`` by text, so the 0-offset span
    entered the merge branch and was silently swallowed. Normalization must
    sort by position and keep non-touching spans intact.
    """
    from app.scibert import normalize_pipeline_result

    raw = [
        {"entity_group": "CONCEPT", "score": 0.9966, "word": "displacement", "start": 34, "end": 46},
        {"entity_group": "CONCEPT", "score": 0.9982, "word": "velocity", "start": 0, "end": 8},
    ]
    entities = normalize_pipeline_result(raw, 0.80)
    assert [(e["text"], e["start"]) for e in entities] == [
        ("velocity", 0),
        ("displacement", 34),
    ]
