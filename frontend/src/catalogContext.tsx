import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { isApiConfigured } from './lib/api';
import { fetchConcept, fetchConcepts, fetchSubjects, fetchTopics } from './lib/catalogApi';
import { loadCatalogSnapshot, saveCatalogSnapshot, type CatalogSnapshot } from './lib/catalogCache';
import {
  mapConceptDetail,
  mapConceptSummary,
  toCatalogSubject,
  type CatalogSubject,
  type CatalogTopic,
  type Concept,
} from './types/catalog';
import { useConnectivity } from './connectivityContext';

export type CatalogStatus = 'loading' | 'ready' | 'empty' | 'error';
export type CatalogSource = 'api' | 'cache' | null;

type CatalogContextValue = {
  status: CatalogStatus;
  source: CatalogSource;
  lastSyncedAt: string | null;
  subjects: CatalogSubject[];
  topics: CatalogTopic[];
  concepts: Concept[];
  getConcept: (id: string) => Concept | undefined;
  getTopicConceptIds: (topicId: string) => string[];
  getTopicsForSubject: (subjectId: string) => CatalogTopic[];
  getPreviousConcept: (id: string) => Concept | undefined;
  getNextConcept: (id: string) => Concept | undefined;
  loadConcept: (id: string) => Promise<Concept | undefined>;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useConnectivity();
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [source, setSource] = useState<CatalogSource>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [topics, setTopics] = useState<CatalogTopic[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [conceptOrder, setConceptOrder] = useState<Record<string, string[]>>({});
  const conceptsRef = useRef<Concept[]>([]);
  conceptsRef.current = concepts;
  const inFlight = useRef(false);
  const hydrated = useRef(false);

  const applySnapshot = useCallback((snapshot: CatalogSnapshot) => {
    setSubjects(snapshot.subjects);
    setTopics(snapshot.topics);
    setConcepts(snapshot.concepts);
    setConceptOrder(snapshot.conceptOrder);
    setLastSyncedAt(snapshot.lastSyncedAt);
  }, []);

  const fetchAll = useCallback(async (): Promise<CatalogSnapshot> => {
    const apiSubjects = await fetchSubjects();
    const catalogSubjects = apiSubjects.map(toCatalogSubject);
    const allTopics: CatalogTopic[] = [];
    const allConcepts: Concept[] = [];
    const order: Record<string, string[]> = {};

    await Promise.all(
      apiSubjects.map(async (subject) => {
        const subjectId = String(toCatalogSubject(subject).id);
        const apiTopics = await fetchTopics(subject.id);
        await Promise.all(
          apiTopics.map(async (topic) => {
            const summaries = await fetchConcepts(topic.id);
            const topicConcepts = summaries.map((summary) =>
              mapConceptSummary(summary, topic.id, subjectId),
            );
            allTopics.push({ id: topic.id, name: topic.name, subjectId });
            allConcepts.push(...topicConcepts);
            order[topic.id] = topicConcepts.map((concept) => concept.id);
          }),
        );
      }),
    );

    return {
      lastSyncedAt: new Date().toISOString(),
      subjects: catalogSubjects,
      topics: allTopics,
      concepts: allConcepts,
      conceptOrder: order,
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isApiConfigured || inFlight.current) return;
    inFlight.current = true;
    try {
      const snapshot = await fetchAll();
      applySnapshot(snapshot);
      setSource('api');
      setStatus(snapshot.concepts.length > 0 ? 'ready' : 'empty');
      await saveCatalogSnapshot(snapshot);
    } catch {
      // Keep any cached data; only surface an error when we have nothing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    } finally {
      inFlight.current = false;
    }
  }, [applySnapshot, fetchAll]);

  // Hydrate from cache once, then refresh when connectivity allows.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const cached = await loadCatalogSnapshot();
      if (!mounted) return;
      if (cached && cached.concepts.length > 0) {
        applySnapshot(cached);
        setSource('cache');
        setStatus('ready');
      } else if (!isApiConfigured) {
        setStatus('empty');
      }
      hydrated.current = true;
      if (isApiConfigured) void refresh();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync when connectivity returns.
  useEffect(() => {
    if (isOnline && hydrated.current) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const getConcept = useCallback(
    (id: string) => concepts.find((concept) => concept.id === id),
    [concepts],
  );

  const getTopicConceptIds = useCallback(
    (topicId: string) =>
      conceptOrder[topicId] ?? concepts.filter((c) => c.topicId === topicId).map((c) => c.id),
    [conceptOrder, concepts],
  );

  const getTopicsForSubject = useCallback(
    (subjectId: string) => topics.filter((topic) => String(topic.subjectId) === String(subjectId)),
    [topics],
  );

  const getRelative = useCallback(
    (id: string, offset: number) => {
      const concept = concepts.find((item) => item.id === id);
      if (!concept) return undefined;
      const sequence = getTopicConceptIds(concept.topicId);
      const index = sequence.indexOf(id);
      const nextId = sequence[index + offset];
      return nextId ? concepts.find((item) => item.id === nextId) : undefined;
    },
    [concepts, getTopicConceptIds],
  );

  const getPreviousConcept = useCallback((id: string) => getRelative(id, -1), [getRelative]);
  const getNextConcept = useCallback((id: string) => getRelative(id, 1), [getRelative]);

  const loadConcept = useCallback(
    async (id: string): Promise<Concept | undefined> => {
      const existing = conceptsRef.current.find((concept) => concept.id === id);
      if (existing && existing.content.length > 0) return existing;
      if (!isApiConfigured) return existing;
      try {
        const detail = mapConceptDetail(await fetchConcept(id), existing?.topicId ?? '');
        const merged = { ...(existing ?? detail), ...detail };
        const next = conceptsRef.current.map((concept) =>
          concept.id === id ? merged : concept,
        );
        if (!next.some((concept) => concept.id === id)) next.push(merged);
        setConcepts(next);
        const snapshot: CatalogSnapshot = {
          lastSyncedAt: lastSyncedAt ?? new Date().toISOString(),
          subjects,
          topics,
          concepts: next,
          conceptOrder,
        };
        void saveCatalogSnapshot(snapshot);
        return merged;
      } catch {
        return existing;
      }
    },
    [conceptOrder, lastSyncedAt, subjects, topics],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      status,
      source,
      lastSyncedAt,
      subjects,
      topics,
      concepts,
      getConcept,
      getTopicConceptIds,
      getTopicsForSubject,
      getPreviousConcept,
      getNextConcept,
      loadConcept,
      refresh,
    }),
    [
      status,
      source,
      lastSyncedAt,
      subjects,
      topics,
      concepts,
      getConcept,
      getTopicConceptIds,
      getTopicsForSubject,
      getPreviousConcept,
      getNextConcept,
      loadConcept,
      refresh,
    ],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
