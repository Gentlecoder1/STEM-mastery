import type { ColorToken } from '../theme';

export const CONTENT_TYPES = [
  'DEFINITION',
  'EXPLANATION',
  'FORMULA',
  'WORKED_EXAMPLE',
  'MEDIA',
  'QUESTION',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export type ConceptState = 'done' | 'current' | 'next' | 'locked';

export type LearningContent = {
  id: string;
  conceptId: string;
  title: string;
  contentText: string;
  contentType: ContentType;
  chapterOrder: number;
  mediaURI: string | null;
};

export type Concept = {
  id: string;
  topicId: string;
  title: string;
  mastery: number;
  state: ConceptState;
  definition: string;
  whyItMatters: string;
  prerequisites: readonly string[];
  related: readonly string[];
  tint: ColorToken;
  soft: ColorToken;
  content: readonly LearningContent[];
};

function ordered(content: readonly Omit<LearningContent, 'chapterOrder'>[]): LearningContent[] {
  return [...content]
    .sort((a, b) => CONTENT_TYPES.indexOf(a.contentType) - CONTENT_TYPES.indexOf(b.contentType))
    .map((item, index) => ({ ...item, chapterOrder: index + 1 }));
}

export const CONCEPTS: readonly Concept[] = [
  {
    id: 'concept-velocity',
    topicId: 'topic-speed-velocity',
    title: 'Velocity',
    mastery: 68,
    state: 'current',
    definition: 'Velocity is the rate of change of displacement with respect to time.',
    whyItMatters:
      'Velocity is what separates physics from guesswork. Once a learner can track direction as well as magnitude, every later topic — acceleration, forces, momentum — builds on a foundation they actually own.',
    prerequisites: ['Displacement', 'Speed'],
    related: ['Direction', 'Acceleration'],
    tint: 'blue',
    soft: 'blueSoft',
    content: ordered([
      {
        id: 'c-velocity-def',
        conceptId: 'concept-velocity',
        title: 'Definition',
        contentText: 'Velocity is the rate of change of displacement with respect to time.',
        contentType: 'DEFINITION',
        mediaURI: null,
      },
      {
        id: 'c-velocity-formula',
        conceptId: 'concept-velocity',
        title: 'Formula',
        contentText: 'v = displacement / time',
        contentType: 'FORMULA',
        mediaURI: null,
      },
      {
        id: 'c-velocity-direction',
        conceptId: 'concept-velocity',
        title: 'Why direction matters',
        contentText:
          'Unlike speed, velocity includes direction. A car travelling at 60 km/h north and one travelling at 60 km/h south have the same speed but opposite velocities.',
        contentType: 'EXPLANATION',
        mediaURI: null,
      },
      {
        id: 'c-velocity-example-1',
        conceptId: 'concept-velocity',
        title: 'Worked example 1',
        contentText:
          'A runner covers 100 m east in 20 s. Displacement is 100 m, so v = 100 / 20 = 5 m/s east.',
        contentType: 'WORKED_EXAMPLE',
        mediaURI: null,
      },
      {
        id: 'c-velocity-graph',
        conceptId: 'concept-velocity',
        title: 'Distance–time graph',
        contentText:
          'A straight sloping line on a distance–time graph means constant speed. The steeper the slope, the greater the velocity.',
        contentType: 'MEDIA',
        mediaURI: 'asset://graphs/distance-time-velocity',
      },
      {
        id: 'c-velocity-example-2',
        conceptId: 'concept-velocity',
        title: 'Worked example 2',
        contentText:
          'If displacement is −40 m over 8 s, velocity is −5 m/s. The negative sign shows motion in the opposite direction to the chosen positive.',
        contentType: 'WORKED_EXAMPLE',
        mediaURI: null,
      },
      {
        id: 'c-velocity-check',
        conceptId: 'concept-velocity',
        title: 'Quick check',
        contentText:
          'A body returns to its starting point after a lap. Is its average speed zero? Is its average velocity zero?',
        contentType: 'QUESTION',
        mediaURI: null,
      },
    ]),
  },
  {
    id: 'concept-displacement',
    topicId: 'topic-speed-velocity',
    title: 'Distance and displacement',
    mastery: 92,
    state: 'done',
    definition: 'Distance is the total path length covered; displacement is the straight-line change in position.',
    whyItMatters:
      'Learners who blur distance and displacement cannot compute velocity correctly. This is the most common source of sign errors later on.',
    prerequisites: ['Position', 'Time'],
    related: ['Speed', 'Velocity'],
    tint: 'green',
    soft: 'greenSoft',
    content: ordered([
      {
        id: 'c-disp-def',
        conceptId: 'concept-displacement',
        title: 'Definition',
        contentText:
          'Distance is scalar and never decreases. Displacement is a vector: magnitude with direction.',
        contentType: 'DEFINITION',
        mediaURI: null,
      },
      {
        id: 'c-disp-example',
        conceptId: 'concept-displacement',
        title: 'Worked example',
        contentText:
          'Walk 3 m east then 4 m north. Distance travelled is 7 m; displacement is 5 m northeast.',
        contentType: 'WORKED_EXAMPLE',
        mediaURI: null,
      },
      {
        id: 'c-disp-check',
        conceptId: 'concept-displacement',
        title: 'Quick check',
        contentText: 'Can displacement ever be greater than distance? Explain your answer.',
        contentType: 'QUESTION',
        mediaURI: null,
      },
    ]),
  },
  {
    id: 'concept-displacement-graphs',
    topicId: 'topic-speed-velocity',
    title: 'Displacement–time graphs',
    mastery: 43,
    state: 'next',
    definition: 'A displacement–time graph shows where an object is and how that position changes over time.',
    whyItMatters:
      'Reading slope off a graph is the skill that turns kinematics from arithmetic into interpretation.',
    prerequisites: ['Displacement', 'Velocity'],
    related: ['Acceleration'],
    tint: 'violet',
    soft: 'violetSoft',
    content: ordered([
      {
        id: 'c-graph-def',
        conceptId: 'concept-displacement-graphs',
        title: 'Definition',
        contentText: 'The gradient of a displacement–time graph equals velocity.',
        contentType: 'DEFINITION',
        mediaURI: null,
      },
      {
        id: 'c-graph-media',
        conceptId: 'concept-displacement-graphs',
        title: 'Reading the gradient',
        contentText: 'Compare the slope of two segments to compare velocities.',
        contentType: 'MEDIA',
        mediaURI: 'asset://graphs/displacement-time-gradient',
      },
      {
        id: 'c-graph-check',
        conceptId: 'concept-displacement-graphs',
        title: 'Quick check',
        contentText: 'Which line on the graph represents the faster object?',
        contentType: 'QUESTION',
        mediaURI: null,
      },
    ]),
  },
  {
    id: 'concept-acceleration',
    topicId: 'topic-speed-velocity',
    title: 'Acceleration',
    mastery: 0,
    state: 'locked',
    definition: 'Acceleration is the rate of change of velocity with respect to time.',
    whyItMatters:
      'Acceleration connects motion to force — it is the bridge from pure kinematics into dynamics.',
    prerequisites: ['Velocity', 'Displacement–time graphs'],
    related: ['Forces', 'Direction'],
    tint: 'slate',
    soft: 'canvas',
    content: ordered([
      {
        id: 'c-accel-def',
        conceptId: 'concept-acceleration',
        title: 'Definition',
        contentText: 'a = (final velocity − initial velocity) / time taken',
        contentType: 'DEFINITION',
        mediaURI: null,
      },
      {
        id: 'c-accel-formula',
        conceptId: 'concept-acceleration',
        title: 'Formula',
        contentText: 'a = Δv / t',
        contentType: 'FORMULA',
        mediaURI: null,
      },
    ]),
  },
] as const;

export function getConcept(conceptId: string): Concept | undefined {
  return CONCEPTS.find((concept) => concept.id === conceptId);
}

export function getConceptContent(conceptId: string): readonly LearningContent[] {
  const concept = getConcept(conceptId);
  if (!concept) return [];
  return [...concept.content].sort((a, b) => a.chapterOrder - b.chapterOrder);
}

export const CONTENT_LABELS: Record<ContentType, string> = {
  DEFINITION: 'Definition',
  EXPLANATION: 'Explanation',
  FORMULA: 'Formula',
  WORKED_EXAMPLE: 'Worked example',
  MEDIA: 'Diagram',
  QUESTION: 'Quick check',
};