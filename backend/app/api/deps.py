import logging
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings
from app.core.db import Neo4jDatabase, create_database
from app.repositories.graph import GraphRepository
from app.repositories.learner_state import LearnerStateRepository
from app.services.semantic_extractor import (
    SemanticExtractor,
    UnconfiguredSemanticExtractor,
)

logger = logging.getLogger("stem_mastery")


def get_database(request: Request) -> Neo4jDatabase:
    """Return the Neo4j wrapper, or fail with 503 when it is unavailable.

    The driver is normally created once during app startup (lifespan). On
    serverless platforms such as Vercel lifespan may not run, so fall back to
    creating it lazily on first use. Connection details stay environment-driven
    so AuraDB can be enabled later without any code changes.
    """
    database: Neo4jDatabase | None = getattr(request.app.state, "db", None)
    if database is None:
        if not settings.neo4j_uri:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Curriculum database is not configured.",
            )
        try:
            database = create_database()
        except Exception:  # noqa: BLE001 - surface any driver/URI error as 503
            logger.exception("Could not create the Neo4j driver from configuration.")
            database = None
        if database is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Curriculum database is not configured.",
            )
        request.app.state.db = database
    return database


def get_repository(request: Request) -> GraphRepository:
    return GraphRepository(get_database(request))


def get_learner_state(request: Request) -> LearnerStateRepository:
    repository: LearnerStateRepository | None = getattr(
        request.app.state, "learner_state", None
    )
    if repository is None:
        repository = LearnerStateRepository()
    return repository


RepositoryDep = Annotated[GraphRepository, Depends(get_repository)]
LearnerStateDep = Annotated[LearnerStateRepository, Depends(get_learner_state)]


def _build_semantic_extractor() -> SemanticExtractor:
    """Mode-driven extractor factory.

    ``remote`` is the production mode: SciBERT runs in a dedicated Cloud Run
    service (see ``scibert_service/``), so torch/transformers never ship in
    the serverless bundle. ``local`` keeps the in-process lazy model for
    offline development. Both implement the same ``SemanticExtractor``
    interface — routes and the app contract are untouched.

    Imports are deferred so a remote deployment never even imports the
    ML-backed local module. Returning ``UnconfiguredSemanticExtractor`` when
    the mode's URL/path is missing keeps the whole API bootable: only
    /semantic/* answers 503.
    """
    if settings.semantic_mode == "remote":
        if not settings.scibert_remote_url:
            return UnconfiguredSemanticExtractor()
        from app.services.remote_scibert_service import RemoteSciBERTExtractor

        return RemoteSciBERTExtractor()
    if not settings.scibert_model_path:
        return UnconfiguredSemanticExtractor()
    from app.services.scibert_service import LocalSciBERTExtractor

    return LocalSciBERTExtractor()


def get_semantic_extractor(request: Request) -> SemanticExtractor:
    """Lazily built, cached per-app extractor.

    Construction is cheap by design — the 418 MB model is NOT loaded here nor
    at startup. Weights load inside the extractor on the first inference.
    """
    extractor: SemanticExtractor | None = getattr(
        request.app.state, "semantic_extractor", None
    )
    if extractor is None:
        extractor = _build_semantic_extractor()
        request.app.state.semantic_extractor = extractor
    return extractor


SemanticExtractorDep = Annotated[SemanticExtractor, Depends(get_semantic_extractor)]
