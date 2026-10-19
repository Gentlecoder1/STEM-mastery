#!/usr/bin/env python3
r"""Seed V3 assessment questions into Neo4j AuraDB.

Designed for the already-migrated V3 curriculum:
- 12 topics (first four per Mathematics, Physics, Chemistry)
- 90 canonical Concept nodes
- structureVersion = 'v3-json'
- 450 questions total: 360 MCQ (80%) + 90 open-response/TheoreticalQuestion (20%)

Usage from project root (PowerShell):
    python .\seed_v3_questions\seed_v3_questions_neo4j.py --env-file .\backend\.env

This script does NOT change topics, concepts, lesson content, prerequisite edges,
or related-concept edges.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable

try:
    from neo4j import GraphDatabase
except ImportError as exc:
    raise SystemExit(
        "The 'neo4j' Python package is required. Install it with: "
        "python -m pip install neo4j"
    ) from exc

SEED_VERSION = "v3-questions-1.0"
STRUCTURE_VERSION = "v3-json"
EXPECTED_CONCEPTS = 90
EXPECTED_QUESTIONS = 450
EXPECTED_MCQ = 360
EXPECTED_THEORY = 90


def parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Seed V3 STEM assessment questions into Neo4j")
    parser.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help="Path to .env containing STEM_NEO4J_* values (e.g. backend/.env)",
    )
    parser.add_argument(
        "--data-file",
        type=Path,
        default=here / "STEM_V3_Questions_First4.json",
        help="Path to the V3 question dataset",
    )
    parser.add_argument(
        "--no-replace",
        action="store_true",
        help="Keep existing question links on the 90 V3 concepts instead of replacing them",
    )
    return parser.parse_args()


def load_env_file(path: Path | None) -> None:
    if path is None:
        return
    if not path.exists():
        raise SystemExit(f"Environment file not found: {path}")
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value and len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def env(name: str, *, required: bool = True, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if required and not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def load_dataset(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"Question JSON not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    scope = data.get("scope") or {}
    if scope.get("structureVersion") != STRUCTURE_VERSION:
        raise SystemExit(
            f"Unexpected structureVersion: {scope.get('structureVersion')!r}; expected {STRUCTURE_VERSION!r}"
        )
    questions = data.get("questions")
    if not isinstance(questions, list):
        raise SystemExit("Dataset 'questions' must be a list")
    if len(questions) != EXPECTED_QUESTIONS:
        raise SystemExit(f"Expected {EXPECTED_QUESTIONS} questions, found {len(questions)}")

    ids = [q.get("questionID") for q in questions]
    if None in ids or len(set(ids)) != len(ids):
        raise SystemExit("Question IDs are missing or duplicated")

    mcq = [q for q in questions if q.get("type") == "MultipleChoiceQuestion"]
    theory = [q for q in questions if q.get("type") == "TheoreticalQuestion"]
    if len(mcq) != EXPECTED_MCQ or len(theory) != EXPECTED_THEORY:
        raise SystemExit(
            f"Expected {EXPECTED_MCQ} MCQ and {EXPECTED_THEORY} theory/open-response questions; "
            f"found {len(mcq)} and {len(theory)}"
        )

    concept_ids = {q.get("conceptId") for q in questions}
    if None in concept_ids or len(concept_ids) != EXPECTED_CONCEPTS:
        raise SystemExit(f"Expected questions for {EXPECTED_CONCEPTS} concepts, found {len(concept_ids)}")

    # Strict MCQ integrity check before touching Neo4j.
    malformed: list[str] = []
    for q in mcq:
        opts = q.get("options")
        if not isinstance(opts, list) or len(opts) != 4:
            malformed.append(q["questionID"])
            continue
        option_map = {str(o.get("id")): str(o.get("text")) for o in opts if isinstance(o, dict)}
        if len(option_map) != 4 or len({v.strip().lower() for v in option_map.values()}) != 4:
            malformed.append(q["questionID"])
            continue
        key = q.get("correctOption")
        if key not in option_map or option_map[key].strip() != str(q.get("correctAnswer") or "").strip():
            malformed.append(q["questionID"])
    if malformed:
        raise SystemExit(f"Malformed MCQs in source dataset: {malformed[:20]}")

    qa = data.get("qa") or {}
    if qa.get("malformedMCQs"):
        raise SystemExit("Dataset QA reports malformed MCQs")
    return data


def to_seed_row(q: dict[str, Any]) -> dict[str, Any]:
    return {
        "questionID": q["questionID"],
        "conceptId": q["conceptId"],
        "topicId": q.get("topicId"),
        "subjectId": q.get("subjectId"),
        "type": q["type"],
        "questionText": q["questionText"],
        "difficultyLevel": q.get("difficultyLevel"),
        # Neo4j properties cannot store nested maps, so keep structured options as JSON.
        # graph.py already knows how to parse JSON option payloads.
        "options": json.dumps(q.get("options") or [], ensure_ascii=False, separators=(",", ":")),
        "correctOption": q.get("correctOption"),
        "correctAnswer": q.get("correctAnswer"),
        "referenceAnswer": q.get("referenceAnswer"),
        "expectedNumericAnswer": q.get("expectedNumericAnswer"),
        "solution": q.get("solution"),
        "sourceFile": q.get("sourceFile"),
        "sourceExerciseType": q.get("sourceExerciseType"),
        "verificationStatus": q.get("verificationStatus", "SOURCE_DERIVED_REVIEW_RECOMMENDED"),
        "structureVersion": STRUCTURE_VERSION,
        "seedVersion": SEED_VERSION,
    }


VERIFY_CONCEPTS = """
UNWIND $ids AS id
OPTIONAL MATCH (c:Concept {id:id, structureVersion:'v3-json'})
RETURN id, c IS NOT NULL AS exists
ORDER BY id
"""

VERIFY_TOPIC_LINKS = """
UNWIND $rows AS row
OPTIONAL MATCH (t:Topic {id:row.topicId})-[:HAS_CONCEPT]->(c:Concept {id:row.conceptId, structureVersion:'v3-json'})
RETURN row.topicId AS topicId, row.conceptId AS conceptId, c IS NOT NULL AS linked
"""

CLEAR_ASSESSES = """
UNWIND $ids AS id
MATCH (q:Question)-[r:ASSESSES_CONCEPT]->(c:Concept {id:id, structureVersion:'v3-json'})
DELETE r
"""

CLEAR_EXPECTS = """
UNWIND $ids AS id
MATCH (q:Question)-[r:EXPECTS_CONCEPT]->(c:Concept {id:id, structureVersion:'v3-json'})
DELETE r
"""

DELETE_OLD_V3_SEEDED_QUESTIONS = """
MATCH (q:Question {structureVersion:'v3-json', seedVersion:$seedVersion})
WHERE NOT (q)-[:ASSESSES_CONCEPT]->(:Concept)
  AND NOT (q)-[:EXPECTS_CONCEPT]->(:Concept)
