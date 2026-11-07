import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CONTENT_TYPES,
  type CatalogSubject,
  type CatalogTopic,
  type Concept,
  type LearningContent,
} from '../types/catalog';
import { saveLesson } from './offlineStore';

export const CATALOG_STORAGE_KEY = 'stem-mastery.catalog.v1';

export type CatalogSnapshot = {
  lastSyncedAt: string;
  subjects: CatalogSubject[];
  topics: CatalogTopic[];
  /** Concept metadata keyed by id (definition/related membership loaded lazily). */
  concepts: Concept[];
  /** Concept ids in prerequisite order, keyed by topic id. */
  conceptOrder: Record<string, string[]>;
};

function isLearningContent(value: unknown): value is LearningContent {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.conceptId === 'string' &&
    typeof item.title === 'string' &&
    typeof item.contentText === 'string' &&
    CONTENT_TYPES.some((type) => type === item.contentType) &&
    typeof item.chapterOrder === 'number' &&
    (item.mediaURI === null || typeof item.mediaURI === 'string')
  );
}

export async function loadCatalogSnapshot(): Promise<CatalogSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CatalogSnapshot> & { concepts?: unknown[] };
    if (!Array.isArray(parsed.concepts)) return null;

    const legacyLessonWrites: Promise<void>[] = [];
    const concepts = parsed.concepts.flatMap((value): Concept[] => {
      if (!value || typeof value !== 'object') return [];
      const item = value as Partial<Concept> & {
        topicId?: string;
        subjectId?: string;
        content?: unknown[];
      };
      if (typeof item.id !== 'string') return [];
      const legacyContent = Array.isArray(item.content) ? item.content.filter(isLearningContent) : [];
      if (legacyContent.length > 0) legacyLessonWrites.push(saveLesson(item.id, legacyContent));
      return [{
        id: item.id,
        topicIds: Array.isArray(item.topicIds) ? item.topicIds : item.topicId ? [item.topicId] : [],
        subjectIds: Array.isArray(item.subjectIds)
          ? item.subjectIds
          : item.subjectId
            ? [item.subjectId]
            : [],
        title: item.title ?? item.id,
        definition: item.definition ?? '',
        whyItMatters: item.whyItMatters ?? '',
        prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
        related: Array.isArray(item.related) ? item.related : [],
        prerequisiteIds: Array.isArray(item.prerequisiteIds) ? item.prerequisiteIds : [],
        relatedConceptIds: Array.isArray(item.relatedConceptIds) ? item.relatedConceptIds : [],
        hasLesson: item.hasLesson ?? (Array.isArray(item.content) && item.content.length > 0),
        tint: item.tint ?? 'blue',
        soft: item.soft ?? 'blueSoft',
      }];
    });
    await Promise.all(legacyLessonWrites);

    return {
      lastSyncedAt: parsed.lastSyncedAt ?? new Date().toISOString(),
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      concepts,
      conceptOrder: parsed.conceptOrder ?? {},
    };
  } catch {
    return null;
  }
}

export async function saveCatalogSnapshot(snapshot: CatalogSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // best-effort cache
  }
}
