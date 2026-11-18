"""Server-side grading.

Correct answers live only in Neo4j and never leave the backend. The client
submits a response and receives correctness (and, for multiple-choice, which
option was correct) plus any authored explanation.
"""

from __future__ import annotations

import hashlib
import re
from typing import Any

QUIZ_PASS_RATIO = 0.6

# --- Offline marking keys -------------------------------------------------
# Answer keys still never leave the backend in plain form. For offline use the
# client receives one-way SHA-256 hashes: the hash of the correct option id for
# multiple-choice questions, and hashes of the reference answer's keywords for
# written questions. The device hashes the learner's response the same way and
# compares. Offline results are provisional: queued submissions are re-graded
# here when the device reconnects, so stored mastery always comes from the server.
# Keep KEYWORD_STOPWORDS and keyword_stems() in step with
# frontend/src/lib/offlineGrading.ts.
OFFLINE_KEY_VERSION = 1
OFFLINE_MIN_COVERAGE = 0.5
KEYWORD_STOPWORDS = frozenset(
    "the and for are was were with that this from into onto than then they them their "
    "there which what when where while have has had been being will would can could "
    "should shall may might must not but also its it's per each any all some such "
    "very more most less least one two how why who whom whose our your his her".split()
)


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def keyword_stems(text: str) -> list[str]:
    """Lower-case content-word stems (length >= 3, plural "s" removed unless "ss"), unique, in order."""
    stems: list[str] = []
    for token in re.findall(r"[a-z0-9]+", str(text or "").lower()):
        if len(token) < 3 or token in KEYWORD_STOPWORDS:
            continue
        stem = token[:-1] if len(token) > 3 and token.endswith("s") and not token.endswith("ss") else token
        if stem not in stems:
            stems.append(stem)
    return stems


def answer_hash(question_id: str, value: Any) -> str:
    return _sha256(f"{question_id}:{_normalise(value).lower()}")


def written_reference(question: dict[str, Any]) -> tuple[str, list[str]]:
    numeric = question.get("expectedNumericAnswer")
    reference = _normalise(
        numeric if numeric is not None else question.get("referenceAnswer") or question.get("correctAnswer")
    )
    if numeric is not None or re.match(r"^[+−-]?(?:\d|\.\d)", reference):
        return reference, []
    return reference, keyword_stems(reference)[:12]


def offline_key(question_id: str, question: dict[str, Any]) -> dict[str, Any] | None:
    """Return the hashed key the app uses to mark this question without a network."""
    if is_multiple_choice(question):
        expected = resolve_correct_option(question)
        if expected is None:
            return None
        return {"v": OFFLINE_KEY_VERSION, "answerHash": answer_hash(question_id, expected)}
    reference, stems = written_reference(question)
    if not reference:
        return None
    if not stems:
        return {"v": OFFLINE_KEY_VERSION, "answerHash": answer_hash(question_id, reference)}
    return {
        "v": OFFLINE_KEY_VERSION,
        "keywordHashes": [answer_hash(question_id, stem) for stem in stems],
        "minCoverage": OFFLINE_MIN_COVERAGE,
    }


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
    if question_type in {"theoretical", "written", "open", "essay", "short_answer", "theory"}:
        return False
    return bool(question.get("options")) and resolve_correct_option(question) is not None


def grade_response(question: dict[str, Any], response: Any) -> bool | None:
    """Grade choice answers and authored written answers with the offline rubric."""
    text = _normalise(response)
    if is_multiple_choice(question):
        expected = resolve_correct_option(question)
        return text.lower() == expected.lower() if expected is not None else None
    reference, stems = written_reference(question)
    if not reference or not text:
        return None
    if not stems:
        return text.lower() == reference.lower()
    given = set(keyword_stems(text))
    return len(given.intersection(stems)) / len(stems) >= OFFLINE_MIN_COVERAGE


def summarise(results: list[bool | None]) -> dict[str, int | float | bool]:
    """Compute the aggregate score over auto-gradable responses.

    Questions without a usable answer key are excluded.
    """
    graded = [result for result in results if result is not None]
    total = len(graded)
    correct = sum(1 for result in graded if result)
    score_pct = round((correct / total) * 100) if total else 100
    passed = total == 0 or score_pct >= QUIZ_PASS_RATIO * 100
    return {"correct": correct, "total": total, "scorePct": score_pct, "passed": passed}
