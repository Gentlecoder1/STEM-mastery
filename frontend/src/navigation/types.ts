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
  Subjects: undefined;
  SubjectDashboard: { subjectId: SubjectId };
  TopicOverview: { topicId?: string } | undefined;
  ConceptDetails: { conceptId: string };
  ConceptLearning: { conceptId: string; startAt?: number };
  TopicQuiz: { topicId: string; topicTitle: string };
  Progress: undefined;
  TopicProgress: undefined;
  Challenge: undefined;
  ChallengeQuiz: { topicId: string; topicTitle: string };
  Search: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabKey = 'Home' | 'Subjects' | 'Progress' | 'Profile';