"""Read-only Neo4j repository for catalog data.

Every query runs inside ``session.execute_read`` and is fully parameterised.
None of these methods mutate the graph — the curriculum is authoritative in
AuraDB and only ever read here.

The queries reflect the agreed schema (Subject/Topic/Concept/LearningContent/
Question with HAS_TOPIC, HAS_CONCEPT, BELONGS_TO_SUBJECT, PREREQUISITE_OF,
RELATED_TO, HAS_CONTENT, ASSESSES_CONCEPT, EXPECTS_CONCEPT). They should be
verified against the migrated AuraDB via ``GET /api/v1/graph/schema`` and the
live smoke test.
"""

from __future__ import annotations

import json
from typing import Any

from app.core.db import Neo4jDatabase

_LABELS = """
CALL db.labels() YIELD label
RETURN collect(label) AS labels
"""

_RELATIONSHIP_TYPES = """
CALL db.relationshipTypes() YIELD relationshipType
RETURN collect(relationshipType) AS relationshipTypes
"""

_PROPERTY_KEYS = """
CALL db.propertyKeys() YIELD propertyKey
RETURN collect(propertyKey) AS propertyKeys
"""

_SUBJECTS = """
MATCH (s:Subject)
RETURN s.id AS id, coalesce(s.name, s.prefLabel, s.id) AS name, s.iri AS iri
ORDER BY name
"""

_TOPICS = """
MATCH (:Subject {id: $subject_id})-[r:HAS_TOPIC]->(t:Topic)
RETURN t.id AS id, coalesce(t.name, t.prefLabel, t.id) AS name, t.iri AS iri,
       r.order AS order
ORDER BY r.order ASC
"""

_CONCEPTS = """
MATCH (t:Topic {id: $topic_id})-[r:HAS_CONCEPT]->(c:Concept)
WHERE c.legacyArchivedAt IS NULL AND coalesce(c.canonical, true) = true
  AND ((t.structureVersion = 'v3-json' AND c.canonical = true)
       OR coalesce(t.structureVersion, '') <> 'v3-json')
OPTIONAL MATCH (p:Concept)-[:PREREQUISITE_OF]->(c)
WHERE p.legacyArchivedAt IS NULL AND coalesce(p.canonical, true) = true
RETURN c.id AS id, coalesce(c.name, c.prefLabel, c.id) AS name,
       c.prefLabel AS prefLabel, c.iri AS iri, r.order AS order,
       collect(DISTINCT CASE
           WHEN p IS NOT NULL
           THEN {id: p.id, name: coalesce(p.name, p.prefLabel, p.id)}
       END) AS prerequisites
ORDER BY r.order ASC
"""

_CONCEPT = """
MATCH (c:Concept {id: $concept_id})
WHERE c.legacyArchivedAt IS NULL AND coalesce(c.canonical, true) = true
OPTIONAL MATCH (t:Topic)-[:HAS_CONCEPT]->(c)
OPTIONAL MATCH (s:Subject)-[:HAS_TOPIC]->(t)
RETURN c.id AS id, coalesce(c.name, c.prefLabel) AS name,
       c.prefLabel AS prefLabel, c.aliases AS aliases, c.iri AS iri,
       collect(DISTINCT t.id) AS topicIds,
       collect(DISTINCT s.id) AS subjectIds
"""

_HAS_LESSON = """
MATCH (c:Concept {id: $concept_id})-[:HAS_CONTENT]->(lc:LearningContent)
WHERE c.structureVersion = 'v3-json' AND c.canonical = true
  AND lc.structureVersion = 'v3-json' AND lc.learnerFacing = true
RETURN count(*) > 0 AS hasLesson
"""

_PREREQUISITES = """
MATCH (p:Concept)-[:PREREQUISITE_OF]->(c:Concept {id: $concept_id})
WHERE p.legacyArchivedAt IS NULL AND coalesce(p.canonical, true) = true
RETURN DISTINCT p.id AS id, coalesce(p.name, p.prefLabel, p.id) AS name
ORDER BY name
"""

