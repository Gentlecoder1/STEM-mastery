import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubjectId } from './theme';
import { getTopicConceptIds } from './data/learning';
import { useProfile } from './profileContext';
import { getSupabase } from './lib/supabase';

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
  saveClassAndSubjects: (classLevel: ClassLevel, subjects: SubjectId[]) => Promise<void>;
  setDailyGoal: (goal: string) => Promise<void>;
  saveProfile: (userName: string, location: string) => Promise<void>;
  toggleTopicDownload: (topicId: string) => void;
  removeLessonDownload: (conceptId: string) => void;
  setDownloadsEnabled: (enabled: boolean) => void;
};

const DEFAULT_DOWNLOADED_LESSONS = [...getTopicConceptIds('topic-speed-velocity')];

const DEFAULT_PREFERENCES: PreferencesContextValue = {
  classLevel: 'SS1',
  subjects: ['mathematics', 'physics', 'chemistry'],
  dailyGoal: '20 minutes',
  userName: '',
  location: 'Lagos, Nigeria',
  downloadedLessons: DEFAULT_DOWNLOADED_LESSONS,
  downloadsEnabled: true,
  saveClassAndSubjects: async () => {},
  setDailyGoal: async () => {},
  saveProfile: async () => {},
  toggleTopicDownload: () => {},
  removeLessonDownload: () => {},
  setDownloadsEnabled: () => {},
};

const PreferencesContext = createContext<PreferencesContextValue>(DEFAULT_PREFERENCES);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useProfile();
  const [classLevel, setClassLevel] = useState<ClassLevel>('SS1');
  const [subjects, setSubjects] = useState<SubjectId[]>(['mathematics', 'physics', 'chemistry']);
  const [dailyGoal, setDailyGoal] = useState('20 minutes');
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [downloadedLessons, setDownloadedLessons] = useState<string[]>(DEFAULT_DOWNLOADED_LESSONS);
  const [downloadsEnabled, setDownloadsEnabled] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setClassLevel((profile.classLevel ?? 'SS1') as ClassLevel);
    setSubjects(profile.subjects && profile.subjects.length > 0 ? profile.subjects : ['mathematics', 'physics', 'chemistry']);
    setDailyGoal(profile.dailyGoal || '20 minutes');
    setUserName(profile.fullName || '');
    setLocation(profile.location || 'Lagos, Nigeria');
  }, [profile]);

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

  const saveClassAndSubjects = useCallback(
    async (nextClass: ClassLevel, nextSubjects: SubjectId[]) => {
      setClassLevel(nextClass);
      setSubjects(nextSubjects);
      const supabase = getSupabase();
      if (supabase && profile) {
        await updateProfile({ classLevel: nextClass, subjects: nextSubjects });
      }
    },
    [profile, updateProfile],
  );
  const saveProfile = useCallback(
    async (nextName: string, nextLocation: string) => {
      setUserName(nextName.trim());
      setLocation(nextLocation.trim() || 'Lagos, Nigeria');
      const supabase = getSupabase();
      if (supabase && profile) {
        await updateProfile({ fullName: nextName.trim(), location: nextLocation.trim() || 'Lagos, Nigeria' });
      }
    },
    [profile, updateProfile],
  );
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
      setDailyGoal: async (goal: string) => {
        setDailyGoal(goal);
        const supabase = getSupabase();
        if (supabase && profile) {
          await updateProfile({ dailyGoal: goal });
        }
      },
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
      profile,
      updateProfile,
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
