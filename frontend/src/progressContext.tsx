import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubjectId } from './theme';
import { useCatalog } from './catalogContext';
import { useAuth } from './auth/AuthContext';
import { getSupabase } from './lib/supabase';
import {
  loadCompletedConceptIds,
  loadPlacement,
  loadTopicAssessments,
  type TopicAssessment,
} from './lib/progress';
import { useProfile } from './profileContext';

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

export type PlacementState = {
  subjects: Record<string, PlacementResult>;
  conceptMastery: Record<string, number>;
  recommendedStartConceptId: string | null;
};

const EMPTY_PLACEMENT: PlacementState = {
  subjects: {},
  conceptMastery: {},
  recommendedStartConceptId: null,
};

export type ConceptStatus = 'done' | 'current' | 'open';

export type ProgressContextValue = {
  completedConcepts: readonly string[];
  placement: PlacementState;
  placementTaken: boolean;
  topicAssessments: Record<string, TopicAssessment>;
  isTopicMastered: (topicId: string) => boolean;
  getTopicMastery: (topicId: string) => number;
  getSubjectMastery: (subjectId: SubjectId) => number;
  isConceptCompleted: (conceptId: string) => boolean;
  isConceptOpen: (conceptId: string) => boolean;
  getConceptStatus: (conceptId: string) => ConceptStatus;
  getRecommendedConceptId: (subjectId?: SubjectId) => string | undefined;
  completeConcept: (conceptId: string) => void;
  recordTopicAssessment: (topicId: string, scorePct: number) => void;
  refresh: () => Promise<void>;
  resetProgress: () => void;
};

const ProgressContext = createContext<ProgressContextValue>({
  completedConcepts: [],
  placement: EMPTY_PLACEMENT,
  placementTaken: false,
  topicAssessments: {},
  isTopicMastered: () => false,
  getTopicMastery: () => 0,
  getSubjectMastery: () => 0,
  isConceptCompleted: () => false,
  isConceptOpen: () => false,
  getConceptStatus: () => 'open',
  getRecommendedConceptId: () => undefined,
  completeConcept: () => {},
  recordTopicAssessment: () => {},
  refresh: async () => {},
  resetProgress: () => {},
});