_RELATED = """
MATCH (c:Concept {id: $concept_id})-[:RELATED_TO]-(r:Concept)
WHERE r.legacyArchivedAt IS NULL AND coalesce(r.canonical, true) = true
RETURN DISTINCT r.id AS id, coalesce(r.name, r.prefLabel) AS name
ORDER BY name
"""

_STRUCTURED_LESSON = """
MATCH (c:Concept {id: $concept_id})
WHERE c.structureVersion = 'v3-json' AND c.canonical = true
OPTIONAL MATCH (s:Subject)-[:HAS_TOPIC]->(t:Topic)-[hc:HAS_CONCEPT]->(c)
WITH c, collect(DISTINCT CASE WHEN s IS NULL OR t IS NULL THEN null ELSE {
    subjectId: s.id,
    topicId: t.id,
    topicOrder: hc.order
} END) AS contexts
OPTIONAL MATCH (c)-[:HAS_CONTENT]->(lc:LearningContent)
WHERE lc.structureVersion = 'v3-json' AND lc.learnerFacing = true
WITH c, contexts, lc
ORDER BY coalesce(lc.chapterOrder, 0), coalesce(lc.order, 0), lc.contentID
WITH c, contexts, collect(CASE WHEN lc IS NULL THEN null ELSE properties(lc) END) AS lessons
OPTIONAL MATCH (p:Concept)-[:PREREQUISITE_OF]->(c)
WHERE p.legacyArchivedAt IS NULL AND coalesce(p.canonical, true) = true
WITH c, contexts, lessons,
     collect(DISTINCT CASE WHEN p IS NULL THEN null ELSE {
         id: p.id, name: coalesce(p.title, p.name, p.prefLabel, p.id)
     } END) AS prerequisites
OPTIONAL MATCH (c)-[:RELATED_TO]-(r:Concept)
WHERE r.legacyArchivedAt IS NULL AND coalesce(r.canonical, true) = true
WITH c, contexts, lessons, prerequisites,
     collect(DISTINCT CASE WHEN r IS NULL THEN null ELSE {
         id: r.id, name: coalesce(r.title, r.name, r.prefLabel, r.id)
     } END) AS related
RETURN c.id AS id, coalesce(c.title, c.name, c.prefLabel, c.id) AS title,
       c.subjectId AS subjectId, c.topicId AS topicId, c.order AS conceptOrder,
       c.estimatedMinutes AS estimatedMinutes,
       c.prerequisiteNotes AS prerequisiteNotes,
       contexts, [item IN lessons WHERE item IS NOT NULL] AS lessons,
       [item IN prerequisites WHERE item IS NOT NULL] AS prerequisites,
       [item IN related WHERE item IS NOT NULL] AS relatedConcepts
"""

_STRUCTURED_QUESTION_COUNT = """
MATCH (c:Concept {id: $concept_id})
OPTIONAL MATCH (q:Question)
WHERE (q)-[:ASSESSES_CONCEPT]->(c) OR (q)-[:EXPECTS_CONCEPT]->(c)
RETURN count(DISTINCT q) AS questionCount
"""

_QUESTIONS = """
MATCH (q:Question)
WHERE (q)-[:ASSESSES_CONCEPT]->(:Concept {id: $concept_id})
   OR (q)-[:EXPECTS_CONCEPT]->(:Concept {id: $concept_id})
RETURN DISTINCT q.questionID AS questionID, q.type AS type,
       q.questionText AS questionText, q.difficultyLevel AS difficultyLevel,
       q.options AS options
ORDER BY questionID
"""

# Questions *with* their answer keys, used only server-side for grading.
_QUESTION_ANSWERS = """
MATCH (q:Question)
WHERE (q)-[:ASSESSES_CONCEPT]->(:Concept {id: $concept_id})
   OR (q)-[:EXPECTS_CONCEPT]->(:Concept {id: $concept_id})
RETURN DISTINCT q.questionID AS questionID, q.type AS type,
       q.options AS options, q.correctOption AS correctOption,
       q.correctAnswer AS correctAnswer, q.referenceAnswer AS referenceAnswer,
       q.expectedNumericAnswer AS expectedNumericAnswer, q.solution AS solution
"""

