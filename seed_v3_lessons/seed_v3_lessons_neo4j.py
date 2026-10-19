#!/usr/bin/env python3
r"""Seed the 12 V3 STEM lesson JSON topics into Neo4j AuraDB.

This script is designed for the V3 curriculum already present in Neo4j:
- 12 topics (first four per Mathematics, Physics, Chemistry)
- 90 canonical Concept nodes
- Concept IDs identical to the source JSON IDs
- structureVersion = 'v3-json'

It seeds *lesson content only*. It does not create/modify questions and it does
not rebuild PREREQUISITE_OF / RELATED_TO relationships.

Usage from project root (PowerShell):
    python .\seed_v3_lessons\seed_v3_lessons_neo4j.py --env-file .\backend\.env

If the JSON is in the same folder as this script, no --data-file is required.
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

SEED_VERSION = "v3-lessons-1.0"
STRUCTURE_VERSION = "v3-json"

SECTION_ORDER = {
    "learning_objective": 10,
    "prerequisite_note": 20,
    "definition": 30,
    "explanation": 40,
    "key_term": 50,
    "illustration": 60,
    "worked_example": 70,
    "real_world_application": 80,
    "common_mistake": 90,
    "summary": 100,
}


def parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Seed V3 STEM lesson content into Neo4j")
    parser.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help="Path to .env containing STEM_NEO4J_* values (e.g. backend/.env)",
    )
    parser.add_argument(
        "--data-file",
        type=Path,
        default=here / "STEM_V3_Lesson_Content_First4.json",
        help="Path to the V3 combined lesson JSON",
    )
    parser.add_argument(
        "--no-replace",
        action="store_true",
        help="Do not clear existing HAS_CONTENT links on the 90 V3 concepts before seeding",
    )
    return parser.parse_args()


def load_env_file(path: Path | None) -> None:
    """Load simple KEY=VALUE pairs without printing or exposing secrets."""
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
        if value and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        # Existing shell variables take precedence over file values.
        os.environ.setdefault(key, value)


def env(name: str, *, required: bool = True, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if required and not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def require_list(value: Any, field: str, concept_id: str) -> list[Any]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError(f"{concept_id}: field '{field}' must be a list")
    return value


def clean_text(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def as_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def content_record(
    *,
    concept_id: str,
    topic_id: str,
    subject_id: str,
    source_file: str,
    content_type: str,
    item_order: int,
    title: str,
    content_text: str,
    content_data: Any | None = None,
    media_uri: str | None = None,
) -> dict[str, Any]:
    content_id = f"{concept_id}::{content_type}::{item_order:03d}"
    return {
        "contentID": content_id,
        "conceptId": concept_id,
        "topicId": topic_id,
        "subjectId": subject_id,
        "title": title,
        "type": content_type,
        "chapterOrder": SECTION_ORDER[content_type],
        "order": item_order,
        "contentText": content_text,
        "contentData": as_json(content_data) if content_data is not None else None,
        "mediaURI": media_uri,
        "sourceFile": source_file,
        "structureVersion": STRUCTURE_VERSION,
        "seedVersion": SEED_VERSION,
        "learnerFacing": True,
    }


def flatten_content(topic: dict[str, Any], concept: dict[str, Any]) -> list[dict[str, Any]]:
    cid = concept["conceptId"]
    topic_id = topic["topicId"]
    subject_id = topic["subjectId"]
    source_file = topic.get("sourceFile", "")
    rows: list[dict[str, Any]] = []

    for i, text in enumerate(require_list(concept.get("learningObjectives"), "learningObjectives", cid), 1):
        t = clean_text(text)
        if t:
            rows.append(content_record(
                concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
                content_type="learning_objective", item_order=i,
                title=f"Learning objective {i}", content_text=t,
            ))

    for i, text in enumerate(require_list(concept.get("prerequisiteNotes"), "prerequisiteNotes", cid), 1):
        t = clean_text(text)
        if t:
            rows.append(content_record(
                concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
                content_type="prerequisite_note", item_order=i,
                title=f"Prerequisite note {i}", content_text=t,
            ))

    definition = clean_text(concept.get("definition"))
    if definition:
        rows.append(content_record(
            concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
            content_type="definition", item_order=1,
            title="Definition", content_text=definition,
        ))

    for i, text in enumerate(require_list(concept.get("explanation"), "explanation", cid), 1):
        t = clean_text(text)
        if t:
            rows.append(content_record(
                concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
                content_type="explanation", item_order=i,
                title=f"Explanation {i}", content_text=t,
            ))

    for i, item in enumerate(require_list(concept.get("keyTerms"), "keyTerms", cid), 1):
        if not isinstance(item, dict):
            raise ValueError(f"{cid}: keyTerms[{i-1}] must be an object")
        term = clean_text(item.get("term"))
        definition_text = clean_text(item.get("definition"))
        if term or definition_text:
            rows.append(content_record(
                concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
                content_type="key_term", item_order=i,
                title=term or f"Key term {i}", content_text=definition_text,
                content_data={"term": term, "definition": definition_text},
            ))

    for i, item in enumerate(require_list(concept.get("illustrations"), "illustrations", cid), 1):
        if not isinstance(item, dict):
            raise ValueError(f"{cid}: illustrations[{i-1}] must be an object")
        # image_prompt has already been removed from the combined learner dataset.
        cleaned = {k: v for k, v in item.items() if k != "image_prompt" and v not in (None, "", [], {})}
        caption = clean_text(cleaned.get("caption"))
        description = clean_text(cleaned.get("description"))
        media_uri = clean_text(cleaned.get("mediaURI")) or None
        rows.append(content_record(
            concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
            content_type="illustration", item_order=i,
            title=caption or f"Illustration {i}", content_text=description,
            content_data=cleaned, media_uri=media_uri,
        ))

    for i, item in enumerate(require_list(concept.get("workedExamples"), "workedExamples", cid), 1):
        if not isinstance(item, dict):
            raise ValueError(f"{cid}: workedExamples[{i-1}] must be an object")
        problem = clean_text(item.get("problem"))
        steps = require_list(item.get("steps"), "workedExamples.steps", cid)
        answer = clean_text(item.get("answer"))
        human = [problem] if problem else []
        human.extend(clean_text(x) for x in steps if clean_text(x))
        if answer:
            human.append(f"Answer: {answer}")
        cleaned = {"problem": problem, "steps": steps, "answer": answer}
        rows.append(content_record(
            concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
            content_type="worked_example", item_order=i,
            title=f"Worked example {i}", content_text="\n".join(human),
            content_data=cleaned,
        ))

    for i, text in enumerate(require_list(concept.get("realWorldApplications"), "realWorldApplications", cid), 1):
        t = clean_text(text)
        if t:
            rows.append(content_record(
                concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
                content_type="real_world_application", item_order=i,
                title=f"Real-world application {i}", content_text=t,
            ))

    for i, text in enumerate(require_list(concept.get("commonMistakes"), "commonMistakes", cid), 1):
        t = clean_text(text)
        if t:
            rows.append(content_record(
                concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
                content_type="common_mistake", item_order=i,
                title=f"Common mistake {i}", content_text=t,
            ))

    for i, text in enumerate(require_list(concept.get("summary"), "summary", cid), 1):
        t = clean_text(text)
        if t:
            rows.append(content_record(
                concept_id=cid, topic_id=topic_id, subject_id=subject_id, source_file=source_file,
                content_type="summary", item_order=i,
                title=f"Summary point {i}", content_text=t,
            ))

    return rows


def load_dataset(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"Lesson JSON not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    scope = data.get("scope") or {}
    if scope.get("structureVersion") != STRUCTURE_VERSION:
        raise SystemExit(
            f"Unexpected structureVersion: {scope.get('structureVersion')!r}; expected {STRUCTURE_VERSION!r}"
        )
    topics = data.get("topics")
    if not isinstance(topics, list):
        raise SystemExit("Dataset 'topics' must be a list")

    concept_ids: list[str] = []
    for topic in topics:
        for concept in topic.get("concepts", []):
            concept_ids.append(concept["conceptId"])

    if len(topics) != 12:
        raise SystemExit(f"Expected 12 topics, found {len(topics)}")
    if len(concept_ids) != 90:
        raise SystemExit(f"Expected 90 concepts, found {len(concept_ids)}")
    if len(set(concept_ids)) != 90:
        raise SystemExit("Duplicate concept IDs found in lesson JSON")

    qa = data.get("qa") or {}
    if qa.get("allConceptIdsMatchV3") is False:
        raise SystemExit("Dataset QA says concept IDs do not match V3")
    return data


VERIFY_CONCEPTS = """
UNWIND $ids AS id
OPTIONAL MATCH (c:Concept {id:id, structureVersion:'v3-json'})
RETURN id, c IS NOT NULL AS exists
ORDER BY id
"""

VERIFY_TOPICS = """
UNWIND $rows AS row
OPTIONAL MATCH (t:Topic {id:row.topicId})-[:HAS_CONCEPT]->(c:Concept {id:row.conceptId, structureVersion:'v3-json'})
RETURN row.topicId AS topicId, row.conceptId AS conceptId, c IS NOT NULL AS linked
"""

CLEAR_CONTENT = """
UNWIND $ids AS id
MATCH (c:Concept {id:id, structureVersion:'v3-json'})-[r:HAS_CONTENT]->(lc:LearningContent)
DELETE r
WITH DISTINCT lc
WHERE NOT (lc)<-[:HAS_CONTENT]-(:Concept)
DETACH DELETE lc
"""

SET_TOPIC_METADATA = """
UNWIND $topics AS row
MATCH (t:Topic {id:row.topicId})
SET t.overview = row.overview,
    t.level = row.level,
    t.curriculum = row.curriculum,
    t.sourceChapterId = row.chapterId,
    t.lessonSeedVersion = $seedVersion,
    t.lessonContentAvailable = true
