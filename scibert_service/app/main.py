"""Standalone SciBERT inference service (destination: Google Cloud Run).

Exposes the minimum internal API consumed by the FastAPI backend's
``RemoteSciBERTExtractor``:

* ``GET  /health``  — liveness/readiness; deliberately never loads the model.
* ``POST /extract`` — ``{"text": "..."}`` -> ``{"entities": [...]}`` with the
  exact stable entity schema the main backend contract expects
  (``text``/``type``/``score``/``start``/``end``; BIO prefixes stripped).

This service has NO Neo4j, NO Supabase and NO graph logic. It cannot create
or mutate curriculum data; resolution stays in the main backend.
"""

from __future__ import annotations

import asyncio
import logging
import os

from fastapi import FastAPI, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.scibert import SciBERT, SciBERTServerError, model_config

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("scibert_service")

# One instance per container; the model blocks inside `extract_sync`, so
# inference runs in a thread executor off the event loop.
scibert = SciBERT()

app = FastAPI(title="SciBERT Inference Service", docs_url="/docs", redoc_url="/redoc")


class ExtractRequest(BaseModel):
    text: str


class ExtractResponse(BaseModel):
    model: str | None = None
    entities: list[dict[str, str | float | int]] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    configured: bool
    loaded: bool
    model: str | None = None


@app.exception_handler(SciBERTServerError)
async def scibert_error_handler(
    request: Request, exc: SciBERTServerError
) -> HTTPException:
    """503 without leaking internal paths or stack traces."""
    logger.warning("SciBERT failure on %s: %s", request.url.path, exc)
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="SciBERT inference is unavailable.",
    )


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    config = model_config()
    return HealthResponse(
        status="ok",
        configured=config["path"].is_dir(),  # file checks only; never loads
        loaded=scibert.loaded,
        model=str(config["name"]),
    )


@app.post("/extract", response_model=ExtractResponse)
async def extract(payload: ExtractRequest) -> ExtractResponse:
    text = payload.text if isinstance(payload.text, str) else ""
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text must not be empty.",
        )
    if len(text) > int(model_config()["max_text_chars"]):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text exceeds the configured character limit.",
        )
    # Lazy, once-only load; weights stay resident for subsequent requests.
    entities = await asyncio.to_thread(scibert.extract_sync, text)
    return ExtractResponse(model=model_config()["name"], entities=entities)


if __name__ == "__main__":
    import uvicorn

    # Cloud Run injects PORT (default 8080); bind 0.0.0.0 as required.
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
