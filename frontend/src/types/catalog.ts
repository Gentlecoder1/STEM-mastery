import type { ColorToken, SubjectId, ThemeColors } from '../theme';
import { colors } from '../theme';

export const QUIZ_PASS_RATIO = 0.6;

export type LessonValue =
  | string
  | number
  | boolean
  | null
  | LessonValue[]
  | { [key: string]: LessonValue };

export type QuizOption = {
  id: string;
  label: string;
  text: string;
};

/** A quiz question as delivered to the client: answer keys are withheld. */
export type QuizQuestion = {
  id: string;
  type: 'mcq' | 'written';
  prompt: string;
  options?: readonly QuizOption[];
  hint?: string | null;
};

/** App-facing concept shape used by the screens (mirrors the old mock type). */
export type Concept = {
  id: string;
  /**
   * A concept can live under more than one topic, so membership is an array
   * sourced from Neo4j's HAS_CONCEPT relationships. No single topic is
   * authoritative.
   */
  topicIds: string[];
  subjectIds: string[];
  title: string;
  definition: string;
  prerequisites: readonly string[];
  related: readonly string[];
  prerequisiteIds: readonly string[];
  relatedConceptIds: readonly string[];
  /** Whether the graph holds lesson sections — the payload lives in the lesson cache. */
  hasLesson: boolean;
  tint: ColorToken;
  soft: ColorToken;
};

export type CatalogSubject = {
  id: SubjectId | string;
  name: string;
  accent: string;
  soft: string;
};

export type CatalogTopic = {
  id: string;
  name: string;
  subjectId: SubjectId | string;
};

// -- API response shapes -----------------------------------------------------

export type ApiSubject = { id: string; name: string; iri: string | null };
export type ApiTopic = { id: string; name: string; iri: string | null };
export type ApiConceptSummary = {
  id: string;
  name: string | null;
  prefLabel: string | null;
  iri: string | null;
  prerequisites: { id: string; name: string | null }[];
};
export type ApiConceptContext = {
  subjectId: string | null;
  subjectName: string | null;
  topicId: string | null;
  topicName: string | null;
};
export type ApiConceptSearchResult = {
  id: string;
  name: string;
  shortDescription: string | null;
  contexts: ApiConceptContext[];
};
export type StructuredLesson = {
  concept: {
    id: string;
    title: string;
    subjectId: string | null;
    topicId: string | null;
    order: number | null;
    estimatedMinutes: number | null;
  };
  learningObjectives: string[];
  definition: string | null;
  explanation: string[];
  keyTerms: { term: string; definition: string }[];
  illustrations: {
    type: string | null;
    caption: string | null;
    description: string | null;
    table: LessonValue;
    mediaURI: string | null;
  }[];
  workedExamples: { problem: string; steps: string[]; answer: string | null }[];
  realWorldApplications: string[];
  commonMistakes: string[];
  summary: string[];
  prerequisiteNotes: string[];
  prerequisites: { id: string; name: string | null }[];
  relatedConcepts: { id: string; name: string | null }[];
  practiceAvailable: boolean;
  questionCount: number;
};
export type ApiQuestion = {
  id: string;
  type: string | null;
  prompt: string | null;
  difficultyLevel?: string | null;
  options: { id: string; label: string | null; text: string | null }[];
  hint?: string | null;
  explanation?: string | null;
};

/**
 * `GET /concepts/{id}` — metadata only. Lesson sections come from
 * `/concepts/{id}/lesson` and quiz questions from `/concepts/{id}/questions`.
 */
export type ApiConcept = {
  id: string;
  title: string | null;
  shortDescription: string | null;
  topicIds: string[];
  subjectIds: string[];
  prerequisiteIds: string[];
  relatedConceptIds: string[];
  hasLesson: boolean;
  /** Display names for the id lists above (the app may not have the target cached). */
  prerequisites: { id: string; name: string | null }[];
  related: { id: string; name: string | null }[];
};

// -- Mapping -----------------------------------------------------------------

