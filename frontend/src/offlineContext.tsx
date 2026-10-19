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
import { fetchLesson } from './lib/catalogApi';
import { mapQuestions, type QuizQuestion, type StructuredLesson } from './types/catalog';
import {
  emptyReading,
  loadAllReading,
  loadDownloads,
  loadLesson,
  loadPending,
  loadQuestions,
  removeLesson,
  removeQuestions,
  saveAllReading,
  saveDownloads,
  saveLesson,
  savePending,
  saveQuestions,
  type ReadingProgress,
} from './lib/offlineStore';
import { fetchConceptQuestions, syncProgress, type LessonProgressItem } from './lib/assessmentApi';
import { useConnectivity } from './connectivityContext';
import { useCatalog } from './catalogContext';

type OfflineContextValue = {
  downloads: string[];
  isDownloaded: (conceptId: string) => boolean;
  isTopicDownloaded: (topicId: string) => boolean;
  downloadConcept: (conceptId: string) => Promise<boolean>;
  downloadTopic: (topicId: string) => Promise<number>;
  removeDownload: (conceptId: string) => void;
  removeTopicDownload: (topicId: string) => void;
  getLesson: (conceptId: string) => StructuredLesson | null;
  ensureLesson: (conceptId: string) => Promise<StructuredLesson | null>;
  getQuestions: (conceptId: string) => QuizQuestion[] | null;
  ensureQuestions: (conceptId: string) => Promise<QuizQuestion[] | null>;
  getReading: (conceptId: string) => ReadingProgress;
  updateReading: (conceptId: string, patch: Partial<ReadingProgress>) => void;
  markLessonComplete: (conceptId: string) => void;
  queuedCount: number;
  pendingQuizCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

function toSyncItem(record: ReadingProgress): LessonProgressItem {
  return {
    conceptId: record.conceptId,
    lessonId: record.lessonId,
    progressPercent: record.progressPercent,
    lastSection: record.lastSection,
    lessonCompleted: record.lessonCompleted,
    quizPending: record.quizPending,
    completedOffline: record.completedOffline,
    startedAt: record.startedAt,
    lastOpenedAt: record.lastOpenedAt,
    updatedAt: record.updatedAt,
  };
}

const nowIso = () => new Date().toISOString();

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useConnectivity();
  const { getTopicConceptIds } = useCatalog();

  const [downloads, setDownloads] = useState<string[]>([]);
  const [lessons, setLessons] = useState<Record<string, StructuredLesson>>({});
  const [questions, setQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [reading, setReading] = useState<Record<string, ReadingProgress>>({});
  const [pending, setPending] = useState<Record<string, ReadingProgress>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const downloadsRef = useRef(downloads);
  downloadsRef.current = downloads;
  const lessonsRef = useRef(lessons);
  lessonsRef.current = lessons;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const readingRef = useRef(reading);
  readingRef.current = reading;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const hydrated = useRef(false);
  const syncing = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [storedDownloads, storedReading, storedPending] = await Promise.all([
        loadDownloads(),
        loadAllReading(),
        loadPending(),
      ]);
      if (!mounted) return;
      if (storedDownloads) setDownloads(storedDownloads);
      if (storedReading) setReading(storedReading);
      if (storedPending) setPending(storedPending);
      hydrated.current = true;
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistReading = useCallback((next: Record<string, ReadingProgress>) => {
    void saveAllReading(next);
  }, []);

  const persistPending = useCallback((next: Record<string, ReadingProgress>) => {
    void savePending(next);
  }, []);

  const persistDownloads = useCallback((next: string[]) => {
    void saveDownloads(next);
  }, []);

  const isDownloaded = useCallback(
    (conceptId: string) => downloadsRef.current.includes(conceptId),
    [],
  );

  const isTopicDownloaded = useCallback(
    (topicId: string) => {
      const ids = getTopicConceptIds(topicId);
      return ids.length > 0 && ids.every((id) => downloadsRef.current.includes(id));
    },
    [getTopicConceptIds],
  );

  const cacheLesson = useCallback(async (conceptId: string): Promise<StructuredLesson> => {
    const lesson = await fetchLesson(conceptId);
    await saveLesson(conceptId, lesson);
    setLessons((current) => ({ ...current, [conceptId]: lesson }));
    return lesson;
  }, []);

  const cacheQuestions = useCallback(async (conceptId: string): Promise<QuizQuestion[]> => {
    const conceptQuestions = mapQuestions(await fetchConceptQuestions(conceptId));
    await saveQuestions(conceptId, conceptQuestions);
    setQuestions((current) => ({ ...current, [conceptId]: conceptQuestions }));
    return conceptQuestions;
  }, []);

  const downloadConcept = useCallback(
    async (conceptId: string) => {
      if (!isApiConfigured || !isOnline) return false;
      try {
        await Promise.all([cacheLesson(conceptId), cacheQuestions(conceptId)]);
      } catch {
        return false;
      }
      setDownloads((current) => {
        if (current.includes(conceptId)) return current;
        const next = [...current, conceptId];
        persistDownloads(next);
        return next;
      });
      return true;
    },
    [cacheLesson, cacheQuestions, isOnline, persistDownloads],
  );

  const downloadTopic = useCallback(
    async (topicId: string) => {
      const ids = getTopicConceptIds(topicId);
      let completed = 0;
      for (let index = 0; index < ids.length; index += 4) {
        const batch = ids.slice(index, index + 4);
        const results = await Promise.all(batch.map(async (id) => {
          if (downloadsRef.current.includes(id)) {
            const [lesson, cachedQuestions] = await Promise.all([loadLesson(id), loadQuestions(id)]);
            if (lesson && cachedQuestions) return false;
          }
          return downloadConcept(id);
        }));
        completed += results.filter(Boolean).length;
      }
      return completed;
    },
    [downloadConcept, getTopicConceptIds],
  );

  const removeDownload = useCallback(
    (conceptId: string) => {
      setDownloads((current) => {
        if (!current.includes(conceptId)) return current;
        const next = current.filter((id) => id !== conceptId);
        persistDownloads(next);
        return next;
      });
      setLessons((current) => {
        if (!(conceptId in current)) return current;
        const next = { ...current };
        delete next[conceptId];
        return next;
      });
      setQuestions((current) => {
        if (!(conceptId in current)) return current;
        const next = { ...current };
        delete next[conceptId];
        return next;
      });
      void Promise.all([removeLesson(conceptId), removeQuestions(conceptId)]);
    },
    [persistDownloads],
  );

  const removeTopicDownload = useCallback(
    (topicId: string) => {
      for (const id of getTopicConceptIds(topicId)) removeDownload(id);
    },
    [getTopicConceptIds, removeDownload],
  );

  const ensureLesson = useCallback(
    async (conceptId: string): Promise<StructuredLesson | null> => {
      const inMemory = lessonsRef.current[conceptId];
      if (inMemory) return inMemory;
      const cached = await loadLesson(conceptId);
      if (cached) {
        setLessons((current) => ({ ...current, [conceptId]: cached.lesson }));
        return cached.lesson;
      }
      if (!isApiConfigured || !isOnline) return null;
      try {
        return await cacheLesson(conceptId);
      } catch {
        return null;
      }
    },
    [cacheLesson, isOnline],
  );

  const ensureQuestions = useCallback(
    async (conceptId: string): Promise<QuizQuestion[] | null> => {
      const inMemory = questionsRef.current[conceptId];
      if (inMemory) return inMemory;
      const cached = await loadQuestions(conceptId);
      if (cached) {
        setQuestions((current) => ({ ...current, [conceptId]: cached.questions }));
        return cached.questions;
      }
      if (!isApiConfigured || !isOnline) return null;
      try {
        return await cacheQuestions(conceptId);
      } catch {
        return null;
      }
    },
    [cacheQuestions, isOnline],
  );

  const getLesson = useCallback(
    (conceptId: string): StructuredLesson | null => lessons[conceptId] ?? null,
    [lessons],
  );

  const getQuestions = useCallback(
    (conceptId: string): QuizQuestion[] | null => questions[conceptId] ?? null,
    [questions],
  );

  const getReading = useCallback(
    (conceptId: string): ReadingProgress =>
      readingRef.current[conceptId] ?? emptyReading(conceptId),
    [],
  );

  const updateReading = useCallback(
    (conceptId: string, patch: Partial<ReadingProgress>) => {
      const timestamp = nowIso();
      const currentRecord = readingRef.current[conceptId] ?? emptyReading(conceptId);
      const nextRecord: ReadingProgress = {
        ...currentRecord,
        ...patch,
        conceptId,
        startedAt: currentRecord.startedAt ?? timestamp,
        lastOpenedAt: patch.lastOpenedAt ?? currentRecord.lastOpenedAt ?? timestamp,
        updatedAt: timestamp,
      };
      setReading((current) => {
        const next = { ...current, [conceptId]: nextRecord };
        persistReading(next);
        return next;
      });
      setPending((current) => {
        const next = { ...current, [conceptId]: nextRecord };
        persistPending(next);
        return next;
      });
    },
    [persistPending, persistReading],
  );

  const markLessonComplete = useCallback(
    (conceptId: string) => {
      updateReading(conceptId, {
        lessonCompleted: true,
        quizPending: true,
        completedOffline: !isOnline,
        progressPercent: 100,
      });
    },
    [isOnline, updateReading],
  );

  const syncNow = useCallback(async () => {
    if (!isApiConfigured || !isOnline || syncing.current) return;
    const items = Object.values(pendingRef.current);
    if (items.length === 0) return;
    syncing.current = true;
    setIsSyncing(true);
    try {
      const result = await syncProgress(items.map(toSyncItem));
      const serverByConcept = new Map(result.serverState.map((item) => [item.conceptId, item]));
      setReading((current) => {
        const next = { ...current };
        for (const conceptId of result.synced) {
          const server = serverByConcept.get(conceptId);
          if (!server) continue;
          next[conceptId] = {
            conceptId,
            lessonId: server.lessonId,
            progressPercent: server.progressPercent,
            lastSection: server.lastSection,
            lessonCompleted: server.lessonCompleted,
            quizPending: server.quizPending,
            completedOffline: server.completedOffline,
            startedAt: server.startedAt,
            lastOpenedAt: server.lastOpenedAt,
            updatedAt: server.updatedAt,
          };
        }
        persistReading(next);
        return next;
      });
      setPending((current) => {
        const next = { ...current };
        for (const conceptId of result.synced) delete next[conceptId];
        persistPending(next);
        return next;
      });
      setLastSyncedAt(nowIso());
    } catch {
      // keep the queue for the next attempt
    } finally {
      syncing.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, persistPending, persistReading]);

  useEffect(() => {
    if (isOnline && hydrated.current) void syncNow();
  }, [isOnline, syncNow]);

  const queuedCount = useMemo(() => Object.keys(pending).length, [pending]);
  const pendingQuizCount = useMemo(
    () => Object.values(reading).filter((record) => record.quizPending).length,
    [reading],
  );

  const value = useMemo<OfflineContextValue>(
    () => ({
      downloads,
      isDownloaded,
      isTopicDownloaded,
      downloadConcept,
      downloadTopic,
      removeDownload,
      removeTopicDownload,
      getLesson,
      ensureLesson,
      getQuestions,
      ensureQuestions,
      getReading,
      updateReading,
      markLessonComplete,
      queuedCount,
      pendingQuizCount,
      isSyncing,
      lastSyncedAt,
      syncNow,
    }),
    [
      downloads,
      isDownloaded,
      isTopicDownloaded,
      downloadConcept,
      downloadTopic,
      removeDownload,
      removeTopicDownload,
      getLesson,
      ensureLesson,
      getQuestions,
      ensureQuestions,
      questions,
      getReading,
      updateReading,
      markLessonComplete,
      pending,
      reading,
      queuedCount,
      pendingQuizCount,
      isSyncing,
      lastSyncedAt,
      syncNow,
    ],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
