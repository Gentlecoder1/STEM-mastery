from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import RepositoryDep
from app.models.catalog import (
    Concept,
    ConceptRef,
    ConceptSearchResult,
    ConceptSummary,
    Question,
    QuestionOption,
    StructuredLesson,
    Subject,
    Topic,
)

router = APIRouter(tags=["catalog"])


def _question(row: dict) -> Question:
    data = dict(row)
    options = [QuestionOption(**option) for option in data.pop("options", [])]
    return Question(**data, options=options)


@router.get("/subjects", response_model=list[Subject])
async def list_subjects(repo: RepositoryDep) -> list[Subject]:
    return [Subject(**row) for row in await repo.list_subjects()]


@router.get("/subjects/{subject_id}/topics", response_model=list[Topic])
async def list_topics(subject_id: str, repo: RepositoryDep) -> list[Topic]:
    return [Topic(**row) for row in await repo.list_topics(subject_id)]


@router.get("/concepts/search", response_model=list[ConceptSearchResult])
async def search_concepts(
    repo: RepositoryDep,
    q: str = Query(min_length=2, max_length=80),
    limit: int = Query(default=20, ge=1, le=50),
) -> list[ConceptSearchResult]:
    return [ConceptSearchResult(**row) for row in await repo.search_concepts(q, limit)]


@router.get("/topics/{topic_id}/concepts", response_model=list[ConceptSummary])
async def list_concepts(topic_id: str, repo: RepositoryDep) -> list[ConceptSummary]:
    return [ConceptSummary(**row) for row in await repo.list_concepts(topic_id)]


@router.get("/concepts/{concept_id}", response_model=Concept)
async def get_concept(concept_id: str, repo: RepositoryDep) -> Concept:
    """Concept metadata only — lesson payload and quizzes live on their own routes."""
    row = await repo.get_concept(concept_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found.")

    data = dict(row)
    prerequisites = [ConceptRef(**item) for item in data.pop("prerequisites", [])]
    related = [ConceptRef(**item) for item in data.pop("related", [])]
    for obsolete in ("content", "questions", "topicId", "subjectId", "definition", "title"):
        data.pop(obsolete, None)

    return Concept(
        **data,
        title=row.get("name") or row.get("prefLabel"),
        prerequisites=prerequisites,
        related=related,
        prerequisiteIds=[ref.id for ref in prerequisites],
        relatedConceptIds=[ref.id for ref in related],
    )


@router.get("/concepts/{concept_id}/lesson", response_model=StructuredLesson)
async def get_lesson(concept_id: str, repo: RepositoryDep) -> StructuredLesson:
    row = await repo.get_structured_lesson(concept_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")
    return StructuredLesson(**row)


@router.get("/concepts/{concept_id}/questions", response_model=list[Question])
async def list_questions(concept_id: str, repo: RepositoryDep) -> list[Question]:
    return [_question(row) for row in await repo.list_questions(concept_id)]
