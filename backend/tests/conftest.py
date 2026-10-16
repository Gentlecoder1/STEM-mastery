"""Shared test fixtures: in-memory graph + learner-state stand-ins.

These keep the HTTP contract testable without Neo4j or Supabase. The auth
dependency is overridden so protected routes can be exercised directly.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_learner_state, get_repository
from app.core.auth import CurrentUser, get_current_user
from app.main import app


class FakeGraphRepository:
    def __init__(self) -> None:
        self._questions = {
            "q-velocity-1": {
                "id": "q-velocity-1",
                "type": "mcq",
                "options": [
                    {"id": "a", "label": "A", "text": "How far an object travels"},
                    {"id": "b", "label": "B", "text": "Speed in a particular direction"},
                    {"id": "c", "label": "C", "text": "The time taken"},
                    {"id": "d", "label": "D", "text": "The size of an object"},
                ],
                "correctOption": "b",
                "correctAnswer": None,
                "referenceAnswer": None,
                "expectedNumericAnswer": None,
                "conceptId": "concept-velocity",
                "subjectId": "physics",
            },
            "q-velocity-2": {
                "id": "q-velocity-2",
                "type": "mcq",
                "options": [
                    {"id": "a", "label": "A", "text": "5 m/s east"},
                    {"id": "b", "label": "B", "text": "20 m/s east"},
                ],
                "correctOption": "a",
                "correctAnswer": None,
                "referenceAnswer": None,
                "expectedNumericAnswer": None,
                "conceptId": "concept-velocity",
                "subjectId": "physics",
            },
            "q-velocity-3": {
                "id": "q-velocity-3",
                "type": "theoretical",
                "options": [],
                "correctOption": None,
                "correctAnswer": None,
                "referenceAnswer": "Velocity is a vector.",
                "expectedNumericAnswer": None,
                "conceptId": "concept-velocity",
                "subjectId": "physics",
            },
            "q-displacement-1": {
                "id": "q-displacement-1",
                "type": "mcq",
                "options": [
                    {"id": "a", "label": "A", "text": "Distance"},
                    {"id": "b", "label": "B", "text": "Displacement"},
                ],
                "correctOption": "b",
                "correctAnswer": None,
                "referenceAnswer": None,
                "expectedNumericAnswer": None,
                "conceptId": "concept-displacement",
                "subjectId": "physics",
            },
        }

    async def list_subjects(self) -> list[dict]:
        return [
            {"id": "physics", "name": "Physics", "iri": "iri://physics"},
            {"id": "mathematics", "name": "Mathematics", "iri": None},
        ]

    async def list_topics(self, subject_id: str) -> list[dict]:
        if subject_id != "physics":
            return []
        return [{"id": "topic-speed-velocity", "name": "Speed and velocity", "iri": None}]

    async def list_concepts(self, topic_id: str) -> list[dict]:
        if topic_id != "topic-speed-velocity":
            return []
        # Already in prerequisite order: displacement before velocity.
        return [
            {
                "id": "concept-displacement",
                "name": "Distance and displacement",
                "prefLabel": "Distance and displacement",
                "iri": None,
                "prerequisites": [],
            },
            {
                "id": "concept-velocity",
                "name": "Velocity",
                "prefLabel": "Velocity",
                "iri": None,
                "prerequisites": [
                    {"id": "concept-displacement", "name": "Distance and displacement"}
                ],
            },
        ]

    async def ordered_concept_ids(self, topic_id: str) -> list[str]:
        return [row["id"] for row in await self.list_concepts(topic_id)]

    async def ordered_subject_concepts(self, subject_id: str) -> list[dict]:
        if subject_id != "physics":
            return []
        return [
            {"id": "concept-displacement", "name": "Distance and displacement"},
            {"id": "concept-velocity", "name": "Velocity"},
        ]

    async def get_concept(self, concept_id: str) -> dict | None:
        if concept_id != "concept-velocity":
            return None
        return {
            "id": "concept-velocity",
            "name": "Velocity",
            "prefLabel": "Velocity",
            "aliases": ["speed vector"],
            "iri": None,
            "topicId": "topic-speed-velocity",
            "subjectId": "physics",
            "definition": "Velocity is the rate of change of displacement with respect to time.",
            "prerequisites": [{"id": "concept-displacement", "name": "Distance and displacement"}],
            "related": [{"id": "concept-acceleration", "name": "Acceleration"}],
        }

    async def list_content(self, concept_id: str) -> list[dict]:
        return [
            {
                "id": "c-velocity-def",
                "conceptId": concept_id,
                "title": "Definition",
                "contentText": "Velocity is a vector quantity.",
                "contentType": "Definition",
                "chapterOrder": 1,
                "mediaURI": None,
            }
        ]

    async def list_questions(self, concept_id: str) -> list[dict]:
        return [
            {
                "id": question["id"],
                "type": question["type"],
                "prompt": "Which statement best describes velocity?",
                "difficultyLevel": "easy",
                "options": question["options"],
            }
            for question in self._questions.values()
        ]

    async def list_question_answers(self, concept_id: str) -> dict[str, dict]:
        return {qid: dict(question) for qid, question in self._questions.items()}

    async def get_question_answer(self, question_id: str) -> dict | None:
        question = self._questions.get(question_id)
        return dict(question) if question else None

    async def placement_candidates(self, subject_id: str) -> list[dict]:
        if subject_id != "physics":
            return []
        return [
            {
                "id": "q-velocity-1",
                "type": "mcq",
                "prompt": "Which statement best describes velocity?",
                "difficultyLevel": "easy",
                "options": self._questions["q-velocity-1"]["options"],
                "conceptId": "concept-velocity",
                "subjectId": "physics",
            },
            {
                "id": "q-displacement-1",
                "type": "mcq",
                "prompt": "Which quantity is a vector?",
                "difficultyLevel": "medium",
                "options": [
                    {"id": "a", "label": "A", "text": "Distance"},
                    {"id": "b", "label": "B", "text": "Displacement"},
                ],
                "conceptId": "concept-displacement",
                "subjectId": "physics",
            },
        ]

    async def schema(self) -> dict:
        return {
            "labels": ["Concept", "LearningContent", "Subject", "Topic"],
            "relationshipTypes": ["HAS_TOPIC", "HAS_CONCEPT", "PREREQUISITE_OF"],
            "propertyKeys": ["id", "name"],
        }


class FakeLearnerState:
    def __init__(self) -> None:
        self.completed: list[str] = []
        self.topic_assessments: dict[str, dict] = {}
        self.placement: dict | None = None
        self.lesson_progress: dict[str, dict] = {}
        self.calls: list[tuple[str, Any]] = []

    @property
    def configured(self) -> bool:
        return True

    async def mark_concepts_completed(self, user_id: str, concept_ids: list[str]) -> None:
        self.calls.append(("mark_concepts_completed", concept_ids))
        for concept_id in concept_ids:
            if concept_id not in self.completed:
                self.completed.append(concept_id)

    async def upsert_topic_assessment(
        self, user_id: str, topic_id: str, score_pct: int, passed: bool
    ) -> None:
        self.calls.append(("upsert_topic_assessment", (topic_id, score_pct, passed)))
        self.topic_assessments[topic_id] = {
            "topicId": topic_id,
            "scorePct": score_pct,
            "passed": passed,
        }

    async def save_placement(self, user_id: str, placement: dict) -> None:
        self.calls.append(("save_placement", placement))
        self.placement = placement

    async def load_lesson_progress(self, user_id: str) -> dict[str, dict]:
        return dict(self.lesson_progress)

    async def upsert_lesson_progress(self, user_id: str, rows: list[dict]) -> None:
        self.calls.append(("upsert_lesson_progress", rows))
        for row in rows:
            self.lesson_progress[str(row["concept_id"])] = row


@pytest.fixture
def repo() -> FakeGraphRepository:
    return FakeGraphRepository()


@pytest.fixture
def learner_state() -> FakeLearnerState:
    return FakeLearnerState()


@pytest.fixture
def client(
    repo: FakeGraphRepository, learner_state: FakeLearnerState
) -> Iterator[TestClient]:
    app.dependency_overrides[get_repository] = lambda: repo
    app.dependency_overrides[get_learner_state] = lambda: learner_state
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        user_id="00000000-0000-0000-0000-000000000001", email="learner@example.com"
    )
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
