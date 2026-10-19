import { apiFetch } from './api';
import type { ApiQuestion } from '../types/catalog';

export type CheckResult = {
  questionId: string;
  conceptId: string;
  correct: boolean | null;
  correctOptionId: string | null;
  explanation: string | null;
  prerequisites: { id: string; name: string | null }[];
  relatedConcepts: { id: string; name: string | null }[];
};

export type ConceptQuizSubmitResult = {
  conceptId: string;
  correct: number;
  total: number;
  scorePct: number;
  passed: boolean;
  prerequisites: { id: string; name: string | null }[];
  relatedConcepts: { id: string; name: string | null }[];
};

export type TopicQuizSubmitResult = {
  topicId: string;
  correct: number;
  total: number;
  scorePct: number;
  passed: boolean;
};

export type PlacementQuestion = {
  id: string;
  type: string | null;
  prompt: string | null;
  difficultyLevel: string | null;
  options: { id: string; label: string | null; text: string | null }[];
  conceptId: string | null;
  subjectId: string | null;
};

export type PlacementSubjectResult = {
  subjectId: string;
  correct: number;
  total: number;
  scorePct: number;
  passed: boolean;
};

export type PlacementSubmitResult = {
  results: PlacementSubjectResult[];
  conceptMastery: Record<string, number>;
  recommendedStartConceptId: string | null;
};

export type LessonProgressItem = {
  conceptId: string;
  lessonId: string | null;
  progressPercent: number;
  lastSection: string | null;
  lessonCompleted: boolean;
  quizPending: boolean;
  completedOffline: boolean;
  startedAt: string | null;
  lastOpenedAt: string | null;
  updatedAt: string | null;
};

export type ProgressSyncResult = {
  synced: string[];
  serverState: LessonProgressItem[];
};

export function fetchConceptQuestions(conceptId: string): Promise<ApiQuestion[]> {
  return apiFetch<ApiQuestion[]>(`/api/v1/concepts/${encodeURIComponent(conceptId)}/questions`);
}

export function checkAnswer(
  conceptId: string,
  questionId: string,
  response: string | null,
): Promise<CheckResult> {
  return apiFetch<CheckResult>(`/api/v1/concepts/${encodeURIComponent(conceptId)}/quiz/check`, {
    method: 'POST',
    auth: true,
    body: { questionId, selectedOption: response },
  });
}

export function submitConceptQuiz(
  conceptId: string,
  responses: { questionId: string; response: string | null }[],
): Promise<ConceptQuizSubmitResult> {
  return apiFetch<ConceptQuizSubmitResult>(
    `/api/v1/concepts/${encodeURIComponent(conceptId)}/quiz/submit`,
    { method: 'POST', auth: true, body: { responses } },
  );
}

export function submitTopicQuiz(
  topicId: string,
  responses: { questionId: string; response: string | null }[],
): Promise<TopicQuizSubmitResult> {
  return apiFetch<TopicQuizSubmitResult>(
    `/api/v1/topics/${encodeURIComponent(topicId)}/quiz/submit`,
    {
      method: 'POST',
      auth: true,
      body: { responses },
    },
  );
}

export function fetchPlacementQuestions(
  subjects: string[] | undefined,
  count = 10,
): Promise<PlacementQuestion[]> {
  const params = new URLSearchParams();
  if (subjects && subjects.length > 0) params.set('subjects', subjects.join(','));
  params.set('count', String(count));
  return apiFetch<PlacementQuestion[]>(`/api/v1/placement/questions?${params.toString()}`);
}

export function submitPlacement(
  answers: { questionId: string; response: string | null }[],
): Promise<PlacementSubmitResult> {
  return apiFetch<PlacementSubmitResult>('/api/v1/placement/submit', {
    method: 'POST',
    auth: true,
    body: { answers },
  });
}

export function syncProgress(items: LessonProgressItem[]): Promise<ProgressSyncResult> {
  return apiFetch<ProgressSyncResult>('/api/v1/progress/sync', {
    method: 'POST',
    auth: true,
    body: { items },
  });
}
