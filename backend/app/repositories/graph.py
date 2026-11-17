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
MATCH (:Topic {id: $topic_id})-[r:HAS_CONCEPT]->(c:Concept)
OPTIONAL MATCH (p:Concept)-[:PREREQUISITE_OF]->(c)
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
MATCH (p:Concept)-[:PREREQUISITE_OF]->(c:Concept {id: $concept_id})
RETURN DISTINCT p.id AS id, coalesce(p.name, p.prefLabel, p.id) AS name
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
MATCH (p:Concept)-[:PREREQUISITE_OF]->(c:Concept)
WHERE c.id IN $ids AND p.id IN $ids
RETURN c.id AS conceptId, p.id AS prerequisiteId
"""

_SUBJECT_CONCEPTS = """
MATCH (:Subject {id: $subject_id})-[tr:HAS_TOPIC]->(:Topic)-[cr:HAS_CONCEPT]->(c:Concept)
RETURN c.id AS id, coalesce(c.name, c.prefLabel, c.id) AS name,
       c.prefLabel AS prefLabel, c.iri AS iri
ORDER BY tr.order ASC, cr.order ASC
"""

_KNOWLEDGE_MAP_TOPIC = """
MATCH (t:Topic {id: $topic_id})
OPTIONAL MATCH (s:Subject)-[:HAS_TOPIC]->(t)
OPTIONAL MATCH (t)-[r:HAS_CONCEPT]->(c:Concept)
WITH t, s, r, c
ORDER BY r.order ASC
WITH t,
     collect(DISTINCT CASE WHEN c IS NOT NULL THEN {
         id: c.id,
         name: coalesce(c.name, c.prefLabel, c.id),
         order: r.order
     } END) AS concepts,
     collect(DISTINCT s.id) AS subjectIds
RETURN t.id AS id, coalesce(t.name, t.prefLabel, t.id) AS name,
       head(subjectIds) AS subjectId, concepts
"""

_KNOWLEDGE_MAP_NODES = """
MATCH (c:Concept)
WHERE c.id IN $concept_ids
OPTIONAL MATCH (t:Topic)-[cr:HAS_CONCEPT]->(c)
OPTIONAL MATCH (s:Subject)-[:HAS_TOPIC]->(t)
WITH c, collect(DISTINCT CASE WHEN s IS NOT NULL AND t IS NOT NULL THEN {
    subjectId: s.id,
    topicId: t.id,
    conceptOrder: cr.order
} END) AS contexts
OPTIONAL MATCH (c)-[:HAS_CONTENT]->(lc:LearningContent)
WITH c, contexts, lc
ORDER BY coalesce(lc.chapterOrder, lc.order, 0)
WITH c, contexts, head(collect(lc)) AS firstContent, count(lc) > 0 AS hasLesson
RETURN c.id AS id, coalesce(c.name, c.prefLabel, c.id) AS name,
       contexts, substring(firstContent.contentText, 0, 180) AS contentPreview, hasLesson
"""

_KNOWLEDGE_MAP_MAPPING_COUNTS = """
UNWIND $concept_ids AS concept_id
MATCH (c:Concept {id: concept_id})
OPTIONAL MATCH (c)
             -[:ONTOLOGY_MAPS_TO {reviewStatus: 'VERIFIED_MAPPING_V1'}]->(o:OntologyConcept)
RETURN c.id AS id, count(DISTINCT o) AS mappingCount
"""

# Ontology element IDs remain backend-only except for opaque IDs on ontology-only
# map nodes, which cannot navigate into app content.
_KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS = """
MATCH (focus:Concept)
      -[:ONTOLOGY_MAPS_TO {reviewStatus: 'VERIFIED_MAPPING_V1'}]->(focusOntology:OntologyConcept)
WHERE focus.id IN $concept_ids
OPTIONAL MATCH (prerequisiteOntology:OntologyConcept)-[:PREREQUISITE_OF]->(focusOntology)
OPTIONAL MATCH (focusOntology)-[:PREREQUISITE_OF]->(dependentOntology:OntologyConcept)
RETURN focus.id AS focusId,
       elementId(focusOntology) AS focusOntologyId,
       collect(DISTINCT CASE WHEN prerequisiteOntology IS NOT NULL THEN {
           id: elementId(prerequisiteOntology),
           name: coalesce(prerequisiteOntology.name, prerequisiteOntology.prefLabel)
       } END) AS prerequisites,
       collect(DISTINCT CASE WHEN dependentOntology IS NOT NULL THEN {
           id: elementId(dependentOntology),
           name: coalesce(dependentOntology.name, dependentOntology.prefLabel)
       } END) AS dependents
