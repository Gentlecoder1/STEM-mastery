import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CatalogSubject, CatalogTopic, Concept } from '../types/catalog';

export const CATALOG_STORAGE_KEY = 'stem-mastery.catalog.v1';

export type CatalogSnapshot = {
  lastSyncedAt: string;
  subjects: CatalogSubject[];
  topics: CatalogTopic[];
  /** Concept summaries keyed by id (definition/related/content loaded lazily). */
  concepts: Concept[];
  /** Concept ids in prerequisite order, keyed by topic id. */
  conceptOrder: Record<string, string[]>;
};

export async function loadCatalogSnapshot(): Promise<CatalogSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogSnapshot;
    if (!Array.isArray(parsed?.concepts)) return null;
    return parsed;
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
