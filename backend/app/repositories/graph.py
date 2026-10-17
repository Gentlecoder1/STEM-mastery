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
MATCH (:Subject {id: $subject_id})-[:HAS_TOPIC]->(t:Topic)
RETURN t.id AS id, coalesce(t.name, t.prefLabel, t.id) AS name, t.iri AS iri
ORDER BY name
"""

_CONCEPTS = """
MATCH (:Topic {id: $topic_id})-[:HAS_CONCEPT]->(c:Concept)
RETURN c.id AS id, coalesce(c.name, c.prefLabel) AS name,
       c.prefLabel AS prefLabel, c.iri AS iri
ORDER BY name
"""

_CONCEPT = """
MATCH (c:Concept {id: $concept_id})
OPTIONAL MATCH (t:Topic)-[:HAS_CONCEPT]->(c)
OPTIONAL MATCH (c)-[:BELONGS_TO_SUBJECT]->(s:Subject)
RETURN c.id AS id, coalesce(c.name, c.prefLabel) AS name,
       c.prefLabel AS prefLabel, c.aliases AS aliases, c.iri AS iri,
       collect(DISTINCT t.id) AS topicIds,
       collect(DISTINCT s.id) AS subjectIds
"""

_HAS_LESSON = """
MATCH (:Concept {id: $concept_id})-[:HAS_CONTENT]->(:LearningContent)
RETURN count(*) > 0 AS hasLesson
"""

_PREREQUISITES = """
MATCH (c:Concept {id: $concept_id})-[:PREREQUISITE_OF]->(p:Concept)
RETURN DISTINCT p.id AS id, coalesce(p.name, p.prefLabel) AS name
ORDER BY name
"""

_RELATED = """
MATCH (c:Concept {id: $concept_id})-[:RELATED_TO]-(r:Concept)
RETURN DISTINCT r.id AS id, coalesce(r.name, r.prefLabel) AS name
ORDER BY name
"""

_DEFINITION = """
MATCH (c:Concept {id: $concept_id})-[:HAS_CONTENT]->(lc:LearningContent)
WHERE toLower(coalesce(lc.type, '')) = 'definition'
RETURN lc.contentText AS contentText
LIMIT 1
"""

_CONTENT = """
MATCH (:Concept {id: $concept_id})-[:HAS_CONTENT]->(lc:LearningContent)
RETURN lc.contentID AS contentID, lc.title AS title, lc.type AS type,
       lc.chapterOrder AS chapterOrder, lc.order AS contentOrder,
       lc.contentText AS contentText, lc.mediaURI AS mediaURI
ORDER BY coalesce(lc.chapterOrder, lc.order, 0)
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
       q.expectedNumericAnswer AS expectedNumericAnswer
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
MATCH (c:Concept)-[:PREREQUISITE_OF]->(p:Concept)
WHERE c.id IN $ids AND p.id IN $ids
RETURN c.id AS conceptId, p.id AS prerequisiteId
"""

_SUBJECT_CONCEPTS = """
MATCH (:Subject {id: $subject_id})-[:HAS_TOPIC]->(:Topic)-[:HAS_CONCEPT]->(c:Concept)
RETURN DISTINCT c.id AS id, coalesce(c.name, c.prefLabel, c.id) AS name,
       c.prefLabel AS prefLabel, c.iri AS iri
"""

_PLACEMENT_CANDIDATES = """
MATCH (:Subject {id: $subject_id})-[:HAS_TOPIC]->(:Topic)-[:HAS_CONCEPT]->(c:Concept)
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
        "conceptId": row.get("conceptId"),
        "subjectId": row.get("subjectId"),
    }


