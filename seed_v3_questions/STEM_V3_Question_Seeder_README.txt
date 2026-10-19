STEM V3 QUESTION SEEDER — FIRST 4 TOPICS PER SUBJECT
====================================================

WHAT THIS PACKAGE DOES
----------------------
Seeds questions for the 90 V3 concepts already present in Neo4j AuraDB.

Dataset:
- 12 topics
- 90 concepts
- 450 questions total
- 360 MultipleChoiceQuestion (80%)
- 90 TheoreticalQuestion / open-response (20%)
- exactly 5 questions per concept

SOURCE
------
The questions come from the exercises[] arrays in the 12 V3 lesson JSON files.
For each concept:
- exercises 1–4 are converted to 4-option MCQs
- exercise 5 remains open-response and is stored using the existing
  TheoreticalQuestion label/schema

The correct answer and solution remain grounded in the source JSON.
MCQ distractors were generated from source-context alternatives and deterministic
answer transformations, so verificationStatus is set to
SOURCE_DERIVED_REVIEW_RECOMMENDED.

RUN FROM THE PROJECT ROOT
-------------------------
python .\seed_v3_questions\seed_v3_questions_neo4j.py --env-file .\backend\.env

or, if Windows uses the Python launcher:
py .\seed_v3_questions\seed_v3_questions_neo4j.py --env-file .\backend\.env

If the neo4j package is missing:
python -m pip install neo4j

ENVIRONMENT VARIABLES
---------------------
The script reads your existing backend/.env:
STEM_NEO4J_URI
STEM_NEO4J_USER
STEM_NEO4J_PASSWORD
STEM_NEO4J_DATABASE

Do not paste credentials into the script.

REPLACEMENT BEHAVIOUR
---------------------
Default behaviour clears active ASSESSES_CONCEPT / EXPECTS_CONCEPT links on the
90 V3 concepts before inserting this clean question set. It does not touch topics,
concepts, LearningContent, PREREQUISITE_OF, or RELATED_TO.

Use --no-replace only if you intentionally want to keep old active question links.

EXPECTED FINAL QA
-----------------
Total questions: 450/450
MCQ: 360/360
Theory/open response: 90/90
Concepts covered: 90/90
Concepts not having exactly 5 questions: 0
Malformed MCQs: 0
Theory questions missing reference answer: 0
Orphan seeded questions: 0
Duplicate question IDs: 0

SECURITY / APP BEHAVIOUR
------------------------
Before the learner submits an answer, the public question payload must NOT expose:
- correctOption
- correctAnswer
- referenceAnswer
- expectedNumericAnswer
- solution

After submission, the backend grading endpoint may use these fields server-side and
return the feedback needed by the app (for example correct=false,
selectedOption='b', correctOption='c', explanation='...').

NOTE ON "THEORETICALQUESTION"
-----------------------------
The source JSON exercises are all short_answer items. To preserve the requested
80/20 architecture, one source exercise per concept is kept as an open-response
question under the project's existing TheoreticalQuestion label. Some are
calculation/open-response items rather than essay-style theory questions. This is
intentional and preserves source fidelity. These can later be expanded with more
pure explanatory theory questions if required.
