"""Server-side grading.

Correct answers live only in Neo4j and never leave the backend. The client
submits a response and receives correctness (and, for multiple-choice, which
option was correct) plus any authored explanation.
"""

from __future__ import annotations

from typing import Any

QUIZ_PASS_RATIO = 0.6


def _normalise(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def resolve_correct_option(question: dict[str, Any]) -> str | None:
    """Return the option id that the question's stored answer refers to.

    ``correctOption``/``correctAnswer`` may hold an option id, a label, or the
    option text depending on how the graph was populated, so all are accepted.
    """
    raw = question.get("correctOption")
    if raw is None:
        raw = question.get("correctAnswer")
    if raw is None:
        return None
    raw_text = _normalise(raw)
    options = question.get("options") or []

    ids = {_normalise(option.get("id")) for option in options}
    if raw_text in ids:
        return raw_text

    by_label = {
        _normalise(option.get("label")).upper(): _normalise(option.get("id"))
        for option in options
    }
    if raw_text.upper() in by_label:
        return by_label[raw_text.upper()]

    for option in options:
        if _normalise(option.get("text")) == raw_text:
            return _normalise(option.get("id"))

    return raw_text


def is_multiple_choice(question: dict[str, Any]) -> bool:
    question_type = _normalise(question.get("type")).lower()
    if "mcq" in question_type or "multiple" in question_type or "choice" in question_type:
        return True
    if question_type in {"theoretical", "written", "open", "essay"}:
        return False
    return bool(question.get("options")) and resolve_correct_option(question) is not None


def grade_response(question: dict[str, Any], response: Any) -> bool | None:
    """Grade a single response.

    Returns ``True``/``False`` for auto-gradable (multiple-choice) questions and
    ``None`` when the response cannot be auto-graded (theory).
    """
    if not is_multiple_choice(question):
        return None
    expected = resolve_correct_option(question)
    if expected is None:
        return None
    return _normalise(response) == expected


def summarise(results: list[bool | None]) -> dict[str, int | float | bool]:
    """Compute the aggregate score over auto-gradable responses.

    Theory responses are excluded from the score (mirroring the app's existing
    behaviour where only multiple-choice questions contribute to the grade).
    """
    graded = [result for result in results if result is not None]
    total = len(graded)
    correct = sum(1 for result in graded if result)
    score_pct = round((correct / total) * 100) if total else 100
    passed = total == 0 or score_pct >= QUIZ_PASS_RATIO * 100
    return {"correct": correct, "total": total, "scorePct": score_pct, "passed": passed}
