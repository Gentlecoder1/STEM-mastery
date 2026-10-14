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
import { useAuth } from './auth/AuthContext';
import { getSupabase } from './lib/supabase';
import {
  addCompletedConcepts,
  loadCompletedConceptIds,
  loadPlacement,
  loadTopicAssessments,
  savePlacement,
  saveTopicAssessment,
  type TopicAssessment,
  type StoredPlacement,
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

export type ConceptStatus = 'done' | 'current' | 'open';

export type RecordPlacementOptions = {
  startFromBeginning?: boolean;
};

export type ProgressContextValue = {
  completedConcepts: readonly string[];
  placement: Partial<Record<SubjectId, PlacementResult>>;
  placementTaken: boolean;
  topicAssessments: Record<string, TopicAssessment>;
  isTopicMastered: (topicId: string) => boolean;
  getTopicMastery: (topicId: string) => number;
  getSubjectMastery: (subjectId: SubjectId) => number;
  recordTopicAssessment: (topicId: string, scorePct: number) => Promise<void>;
  isConceptCompleted: (conceptId: string) => boolean;
  isConceptOpen: (conceptId: string) => boolean;
  getConceptStatus: (conceptId: string) => ConceptStatus;
  getRecommendedConceptId: (subjectId?: SubjectId) => string | undefined;
  completeConcept: (conceptId: string) => void;
  recordPlacement: (results: readonly PlacementResult[], options?: RecordPlacementOptions) => Promise<void>;
  resetProgress: () => void;
};

const ProgressContext = createContext<ProgressContextValue>({
  completedConcepts: [],
  placement: {},
  placementTaken: false,
  topicAssessments: {},
  isTopicMastered: () => false,
  getTopicMastery: () => 0,
  getSubjectMastery: () => 0,
  recordTopicAssessment: async () => {},
  isConceptCompleted: () => false,
  isConceptOpen: (conceptId) => getTopicConceptIds(getConcept(conceptId)?.topicId ?? '').indexOf(conceptId) <= 0,
  getConceptStatus: () => 'open',
  getRecommendedConceptId: () => CONCEPTS[0]?.id,
  completeConcept: () => {},
  recordPlacement: async () => {},
  resetProgress: () => {},
});

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const [completedConcepts, setCompletedConcepts] = useState<string[]>([]);
  const [placement, setPlacement] = useState<Partial<Record<SubjectId, PlacementResult>>>({});
  const [topicAssessments, setTopicAssessments] = useState<Record<string, TopicAssessment>>({});
  const completedRef = useRef(completedConcepts);
  completedRef.current = completedConcepts;
  const remote = !!user;

  useEffect(() => {
    let mounted = true;
    setCompletedConcepts([]);
    setPlacement({});
    setTopicAssessments({});
    (async () => {
      const supabase = getSupabase();
      if (supabase && user) {
        try {
          const [ids, storedPlacement, storedAssessments] = await Promise.all([
            loadCompletedConceptIds(supabase, user.id),
            loadPlacement(supabase, user.id),
            loadTopicAssessments(supabase, user.id),
          ]);
          if (!mounted) return;
          setCompletedConcepts(ids);
          setPlacement((storedPlacement as Partial<Record<SubjectId, PlacementResult>>) ?? {});
          setTopicAssessments(storedAssessments);
          return;
        } catch (e) {
          return;
        }
      }
      if (!STORAGE) return;
      try {
        const raw = await STORAGE.getItem(PROGRESS_STORAGE_KEY);
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw) as {
          completedConcepts?: string[];
          placement?: Partial<Record<SubjectId, PlacementResult>>;
        };
        if (Array.isArray(parsed?.completedConcepts)) setCompletedConcepts(parsed.completedConcepts);
        if (parsed?.placement) setPlacement(parsed.placement);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const persist = useCallback((nextCompleted: string[], nextPlacement: Partial<Record<SubjectId, PlacementResult>>) => {
    if (remote) {
      return; // Supabase writes happen on mutations; we don't duplicate to local when remote.
    }
    if (!STORAGE) return;
    STORAGE.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ completedConcepts: nextCompleted, placement: nextPlacement }),
    ).catch(() => {});
  }, [remote]);

  const completeConcept = useCallback(
    async (conceptId: string) => {
      const supabase = getSupabase();
      if (supabase && user) {
        await addCompletedConcepts(supabase, user.id, [conceptId]);
        const ids = await loadCompletedConceptIds(supabase, user.id);
        setCompletedConcepts(ids);
        void refreshProfile();
        return;
      }
      setCompletedConcepts((current) => {
        if (current.includes(conceptId)) return current;
        const next = [...current, conceptId];
        persist(next, placement);
        return next;
      });
    },
    [user, placement, persist, refreshProfile],
  );

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
    [completedConcepts, topicAssessments],
  );

  const getTopicMastery = useCallback(
    (topicId: string) => {
      const conceptIds = getTopicConceptIds(topicId);
      if (conceptIds.length === 0 || topicAssessments[topicId]?.passed !== true) return 0;
      return Math.round(
        (conceptIds.filter((id) => completedConcepts.includes(id)).length / conceptIds.length) * 100,
      );
    },
    [completedConcepts, topicAssessments],
  );

  const getSubjectMastery = useCallback(
    (subjectId: SubjectId) => {
      const topicIds = Array.from(new Set(CONCEPTS.filter((concept) => concept.subjectId === subjectId).map((concept) => concept.topicId)));
      if (topicIds.length === 0) return 0;
      return Math.round((topicIds.filter(isTopicMastered).length / topicIds.length) * 100);
    },
    [isTopicMastered],
  );

  const recordTopicAssessment = useCallback(
    async (topicId: string, scorePct: number) => {
      const assessment = { topicId, scorePct, passed: scorePct >= 60 };
      setTopicAssessments((current) => ({ ...current, [topicId]: assessment }));
      const supabase = getSupabase();
      if (supabase && user) await saveTopicAssessment(supabase, user.id, assessment);
    },
    [user],
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
    async     (results: readonly PlacementResult[], _options?: RecordPlacementOptions) => {
      const supabase = getSupabase();
      if (supabase && user) {
        const nextPlacement = { ...placement };
        for (const result of results) nextPlacement[result.subjectId] = result;
        await savePlacement(supabase, user.id, nextPlacement as StoredPlacement);
        const [ids] = await Promise.all([
          loadCompletedConceptIds(supabase, user.id),
          loadPlacement(supabase, user.id).then((p) => setPlacement((p as any) ?? {})),
        ]);
        setCompletedConcepts(ids);
        void refreshProfile();
        return;
      }
      setPlacement((currentPlacement) => {
        const nextPlacement = { ...currentPlacement };
        for (const result of results) nextPlacement[result.subjectId] = result;

        setCompletedConcepts((current) => {
          persist(current, nextPlacement);
          return current;
        });

        return nextPlacement;
      });
    },
    [user, placement, persist, refreshProfile],
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
      topicAssessments,
      isTopicMastered,
      getTopicMastery,
      getSubjectMastery,
      recordTopicAssessment,
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
      recordPlacement,
      resetProgress,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  return useContext(ProgressContext);
}
