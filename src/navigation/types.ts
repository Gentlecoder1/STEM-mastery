import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SubjectId } from '../theme';

export type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  Login: undefined;
  OTPScreen: { email: string } | undefined;
  Onboarding: undefined;
  Home: undefined;
  Subjects: undefined;
  SubjectDashboard: { subjectId: SubjectId };
  TopicOverview: undefined;
  ConceptDetails: { conceptId: string };
  ConceptLearning: { conceptId: string; startAt?: number };
  ConceptQuiz: { conceptId: string };
  Practice: undefined;
  PracticeQuestion: { index: number };
  PracticeFeedback: { index: number; selected?: string; writtenText?: string };
  PracticeRecommendation: undefined;
  PracticeLesson: undefined;
  PracticeQuizResult: { correct?: number; xp?: number } | undefined;
  Progress: undefined;
  ConceptProgress: undefined;
  Challenge: undefined;
  Search: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabKey = 'Home' | 'Subjects' | 'Practice' | 'Progress' | 'Profile';