DETACH DELETE q
"""

UPSERT_MCQ = """
UNWIND $rows AS row
MATCH (c:Concept {id:row.conceptId, structureVersion:'v3-json'})
MERGE (q:Question {questionID:row.questionID})
SET q:MultipleChoiceQuestion,
    q.type = row.type,
    q.questionText = row.questionText,
    q.difficultyLevel = row.difficultyLevel,
    q.options = row.options,
    q.correctOption = row.correctOption,
    q.correctAnswer = row.correctAnswer,
    q.referenceAnswer = null,
    q.expectedNumericAnswer = row.expectedNumericAnswer,
    q.solution = row.solution,
    q.conceptId = row.conceptId,
    q.topicId = row.topicId,
    q.subjectId = row.subjectId,
    q.sourceFile = row.sourceFile,
    q.sourceExerciseType = row.sourceExerciseType,
    q.verificationStatus = row.verificationStatus,
    q.structureVersion = row.structureVersion,
    q.seedVersion = row.seedVersion,
    q.updatedAt = datetime()
REMOVE q:TheoreticalQuestion
MERGE (q)-[:ASSESSES_CONCEPT]->(c)
"""

UPSERT_THEORY = """
UNWIND $rows AS row
MATCH (c:Concept {id:row.conceptId, structureVersion:'v3-json'})
MERGE (q:Question {questionID:row.questionID})
SET q:TheoreticalQuestion,
    q.type = row.type,
    q.questionText = row.questionText,
    q.difficultyLevel = row.difficultyLevel,
    q.options = row.options,
    q.correctOption = null,
    q.correctAnswer = null,
    q.referenceAnswer = row.referenceAnswer,
    q.expectedNumericAnswer = row.expectedNumericAnswer,
    q.solution = row.solution,
    q.conceptId = row.conceptId,
    q.topicId = row.topicId,
    q.subjectId = row.subjectId,
    q.sourceFile = row.sourceFile,
    q.sourceExerciseType = row.sourceExerciseType,
    q.verificationStatus = row.verificationStatus,
    q.structureVersion = row.structureVersion,
    q.seedVersion = row.seedVersion,
    q.updatedAt = datetime()
