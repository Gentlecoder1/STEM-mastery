import type { ColorToken, SubjectId } from '../theme';

export const QUIZ_PASS_RATIO = 0.6;

export const CONTENT_TYPES = [
  'DEFINITION',
  'EXPLANATION',
  'FORMULA',
  'WORKED_EXAMPLE',
  'MEDIA',
  'QUESTION',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export type LearningContent = {
  id: string;
  conceptId: string;
  title: string;
  contentText: string;
  contentType: ContentType;
  chapterOrder: number;
  mediaURI: string | null;
};

export type QuizOption = {
  id: string;
  label: string;
  text: string;
};

export type QuizQuestion = {
  type: 'mcq' | 'written';
  prompt: string;
  options?: readonly QuizOption[];
  answerId?: string;
  explanation: string;
  hint?: string;
};

export type Concept = {
  id: string;
  topicId: string;
  subjectId: SubjectId;
  title: string;
  definition: string;
  whyItMatters: string;
  prerequisites: readonly string[];
  related: readonly string[];
  tint: ColorToken;
  soft: ColorToken;
  content: readonly LearningContent[];
  quiz: readonly QuizQuestion[];
};

function ordered(content: readonly Omit<LearningContent, 'chapterOrder'>[]): LearningContent[] {
  return [...content]
    .sort((a, b) => CONTENT_TYPES.indexOf(a.contentType) - CONTENT_TYPES.indexOf(b.contentType))
    .map((item, index) => ({ ...item, chapterOrder: index + 1 }));
}

export const CONCEPTS: readonly Concept[] = [
  {
    id: 'concept-displacement',
    topicId: 'topic-speed-velocity',
    subjectId: 'physics',
    title: 'Distance and displacement',
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
    quiz: [
      {
        type: 'mcq',
        prompt: 'Which quantity is a vector?',
        options: [
          { id: 'a', label: 'A', text: 'Distance' },
          { id: 'b', label: 'B', text: 'Displacement' },
          { id: 'c', label: 'C', text: 'Time' },
          { id: 'd', label: 'D', text: 'Mass' },
        ],
        answerId: 'b',
        explanation: 'Displacement has both magnitude and direction, so it is a vector.',
      },
      {
        type: 'mcq',
        prompt: 'You walk 3 m east then 4 m north. What is your displacement?',
        options: [
          { id: 'a', label: 'A', text: '7 m' },
          { id: 'b', label: 'B', text: '5 m' },
          { id: 'c', label: 'C', text: '1 m' },
          { id: 'd', label: 'D', text: '12 m' },
        ],
        answerId: 'b',
        explanation: 'Displacement is the straight line from start to finish: √(3² + 4²) = 5 m.',
      },
    ],
  },
  {
    id: 'concept-velocity',
    topicId: 'topic-speed-velocity',
    subjectId: 'physics',
    title: 'Velocity',
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
    quiz: [
      {
        type: 'mcq',
        prompt: 'Which statement best describes velocity?',
        options: [
          { id: 'a', label: 'A', text: 'How far an object travels' },
          { id: 'b', label: 'B', text: 'Speed in a particular direction' },
          { id: 'c', label: 'C', text: 'The time taken to travel' },
          { id: 'd', label: 'D', text: 'The size of an object' },
        ],
        answerId: 'b',
        explanation: 'Velocity is a vector quantity: it describes how fast something moves and in which direction.',
      },
      {
        type: 'mcq',
        prompt: 'A runner covers 100 m east in 20 s. What is their velocity?',
        options: [
          { id: 'a', label: 'A', text: '5 m/s east' },
          { id: 'b', label: 'B', text: '20 m/s east' },
          { id: 'c', label: 'C', text: '0.2 m/s east' },
          { id: 'd', label: 'D', text: '100 m/s east' },
        ],
        answerId: 'a',
        explanation: 'v = displacement / time = 100 / 20 = 5 m/s east.',
      },
    ],
  },
  {
    id: 'concept-displacement-graphs',
    topicId: 'topic-speed-velocity',
    subjectId: 'physics',
    title: 'Displacement–time graphs',
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
    quiz: [
      {
        type: 'mcq',
        prompt: 'On a displacement–time graph, what does the gradient represent?',
        options: [
          { id: 'a', label: 'A', text: 'Acceleration' },
          { id: 'b', label: 'B', text: 'Velocity' },
          { id: 'c', label: 'C', text: 'Distance' },
          { id: 'd', label: 'D', text: 'Time' },
        ],
        answerId: 'b',
        explanation: 'The gradient (slope) of a displacement–time graph is the velocity.',
      },
      {
        type: 'mcq',
        prompt: 'Two lines are drawn on a displacement–time graph. The steeper one represents an object that is…',
        options: [
          { id: 'a', label: 'A', text: 'Slower' },
          { id: 'b', label: 'B', text: 'Faster' },
          { id: 'c', label: 'C', text: 'At rest' },
          { id: 'd', label: 'D', text: 'Moving backwards' },
        ],
        answerId: 'b',
        explanation: 'A steeper gradient means a greater velocity, so the object is faster.',
      },
    ],
  },
  {
    id: 'concept-acceleration',
    topicId: 'topic-speed-velocity',
    subjectId: 'physics',
    title: 'Acceleration',
    definition: 'Acceleration is the rate of change of velocity with respect to time.',
    whyItMatters:
      'Acceleration connects motion to force — it is the bridge from pure kinematics into dynamics.',
    prerequisites: ['Velocity', 'Displacement–time graphs'],
    related: ['Forces', 'Direction'],
    tint: 'orange',
    soft: 'orangeSoft',
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
      {
        id: 'c-accel-check',
        conceptId: 'concept-acceleration',
        title: 'Quick check',
        contentText: 'A car speeds up from 0 to 20 m/s in 4 s. What is its acceleration?',
        contentType: 'QUESTION',
        mediaURI: null,
      },
    ]),
    quiz: [
      {
        type: 'mcq',
        prompt: 'What does acceleration measure?',
        options: [
          { id: 'a', label: 'A', text: 'The rate of change of velocity' },
          { id: 'b', label: 'B', text: 'The distance travelled' },
          { id: 'c', label: 'C', text: 'The total time taken' },
          { id: 'd', label: 'D', text: 'The direction of motion' },
        ],
        answerId: 'a',
        explanation: 'Acceleration is the rate of change of velocity with time.',
      },
      {
        type: 'mcq',
        prompt: 'A car speeds up from 0 to 20 m/s in 4 s. What is its acceleration?',
        options: [
          { id: 'a', label: 'A', text: '5 m/s²' },
          { id: 'b', label: 'B', text: '80 m/s²' },
          { id: 'c', label: 'C', text: '0.2 m/s²' },
          { id: 'd', label: 'D', text: '24 m/s²' },
        ],
        answerId: 'a',
        explanation: 'a = Δv / t = (20 − 0) / 4 = 5 m/s².',
      },
    ],
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

export function getTopicConcepts(topicId: string): readonly Concept[] {
  return CONCEPTS.filter((concept) => concept.topicId === topicId);
}

export function getTopicConceptIds(topicId: string): readonly string[] {
  return getTopicConcepts(topicId).map((concept) => concept.id);
}

export function getPreviousConcept(conceptId: string): Concept | undefined {
  const concept = getConcept(conceptId);
  if (!concept) return undefined;
  const sameTopic = getTopicConcepts(concept.topicId);
  const index = sameTopic.findIndex((item) => item.id === conceptId);
  return index > 0 ? sameTopic[index - 1] : undefined;
}

export function getNextConcept(conceptId: string): Concept | undefined {
  const concept = getConcept(conceptId);
  if (!concept) return undefined;
  const sameTopic = getTopicConcepts(concept.topicId);
  const index = sameTopic.findIndex((item) => item.id === conceptId);
  return index >= 0 && index < sameTopic.length - 1 ? sameTopic[index + 1] : undefined;
}

export function getConceptQuiz(conceptId: string): readonly QuizQuestion[] {
  return getConcept(conceptId)?.quiz ?? [];
}

export const CONTENT_LABELS: Record<ContentType, string> = {
  DEFINITION: 'Definition',
  EXPLANATION: 'Explanation',
  FORMULA: 'Formula',
  WORKED_EXAMPLE: 'Worked example',
  MEDIA: 'Diagram',
  QUESTION: 'Quick check',
};
