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
import PracticeHomeScreen from './src/screens/PracticeHomeScreen';
import PracticeQuestionScreen from './src/screens/PracticeQuestionScreen';
import PracticeFeedbackScreen from './src/screens/PracticeFeedbackScreen';
import PracticeRecommendationScreen from './src/screens/PracticeRecommendationScreen';
import PracticeLessonScreen from './src/screens/PracticeLessonScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: colors.canvas,
    text: colors.ink,
    primary: colors.primary,
    border: 'transparent',
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

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
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTPScreen" component={OTPScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingFlow} />
          <Stack.Screen name="Home" component={HomeDashboardScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Subjects" component={SubjectsScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="SubjectDashboard" component={SubjectDashboardScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="TopicOverview" component={TopicOverviewScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ConceptDetails" component={ConceptDetailsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ConceptLearning" component={ConceptLearningScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Practice" component={PracticeHomeScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="PracticeQuestion" component={PracticeQuestionScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="PracticeFeedback" component={PracticeFeedbackScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="PracticeRecommendation" component={PracticeRecommendationScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="PracticeLesson" component={PracticeLessonScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});