REMOVE q:MultipleChoiceQuestion
MERGE (q)-[:ASSESSES_CONCEPT]->(c)
"""

QA_COUNTS = """
MATCH (q:Question {seedVersion:$seedVersion})-[:ASSESSES_CONCEPT]->(c:Concept {structureVersion:'v3-json'})
RETURN count(DISTINCT q) AS totalQuestions,
       count(DISTINCT CASE WHEN q:MultipleChoiceQuestion THEN q END) AS mcq,
       count(DISTINCT CASE WHEN q:TheoreticalQuestion THEN q END) AS theory,
       count(DISTINCT c) AS conceptsCovered
"""

QA_PER_CONCEPT = """
MATCH (c:Concept {structureVersion:'v3-json'})
WHERE c.id IN $ids
OPTIONAL MATCH (q:Question {seedVersion:$seedVersion})-[:ASSESSES_CONCEPT]->(c)
WITH c.id AS conceptId, count(DISTINCT q) AS n
WHERE n <> 5
RETURN conceptId, n
ORDER BY conceptId
"""

QA_MALFORMED_MCQ = """
MATCH (q:Question:MultipleChoiceQuestion {seedVersion:$seedVersion})
WHERE q.options IS NULL OR q.options = '' OR q.correctOption IS NULL OR q.correctAnswer IS NULL
RETURN count(q) AS malformedMCQs
"""

QA_MISSING_REFERENCE = """
MATCH (q:Question:TheoreticalQuestion {seedVersion:$seedVersion})
WHERE q.referenceAnswer IS NULL OR trim(q.referenceAnswer) = ''
RETURN count(q) AS theoryMissingReferenceAnswer
"""

QA_ORPHANS = """
MATCH (q:Question {seedVersion:$seedVersion})
WHERE NOT (q)-[:ASSESSES_CONCEPT]->(:Concept {structureVersion:'v3-json'})
RETURN count(q) AS orphanQuestions
"""

QA_DUPLICATE_IDS = """
MATCH (q:Question {seedVersion:$seedVersion})
WITH q.questionID AS id, count(*) AS n
WHERE n > 1
RETURN count(*) AS duplicateQuestionIDs
"""


def batched(items: list[dict[str, Any]], size: int = 250) -> Iterable[list[dict[str, Any]]]:
    for i in range(0, len(items), size):
        yield items[i:i + size]


def main() -> int:
    args = parse_args()
    load_env_file(args.env_file)

    uri = env("STEM_NEO4J_URI")
    user = env("STEM_NEO4J_USER", default="neo4j")
    password = env("STEM_NEO4J_PASSWORD")
    database = env("STEM_NEO4J_DATABASE", required=False, default="neo4j") or "neo4j"

    data_file = args.data_file.resolve()
    data = load_dataset(data_file)
    questions = data["questions"]
    rows = [to_seed_row(q) for q in questions]
    mcq_rows = [r for r in rows if r["type"] == "MultipleChoiceQuestion"]
    theory_rows = [r for r in rows if r["type"] == "TheoreticalQuestion"]
    concept_ids = sorted({r["conceptId"] for r in rows})
    topic_links = [
        {"topicId": r["topicId"], "conceptId": r["conceptId"]}
        for r in rows
    ]
    # Deduplicate preflight topic/concept checks.
    topic_links = list({(x["topicId"], x["conceptId"]): x for x in topic_links}.values())

    print("STEM V3 question seeder")
    print(f"Data file: {data_file}")
    print(f"Concepts covered: {len(concept_ids)}")
    print(f"Questions: {len(rows)}")
    print(f"MCQ: {len(mcq_rows)} ({len(mcq_rows)/len(rows):.0%})")
    print(f"Theory/open response: {len(theory_rows)} ({len(theory_rows)/len(rows):.0%})")

    driver = GraphDatabase.driver(uri, auth=(user, password))
    try:
        driver.verify_connectivity()
        print("Connected to Neo4j AuraDB.")

        with driver.session(database=database) as session:
            verify_rows = session.run(VERIFY_CONCEPTS, ids=concept_ids).data()
            missing = [row["id"] for row in verify_rows if not row["exists"]]
            if missing:
                print("ERROR: V3 concept IDs missing from Neo4j:", file=sys.stderr)
                for cid in missing:
                    print(f"  - {cid}", file=sys.stderr)
                return 2

            link_rows = session.run(VERIFY_TOPIC_LINKS, rows=topic_links).data()
            bad_links = [row for row in link_rows if not row["linked"]]
            if bad_links:
                print("ERROR: Some V3 concepts are not connected to their expected topics:", file=sys.stderr)
                for row in bad_links[:20]:
                    print(f"  - {row['topicId']} -> {row['conceptId']}", file=sys.stderr)
                return 3

            print("Preflight QA: 90/90 concepts and topic links verified.")

            if not args.no_replace:
                session.run(CLEAR_ASSESSES, ids=concept_ids).consume()
                session.run(CLEAR_EXPECTS, ids=concept_ids).consume()
                session.run(
                    DELETE_OLD_V3_SEEDED_QUESTIONS,
                    seedVersion=SEED_VERSION,
                ).consume()
                print("Existing active question links on the 90 V3 concepts cleared for clean replacement.")
            else:
                print("--no-replace enabled: existing question links retained.")

            seeded = 0
            for batch in batched(mcq_rows, 200):
                session.run(UPSERT_MCQ, rows=batch).consume()
                seeded += len(batch)
                print(f"Seeded {seeded}/{len(rows)} questions...")
            for batch in batched(theory_rows, 200):
                session.run(UPSERT_THEORY, rows=batch).consume()
                seeded += len(batch)
                print(f"Seeded {seeded}/{len(rows)} questions...")

            qa = session.run(QA_COUNTS, seedVersion=SEED_VERSION).single()
            bad_counts = session.run(QA_PER_CONCEPT, ids=concept_ids, seedVersion=SEED_VERSION).data()
            malformed = session.run(QA_MALFORMED_MCQ, seedVersion=SEED_VERSION).single()["malformedMCQs"]
            missing_ref = session.run(QA_MISSING_REFERENCE, seedVersion=SEED_VERSION).single()["theoryMissingReferenceAnswer"]
            orphans = session.run(QA_ORPHANS, seedVersion=SEED_VERSION).single()["orphanQuestions"]
            dupes = session.run(QA_DUPLICATE_IDS, seedVersion=SEED_VERSION).single()["duplicateQuestionIDs"]

            print("\nFINAL QA")
            print(f"Total questions: {qa['totalQuestions']}/{EXPECTED_QUESTIONS}")
            print(f"MCQ: {qa['mcq']}/{EXPECTED_MCQ}")
            print(f"Theory/open response: {qa['theory']}/{EXPECTED_THEORY}")
            print(f"Concepts covered: {qa['conceptsCovered']}/{EXPECTED_CONCEPTS}")
            print(f"Concepts not having exactly 5 questions: {len(bad_counts)}")
            print(f"Malformed MCQs: {malformed}")
            print(f"Theory questions missing reference answer: {missing_ref}")
            print(f"Orphan seeded questions: {orphans}")
            print(f"Duplicate question IDs: {dupes}")

            if (
                qa["totalQuestions"] != EXPECTED_QUESTIONS
                or qa["mcq"] != EXPECTED_MCQ
                or qa["theory"] != EXPECTED_THEORY
                or qa["conceptsCovered"] != EXPECTED_CONCEPTS
                or bad_counts
                or malformed != 0
                or missing_ref != 0
                or orphans != 0
                or dupes != 0
            ):
                print("QA FAILED. Review the counts above.", file=sys.stderr)
                return 4

        print("\nSUCCESS: V3 questions seeded and QA passed.")
        print("Answer keys are stored in Neo4j for server-side grading; do not expose them in initial question API responses.")
        return 0
    finally:
        driver.close()


if __name__ == "__main__":
    raise SystemExit(main())
