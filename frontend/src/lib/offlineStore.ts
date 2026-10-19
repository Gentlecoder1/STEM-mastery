import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LearningContent, QuizQuestion } from '../types/catalog';

const LESSON_PREFIX = 'stem-mastery.lesson.v1.';
const QUESTIONS_PREFIX = 'stem-mastery.questions.v1.';
export const DOWNLOADS_STORAGE_KEY = 'stem-mastery.downloads.v2';
export const READING_STORAGE_KEY = 'stem-mastery.reading.v1';
export const PENDING_STORAGE_KEY = 'stem-mastery.pending.v1';

export type ReadingProgress = {
  conceptId: string;
  lessonId: string | null;
  progressPercent: number;
  lastSection: string | null;
  lessonCompleted: boolean;
  quizPending: boolean;
  completedOffline: boolean;
  startedAt: string | null;
  lastOpenedAt: string | null;
  updatedAt: string | null;
};

export function emptyReading(conceptId: string): ReadingProgress {
  return {
    conceptId,
    lessonId: null,
    progressPercent: 0,
    lastSection: null,
    lessonCompleted: false,
    quizPending: false,
    completedOffline: false,
    startedAt: null,
    lastOpenedAt: null,
    updatedAt: null,
  };
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort
  }
}

const lessonKey = (conceptId: string) => `${LESSON_PREFIX}${conceptId}`;

export type LessonCache = { conceptId: string; content: LearningContent[]; savedAt: string };

export function loadLesson(conceptId: string): Promise<LessonCache | null> {
  return readJson<LessonCache>(lessonKey(conceptId));
}

export function saveLesson(conceptId: string, content: LearningContent[]): Promise<void> {
  return writeJson(lessonKey(conceptId), {
    conceptId,
    content,
    savedAt: new Date().toISOString(),
  });
}

const questionsKey = (conceptId: string) => `${QUESTIONS_PREFIX}${conceptId}`;

export type QuestionCache = { conceptId: string; questions: QuizQuestion[]; savedAt: string };

export function loadQuestions(conceptId: string): Promise<QuestionCache | null> {
  return readJson<QuestionCache>(questionsKey(conceptId));
}

export function saveQuestions(conceptId: string, questions: QuizQuestion[]): Promise<void> {
  return writeJson(questionsKey(conceptId), {
    conceptId,
    questions,
    savedAt: new Date().toISOString(),
  });
}

export function removeLesson(conceptId: string): Promise<void> {
  return AsyncStorage.removeItem(lessonKey(conceptId)).catch(() => {});
}

export function removeQuestions(conceptId: string): Promise<void> {
  return AsyncStorage.removeItem(questionsKey(conceptId)).catch(() => {});
}

export function loadDownloads(): Promise<string[] | null> {
  return readJson<string[]>('stem-mastery.downloads.v2');
}

export const saveDownloads = (ids: string[]) => writeJson('stem-mastery.downloads.v2', ids);

export function loadAllReading(): Promise<Record<string, ReadingProgress> | null> {
  return readJson<Record<string, ReadingProgress>>('stem-mastery.reading.v1');
}

export const saveAllReading = (records: Record<string, ReadingProgress>) =>
  writeJson('stem-mastery.reading.v1', records);

export function loadPending(): Promise<Record<string, ReadingProgress> | null> {
  return readJson<Record<string, ReadingProgress>>('stem-mastery.pending.v1');
}

export const savePending = (records: Record<string, ReadingProgress>) =>
  writeJson('stem-mastery.pending.v1', records);
