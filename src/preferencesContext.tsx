import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { SubjectId } from './theme';

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
  downloadedTopics: string[];
  downloadsEnabled: boolean;
  saveClassAndSubjects: (classLevel: ClassLevel, subjects: SubjectId[]) => void;
  setDailyGoal: (goal: string) => void;
  saveProfile: (userName: string, location: string) => void;
  toggleTopicDownload: (topicId: string) => void;
  setDownloadsEnabled: (enabled: boolean) => void;
};

const DEFAULT_PREFERENCES: PreferencesContextValue = {
  classLevel: 'SS1',
  subjects: ['mathematics', 'physics', 'chemistry'],
  dailyGoal: '20 minutes',
  userName: 'Iseoluwa',
  location: 'Lagos, Nigeria',
  downloadedTopics: ['topic-speed-velocity'],
  downloadsEnabled: true,
  saveClassAndSubjects: () => {},
  setDailyGoal: () => {},
  saveProfile: () => {},
  toggleTopicDownload: () => {},
  setDownloadsEnabled: () => {},
};

const PreferencesContext = createContext<PreferencesContextValue>(DEFAULT_PREFERENCES);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [classLevel, setClassLevel] = useState<ClassLevel>('SS1');
  const [subjects, setSubjects] = useState<SubjectId[]>(['mathematics', 'physics', 'chemistry']);
  const [dailyGoal, setDailyGoal] = useState('20 minutes');
  const [userName, setUserName] = useState('Iseoluwa');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [downloadedTopics, setDownloadedTopics] = useState<string[]>(['topic-speed-velocity']);
  const [downloadsEnabled, setDownloadsEnabled] = useState(true);

  const saveClassAndSubjects = useCallback((nextClass: ClassLevel, nextSubjects: SubjectId[]) => {
    setClassLevel(nextClass);
    setSubjects(nextSubjects);
  }, []);
  const saveProfile = useCallback((nextName: string, nextLocation: string) => {
    setUserName(nextName.trim() || 'Iseoluwa');
    setLocation(nextLocation.trim() || 'Lagos, Nigeria');
  }, []);
  const toggleTopicDownload = useCallback((topicId: string) => {
    setDownloadedTopics((current) =>
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId],
    );
  }, []);

  const value = useMemo(
    () => ({
      classLevel,
      subjects,
      dailyGoal,
      userName,
      location,
      downloadedTopics,
      downloadsEnabled,
      saveClassAndSubjects,
      setDailyGoal,
      saveProfile,
      toggleTopicDownload,
      setDownloadsEnabled,
    }),
    [
      classLevel,
      subjects,
      dailyGoal,
      userName,
      location,
      downloadedTopics,
      downloadsEnabled,
      saveClassAndSubjects,
      saveProfile,
      toggleTopicDownload,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
