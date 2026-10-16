import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from neo4j.exceptions import Neo4jError

from app.api.routes import assessment, catalog, graph, health, placement, progress
from app.core.config import settings
from app.core.db import create_database
from app.repositories.learner_state import LearnerStateRepository

logger = logging.getLogger("stem_mastery")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    database = create_database()
    app.state.db = database
    app.state.learner_state = LearnerStateRepository()
    if not app.state.learner_state.configured:
        logger.warning("Supabase is not configured; learner-state writes will return 503.")
    if database is None:
        logger.warning("Neo4j is not configured; catalog endpoints will return 503.")
    else:
        try:
            await database.verify_connectivity()
            logger.info("Connected to Neo4j database '%s'.", database.database)
        except Exception:  # noqa: BLE001 - boot even if the graph is unreachable
            logger.exception("Could not verify Neo4j connectivity at startup.")
    yield
    if database is not None:
        await database.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Neo4jError)
async def neo4j_error_handler(request: Request, exc: Neo4jError) -> JSONResponse:
    """Return 503 instead of crashing when the graph is unreachable.

    Covers the case where Neo4j is configured but Aura is down, still booting,
    or the credentials are wrong. The app keeps serving health and learner-state
    routes; only graph-dependent endpoints degrade.
    """
    logger.warning("Neo4j operation failed for %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Curriculum database is unavailable."},
    )


app.include_router(health.router)
app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(catalog.router, prefix=settings.api_prefix)
app.include_router(assessment.router, prefix=settings.api_prefix)
app.include_router(placement.router, prefix=settings.api_prefix)
app.include_router(progress.router, prefix=settings.api_prefix)
app.include_router(graph.router, prefix=settings.api_prefix)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "version": settings.version,
        "docs": "/docs",
    }