"""

SET_CONCEPT_METADATA = """
UNWIND $concepts AS row
MATCH (c:Concept {id:row.conceptId, structureVersion:'v3-json'})
SET c.estimatedMinutes = row.estimatedMinutes,
    c.lessonSeedVersion = $seedVersion,
    c.lessonContentAvailable = true,
    c.sourceFile = row.sourceFile
"""

UPSERT_CONTENT = """
UNWIND $rows AS row
MATCH (c:Concept {id:row.conceptId, structureVersion:'v3-json'})
MERGE (lc:LearningContent {contentID:row.contentID})
SET lc.title = row.title,
    lc.type = row.type,
    lc.chapterOrder = row.chapterOrder,
    lc.order = row.order,
    lc.contentText = row.contentText,
    lc.contentData = row.contentData,
    lc.mediaURI = row.mediaURI,
    lc.conceptId = row.conceptId,
    lc.topicId = row.topicId,
    lc.subjectId = row.subjectId,
    lc.sourceFile = row.sourceFile,
    lc.structureVersion = row.structureVersion,
    lc.seedVersion = row.seedVersion,
    lc.learnerFacing = row.learnerFacing,
    lc.updatedAt = datetime()
MERGE (c)-[:HAS_CONTENT]->(lc)
"""

QA_COUNTS = """
MATCH (c:Concept {structureVersion:'v3-json'})
WHERE c.id IN $ids
OPTIONAL MATCH (c)-[:HAS_CONTENT]->(lc:LearningContent {seedVersion:$seedVersion})
WITH count(DISTINCT c) AS concepts, count(DISTINCT lc) AS contentNodes,
     count(DISTINCT CASE WHEN lc.type='definition' THEN c END) AS conceptsWithDefinition,
     count(DISTINCT CASE WHEN lc.type='explanation' THEN c END) AS conceptsWithExplanation
