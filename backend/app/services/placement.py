"""Balanced selection of placement questions.

Controlled randomness: spread across concepts, at most two questions per
concept, with a difficulty mix, instead of a purely random sample.
"""

from __future__ import annotations

import random
from collections import defaultdict
from typing import Any

_DIFFICULTY_RANK = {"easy": 0, "medium": 1, "hard": 2}


def _difficulty_rank(question: dict[str, Any]) -> int:
    level = str(question.get("difficultyLevel") or "").strip().lower()
    return _DIFFICULTY_RANK.get(level, 1)


def select_placement_questions(
    candidates: list[dict[str, Any]], count: int, seed: int | None = None
) -> list[dict[str, Any]]:
    if count <= 0:
        return []

    rng = random.Random(seed)
    seen: set[str] = set()
    by_concept: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for candidate in candidates:
        question_id = str(candidate.get("id"))
        if not question_id or question_id in seen:
            continue
        if not candidate.get("options"):
            continue
        seen.add(question_id)
        by_concept[str(candidate.get("conceptId"))].append(candidate)

    concept_ids = list(by_concept)
    rng.shuffle(concept_ids)
    for questions in by_concept.values():
        rng.shuffle(questions)
        # One question per difficulty first, so a concept contributes a mix.
        questions.sort(key=_difficulty_rank)

    selected: list[dict[str, Any]] = []
    for round_index in range(2):  # at most two questions per concept
        for concept_id in concept_ids:
            if len(selected) >= count:
                break
            questions = by_concept[concept_id]
            if round_index < len(questions):
                selected.append(questions[round_index])
        if len(selected) >= count:
            break

    return selected[:count]