def _topological_order(
    ids: list[str], prerequisites: dict[str, list[str]], names: dict[str, Any]
) -> list[str]:
    """Kahn's algorithm with a deterministic (name, id) tie-break.

    ``prerequisites[c]`` are concepts that must appear *before* ``c``. Nodes left
    over after the queue drains (cycles/disconnected) are appended in the same
    deterministic order.
    """

    def sort_key(node_id: str) -> tuple[str, str]:
        return (str(names.get(node_id) or ""), str(node_id))

    indegree = {cid: 0 for cid in ids}
    dependents: dict[str, list[str]] = {cid: [] for cid in ids}
    for cid in ids:
        for prereq in prerequisites.get(cid, []):
            if prereq in indegree:
                indegree[cid] += 1
                dependents[prereq].append(cid)

    ready = sorted((cid for cid in ids if indegree[cid] == 0), key=sort_key)
    ordered: list[str] = []
    seen: set[str] = set()
    while ready:
        node = ready.pop(0)
        if node in seen:
            continue
        seen.add(node)
        ordered.append(node)
        newly_ready = []
        for dependent in dependents[node]:
            indegree[dependent] -= 1
            if indegree[dependent] == 0:
                newly_ready.append(dependent)
        if newly_ready:
            ready = sorted([*ready, *newly_ready], key=sort_key)

    for cid in sorted(ids, key=sort_key):
        if cid not in seen:
            ordered.append(cid)
    return ordered



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
        """Return a topic's concepts in prerequisite (topological) order.

        Prerequisites come from ``(concept)-[:PREREQUISITE_OF]->(prerequisite)``.
        Cycles or disconnected nodes fall back to a deterministic name/id order.
        Each concept carries lightweight ``{id, name}`` prerequisites.
        """
        rows = await self._read(_CONCEPTS, topic_id=topic_id)
        names = {row["id"]: row.get("name") for row in rows}
        ids = [row["id"] for row in rows]
        edges = await self._read(_CONCEPT_EDGES, ids=ids) if len(ids) > 1 else []

        prerequisites: dict[str, list[str]] = {cid: [] for cid in ids}
        for edge in edges:
            dependent = edge["conceptId"]
            prereq = edge["prerequisiteId"]
            if dependent in prerequisites and prereq not in prerequisites[dependent]:
                prerequisites[dependent].append(prereq)

        ordered_ids = _topological_order(ids, prerequisites, names)
        by_id = {row["id"]: row for row in rows}
        return [
            {
                **by_id[cid],
                "prerequisites": [
                    {"id": pid, "name": names.get(pid)} for pid in sorted(prerequisites[cid])
                ],
            }
            for cid in ordered_ids
        ]

    async def ordered_concept_ids(self, topic_id: str) -> list[str]:
        concepts = await self.list_concepts(topic_id)
        return [concept["id"] for concept in concepts]

    async def ordered_subject_concepts(self, subject_id: str) -> list[dict[str, Any]]:
        """All concepts in a subject in a prerequisite-respecting order."""
        rows = await self._read(_SUBJECT_CONCEPTS, subject_id=subject_id)
        names = {row["id"]: row.get("name") for row in rows}
        ids = [row["id"] for row in rows]
        edges = await self._read(_CONCEPT_EDGES, ids=ids) if len(ids) > 1 else []
        prerequisites: dict[str, list[str]] = {cid: [] for cid in ids}
        for edge in edges:
            dependent = edge["conceptId"]
            prereq = edge["prerequisiteId"]
            if dependent in prerequisites and prereq not in prerequisites[dependent]:
                prerequisites[dependent].append(prereq)
        ordered_ids = _topological_order(ids, prerequisites, names)
        by_id = {row["id"]: row for row in rows}
        return [by_id[cid] for cid in ordered_ids]

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
        definition_rows = await self._read(_DEFINITION, concept_id=concept_id)
        concept["shortDescription"] = (
            definition_rows[0]["contentText"] if definition_rows else None
        )
        has_lesson_rows = await self._read(_HAS_LESSON, concept_id=concept_id)
        concept["hasLesson"] = bool(has_lesson_rows and has_lesson_rows[0].get("hasLesson"))
        return concept

    async def list_content(self, concept_id: str) -> list[dict[str, Any]]:
        rows = await self._read(_CONTENT, concept_id=concept_id)
        return [
            {
                "id": row.get("contentID"),
                "conceptId": concept_id,
                "title": row.get("title"),
                "contentText": row.get("contentText"),
                "contentType": row.get("type"),
                "chapterOrder": row.get("chapterOrder") or row.get("contentOrder"),
                "mediaURI": row.get("mediaURI"),
            }
            for row in rows
        ]

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