"""

_KNOWLEDGE_MAP_ONTOLOGY_CONCEPT_MAPPINGS = """
UNWIND $ontology_ids AS ontology_id
MATCH (o:OntologyConcept)
WHERE elementId(o) = ontology_id
OPTIONAL MATCH (c:Concept)
             -[:ONTOLOGY_MAPS_TO {reviewStatus: 'VERIFIED_MAPPING_V1'}]->(o)
RETURN ontology_id AS ontologyId,
       coalesce(o.name, o.prefLabel, elementId(o)) AS name,
       collect(DISTINCT c.id) AS conceptIds
"""

_STRUCTURED_LESSON = """
MATCH (c:Concept {id: $concept_id})
OPTIONAL MATCH (c)-[:BELONGS_TO_SUBJECT]->(s:Subject)
OPTIONAL MATCH (t:Topic)-[:HAS_CONCEPT]->(c)
OPTIONAL MATCH (p:Concept)-[:PREREQUISITE_OF]->(c)
OPTIONAL MATCH (r:Concept)-[:RELATED_TO]-(c)
OPTIONAL MATCH (lc:LearningContent)-[:HAS_CONTENT]->(c)
WITH c, s, t, collect(DISTINCT CASE WHEN p IS NOT NULL THEN {
    id: p.id,
    name: coalesce(p.name, p.prefLabel, p.id)
} END) AS prerequisites,
collect(DISTINCT CASE WHEN r IS NOT NULL THEN {
    id: r.id,
    name: coalesce(r.name, r.prefLabel, r.id)
} END) AS relatedConcepts,
collect(DISTINCT CASE WHEN lc IS NOT NULL THEN {
    id: lc.contentID,
    type: lc.type,
    title: lc.title,
    contentText: lc.contentText,
    contentData: lc.contentData,
    chapterOrder: lc.chapterOrder,
    order: lc.order
} END) AS lessons,
collect(DISTINCT CASE WHEN s IS NOT NULL AND t IS NOT NULL THEN {
    subjectId: s.id,
    topicId: t.id,
    topicOrder: t.order
} END) AS contexts
RETURN c.id AS id,
       coalesce(c.name, c.prefLabel, c.id) AS title,
       s.id AS subjectId,
       t.id AS topicId,
       coalesce(c.conceptOrder, c.order, 0) AS conceptOrder,
       coalesce(c.estimatedMinutes, 0) AS estimatedMinutes,
       prerequisites,
       relatedConcepts,
       lessons,
       contexts
LIMIT 1
"""

_STRUCTURED_QUESTION_COUNT = """
MATCH (q:Question)
WHERE (q)-[:ASSESSES_CONCEPT]->(:Concept {id: $concept_id})
   OR (q)-[:EXPECTS_CONCEPT]->(:Concept {id: $concept_id})
RETURN count(DISTINCT q) AS questionCount
"""

_SEARCH_CONCEPTS = """
MATCH (c:Concept)
WHERE toLower(coalesce(c.name, '')) CONTAINS $search_term
   OR toLower(coalesce(c.prefLabel, '')) CONTAINS $search_term
   OR toLower(coalesce(c.id, '')) CONTAINS $search_term
OPTIONAL MATCH (s:Subject)-[:HAS_TOPIC]->(t:Topic)-[:HAS_CONCEPT]->(c)
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
MATCH (:Subject {id: $subject_id})-[:HAS_TOPIC]->(:Topic)-[:HAS_CONCEPT]->(c:Concept)
MATCH (q:Question)-[:ASSESSES_CONCEPT]->(c)
RETURN DISTINCT q.questionID AS id, q.type AS type, q.questionText AS prompt,
       q.difficultyLevel AS difficultyLevel, q.options AS options, c.id AS conceptId
