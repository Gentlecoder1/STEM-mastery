import { apiFetch } from './api';
import type { ApiConcept, ApiConceptSummary, ApiSubject, ApiTopic } from '../types/catalog';

export function fetchSubjects(): Promise<ApiSubject[]> {
  return apiFetch<ApiSubject[]>('/api/v1/subjects');
}

export function fetchTopics(subjectId: string): Promise<ApiTopic[]> {
  return apiFetch<ApiTopic[]>(`/api/v1/subjects/${encodeURIComponent(subjectId)}/topics`);
}

export function fetchConcepts(topicId: string): Promise<ApiConceptSummary[]> {
  return apiFetch<ApiConceptSummary[]>(`/api/v1/topics/${encodeURIComponent(topicId)}/concepts`);
}

export function fetchConcept(id: string): Promise<ApiConcept> {
  return apiFetch<ApiConcept>(`/api/v1/concepts/${encodeURIComponent(id)}`);
}
