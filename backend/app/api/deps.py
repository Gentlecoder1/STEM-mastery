from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.core.db import Neo4jDatabase
from app.repositories.graph import GraphRepository
from app.repositories.learner_state import LearnerStateRepository


def get_database(request: Request) -> Neo4jDatabase:
    database: Neo4jDatabase | None = getattr(request.app.state, "db", None)
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is not configured.",
        )
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