"""

_KNOWLEDGE_MAP_MAX_NODES = 40


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


def _normalize_match_text(value: Any) -> str:
    """Lowercase + collapse whitespace for conservative entity matching."""
    return " ".join(str(value or "").split()).strip().lower()


def _decode_json_payload(value: Any) -> Any:
    if value in (None, ""):
        return None
    if isinstance(value, (dict, list, int, float, bool)):
        return value
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


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
        rows = await self._read(_SEARCH_CONCEPTS, search_term=query.strip().lower(), limit=limit)
        for row in rows:
            row["contexts"] = [context for context in (row.get("contexts") or []) if context]
        return rows

    async def _knowledge_map_nodes(self, concept_ids: list[str]) -> list[dict[str, Any]]:
        if not concept_ids:
            return []
        rows = await self._read(_KNOWLEDGE_MAP_NODES, concept_ids=concept_ids)
        nodes: list[dict[str, Any]] = []
        for row in rows:
            contexts = [context for context in (row.get("contexts") or []) if context]
            nodes.append(
                {
                    "id": row["id"],
                    "name": row.get("name") or row["id"],
                    "type": "concept",
                    "subjectIds": list(
                        dict.fromkeys(
                            context.get("subjectId")
                            for context in contexts
                            if context.get("subjectId")
                        )
                    ),
                    "topicIds": list(
                        dict.fromkeys(
                            context.get("topicId")
                            for context in contexts
                            if context.get("topicId")
                        )
                    ),
                    "conceptOrder": contexts[0].get("conceptOrder") if contexts else None,
                    "contentPreview": row.get("contentPreview"),
                    "hasLesson": bool(row.get("hasLesson")),
                    "prerequisiteCount": None,
                    "dependentCount": None,
                }
            )
        return nodes

    async def _knowledge_map_mapping_counts(self, concept_ids: list[str]) -> dict[str, int]:
        if not concept_ids:
            return {}
        rows = await self._read(
            _KNOWLEDGE_MAP_MAPPING_COUNTS,
            concept_ids=list(dict.fromkeys(concept_ids)),
        )
        return {row["id"]: int(row.get("mappingCount") or 0) for row in rows}

    async def _knowledge_map_neighborhood(
        self,
        focus_ids: list[str],
        depth: int,
        allowed_concept_ids: set[str] | None = None,
        reserved_ids: set[str] | None = None,
    ) -> tuple[list[dict[str, str]], set[str], str, bool, dict[str, dict[str, Any]]]:
        visible_ids = set(focus_ids) | (reserved_ids or set())
        frontier = list(dict.fromkeys(focus_ids))
        visited: set[str] = set()
        edges: dict[tuple[str, str], dict[str, str]] = {}
        ontology_nodes: dict[str, dict[str, Any]] = {}
        incomplete_mapping = False
        mapped_any = False
        mapping_exists = False
        truncated = False

        for _level in range(depth):
            current = [concept_id for concept_id in frontier if concept_id not in visited]
            if not current:
                break
            visited.update(current)

            focus_mapping_counts = await self._knowledge_map_mapping_counts(current)
            mapping_exists = mapping_exists or any(
                count > 0 for count in focus_mapping_counts.values()
            )
            mapped_focus_ids = [
                concept_id
                for concept_id in current
                if focus_mapping_counts.get(concept_id, 0) > 0
            ]
            if any(focus_mapping_counts.get(concept_id, 0) == 0 for concept_id in current):
                incomplete_mapping = True
            if not mapped_focus_ids:
                continue
            mapped_any = True

            rows = await self._read(
                _KNOWLEDGE_MAP_DIRECT_ONTOLOGY_IDS,
                concept_ids=mapped_focus_ids,
            )
            ontology_ids = list(
                dict.fromkeys(
                    ontology_id
                    for row in rows
                    for ontology_id in (
                        [row.get("focusOntologyId")]
                        + [
                            ontology.get("id")
                            for ontology in (row.get("prerequisites") or [])
                        ]
                        + [
                            ontology.get("id")
                            for ontology in (row.get("dependents") or [])
                        ]
                    )
                    if ontology_id
                )
            )
            ontology_mappings: dict[str, list[str]] = {}
            if ontology_ids:
                mapping_rows = await self._read(
                    _KNOWLEDGE_MAP_ONTOLOGY_CONCEPT_MAPPINGS,
                    ontology_ids=ontology_ids,
                )
                ontology_mappings = {
                    row["ontologyId"]: [
                        concept_id for concept_id in (row.get("conceptIds") or []) if concept_id
                    ]
                    for row in mapping_rows
                }
                ontology_names = {
                    row["ontologyId"]: row.get("name") or row["ontologyId"]
                    for row in mapping_rows
                }
            else:
                ontology_names = {}

            def ontology_endpoint_ids(
                ontology_id: str,
                mappings: dict[str, list[str]] = ontology_mappings,
                names: dict[str, str] = ontology_names,
            ) -> list[str]:
                concept_ids = mappings.get(ontology_id, [])
                if concept_ids:
                    return concept_ids
                node_id = f"ontology:{ontology_id}"
                ontology_nodes[node_id] = {
                    "id": node_id,
                    "name": names.get(ontology_id, ontology_id),
                    "type": "ontology_only",
                    "subjectIds": [],
                    "topicIds": [],
                    "conceptOrder": None,
                    "contentPreview": None,
                    "hasLesson": False,
                    "prerequisiteCount": None,
                    "dependentCount": None,
                }
                return [node_id]

            def permitted_endpoint_ids(endpoint_ids: list[str]) -> list[str]:
                if allowed_concept_ids is None:
                    return endpoint_ids
                return [
                    endpoint_id
                    for endpoint_id in endpoint_ids
                    if endpoint_id.startswith("ontology:")
                    or endpoint_id in allowed_concept_ids
                ]

            next_frontier: list[str] = []

            def add_edges(
                source_ids: list[str],
                target_ids: list[str],
                frontier_ids: list[str] = next_frontier,
            ) -> None:
                nonlocal truncated
                for source in permitted_endpoint_ids(source_ids):
                    for target in permitted_endpoint_ids(target_ids):
                        if source == target:
                            continue
                        new_ids = {source, target} - visible_ids
                        if len(visible_ids) + len(new_ids) > _KNOWLEDGE_MAP_MAX_NODES:
                            truncated = True
                            continue
                        visible_ids.update((source, target))
                        edges[(source, target)] = {
                            "source": source,
                            "target": target,
                            "type": "PREREQUISITE_OF",
                        }
                        for endpoint_id in (source, target):
                            if (
                                not endpoint_id.startswith("ontology:")
                                and endpoint_id not in visited
                            ):
                                frontier_ids.append(endpoint_id)

            for row in rows:
                focus_endpoints = ontology_endpoint_ids(row["focusOntologyId"])
                for prerequisite in row.get("prerequisites") or []:
                    add_edges(
                        ontology_endpoint_ids(prerequisite["id"]),
                        focus_endpoints,
                    )
                for dependent in row.get("dependents") or []:
                    add_edges(
                        focus_endpoints,
                        ontology_endpoint_ids(dependent["id"]),
                    )
            frontier = list(dict.fromkeys(next_frontier))

        if not mapping_exists:
            status = "pending"
        elif not mapped_any:
            status = "partial"
        elif incomplete_mapping:
            status = "partial"
        else:
            status = "ready"
        ontology_nodes = {
            node_id: node
            for node_id, node in ontology_nodes.items()
            if node_id in visible_ids
        }
        return list(edges.values()), visible_ids, status, truncated, ontology_nodes

    async def knowledge_map_topic(
        self,
        topic_id: str,
        focus_id: str | None = None,
        depth: int = 1,
        include_connected_topics: bool = False,
    ) -> dict[str, Any] | None:
        rows = await self._read(_KNOWLEDGE_MAP_TOPIC, topic_id=topic_id)
        if not rows:
            return None
        topic = rows[0]
        concepts = [
            concept
            for concept in (topic.get("concepts") or [])
            if concept and concept.get("id")
        ]
        concept_ids = [concept["id"] for concept in concepts]
        if not concept_ids:
            return {
                "focusId": None,
                "subjectId": topic.get("subjectId"),
                "topicId": topic_id,
                "nodes": [],
                "edges": [],
                "mappingStatus": "pending",
                "mappingMessage": (
                    "No verified Concept–Ontology mapping is available for this topic yet."
                ),
                "depth": depth,
                "truncated": False,
            }

        truncated = len(concept_ids) > _KNOWLEDGE_MAP_MAX_NODES
        visible_topic_ids = concept_ids[:_KNOWLEDGE_MAP_MAX_NODES]
        if focus_id in concept_ids and focus_id not in visible_topic_ids:
            visible_topic_ids[-1] = focus_id
        selected_focus = focus_id if focus_id in visible_topic_ids else visible_topic_ids[0]
        topic_node_rows = await self._knowledge_map_nodes(visible_topic_ids)
        order_by_id = {concept["id"]: concept.get("order") for concept in concepts}
        for node in topic_node_rows:
            node["conceptOrder"] = order_by_id.get(node["id"], node["conceptOrder"])

        allowed_ids = None if include_connected_topics else set(visible_topic_ids)
        (
            edge_rows,
            neighborhood_ids,
            neighborhood_status,
            graph_truncated,
            ontology_nodes,
        ) = await self._knowledge_map_neighborhood(
            [selected_focus],
            depth,
            allowed_ids,
            set(visible_topic_ids),
        )
        graph_truncated = graph_truncated or truncated
        merged_nodes = {node["id"]: node for node in topic_node_rows}
        extra_ids = neighborhood_ids - set(merged_nodes)
        extra_concept_ids = sorted(
            node_id for node_id in extra_ids if not node_id.startswith("ontology:")
        )
        if include_connected_topics and extra_concept_ids:
            remaining = max(0, _KNOWLEDGE_MAP_MAX_NODES - len(merged_nodes))
            extra_nodes = await self._knowledge_map_nodes(extra_concept_ids[:remaining])
            merged_nodes.update({node["id"]: node for node in extra_nodes})
            remaining -= len(extra_nodes)
            graph_truncated = graph_truncated or len(extra_concept_ids) > len(extra_nodes)
        else:
            remaining = max(0, _KNOWLEDGE_MAP_MAX_NODES - len(merged_nodes))
        extra_ontology_ids = sorted(
            node_id for node_id in extra_ids if node_id.startswith("ontology:")
        )
        for node_id in extra_ontology_ids[:remaining]:
            merged_nodes[node_id] = ontology_nodes[node_id]
        graph_truncated = graph_truncated or len(extra_ontology_ids) > remaining

        edge_rows = [
            edge
            for edge in edge_rows
            if edge["source"] in merged_nodes and edge["target"] in merged_nodes
        ]
        topic_mapping_counts = await self._knowledge_map_mapping_counts(visible_topic_ids)
        mapped_count = sum(count > 0 for count in topic_mapping_counts.values())
        mapping_found_count = sum(count > 0 for count in topic_mapping_counts.values())
        if mapping_found_count == 0:
            mapping_status = "pending"
        elif (
            mapped_count < len(visible_topic_ids)
            or neighborhood_status != "ready"
        ):
            mapping_status = "partial"
        else:
            mapping_status = "ready"

        return {
            "focusId": selected_focus,
            "subjectId": topic.get("subjectId"),
            "topicId": topic_id,
            "nodes": list(merged_nodes.values()),
            "edges": edge_rows,
            "mappingStatus": mapping_status,
            "mappingMessage": self._knowledge_map_message(mapping_status),
            "depth": depth,
            "truncated": graph_truncated,
        }

    async def knowledge_map_concept(
        self,
        concept_id: str,
        depth: int = 1,
        topic_id: str | None = None,
        include_connected_topics: bool = True,
    ) -> dict[str, Any] | None:
        focus_nodes = await self._knowledge_map_nodes([concept_id])
        if not focus_nodes:
            return None
        focus = focus_nodes[0]
        allowed_ids = None
        if topic_id and not include_connected_topics:
            topic_rows = await self._read(_KNOWLEDGE_MAP_TOPIC, topic_id=topic_id)
            if topic_rows:
                allowed_ids = {
                    item["id"]
                    for item in (topic_rows[0].get("concepts") or [])
                    if item and item.get("id")
                }
            else:
                allowed_ids = {concept_id}
        edge_rows, visible_ids, mapping_status, truncated, ontology_nodes = (
            await self._knowledge_map_neighborhood([concept_id], depth, allowed_ids)
        )
        node_ids = [node_id for node_id in visible_ids if not node_id.startswith("ontology:")]
        nodes = await self._knowledge_map_nodes(node_ids)
        nodes_by_id = {node["id"]: node for node in nodes}
        nodes_by_id.update(ontology_nodes)
        edge_rows = [
            edge
            for edge in edge_rows
            if edge["source"] in nodes_by_id and edge["target"] in nodes_by_id
        ]
        if mapping_status == "ready":
            focus["prerequisiteCount"] = sum(edge["target"] == concept_id for edge in edge_rows)
            focus["dependentCount"] = sum(edge["source"] == concept_id for edge in edge_rows)
            nodes_by_id[concept_id] = focus
        return {
            "focusId": concept_id,
            "subjectId": focus["subjectIds"][0] if focus["subjectIds"] else None,
            "topicId": topic_id
            if topic_id and topic_id in focus["topicIds"]
            else (focus["topicIds"][0] if focus["topicIds"] else None),
            "nodes": list(nodes_by_id.values()),
            "edges": edge_rows,
            "mappingStatus": mapping_status,
            "mappingMessage": self._knowledge_map_message(mapping_status),
            "depth": depth,
            "truncated": truncated,
        }

    @staticmethod
    def _knowledge_map_message(mapping_status: str) -> str | None:
        if mapping_status == "pending":
            return "No verified Concept–Ontology mapping is available for this concept yet."
        if mapping_status == "partial":
            return (
                "Some canonical Concepts in this map lack a verified ontology mapping. "
                "Unmapped ontology nodes may still appear."
            )
        return None

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

    async def get_structured_lesson(self, concept_id: str) -> dict[str, Any] | None:
        """Return a v3 lesson payload assembled from graph content nodes."""
        rows = await self._read(_STRUCTURED_LESSON, concept_id=concept_id)
        if not rows:
            return None

        row = rows[0]
        lessons = row.get("lessons") or []
        if not lessons:
            return None

        contexts = row.get("contexts") or []
        context = contexts[0] if contexts else {}
        concept = {
            "id": row.get("id") or concept_id,
            "title": row.get("title"),
            "subjectId": row.get("subjectId") or context.get("subjectId"),
            "topicId": row.get("topicId") or context.get("topicId"),
            "order": row.get("conceptOrder") or 0,
            "estimatedMinutes": row.get("estimatedMinutes") or 0,
        }

        question_rows = await self._read(_STRUCTURED_QUESTION_COUNT, concept_id=concept_id)
        question_count = int((question_rows[0] or {}).get("questionCount", 0) or 0)

        lesson: dict[str, Any] = {
            "concept": concept,
            "contexts": contexts,
            "prerequisites": row.get("prerequisites") or [],
            "relatedConcepts": row.get("relatedConcepts") or [],
            "practiceAvailable": question_count > 0,
            "questionCount": question_count,
        }

        content_by_type: dict[str, list[Any]] = {
            "learning_objective": [],
            "prerequisite_note": [],
            "definition": [],
            "explanation": [],
            "key_term": [],
            "illustration": [],
            "worked_example": [],
            "real_world_application": [],
            "common_mistake": [],
            "summary": [],
        }

        for item in lessons:
            item_type = str(item.get("type") or "").strip().lower()
            if item_type not in content_by_type:
                content_by_type.setdefault(item_type, [])
            payload = _decode_json_payload(item.get("contentData"))
            if item_type == "key_term":
                if isinstance(payload, dict):
                    content_by_type[item_type].append(
                        {"term": payload.get("term") or item.get("title"), "definition": payload.get("definition") or item.get("contentText")}
                    )
                else:
                    content_by_type[item_type].append(
                        {"term": item.get("title"), "definition": item.get("contentText")}
                    )
            elif item_type in {"illustration", "worked_example"}:
                if isinstance(payload, dict):
                    content_by_type[item_type].append(payload)
                elif item.get("contentText") is not None:
                    content_by_type[item_type].append({"text": item.get("contentText")})
            else:
                if item.get("contentText"):
                    content_by_type[item_type].append(item.get("contentText"))

        lesson["learningObjectives"] = content_by_type["learning_objective"]
        lesson["prerequisiteNotes"] = content_by_type["prerequisite_note"]
        lesson["definitions"] = content_by_type["definition"]
        lesson["explanations"] = content_by_type["explanation"]
        lesson["keyTerms"] = content_by_type["key_term"]
        lesson["illustrations"] = content_by_type["illustration"]
        lesson["workedExamples"] = content_by_type["worked_example"]
        lesson["realWorldApplications"] = content_by_type["real_world_application"]
        lesson["commonMistakes"] = content_by_type["common_mistake"]
        lesson["summary"] = content_by_type["summary"][0] if content_by_type["summary"] else None

        return lesson

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