RETURN concepts, contentNodes, conceptsWithDefinition, conceptsWithExplanation
"""

QA_BY_TYPE = """
MATCH (:Concept {structureVersion:'v3-json'})-[:HAS_CONTENT]->(lc:LearningContent {seedVersion:$seedVersion})
RETURN lc.type AS type, count(lc) AS count
ORDER BY type
"""

QA_ORPHANS = """
MATCH (lc:LearningContent {seedVersion:$seedVersion})
WHERE NOT (:Concept)-[:HAS_CONTENT]->(lc)
RETURN count(lc) AS orphanContentNodes
"""

QA_DUPLICATE_IDS = """
MATCH (lc:LearningContent {seedVersion:$seedVersion})
WITH lc.contentID AS id, count(*) AS n
WHERE n > 1
RETURN count(*) AS duplicateContentIDs
"""


def batched(items: list[dict[str, Any]], size: int = 500) -> Iterable[list[dict[str, Any]]]:
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
    topics: list[dict[str, Any]] = data["topics"]

    concept_rows: list[dict[str, Any]] = []
    topic_concept_rows: list[dict[str, str]] = []
    all_content: list[dict[str, Any]] = []

    for topic in topics:
        for concept in topic.get("concepts", []):
            concept_rows.append({
                "conceptId": concept["conceptId"],
                "estimatedMinutes": concept.get("estimatedMinutes"),
                "sourceFile": topic.get("sourceFile"),
            })
            topic_concept_rows.append({
                "topicId": topic["topicId"],
                "conceptId": concept["conceptId"],
            })
            all_content.extend(flatten_content(topic, concept))

    concept_ids = [row["conceptId"] for row in concept_rows]
    topic_metadata = [{
        "topicId": t["topicId"],
        "overview": t.get("overview"),
        "level": t.get("level"),
        "curriculum": t.get("curriculum"),
        "chapterId": t.get("chapterId"),
    } for t in topics]

    print("STEM V3 lesson seeder")
    print(f"Data file: {data_file}")
    print(f"Topics: {len(topics)}")
    print(f"Concepts: {len(concept_ids)}")
    print(f"LearningContent nodes to seed: {len(all_content)}")
    print("Questions/exercises: NOT seeded by this script")

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

            topic_links = session.run(VERIFY_TOPICS, rows=topic_concept_rows).data()
            bad_links = [row for row in topic_links if not row["linked"]]
            if bad_links:
                print("ERROR: Some V3 concepts are not linked to their expected topic:", file=sys.stderr)
                for row in bad_links[:20]:
                    print(f"  - {row['topicId']} -> {row['conceptId']}", file=sys.stderr)
                return 3

            print("Preflight QA: 90/90 concepts and topic links verified.")

            if not args.no_replace:
                session.run(CLEAR_CONTENT, ids=concept_ids).consume()
                print("Existing lesson content on the 90 V3 concepts cleared for clean replacement.")
            else:
                print("--no-replace enabled: existing lesson content retained.")

            session.run(SET_TOPIC_METADATA, topics=topic_metadata, seedVersion=SEED_VERSION).consume()
            session.run(SET_CONCEPT_METADATA, concepts=concept_rows, seedVersion=SEED_VERSION).consume()

            seeded = 0
            for batch in batched(all_content, 400):
                session.run(UPSERT_CONTENT, rows=batch).consume()
                seeded += len(batch)
                print(f"Seeded {seeded}/{len(all_content)} LearningContent nodes...")

            qa = session.run(QA_COUNTS, ids=concept_ids, seedVersion=SEED_VERSION).single()
            by_type = session.run(QA_BY_TYPE, seedVersion=SEED_VERSION).data()
            orphan = session.run(QA_ORPHANS, seedVersion=SEED_VERSION).single()["orphanContentNodes"]
            dupes = session.run(QA_DUPLICATE_IDS, seedVersion=SEED_VERSION).single()["duplicateContentIDs"]

            print("\nFINAL QA")
            print(f"Concepts: {qa['concepts']}/90")
            print(f"LearningContent nodes: {qa['contentNodes']}/{len(all_content)}")
            print(f"Concepts with definition: {qa['conceptsWithDefinition']}/90")
            print(f"Concepts with explanation: {qa['conceptsWithExplanation']}/90")
            print(f"Orphan content nodes: {orphan}")
            print(f"Duplicate content IDs: {dupes}")
            print("Content by type:")
            for row in by_type:
                print(f"  {row['type']}: {row['count']}")

            if (
                qa["concepts"] != 90
                or qa["contentNodes"] != len(all_content)
                or qa["conceptsWithDefinition"] != 90
                or qa["conceptsWithExplanation"] != 90
                or orphan != 0
                or dupes != 0
            ):
                print("QA FAILED. Review the counts above.", file=sys.stderr)
                return 4

        print("\nSUCCESS: V3 lesson content seeded and QA passed.")
        return 0
    finally:
        driver.close()


if __name__ == "__main__":
    raise SystemExit(main())
