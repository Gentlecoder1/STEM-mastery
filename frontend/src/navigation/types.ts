import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SubjectId } from '../theme';

export type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  Login: undefined;
  VerifyEmail: { email: string } | undefined;
  Onboarding: undefined;
  PlacementTest: undefined;
  Home: undefined;
  KnowledgeMap: { topicId?: string; conceptId?: string } | undefined;
  Subjects: undefined;
  SubjectDashboard: { subjectId: SubjectId };
  TopicOverview: { topicId?: string } | undefined;
  ConceptDetails: { conceptId: string; contextTopicId?: string; returnToConceptId?: string };
  ConceptLearning: { conceptId: string; startAt?: number; returnToConceptId?: string; topicId?: string; lessonIds?: string[]; studySeconds?: number; assessTopic?: boolean; assessmentIds?: string[] };
  ConceptQuiz: { conceptId: string; returnToConceptId?: string; topicId?: string; assessmentIds?: string[] };
  TopicQuiz: { topicId: string; topicTitle: string; studiedIds?: string[]; returnToConceptId?: string };
  Progress: undefined;
  TopicProgress: undefined;
  Challenge: undefined;
  ChallengeQuiz: { topicId: string; topicTitle: string };
  Search: { query?: string } | undefined;
  Profile: undefined;
  Settings: undefined;
  /** Thesis phone benchmark; only registered in EXPO_PUBLIC_BENCHMARK=1 builds. */
  Benchmark: { mode?: 'latency' | 'load'; minutes?: string; runId?: string; offline?: string; source?: 'local' | 'cloud' } | undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabKey = 'Home' | 'Subjects' | 'Progress' | 'Profile';