const SUBJECT_THEME: Record<SubjectId, { tint: ColorToken; soft: ColorToken }> = {
  mathematics: { tint: 'green', soft: 'greenSoft' },
  physics: { tint: 'blue', soft: 'blueSoft' },
  chemistry: { tint: 'violet', soft: 'violetSoft' },
};

const SUBJECT_ACCENT: Record<SubjectId, keyof ThemeColors> = {
  mathematics: 'green',
  physics: 'blue',
  chemistry: 'violet',
};

const SUBJECT_SOFT: Record<SubjectId, keyof ThemeColors> = {
  mathematics: 'greenSoft',
  physics: 'blueSoft',
  chemistry: 'violetSoft',
};

const KNOWN_SUBJECTS: SubjectId[] = ['mathematics', 'physics', 'chemistry'];

/** Map a Neo4j subject id/name onto the app's fixed SubjectId set when possible. */
export function resolveSubjectId(raw: string | null | undefined): SubjectId | string {
  if (!raw) return 'physics';
  const text = raw.trim().toLowerCase();
  const match = KNOWN_SUBJECTS.find((subject) => subject === text);
  if (match) return match;
  const byName: Record<string, SubjectId> = {
    maths: 'mathematics',
    math: 'mathematics',
    mathematics: 'mathematics',
    physics: 'physics',
    chemistry: 'chemistry',
  };
  return byName[text] ?? raw;
}

export function subjectTheme(subjectId: string): { tint: ColorToken; soft: ColorToken } {
  return SUBJECT_THEME[subjectId as SubjectId] ?? { tint: 'blue', soft: 'blueSoft' };
}

export function toCatalogSubject(api: ApiSubject): CatalogSubject {
  const id = resolveSubjectId(api.id || api.name);
  const known = KNOWN_SUBJECTS.includes(id as SubjectId);
  return {
    id,
    name: api.name ?? String(id),
    accent: known ? colors[SUBJECT_ACCENT[id as SubjectId]] : colors.blue,
    soft: known ? colors[SUBJECT_SOFT[id as SubjectId]] : colors.blueSoft,
  };
}

export function mapConceptSummary(
  api: ApiConceptSummary,
  topicId: string,
  subjectId: string,
): Concept {
  const theme = subjectTheme(subjectId);
  return {
    id: api.id,
    topicIds: [topicId],
    subjectIds: [subjectId],
    title: api.name ?? api.prefLabel ?? api.id,
    definition: '',
    prerequisites: api.prerequisites.map((item) => item.name ?? item.id),
    related: [],
    prerequisiteIds: api.prerequisites.map((item) => item.id),
    relatedConceptIds: [],
    hasLesson: false,
    tint: theme.tint,
    soft: theme.soft,
  };
}

export function mapConceptDetail(
  api: ApiConcept,
  fallbackTopicIds: string[] = [],
): Concept {
  const subjectIds = api.subjectIds.filter(Boolean);
  const theme = subjectTheme(resolveSubjectId(subjectIds[0]));
  return {
    id: api.id,
    topicIds: api.topicIds.length > 0 ? api.topicIds.filter(Boolean) : fallbackTopicIds,
    subjectIds,
    title: api.title ?? api.id,
    definition: api.shortDescription ?? '',
    prerequisites: api.prerequisites.map((item) => item.name ?? item.id),
    related: api.related.map((item) => item.name ?? item.id),
    prerequisiteIds: api.prerequisiteIds.filter(Boolean),
    relatedConceptIds: api.relatedConceptIds.filter(Boolean),
    hasLesson: api.hasLesson,
    tint: theme.tint,
    soft: theme.soft,
  };
}

export function mapQuestions(api: ApiQuestion[]): QuizQuestion[] {
  return api.map((question, index) => ({
    id: question.id,
    type: question.type === 'mcq' ? 'mcq' : question.options.length > 0 ? 'mcq' : 'written',
    prompt: question.prompt ?? `Question ${index + 1}`,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label ?? option.id.toUpperCase(),
      text: option.text ?? '',
    })),
    hint: question.hint,
  }));
}
