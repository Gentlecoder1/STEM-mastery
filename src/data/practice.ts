export type QuestionType = 'mcq' | 'written';

export type GraphVariant = 'flat' | 'slope' | 'curved' | 'down';

export type PracticeOption = {
  id: string;
  label: string;
  text: string;
};

export type PracticeQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  xp: number;
  graph?: GraphVariant;
  options?: readonly PracticeOption[];
  answerId?: string;
  marks?: number;
  hint?: string;
  explanation: string;
  concept: string;
  masteryBefore: number;
  masteryAfter: number;
};

export const PRACTICE_SET_SIZE = 8;

export const PRACTICE_QUESTIONS: readonly PracticeQuestion[] = [
  {
    id: 'pq-flat',
    type: 'mcq',
    prompt:
      'Which statement best describes a horizontal (flat) section on a displacement–time graph?',
    xp: 10,
    graph: 'flat',
    options: [
      { id: 'a', label: 'A', text: 'The object is speeding up' },
      { id: 'b', label: 'B', text: 'The object is at rest' },
      { id: 'c', label: 'C', text: 'The object is changing direction' },
      { id: 'd', label: 'D', text: 'The object is moving at constant speed' },
    ],
    answerId: 'b',
    explanation:
      'On a displacement–time graph, a zero slope means zero velocity, so the object stays in one place.',
    concept: 'Reading the graph',
    masteryBefore: 62,
    masteryAfter: 66,
  },
  {
    id: 'pq-steeper',
    type: 'mcq',
    prompt: 'A steeper line on a displacement–time graph means the object is…',
    xp: 10,
    graph: 'slope',
    options: [
      { id: 'a', label: 'A', text: 'Slowing down' },
      { id: 'b', label: 'B', text: 'Moving faster' },
      { id: 'c', label: 'C', text: 'At rest' },
      { id: 'd', label: 'D', text: 'Moving at constant velocity' },
    ],
    answerId: 'b',
    explanation:
      'The gradient of a displacement–time graph equals velocity. A bigger gradient means greater velocity.',
    concept: 'Reading the graph',
    masteryBefore: 63,
    masteryAfter: 67,
  },
  {
    id: 'pq-curving',
    type: 'mcq',
    prompt: 'An upward-curving (getting steeper) motion line shows an object that is…',
    xp: 10,
    graph: 'curved',
    options: [
      { id: 'a', label: 'A', text: 'Accelerating' },
      { id: 'b', label: 'B', text: 'At rest' },
      { id: 'c', label: 'C', text: 'Moving at constant velocity' },
      { id: 'd', label: 'D', text: 'Decelerating to a stop' },
    ],
    answerId: 'a',
    explanation:
      'An increasing gradient means velocity is increasing over time — that is acceleration.',
    concept: 'Slope to acceleration',
    masteryBefore: 60,
    masteryAfter: 65,
  },
  {
    id: 'pq-flat-section',
    type: 'mcq',
    prompt: 'What does the flat section of this displacement-time graph show?',
    xp: 10,
    graph: 'flat',
    options: [
      { id: 'a', label: 'A', text: 'The object is speeding up' },
      { id: 'b', label: 'B', text: 'The object is at rest' },
      { id: 'c', label: 'C', text: 'The object is moving backwards' },
      { id: 'd', label: 'D', text: 'The object has constant velocity' },
    ],
    answerId: 'b',
    explanation:
      'On a displacement–time graph, slope represents velocity. Zero slope means zero velocity.',
    concept: 'Graph interpretation',
    masteryBefore: 68,
    masteryAfter: 72,
  },
  {
    id: 'pq-down',
    type: 'mcq',
    prompt: 'A downward-sloping line on a displacement–time graph indicates the object is…',
    xp: 10,
    graph: 'down',
    options: [
      { id: 'a', label: 'A', text: 'Moving faster' },
      { id: 'b', label: 'B', text: 'Moving back towards the start' },
      { id: 'c', label: 'C', text: 'At rest' },
      { id: 'd', label: 'D', text: 'Accelerating' },
    ],
    answerId: 'b',
    explanation:
      'A negative gradient means displacement is decreasing, so the object is returning toward its start.',
    concept: 'Reading the graph',
    masteryBefore: 64,
    masteryAfter: 68,
  },
  {
    id: 'pq-accelerating-explanation',
    type: 'written',
    prompt:
      'Explain how you can tell that an object is accelerating from a displacement-time graph.',
    xp: 20,
    marks: 4,
    hint: 'Think about how the steepness of the line changes over time.',
    explanation:
      'The object is accelerating when the graph gets steeper because its displacement changes more in the same amount of time. A changing slope means changing velocity — and changing velocity over time is acceleration.',
    concept: 'From slope to acceleration',
    masteryBefore: 58,
    masteryAfter: 65,
  },
  {
    id: 'pq-accel-def',
    type: 'mcq',
    prompt: 'Velocity changes. Acceleration describes…',
    xp: 10,
    options: [
      { id: 'a', label: 'A', text: 'How fast the object is moving' },
      { id: 'b', label: 'B', text: 'The rate of change of velocity' },
      { id: 'c', label: 'C', text: 'The direction of motion' },
      { id: 'd', label: 'D', text: 'Distance travelled per second' },
    ],
    answerId: 'b',
    explanation:
      'Acceleration is how quickly velocity changes: a = Δv / t.',
    concept: 'Understanding acceleration',
    masteryBefore: 66,
    masteryAfter: 70,
  },
  {
    id: 'pq-steeper-curve-speed',
    type: 'mcq',
    prompt: 'A steepening curve means the slope is increasing, so … is also increasing.',
    xp: 10,
    options: [
      { id: 'a', label: 'A', text: 'Time' },
      { id: 'b', label: 'B', text: 'Displacement' },
      { id: 'c', label: 'C', text: 'Velocity' },
      { id: 'd', label: 'D', text: 'Nothing' },
    ],
    answerId: 'c',
    explanation:
      'Slope equals velocity, so as the slope grows, velocity grows with it.',
    concept: 'Slope to acceleration',
    masteryBefore: 67,
    masteryAfter: 71,
  },
];

export function getPracticeQuestion(index: number): PracticeQuestion | undefined {
  return PRACTICE_QUESTIONS[index];
}

export const PRACTICE_SET_TOTAL_MASTERY_BEFORE = 68;
export const PRACTICE_SET_TOTAL_MASTERY_AFTER = 72;