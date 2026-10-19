STEM V3 LESSON CONTENT SEEDER
=============================

FILES
-----
1. seed_v3_lessons_neo4j.py
2. STEM_V3_Lesson_Content_First4.json

WHAT IT DOES
------------
- Verifies the 90 V3 Concept IDs already exist in Neo4j.
- Verifies each concept is linked to the expected topic.
- Clears prior lesson content from those 90 V3 concepts by default.
- Seeds structured LearningContent nodes from the combined JSON.
- Updates topic overview metadata and concept estimatedMinutes.
- Does NOT create or alter PREREQUISITE_OF / RELATED_TO relationships.
- Does NOT seed exercises/questions. Those should be seeded separately as Question nodes.

EXPECTED CONTENT TOTAL
----------------------
3126 LearningContent nodes from the current 90 lessons.

CONTENT TYPES CREATED
---------------------
learning_objective
prerequisite_note
definition
explanation
key_term
illustration
worked_example
real_world_application
common_mistake
summary

Nested structures such as key terms, tables and worked examples are preserved in the
LearningContent.contentData property as JSON. A readable contentText fallback is also stored.

RUN FROM PROJECT ROOT (WINDOWS POWERSHELL)
------------------------------------------
Place both files in a folder called seed_v3_lessons at the project root, then run:

python .\seed_v3_lessons\seed_v3_lessons_neo4j.py --env-file .\backend\.env

If your Python launcher is py:

py .\seed_v3_lessons\seed_v3_lessons_neo4j.py --env-file .\backend\.env

If neo4j package is missing:

python -m pip install neo4j

EXPECTED BEHAVIOUR
------------------
- Connects using STEM_NEO4J_URI, STEM_NEO4J_USER, STEM_NEO4J_PASSWORD,
  STEM_NEO4J_DATABASE from backend/.env.
- Never prints credentials.
- Exits non-zero if the V3 structure is missing/mismatched or QA fails.
- Idempotent for this dataset: rerunning replaces lesson content on the 90 V3 concepts
  and recreates it from the JSON.

IMPORTANT BACKEND FETCH ORDER
-----------------------------
When graph.py is updated, order LearningContent by BOTH section and item order:

ORDER BY coalesce(lc.chapterOrder, 0), coalesce(lc.order, 0), lc.contentID

Do not order only by coalesce(lc.chapterOrder, lc.order, 0), because that ignores item
order whenever chapterOrder exists.
