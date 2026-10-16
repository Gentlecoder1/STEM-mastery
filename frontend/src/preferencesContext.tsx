import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SubjectId } from './theme';
import { useOffline } from './offlineContext';
import { useProfile } from './profileContext';
import { getSupabase } from './lib/supabase';

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

const PreferencesContext = createContext<PreferencesContextValue>({
  classLevel: 'SS1',
  subjects: ['mathematics', 'physics', 'chemistry'],
  dailyGoal: '20 minutes',
  userName: '',
  location: 'Lagos, Nigeria',
  downloadedLessons: [],
  downloadsEnabled: true,
  saveClassAndSubjects: async () => {},
  setDailyGoal: async () => {},
  saveProfile: async () => {},
  toggleTopicDownload: () => {},
  removeLessonDownload: () => {},
  setDownloadsEnabled: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useProfile();
  const offline = useOffline();
  const [classLevel, setClassLevel] = useState<ClassLevel>('SS1');
  const [subjects, setSubjects] = useState<SubjectId[]>(['mathematics', 'physics', 'chemistry']);
  const [dailyGoal, setDailyGoal] = useState('20 minutes');
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [downloadsEnabled, setDownloadsEnabled] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setClassLevel((profile.classLevel ?? 'SS1') as ClassLevel);
    setSubjects(
      profile.subjects && profile.subjects.length > 0
        ? profile.subjects
        : ['mathematics', 'physics', 'chemistry'],
    );
    setDailyGoal(profile.dailyGoal || '20 minutes');
    setUserName(profile.fullName || '');
    setLocation(profile.location || 'Lagos, Nigeria');
  }, [profile]);

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
      const trimmedName = nextName.trim();
      const trimmedLocation = nextLocation.trim() || 'Lagos, Nigeria';
      setUserName(trimmedName);
      setLocation(trimmedLocation);
      const supabase = getSupabase();
      if (supabase && profile) {
        await updateProfile({ fullName: trimmedName, location: trimmedLocation });
      }
    },
    [profile, updateProfile],
  );

  const toggleTopicDownload = useCallback(
    (topicId: string) => {
      if (offline.isTopicDownloaded(topicId)) {
        offline.removeTopicDownload(topicId);
        return;
      }
      void offline.downloadTopic(topicId);
    },
    [offline],
  );

  const removeLessonDownload = useCallback(
    (conceptId: string) => {
      offline.removeDownload(conceptId);
    },
    [offline],
  );

  const setDailyGoalValue = useCallback(
    async (goal: string) => {
      setDailyGoal(goal);
      const supabase = getSupabase();
      if (supabase && profile) {
        await updateProfile({ dailyGoal: goal });
      }
    },
    [profile, updateProfile],
  );

  const value = useMemo(
    () => ({
      classLevel,
      subjects,
      dailyGoal,
      userName,
      location,
      downloadedLessons: offline.downloads,
      downloadsEnabled,
      saveClassAndSubjects,
      setDailyGoal: setDailyGoalValue,
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
      offline.downloads,
      downloadsEnabled,
      saveClassAndSubjects,
      setDailyGoalValue,
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