_QUESTION_ANSWER = """
MATCH (q:Question {questionID: $question_id})
OPTIONAL MATCH (q)-[:ASSESSES_CONCEPT]->(c:Concept)
OPTIONAL MATCH (c)-[:BELONGS_TO_SUBJECT]->(s:Subject)
RETURN q.questionID AS questionID, q.type AS type, q.options AS options,
       q.correctOption AS correctOption, q.correctAnswer AS correctAnswer,
       q.referenceAnswer AS referenceAnswer, q.expectedNumericAnswer AS expectedNumericAnswer,
       c.id AS conceptId, s.id AS subjectId
LIMIT 1
"""

_CONCEPT_EDGES = """
MATCH (p:Concept)-[:PREREQUISITE_OF]->(c:Concept)
WHERE c.id IN $ids AND p.id IN $ids
RETURN c.id AS conceptId, p.id AS prerequisiteId
"""

_SUBJECT_CONCEPTS = """
MATCH (:Subject {id: $subject_id})-[tr:HAS_TOPIC]->(t:Topic)-[cr:HAS_CONCEPT]->(c:Concept)
WHERE c.legacyArchivedAt IS NULL AND coalesce(c.canonical, true) = true
  AND ((t.structureVersion = 'v3-json' AND c.canonical = true)
       OR coalesce(t.structureVersion, '') <> 'v3-json')
RETURN c.id AS id, coalesce(c.name, c.prefLabel, c.id) AS name,
       c.prefLabel AS prefLabel, c.iri AS iri
ORDER BY tr.order ASC, cr.order ASC
"""

_SEARCH_CONCEPTS = """
MATCH (s:Subject)-[:HAS_TOPIC]->(t:Topic)-[:HAS_CONCEPT]->(c:Concept)
WHERE c.legacyArchivedAt IS NULL AND coalesce(c.canonical, true) = true
  AND ((t.structureVersion = 'v3-json' AND c.canonical = true)
       OR coalesce(t.structureVersion, '') <> 'v3-json')
  AND (toLower(coalesce(c.name, '')) CONTAINS $search_term
   OR toLower(coalesce(c.prefLabel, '')) CONTAINS $search_term
   OR toLower(coalesce(c.id, '')) CONTAINS $search_term)
WITH c, collect(DISTINCT CASE WHEN s IS NULL OR t IS NULL THEN null ELSE {
    subjectId: s.id,
    subjectName: coalesce(s.name, s.prefLabel, s.id),
    topicId: t.id,
    topicName: coalesce(t.name, t.prefLabel, t.id)
} END) AS contexts
RETURN c.id AS id, coalesce(c.name, c.prefLabel, c.id) AS name,
       c.prefLabel AS shortDescription, contexts
ORDER BY name, id
LIMIT $limit
"""

_PLACEMENT_CANDIDATES = """
MATCH (:Subject {id: $subject_id})-[:HAS_TOPIC]->(t:Topic)-[:HAS_CONCEPT]->(c:Concept)
WHERE c.legacyArchivedAt IS NULL AND coalesce(c.canonical, true) = true
  AND ((t.structureVersion = 'v3-json' AND c.canonical = true)
       OR coalesce(t.structureVersion, '') <> 'v3-json')
MATCH (q:Question)-[:ASSESSES_CONCEPT]->(c)
RETURN DISTINCT q.questionID AS id, q.type AS type, q.questionText AS prompt,
       q.difficultyLevel AS difficultyLevel, q.options AS options, c.id AS conceptId
"""


def _as_list(value: Any) -> list[Any]:
    """Coerce a Neo4j property into a list.

    Values may be stored natively as a list, or serialised as a JSON array or a
    comma-separated string.
    """
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return [part.strip() for part in text.split(",") if part.strip()]
        return parsed if isinstance(parsed, list) else [parsed]
    return [value]


