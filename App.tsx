import { useMemo } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { colors } from './src/theme';
import { ThemeProvider, useTheme, useThemedStyles } from './src/themeContext';
import ThemeRevealOverlay from './src/components/ThemeRevealOverlay';
import SplashScreen from './src/screens/SplashScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import SubjectsScreen from './src/screens/SubjectsScreen';
import SubjectDashboardScreen from './src/screens/SubjectDashboardScreen';
import TopicOverviewScreen from './src/screens/TopicOverviewScreen';
import ConceptDetailsScreen from './src/screens/ConceptDetailsScreen';
import ConceptLearningScreen from './src/screens/ConceptLearningScreen';
import ConceptQuizScreen from './src/screens/ConceptQuizScreen';
import PracticeHomeScreen from './src/screens/PracticeHomeScreen';
import PracticeQuestionScreen from './src/screens/PracticeQuestionScreen';
import PracticeFeedbackScreen from './src/screens/PracticeFeedbackScreen';
import PracticeRecommendationScreen from './src/screens/PracticeRecommendationScreen';
import PracticeLessonScreen from './src/screens/PracticeLessonScreen';
import PracticeQuizResultScreen from './src/screens/PracticeQuizResultScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ConceptProgressScreen from './src/screens/ConceptProgressScreen';
import ChallengeScreen from './src/screens/ChallengeScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppShell() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const { mode } = useTheme();
  const styles = useThemedStyles(createStyles);

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.canvas,
        card: colors.canvas,
        text: colors.ink,
        primary: colors.primary,
        border: 'transparent',
      },
    }),
    [mode],
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            animationMatchesGesture: true,
            gestureEnabled: true,
            freezeOnBlur: false,
            presentation: 'card',
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTPScreen" component={OTPScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingFlow} />
          <Stack.Screen name="Home" component={HomeDashboardScreen} />
          <Stack.Screen name="Subjects" component={SubjectsScreen} />
          <Stack.Screen name="SubjectDashboard" component={SubjectDashboardScreen} />
          <Stack.Screen name="TopicOverview" component={TopicOverviewScreen} />
          <Stack.Screen name="ConceptDetails" component={ConceptDetailsScreen} />
          <Stack.Screen name="ConceptLearning" component={ConceptLearningScreen} />
          <Stack.Screen name="ConceptQuiz" component={ConceptQuizScreen} />
          <Stack.Screen name="Practice" component={PracticeHomeScreen} />
          <Stack.Screen name="PracticeQuestion" component={PracticeQuestionScreen} />
          <Stack.Screen name="PracticeFeedback" component={PracticeFeedbackScreen} />
          <Stack.Screen name="PracticeRecommendation" component={PracticeRecommendationScreen} />
          <Stack.Screen name="PracticeLesson" component={PracticeLessonScreen} />
          <Stack.Screen name="PracticeQuizResult" component={PracticeQuizResultScreen} />
          <Stack.Screen name="Progress" component={ProgressScreen} />
          <Stack.Screen name="ConceptProgress" component={ConceptProgressScreen} />
          <Stack.Screen name="Challenge" component={ChallengeScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ThemeRevealOverlay />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

const createStyles = () => StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
