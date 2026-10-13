import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubjectId } from './theme';
import { getTopicConceptIds } from './data/learning';

const DOWNLOADS_STORAGE_KEY = 'stem-mastery.downloads.v1';

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

export const CLASS_OPTIONS = ['JSS3', 'SS1', 'SS2', 'SS3'] as const;
export type ClassLevel = (typeof CLASS_OPTIONS)[number];

export const SUBJECT_OPTIONS: readonly { id: SubjectId; label: string }[] = [
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
];

type PreferencesContextValue = {
  classLevel: ClassLevel;
  subjects: SubjectId[];
  dailyGoal: string;
  userName: string;
  location: string;
  downloadedLessons: string[];
  downloadsEnabled: boolean;
  saveClassAndSubjects: (classLevel: ClassLevel, subjects: SubjectId[]) => void;
  setDailyGoal: (goal: string) => void;
  saveProfile: (userName: string, location: string) => void;
  toggleTopicDownload: (topicId: string) => void;
  removeLessonDownload: (conceptId: string) => void;
  setDownloadsEnabled: (enabled: boolean) => void;
};

const DEFAULT_DOWNLOADED_LESSONS = [...getTopicConceptIds('topic-speed-velocity')];

const DEFAULT_PREFERENCES: PreferencesContextValue = {
  classLevel: 'SS1',
  subjects: ['mathematics', 'physics', 'chemistry'],
  dailyGoal: '20 minutes',
  userName: 'Iseoluwa',
  location: 'Lagos, Nigeria',
  downloadedLessons: DEFAULT_DOWNLOADED_LESSONS,
  downloadsEnabled: true,
  saveClassAndSubjects: () => {},
  setDailyGoal: () => {},
  saveProfile: () => {},
  toggleTopicDownload: () => {},
  removeLessonDownload: () => {},
  setDownloadsEnabled: () => {},
};

const PreferencesContext = createContext<PreferencesContextValue>(DEFAULT_PREFERENCES);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [classLevel, setClassLevel] = useState<ClassLevel>('SS1');
  const [subjects, setSubjects] = useState<SubjectId[]>(['mathematics', 'physics', 'chemistry']);
  const [dailyGoal, setDailyGoal] = useState('20 minutes');
  const [userName, setUserName] = useState('Iseoluwa');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [downloadedLessons, setDownloadedLessons] = useState<string[]>(DEFAULT_DOWNLOADED_LESSONS);
  const [downloadsEnabled, setDownloadsEnabled] = useState(true);

  useEffect(() => {
    if (!STORAGE) return;
    let mounted = true;
    STORAGE.getItem(DOWNLOADS_STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw) as { downloadedLessons?: string[] };
        if (Array.isArray(parsed?.downloadedLessons)) setDownloadedLessons(parsed.downloadedLessons);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const persistDownloads = useCallback((next: string[]) => {
    if (!STORAGE) return;
    STORAGE.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify({ downloadedLessons: next })).catch(() => {});
  }, []);

  const saveClassAndSubjects = useCallback((nextClass: ClassLevel, nextSubjects: SubjectId[]) => {
    setClassLevel(nextClass);
    setSubjects(nextSubjects);
  }, []);
  const saveProfile = useCallback((nextName: string, nextLocation: string) => {
    setUserName(nextName.trim() || 'Iseoluwa');
    setLocation(nextLocation.trim() || 'Lagos, Nigeria');
  }, []);
  const toggleTopicDownload = useCallback(
    (topicId: string) => {
      setDownloadedLessons((current) => {
        const lessonIds = getTopicConceptIds(topicId);
        const allDownloaded = lessonIds.length > 0 && lessonIds.every((id) => current.includes(id));
        const next = allDownloaded
          ? current.filter((id) => !lessonIds.includes(id))
          : Array.from(new Set([...current, ...lessonIds]));
        persistDownloads(next);
        return next;
      });
    },
    [persistDownloads],
  );
  const removeLessonDownload = useCallback(
    (conceptId: string) => {
      setDownloadedLessons((current) => {
        const next = current.filter((id) => id !== conceptId);
        persistDownloads(next);
        return next;
      });
    },
    [persistDownloads],
  );

  const value = useMemo(
    () => ({
      classLevel,
      subjects,
      dailyGoal,
      userName,
      location,
      downloadedLessons,
      downloadsEnabled,
      saveClassAndSubjects,
      setDailyGoal,
      saveProfile,
      toggleTopicDownload,
      removeLessonDownload,
      setDownloadsEnabled,
    }),
    [
      classLevel,
      subjects,
      dailyGoal,
      userName,
      location,
      downloadedLessons,
      downloadsEnabled,
      saveClassAndSubjects,
      saveProfile,
      toggleTopicDownload,
      removeLessonDownload,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