def _json_value(value: Any, default: Any) -> Any:
    """Decode JSON-serialized Neo4j strings while preserving native values."""
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def _parse_options(value: Any) -> list[dict[str, Any]]:
    """Normalise a question's ``options`` property into option dictionaries."""
    raw = _as_list(value)
    options: list[dict[str, Any]] = []
    if isinstance(value, dict):
        raw = list(value.items())
    for index, item in enumerate(raw):
        if isinstance(item, dict):
            if "id" in item and ("text" in item or "label" in item):
                options.append(
                    {
                        "id": str(item.get("id")),
                        "label": item.get("label"),
                        "text": item.get("text"),
                    }
                )
            else:
                # e.g. {"a": "Distance", "b": "Displacement"}
                key, text = next(iter(item.items()))
                options.append({"id": str(key), "label": str(key).upper(), "text": str(text)})
        elif isinstance(item, (list, tuple)) and len(item) == 2:
            key, text = item
            options.append({"id": str(key), "label": str(key).upper(), "text": str(text)})
        else:
            letter = chr(ord("a") + index)
            options.append({"id": letter, "label": letter.upper(), "text": str(item)})
    return options


def _question_answer(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("questionID"),
        "type": row.get("type"),
        "options": _parse_options(row.get("options")),
        "correctOption": row.get("correctOption"),
        "correctAnswer": row.get("correctAnswer"),
        "referenceAnswer": row.get("referenceAnswer"),
        "expectedNumericAnswer": row.get("expectedNumericAnswer"),
        "solution": row.get("solution"),
        "conceptId": row.get("conceptId"),
        "subjectId": row.get("subjectId"),
    }


def _normalize_match_text(value: Any) -> str:
    """Lowercase + collapse whitespace for conservative entity matching."""
    return " ".join(str(value or "").split()).strip().lower()


# Exact normalized matches on identity fields only; alias matching is done in
# Python afterwards so list/JSON-string alias properties never reach Cypher
# string functions. LIMIT 2 is enough to distinguish a match from ambiguity.
_MATCH_QUERIES = {
    "SUBJECT": """
        MATCH (n:Subject)
        WHERE toLower(coalesce(n.name, n.prefLabel, '')) = $text
           OR toLower(coalesce(n.id, '')) = $text
        RETURN n.id AS id, coalesce(n.name, n.prefLabel, n.id) AS name
        ORDER BY name
        LIMIT 2
    """,
    "TOPIC": """
        MATCH (n:Topic)
        WHERE toLower(coalesce(n.name, n.prefLabel, '')) = $text
           OR toLower(coalesce(n.id, '')) = $text
        RETURN n.id AS id, coalesce(n.name, n.prefLabel, n.id) AS name
        ORDER BY name
        LIMIT 2
    """,
    "CONCEPT": """
        MATCH (n:Concept)
        WHERE toLower(coalesce(n.name, n.prefLabel, '')) = $text
           OR toLower(coalesce(n.id, '')) = $text
        RETURN n.id AS id, coalesce(n.name, n.prefLabel, n.id) AS name
        ORDER BY name
        LIMIT 2
    """,
}

_ALIAS_QUERY = """
MATCH (n:%s)
WHERE n.aliases IS NOT NULL
RETURN n.id AS id, coalesce(n.name, n.prefLabel, n.id) AS name, n.aliases AS aliases
"""


