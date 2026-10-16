from fastapi import APIRouter, HTTPException, status

from app.api.deps import RepositoryDep
from app.core.config import settings
from app.models.catalog import GraphSchema

router = APIRouter(tags=["graph"])


@router.get("/graph/schema", response_model=GraphSchema)
async def graph_schema(repo: RepositoryDep) -> GraphSchema:
    """Development-only introspection to verify the migrated AuraDB.

    Read-only: lists labels, relationship types and property keys. Disabled
    outside development.
    """
    if settings.env != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return GraphSchema(**await repo.schema())
