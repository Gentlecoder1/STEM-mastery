import { apiFetch } from './api';
import type {
  ApiConcept,
  ApiConceptSearchResult,
  ApiConceptSummary,
  ApiLearningContent,
  ApiSubject,
  ApiTopic,
} from '../types/catalog';

export function fetchSubjects(): Promise<ApiSubject[]> {
  return apiFetch<ApiSubject[]>('/api/v1/subjects');
}

export function fetchTopics(subjectId: string): Promise<ApiTopic[]> {
  return apiFetch<ApiTopic[]>(`/api/v1/subjects/${encodeURIComponent(subjectId)}/topics`);
}

export function fetchConcepts(topicId: string): Promise<ApiConceptSummary[]> {
  return apiFetch<ApiConceptSummary[]>(`/api/v1/topics/${encodeURIComponent(topicId)}/concepts`);
}

export function searchConcepts(query: string): Promise<ApiConceptSearchResult[]> {
  return apiFetch<ApiConceptSearchResult[]>(
    `/api/v1/concepts/search?q=${encodeURIComponent(query)}&limit=20`,
  );
}

/** Concept metadata only — never carries lesson sections. */
export function fetchConcept(id: string): Promise<ApiConcept> {
  return apiFetch<ApiConcept>(`/api/v1/concepts/${encodeURIComponent(id)}`);
}

/** Full lesson payload, cached when a concept is opened or a topic downloaded. */
export function fetchLesson(id: string): Promise<ApiLearningContent[]> {
  return apiFetch<ApiLearningContent[]>(`/api/v1/concepts/${encodeURIComponent(id)}/lesson`);
}
