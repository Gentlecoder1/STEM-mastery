from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import RepositoryDep
from app.services import grading
from app.models.catalog import (
    OfflineKey,
    Concept,
    ConceptSearchResult,
    ConceptRef,
    ConceptSummary,
    LearningContent,
    Question,
    QuestionOption,
    Subject,
    TopicPacket,
    Topic,
)

router = APIRouter(tags=["catalog"])


def _question(row: dict, answers: dict[str, dict] | None = None) -> Question:
    data = dict(row)
    options = [QuestionOption(**option) for option in data.pop("options", [])]
    data.pop("offlineKey", None)
    answer = (answers or {}).get(str(data.get("id")))
    key = grading.offline_key(str(data["id"]), answer) if answer else None
    return Question(**data, options=options, offlineKey=OfflineKey(**key) if key else None)


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


@router.get("/topics/{topic_id}/packet", response_model=TopicPacket)
async def get_topic_packet(topic_id: str, repo: RepositoryDep) -> TopicPacket:
    packet = await repo.get_topic_packet(topic_id)
    if packet is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")
    return TopicPacket(**packet)


@router.get("/topics/{topic_id}/questions", response_model=list[Question])
async def list_topic_questions(topic_id: str, repo: RepositoryDep) -> list[Question]:
    questions = await repo.list_topic_questions(topic_id)
    if questions is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")
    answers = await repo.list_topic_question_answers(topic_id)
    return [_question(row, answers) for row in questions]


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


@router.get("/concepts/{concept_id}/lesson", response_model=list[LearningContent])
async def get_lesson(concept_id: str, repo: RepositoryDep) -> list[LearningContent]:
    return [LearningContent(**row) for row in await repo.list_content(concept_id)]


@router.get("/concepts/{concept_id}/questions", response_model=list[Question])
async def list_questions(concept_id: str, repo: RepositoryDep) -> list[Question]:
    answers = await repo.list_question_answers(concept_id)
    return [_question(row, answers) for row in await repo.list_questions(concept_id)]
