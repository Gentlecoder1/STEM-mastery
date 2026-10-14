import { useMemo } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
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
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { ProfileProvider, useProfile } from './src/profileContext';
import { PreferencesProvider } from './src/preferencesContext';
import { ProgressProvider } from './src/progressContext';
import ThemeRevealOverlay from './src/components/ThemeRevealOverlay';
import SplashScreen from './src/screens/SplashScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';
import PlacementTestScreen from './src/screens/PlacementTestScreen';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import SubjectsScreen from './src/screens/SubjectsScreen';
import SubjectDashboardScreen from './src/screens/SubjectDashboardScreen';
import TopicOverviewScreen from './src/screens/TopicOverviewScreen';
import ConceptDetailsScreen from './src/screens/ConceptDetailsScreen';
import ConceptLearningScreen from './src/screens/ConceptLearningScreen';
import ConceptQuizScreen from './src/screens/ConceptQuizScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ConceptProgressScreen from './src/screens/ConceptProgressScreen';
import ChallengeScreen from './src/screens/ChallengeScreen';
import ChallengeQuizScreen from './src/screens/ChallengeQuizScreen';
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
  const { isInitializing, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
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

  if (
    !fontsLoaded ||
    isInitializing ||
    (isAuthenticated && (profileLoading || (!profile && !profileError)))
  ) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated && profileError && !profile) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>We could not load your profile. Please try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={isAuthenticated && profile?.onboardedAt ? 'Home' : isAuthenticated ? 'Onboarding' : 'Splash'}
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
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingFlow} />
              <Stack.Screen name="PlacementTest" component={PlacementTestScreen} />
              <Stack.Screen name="Home" component={HomeDashboardScreen} />
              <Stack.Screen name="Subjects" component={SubjectsScreen} />
              <Stack.Screen name="SubjectDashboard" component={SubjectDashboardScreen} />
              <Stack.Screen name="TopicOverview" component={TopicOverviewScreen} />
              <Stack.Screen name="ConceptDetails" component={ConceptDetailsScreen} />
              <Stack.Screen name="ConceptLearning" component={ConceptLearningScreen} />
              <Stack.Screen name="ConceptQuiz" component={ConceptQuizScreen} />
              <Stack.Screen name="Progress" component={ProgressScreen} />
              <Stack.Screen name="ConceptProgress" component={ConceptProgressScreen} />
              <Stack.Screen name="Challenge" component={ChallengeScreen} />
              <Stack.Screen name="ChallengeQuiz" component={ChallengeQuizScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <ThemeRevealOverlay />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <PreferencesProvider>
          <ProgressProvider>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </ProgressProvider>
        </PreferencesProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

const createStyles = () => StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  errorText: {
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
