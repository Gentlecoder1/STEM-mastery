from app.models.progress import LessonProgressItem
from app.repositories.graph import _topological_order
from app.services import grading
from app.services.placement import select_placement_questions
from app.services.progress import merge_lesson_progress


def test_grade_mcq_by_option_id() -> None:
    question = {"type": "mcq", "options": [{"id": "a"}, {"id": "b"}], "correctOption": "b"}
    assert grading.grade_response(question, "b") is True
    assert grading.grade_response(question, "a") is False


def test_grade_mcq_by_label() -> None:
    question = {
        "type": "mcq",
        "options": [{"id": "a", "label": "A"}, {"id": "b", "label": "B"}],
        "correctAnswer": "B",
    }
    assert grading.grade_response(question, "b") is True


def test_grade_theory_is_none() -> None:
    assert grading.grade_response({"type": "theoretical", "options": []}, "anything") is None


def test_summarise_excludes_theory_and_uses_pass_ratio() -> None:
    summary = grading.summarise([True, False, None])
    assert summary == {"correct": 1, "total": 2, "scorePct": 50, "passed": False}
    assert grading.summarise([True, True])["passed"] is True


def test_topological_order_respects_prerequisites() -> None:
    ids = ["c", "a", "b"]
    names = {"a": "Alpha", "b": "Beta", "c": "Gamma"}
    prerequisites = {"c": ["a", "b"], "b": ["a"], "a": []}
    assert _topological_order(ids, prerequisites, names) == ["a", "b", "c"]


def test_topological_order_handles_cycles_deterministically() -> None:
    ids = ["y", "x"]
    names = {"x": "X", "y": "Y"}
    prerequisites = {"x": ["y"], "y": ["x"]}
    # Cycle: falls back to name/id ordering for the leftover nodes.
    assert _topological_order(ids, prerequisites, names) == ["x", "y"]


def test_select_placement_questions_caps_per_concept() -> None:
    candidates = [
        {
            "id": f"q{c}-{i}",
            "conceptId": f"c{c}",
            "options": [{"id": "a"}],
            "difficultyLevel": "easy",
        }
        for c in range(3)
        for i in range(4)
    ]
    selected = select_placement_questions(candidates, count=12, seed=1)
    counts: dict[str, int] = {}
    for question in selected:
        counts[question["conceptId"]] = counts.get(question["conceptId"], 0) + 1
    assert all(count <= 2 for count in counts.values())
    assert len(selected) == 6  # three concepts x two questions


def test_merge_progress_is_monotonic_and_time_aware() -> None:
    existing = {
        "concept_id": "concept-velocity",
        "progress_percent": 70,
        "lesson_completed": True,
        "quiz_pending": True,
        "updated_at": "2026-01-01T00:00:00+00:00",
    }
    incoming = LessonProgressItem(
        conceptId="concept-velocity",
        progressPercent=30,
        lessonCompleted=False,
        quizPending=False,
        updatedAt="2026-01-02T00:00:00Z",
    )
    merged = merge_lesson_progress(existing, incoming)
    assert merged["progress_percent"] == 70
    assert merged["lesson_completed"] is True
    assert merged["quiz_pending"] is False
