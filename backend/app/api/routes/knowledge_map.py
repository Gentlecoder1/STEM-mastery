from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import RepositoryDep
from app.models.catalog import ConceptSearchResult
from app.models.knowledge_map import KnowledgeMapResponse

router = APIRouter(tags=["knowledge-map"])


@router.get(
    "/knowledge-map/root",
    response_model=KnowledgeMapResponse,
)
async def get_root_knowledge_map(repo: RepositoryDep) -> KnowledgeMapResponse:
    return KnowledgeMapResponse(**await repo.knowledge_map_root())


@router.get(
    "/knowledge-map/topics/{topic_id}",
    response_model=KnowledgeMapResponse,
)
async def get_topic_knowledge_map(
    topic_id: str,
    repo: RepositoryDep,
    focus_id: str | None = None,
    depth: int = Query(default=1, ge=1, le=3),
    include_connected_topics: bool = False,
) -> KnowledgeMapResponse:
    result = await repo.knowledge_map_topic(
        topic_id,
        focus_id=focus_id,
        depth=depth,
        include_connected_topics=include_connected_topics,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found.",
        )
    return KnowledgeMapResponse(**result)


@router.get(
    "/knowledge-map/concepts/{concept_id}",
    response_model=KnowledgeMapResponse,
)
async def get_concept_knowledge_map(
    concept_id: str,
    repo: RepositoryDep,
    depth: int = Query(default=1, ge=1, le=3),
    topic_id: str | None = None,
    include_connected_topics: bool = True,
) -> KnowledgeMapResponse:
    result = await repo.knowledge_map_concept(
        concept_id,
        depth=depth,
        topic_id=topic_id,
        include_connected_topics=include_connected_topics,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Concept not found.",
        )
    return KnowledgeMapResponse(**result)


@router.get(
    "/knowledge-map/search",
    response_model=list[ConceptSearchResult],
)
async def search_knowledge_map_concepts(
    repo: RepositoryDep,
    q: str = Query(min_length=2, max_length=80),
    limit: int = Query(default=20, ge=1, le=50),
) -> list[ConceptSearchResult]:
    return [
        ConceptSearchResult(**row)
        for row in await repo.search_concepts(q, limit)
    ]
