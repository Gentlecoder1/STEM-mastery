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
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubjectId } from './theme';
import { CONCEPTS, getConcept, getTopicConceptIds } from './data/learning';

const PROGRESS_STORAGE_KEY = 'stem-mastery.progress.v1';

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const STORAGE: StorageLike | null = (() => {
  try {
    const api = AsyncStorage as Partial<StorageLike> | null | undefined;
    return api && typeof api.getItem === 'function' ? (api as StorageLike) : null;
  } catch {
    return null;
  }
})();

export type PlacementResult = {
  subjectId: SubjectId;
  correct: number;
  total: number;
  scorePct: number;
  passed: boolean;
};

export type ConceptStatus = 'done' | 'current' | 'open';

export type RecordPlacementOptions = {
  startFromBeginning?: boolean;
};

export type ProgressContextValue = {
  completedConcepts: readonly string[];
  placement: Partial<Record<SubjectId, PlacementResult>>;
  placementTaken: boolean;
  isConceptCompleted: (conceptId: string) => boolean;
  isConceptOpen: (conceptId: string) => boolean;
  getConceptStatus: (conceptId: string) => ConceptStatus;
  getRecommendedConceptId: (subjectId?: SubjectId) => string | undefined;
  completeConcept: (conceptId: string) => void;
  recordPlacement: (results: readonly PlacementResult[], options?: RecordPlacementOptions) => void;
  resetProgress: () => void;
};

const ProgressContext = createContext<ProgressContextValue>({
  completedConcepts: [],
  placement: {},
  placementTaken: false,
  isConceptCompleted: () => false,
  isConceptOpen: (conceptId) => getTopicConceptIds(getConcept(conceptId)?.topicId ?? '').indexOf(conceptId) <= 0,
  getConceptStatus: () => 'open',
  getRecommendedConceptId: () => CONCEPTS[0]?.id,
  completeConcept: () => {},
  recordPlacement: () => {},
  resetProgress: () => {},
});

function seedSkipCompletions(results: readonly PlacementResult[]): string[] {
  const seeded: string[] = [];
  const seededSubjects = new Set(
    results.filter((result) => result.passed).map((result) => result.subjectId),
  );
  const visitedTopics = new Set<string>();
  for (const concept of CONCEPTS) {
    if (!seededSubjects.has(concept.subjectId)) continue;
    if (visitedTopics.has(concept.topicId)) continue;
    visitedTopics.add(concept.topicId);
    seeded.push(concept.id);
  }
  return seeded;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedConcepts, setCompletedConcepts] = useState<string[]>([]);
  const [placement, setPlacement] = useState<Partial<Record<SubjectId, PlacementResult>>>({});
  const completedRef = useRef(completedConcepts);
  completedRef.current = completedConcepts;

  useEffect(() => {
    if (!STORAGE) return;
    let mounted = true;
    STORAGE.getItem(PROGRESS_STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw) as {
          completedConcepts?: string[];
          placement?: Partial<Record<SubjectId, PlacementResult>>;
        };
        if (Array.isArray(parsed?.completedConcepts)) setCompletedConcepts(parsed.completedConcepts);
        if (parsed?.placement) setPlacement(parsed.placement);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback((nextCompleted: string[], nextPlacement: Partial<Record<SubjectId, PlacementResult>>) => {
    if (!STORAGE) return;
    STORAGE.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ completedConcepts: nextCompleted, placement: nextPlacement }),
    ).catch(() => {});
  }, []);

  const completeConcept = useCallback(
    (conceptId: string) => {
      setCompletedConcepts((current) => {
        if (current.includes(conceptId)) return current;
        const next = [...current, conceptId];
        persist(next, placement);
        return next;
      });
    },
    [persist, placement],
  );

  const isConceptCompleted = useCallback(
    (conceptId: string) => completedConcepts.includes(conceptId),
    [completedConcepts],
  );

  const isConceptOpen = useCallback(
    (conceptId: string) => {
      const concept = getConcept(conceptId);
      if (!concept) return false;
      const sequence = getTopicConceptIds(concept.topicId);
      const index = sequence.indexOf(conceptId);
      if (index <= 0) return true;
      return completedConcepts.includes(sequence[index - 1]);
    },
    [completedConcepts],
  );

  const getConceptStatus = useCallback(
    (conceptId: string): ConceptStatus => {
      if (completedConcepts.includes(conceptId)) return 'done';
      const concept = getConcept(conceptId);
      if (!concept) return 'open';
      const sequence = getTopicConceptIds(concept.topicId);
      const index = sequence.indexOf(conceptId);
      const earlierIncomplete = sequence
        .slice(0, Math.max(index, 0))
        .some((id) => !completedConcepts.includes(id));
      if (!earlierIncomplete && isConceptOpen(conceptId)) return 'current';
      return 'open';
    },
    [completedConcepts, isConceptOpen],
  );

  const getRecommendedConceptId = useCallback(
    (subjectId?: SubjectId) => {
      const pool = subjectId ? CONCEPTS.filter((concept) => concept.subjectId === subjectId) : CONCEPTS;
      const next = pool.find((concept) => !completedConcepts.includes(concept.id));
      return next?.id ?? pool[pool.length - 1]?.id;
    },
    [completedConcepts],
  );

  const recordPlacement = useCallback(
    (results: readonly PlacementResult[], options?: RecordPlacementOptions) => {
      setPlacement((currentPlacement) => {
        const nextPlacement = { ...currentPlacement };
        for (const result of results) nextPlacement[result.subjectId] = result;

        setCompletedConcepts((current) => {
          const skipSeed = options?.startFromBeginning ? [] : seedSkipCompletions(results);
          const merged = Array.from(new Set([...current, ...skipSeed]));
          persist(merged, nextPlacement);
          return merged;
        });

        return nextPlacement;
      });
    },
    [persist],
  );

  const resetProgress = useCallback(() => {
    setCompletedConcepts([]);
    setPlacement({});
    persist([], {});
  }, [persist]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      completedConcepts,
      placement,
      placementTaken: Object.keys(placement).length > 0,
      isConceptCompleted,
      isConceptOpen,
      getConceptStatus,
      getRecommendedConceptId,
      completeConcept,
      recordPlacement,
      resetProgress,
    }),
    [
      completedConcepts,
      placement,
      isConceptCompleted,
      isConceptOpen,
      getConceptStatus,
      getRecommendedConceptId,
      completeConcept,
      recordPlacement,
      resetProgress,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  return useContext(ProgressContext);
}