function normalizePlacement(raw: unknown): PlacementState {
  if (!raw || typeof raw !== 'object') return EMPTY_PLACEMENT;
  const value = raw as Partial<PlacementState> & { subjects?: Record<string, PlacementResult> };
  return {
    subjects: (value.subjects ?? {}) as Record<string, PlacementResult>,
    conceptMastery: (value.conceptMastery ?? {}) as Record<string, number>,
    recommendedStartConceptId:
      typeof value.recommendedStartConceptId === 'string' ? value.recommendedStartConceptId : null,
  };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const { concepts, getConcept, getTopicConceptIds } = useCatalog();
  const [completedConcepts, setCompletedConcepts] = useState<string[]>([]);
  const [placement, setPlacement] = useState<PlacementState>(EMPTY_PLACEMENT);
  const [topicAssessments, setTopicAssessments] = useState<Record<string, TopicAssessment>>({});
  const remote = !!user;

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase && user) {
      try {
        const [ids, storedPlacement, storedAssessments] = await Promise.all([
          loadCompletedConceptIds(supabase, user.id),
          loadPlacement(supabase, user.id),
          loadTopicAssessments(supabase, user.id),
        ]);
        setCompletedConcepts(ids);
        setPlacement(normalizePlacement(storedPlacement));
        setTopicAssessments(storedAssessments);
        return;
      } catch {
        return;
      }
    }
    if (!STORAGE) return;
    try {
      const raw = await STORAGE.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        completedConcepts?: string[];
        placement?: PlacementState;
      };
      if (Array.isArray(parsed?.completedConcepts)) setCompletedConcepts(parsed.completedConcepts);
      if (parsed?.placement) setPlacement(normalizePlacement(parsed.placement));
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    setCompletedConcepts([]);
    setPlacement(EMPTY_PLACEMENT);
    setTopicAssessments({});
    void load();
  }, [load]);

  const persist = useCallback(
    (nextCompleted: string[], nextPlacement: PlacementState) => {
      if (remote || !STORAGE) return;
      STORAGE.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({ completedConcepts: nextCompleted, placement: nextPlacement }),
      ).catch(() => {});
    },
    [remote],
  );

  const completeConcept = useCallback(
    (conceptId: string) => {
      setCompletedConcepts((current) => {
        if (current.includes(conceptId)) return current;
        const next = [...current, conceptId];
        persist(next, placement);
        return next;
      });
    },
    [placement, persist],
  );

  const recordTopicAssessment = useCallback((topicId: string, scorePct: number) => {
    setTopicAssessments((current) => ({
      ...current,
      [topicId]: { topicId, scorePct, passed: scorePct >= 60 },
    }));
  }, []);

  const isConceptCompleted = useCallback(
    (conceptId: string) => completedConcepts.includes(conceptId),
    [completedConcepts],
  );

  const isTopicMastered = useCallback(
    (topicId: string) => {
      const conceptIds = getTopicConceptIds(topicId);
      return (
        conceptIds.length > 0 &&
        conceptIds.every((id) => completedConcepts.includes(id)) &&
        topicAssessments[topicId]?.passed === true
      );
    },
    [completedConcepts, getTopicConceptIds, topicAssessments],
  );

  const getTopicMastery = useCallback(
    (topicId: string) => {
      const conceptIds = getTopicConceptIds(topicId);
      if (conceptIds.length === 0 || topicAssessments[topicId]?.passed !== true) return 0;
      return Math.round(
        (conceptIds.filter((id) => completedConcepts.includes(id)).length / conceptIds.length) * 100,
      );
    },
    [completedConcepts, getTopicConceptIds, topicAssessments],
  );

  const getSubjectMastery = useCallback(
    (subjectId: SubjectId) => {
      const topicIds = Array.from(
        new Set(
          concepts
            .filter((concept) => concept.subjectId === subjectId)
            .map((concept) => concept.topicId),
        ),
      );
      if (topicIds.length === 0) return 0;
      return Math.round((topicIds.filter(isTopicMastered).length / topicIds.length) * 100);
    },
    [concepts, isTopicMastered],
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
    [completedConcepts, getConcept, getTopicConceptIds],
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
    [completedConcepts, getConcept, getTopicConceptIds, isConceptOpen],
  );

  const getRecommendedConceptId = useCallback(
    (subjectId?: SubjectId) => {
      if (placement.recommendedStartConceptId) {
        const recommended = getConcept(placement.recommendedStartConceptId);
        if (recommended && (!subjectId || recommended.subjectId === subjectId)) {
          return recommended.id;
        }
      }
      const pool = subjectId
        ? concepts.filter((concept) => concept.subjectId === subjectId)
        : concepts;
      const next = pool.find((concept) => !completedConcepts.includes(concept.id));
      return next?.id ?? pool[pool.length - 1]?.id;
    },
    [completedConcepts, concepts, getConcept, placement.recommendedStartConceptId],
  );

  const refresh = useCallback(async () => {
    await load();
    void refreshProfile();
  }, [load, refreshProfile]);

  const resetProgress = useCallback(() => {
    setCompletedConcepts([]);
    setPlacement(EMPTY_PLACEMENT);
    persist([], EMPTY_PLACEMENT);
  }, [persist]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      completedConcepts,
      placement,
      topicAssessments,
      isTopicMastered,
      getTopicMastery,
      getSubjectMastery,
      recordTopicAssessment,
      placementTaken: Object.keys(placement.subjects).length > 0,
      isConceptCompleted,
      isConceptOpen,
      getConceptStatus,
      getRecommendedConceptId,
      completeConcept,
      refresh,
      resetProgress,
    }),
    [
      completedConcepts,
      placement,
      topicAssessments,
      isTopicMastered,
      getTopicMastery,
      getSubjectMastery,
      recordTopicAssessment,
      isConceptCompleted,
      isConceptOpen,
      getConceptStatus,
      getRecommendedConceptId,
      completeConcept,
      refresh,
      resetProgress,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  return useContext(ProgressContext);
}
