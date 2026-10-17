"""Semantic endpoints (SciBERT).

Completely isolated from the curriculum catalog: Neo4j-backed routes
(``/subjects``, ``/topics``, ``/concepts``...) never instantiate or call an
extractor. SciBERT runs only here, lazily, and the mobile app stays agnostic
about where inference physically happens.
"""

from dataclasses import asdict

from fastapi import APIRouter, HTTPException, status

from app.api.deps import RepositoryDep, SemanticExtractorDep
from app.core.config import settings
from app.models.semantic import (
    Entity,
    EntityCandidate,
    ExtractRequest,
    ExtractResponse,
    ResolvedEntity,
    ResolveResponse,
    SemanticStatusResponse,
)
from app.services.semantic_extractor import SemanticUnavailableError
from app.services.semantic_resolver import GraphEntityResolver

router = APIRouter(prefix="/semantic", tags=["semantic"])


def _validated_text(payload: ExtractRequest) -> str:
    text = payload.text if isinstance(payload.text, str) else ""
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Text must not be empty.",
        )
    if len(text) > settings.scibert_max_text_chars:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Text exceeds the {settings.scibert_max_text_chars} character limit.",
        )
    return text


@router.post("/extract", response_model=ExtractResponse)
async def extract_entities(
    payload: ExtractRequest, extractor: SemanticExtractorDep
) -> ExtractResponse:
    """Run SciBERT entity extraction; no graph access involved."""
    _validated_text(payload)
    try:
        entities = await extractor.extract(payload.text)
    except SemanticUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Semantic service is unavailable.",
        ) from None
    return ExtractResponse(entities=[Entity(**asdict(entity)) for entity in entities])


@router.post("/resolve", response_model=ResolveResponse)
async def resolve_entities(
    payload: ExtractRequest, extractor: SemanticExtractorDep, repo: RepositoryDep
) -> ResolveResponse:
    """Extract entities and resolve each against the Neo4j graph.

    Nothing is written to the graph; unresolved entities simply come back
    with ``matched: false`` and ambiguous ones keep every candidate.
    """
    _validated_text(payload)
    try:
        entities = await extractor.extract(payload.text)
    except SemanticUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Semantic service is unavailable.",
        ) from None
    resolver = GraphEntityResolver(repo)
    rows = await resolver.resolve_all(entities)
    return ResolveResponse(
        entities=[
            ResolvedEntity(
                **{
                    **row,
                    "candidates": [EntityCandidate(**c) for c in row["candidates"]],
                }
            )
            for row in rows
        ]
    )


@router.get("/status", response_model=SemanticStatusResponse)
async def semantic_status(
    extractor: SemanticExtractorDep,
) -> SemanticStatusResponse:
    """Cheap readiness probe - deliberately never loads the model."""
    return SemanticStatusResponse(
        configured=extractor.is_configured,
        loaded=extractor.is_loaded,
        model=extractor.model_name,
    )