class GraphRepository:
    """Read-only access to the curriculum graph."""

    def __init__(self, database: Neo4jDatabase) -> None:
        self._database = database

    async def _read(self, query: str, **params: Any) -> list[dict[str, Any]]:
        async def work(tx: Any) -> list[dict[str, Any]]:
            result = await tx.run(query, **params)
            return [record.data() async for record in result]

        async with self._database.session() as session:
            return await session.execute_read(work)

    async def schema(self) -> dict[str, list[str]]:
        labels, relationships, properties = (
            await self._read(_LABELS),
            await self._read(_RELATIONSHIP_TYPES),
            await self._read(_PROPERTY_KEYS),
        )
        return {
            "labels": labels[0]["labels"] if labels else [],
            "relationshipTypes": relationships[0]["relationshipTypes"] if relationships else [],
            "propertyKeys": properties[0]["propertyKeys"] if properties else [],
        }

    async def list_subjects(self) -> list[dict[str, Any]]:
        return await self._read(_SUBJECTS)

    async def list_topics(self, subject_id: str) -> list[dict[str, Any]]:
        return await self._read(_TOPICS, subject_id=subject_id)

    async def list_concepts(self, topic_id: str) -> list[dict[str, Any]]:
        """Return a topic's concepts in authoritative curriculum teaching order."""
        rows = await self._read(_CONCEPTS, topic_id=topic_id)
        for row in rows:
            row["prerequisites"] = [
                prerequisite
                for prerequisite in (row.get("prerequisites") or [])
                if prerequisite is not None
            ]
        return rows

    async def ordered_concept_ids(self, topic_id: str) -> list[str]:
        concepts = await self.list_concepts(topic_id)
        return [concept["id"] for concept in concepts]

    async def ordered_subject_concepts(self, subject_id: str) -> list[dict[str, Any]]:
        """Return distinct concepts in topic and concept curriculum order."""
        rows = await self._read(_SUBJECT_CONCEPTS, subject_id=subject_id)
        concepts: list[dict[str, Any]] = []
        seen_ids: set[str] = set()
        for row in rows:
            if row["id"] not in seen_ids:
                concepts.append(row)
                seen_ids.add(row["id"])
        return concepts

    async def search_concepts(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        rows = await self._read(
            _SEARCH_CONCEPTS,
            search_term=query.strip().lower(),
            limit=limit,
        )
        for row in rows:
            row["contexts"] = [context for context in (row.get("contexts") or []) if context]
        return rows

    async def list_question_answers(self, concept_id: str) -> dict[str, dict[str, Any]]:
        """Questions with answer keys for server-side grading (never returned)."""
        rows = await self._read(_QUESTION_ANSWERS, concept_id=concept_id)
        return {row["questionID"]: _question_answer(row) for row in rows}

    async def get_question_answer(self, question_id: str) -> dict[str, Any] | None:
        rows = await self._read(_QUESTION_ANSWER, question_id=question_id)
        return _question_answer(rows[0]) if rows else None

    async def placement_candidates(self, subject_id: str) -> list[dict[str, Any]]:
        rows = await self._read(_PLACEMENT_CANDIDATES, subject_id=subject_id)
        return [
            {
                "id": row.get("id"),
                "type": row.get("type"),
                "prompt": row.get("prompt"),
                "difficultyLevel": row.get("difficultyLevel"),
                "options": _parse_options(row.get("options")),
                "conceptId": row.get("conceptId"),
                "subjectId": subject_id,
            }
            for row in rows
        ]

    async def get_concept(self, concept_id: str) -> dict[str, Any] | None:
        rows = await self._read(_CONCEPT, concept_id=concept_id)
        if not rows:
            return None
        concept = rows[0]
        concept["aliases"] = _as_list(concept.get("aliases"))
        concept["topicIds"] = [value for value in (concept.get("topicIds") or []) if value]
        concept["subjectIds"] = [value for value in (concept.get("subjectIds") or []) if value]
        concept["prerequisites"] = await self._read(_PREREQUISITES, concept_id=concept_id)
        concept["related"] = await self._read(_RELATED, concept_id=concept_id)
        concept["shortDescription"] = concept.get("prefLabel")
        has_lesson_rows = await self._read(_HAS_LESSON, concept_id=concept_id)
        concept["hasLesson"] = bool(has_lesson_rows and has_lesson_rows[0].get("hasLesson"))
        return concept

    async def get_structured_lesson(self, concept_id: str) -> dict[str, Any] | None:
        rows = await self._read(_STRUCTURED_LESSON, concept_id=concept_id)
        if not rows:
            return None

        row = rows[0]
        content_rows = row.get("lessons") or []
        if not content_rows:
            return None

        contexts = [context for context in (row.get("contexts") or []) if context]
        concept_subject_id = row.get("subjectId")
        concept_topic_id = row.get("topicId")
        context = next(
            (
                item
                for item in contexts
                if (concept_subject_id is None or item.get("subjectId") == concept_subject_id)
                and (concept_topic_id is None or item.get("topicId") == concept_topic_id)
            ),
            contexts[0] if contexts else {},
        )
        count_rows = await self._read(_STRUCTURED_QUESTION_COUNT, concept_id=concept_id)
        question_count = int(count_rows[0].get("questionCount") or 0) if count_rows else 0
        section_values: dict[str, list[Any]] = {
            "learning_objective": [],
            "prerequisite_note": [],
            "explanation": [],
            "key_term": [],
            "illustration": [],
            "worked_example": [],
            "real_world_application": [],
            "common_mistake": [],
            "summary": [],
        }
        definition: str | None = None
        for content_row in content_rows:
            content_type = content_row.get("type")
            content_text = content_row.get("contentText")
            content_data = _json_value(content_row.get("contentData"), None)
            if content_type == "definition":
                definition = content_text
            elif content_type in section_values:
                if content_type == "key_term":
                    value = content_data if isinstance(content_data, dict) else {
                        "term": content_row.get("title") or "",
                        "definition": content_text or "",
                    }
                    section_values[content_type].append(
                        {"term": value.get("term", ""), "definition": value.get("definition", "")}
                    )
                elif content_type == "worked_example":
                    value = content_data if isinstance(content_data, dict) else {}
                    section_values[content_type].append(
                        {
                            "problem": value.get("problem") or content_row.get("title") or "",
                            "steps": _as_list(value.get("steps")),
                            "answer": value.get("answer") or None,
                        }
                    )
                elif content_type == "illustration":
                    value = content_data if isinstance(content_data, dict) else {}
                    section_values[content_type].append(
                        {
                            "type": value.get("type"),
                            "caption": value.get("caption") or content_row.get("title"),
                            "description": value.get("description") or content_text,
                            "table": value.get("table"),
                            "mediaURI": content_row.get("mediaURI"),
                        }
                    )
                else:
                    section_values[content_type].append(content_text or "")

        concept = {
            "id": row["id"],
            "title": row["title"],
            "subjectId": context.get("subjectId") or concept_subject_id,
            "topicId": context.get("topicId") or concept_topic_id,
            "order": (
                context.get("topicOrder")
                if context.get("topicOrder") is not None
                else row.get("conceptOrder")
            ),
            "estimatedMinutes": row.get("estimatedMinutes"),
        }
        return {
            "concept": concept,
            "learningObjectives": section_values["learning_objective"],
            "definition": definition,
            "explanation": section_values["explanation"],
            "keyTerms": section_values["key_term"],
            "illustrations": section_values["illustration"],
            "workedExamples": section_values["worked_example"],
            "realWorldApplications": section_values["real_world_application"],
            "commonMistakes": section_values["common_mistake"],
            "summary": section_values["summary"],
            "prerequisiteNotes": (
                _as_list(row.get("prerequisiteNotes"))
                or section_values["prerequisite_note"]
            ),
            "prerequisites": [item for item in (row.get("prerequisites") or []) if item],
            "relatedConcepts": [item for item in (row.get("relatedConcepts") or []) if item],
            "practiceAvailable": question_count > 0,
            "questionCount": question_count,
        }

    async def list_questions(self, concept_id: str) -> list[dict[str, Any]]:
        rows = await self._read(_QUESTIONS, concept_id=concept_id)
        return [
            {
                "id": row.get("questionID"),
                "type": row.get("type"),
                "prompt": row.get("questionText"),
                "difficultyLevel": row.get("difficultyLevel"),
                "options": _parse_options(row.get("options")),
            }
            for row in rows
        ]

    async def find_entity(self, entity_type: str, text: str) -> list[dict[str, Any]]:
        """Conservatively resolve an extracted entity against graph nodes.

        Read-only and parameterised; never creates nodes. Exact normalized
        name/prefLabel/id match first; aliases are checked only when no direct
        match exists and the label's graph data actually has aliases. Returns
        zero, one, or (rarely) several candidates — more than one distinct node
        is reported as ambiguous by the semantic service instead of guessed.
        """
        query = _MATCH_QUERIES.get(entity_type)
        if query is None:
            return []
        normalized = _normalize_match_text(text)
        if not normalized:
            return []
        rows = await self._read(query, text=normalized)
        if rows:
            return rows[:2]

        # Second attempt, aliases only: prefix _ALIAS_QUERY with the label and
        # coerce alias values with the same _as_list rules as catalog reads.
        alias_rows = await self._read(_ALIAS_QUERY % entity_type.title())
        matched = [
            row
            for row in alias_rows
            if normalized in (_normalize_match_text(a) for a in _as_list(row.get("aliases")))
        ]
        return matched[:2]
