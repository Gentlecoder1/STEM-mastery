import { apiFetch } from './api';
import type {
  ApiConcept,
  ApiConceptSearchResult,
  ApiConceptSummary,
  ApiLearningContent,
  ApiSubject,
  ApiTopic,
  KnowledgeMapResponse,
  TopicPacket,
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

export function fetchTopicPacket(topicId: string): Promise<TopicPacket> {
  return apiFetch<TopicPacket>(`/api/v1/topics/${encodeURIComponent(topicId)}/packet`);
}

export function searchConcepts(query: string): Promise<ApiConceptSearchResult[]> {
  return apiFetch<ApiConceptSearchResult[]>(
    `/api/v1/concepts/search?q=${encodeURIComponent(query)}&limit=20`,
  );
}

export function fetchKnowledgeMapRoot(): Promise<KnowledgeMapResponse> {
  return apiFetch<KnowledgeMapResponse>('/api/v1/knowledge-map/root');
}

export function fetchTopicKnowledgeMap(
  topicId: string,
  options: { focusId?: string; depth?: number; includeConnectedTopics?: boolean } = {},
): Promise<KnowledgeMapResponse> {
  const params = new URLSearchParams();
  if (options.focusId) params.set('focus_id', options.focusId);
  if (options.depth !== undefined) params.set('depth', String(options.depth));
  if (options.includeConnectedTopics !== undefined) {
    params.set('include_connected_topics', String(options.includeConnectedTopics));
  }
  const query = params.toString();
  return apiFetch<KnowledgeMapResponse>(
    `/api/v1/knowledge-map/topics/${encodeURIComponent(topicId)}${query ? `?${query}` : ''}`,
  );
}

export function fetchConceptKnowledgeMap(
  conceptId: string,
  options: { topicId?: string; depth?: number; includeConnectedTopics?: boolean } = {},
): Promise<KnowledgeMapResponse> {
  const params = new URLSearchParams();
  if (options.topicId) params.set('topic_id', options.topicId);
  if (options.depth !== undefined) params.set('depth', String(options.depth));
  if (options.includeConnectedTopics !== undefined) {
    params.set('include_connected_topics', String(options.includeConnectedTopics));
  }
  const query = params.toString();
  return apiFetch<KnowledgeMapResponse>(
    `/api/v1/knowledge-map/concepts/${encodeURIComponent(conceptId)}${query ? `?${query}` : ''}`,
  );
}

export function searchKnowledgeMapConcepts(query: string): Promise<ApiConceptSearchResult[]> {
  return apiFetch<ApiConceptSearchResult[]>(
    `/api/v1/knowledge-map/search?q=${encodeURIComponent(query)}&limit=20`,
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
