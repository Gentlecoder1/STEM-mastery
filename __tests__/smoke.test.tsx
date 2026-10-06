import TestRenderer from 'react-test-renderer';
import type { NavigationProp } from '@react-navigation/native';

import HomeDashboardScreen from '../src/screens/HomeDashboardScreen';
import SubjectsScreen from '../src/screens/SubjectsScreen';
import SubjectDashboardScreen from '../src/screens/SubjectDashboardScreen';
import TopicOverviewScreen from '../src/screens/TopicOverviewScreen';
import ConceptDetailsScreen from '../src/screens/ConceptDetailsScreen';
import ConceptLearningScreen from '../src/screens/ConceptLearningScreen';
import PracticeHomeScreen from '../src/screens/PracticeHomeScreen';
import PracticeQuestionScreen from '../src/screens/PracticeQuestionScreen';
import PracticeFeedbackScreen from '../src/screens/PracticeFeedbackScreen';
import PracticeRecommendationScreen from '../src/screens/PracticeRecommendationScreen';
import PracticeLessonScreen from '../src/screens/PracticeLessonScreen';
import SplashScreen from '../src/screens/SplashScreen';
import SignUpScreen from '../src/screens/SignUpScreen';
import LoginScreen from '../src/screens/LoginScreen';
import OTPScreen from '../src/screens/OTPScreen';
import OnboardingFlow from '../src/screens/OnboardingFlow';
import type { RootStackParamList, RootScreenProps } from '../src/navigation/types';

const makeNavigation = () =>
  ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    replace: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    isFocused: () => true,
    canGoBack: () => true,
    setOptions: jest.fn(),
    dispatch: jest.fn(),
    getState: jest.fn(),
    getParent: jest.fn(),
    getId: jest.fn(),
    preload: jest.fn(),
  }) as unknown as NavigationProp<RootStackParamList>;

/**
 * Builds a smoke case for a screen. The single cast is at the fake-navigation
 * boundary; from there the screen's own prop types are fully enforced.
 */
function screenCase<K extends keyof RootStackParamList>(
  name: K,
  Screen: (props: RootScreenProps<K>) => React.JSX.Element,
  params?: RootStackParamList[K]
) {
  return {
    name,
    render: () => {
      const props = {
        navigation: makeNavigation(),
        route: { key: `${String(name)}-1`, name, params },
      } as unknown as RootScreenProps<K>;
      return <Screen {...props} />;
    },
  };
}

const CASES = [
  screenCase('Home', HomeDashboardScreen),
  screenCase('Subjects', SubjectsScreen),
  screenCase('SubjectDashboard', SubjectDashboardScreen, { subjectId: 'physics' }),
  screenCase('TopicOverview', TopicOverviewScreen),
  screenCase('ConceptDetails', ConceptDetailsScreen, { conceptId: 'concept-velocity' }),
  screenCase('ConceptLearning', ConceptLearningScreen, { conceptId: 'concept-velocity' }),
  screenCase('Splash', SplashScreen),
  screenCase('SignUp', SignUpScreen),
  screenCase('Login', LoginScreen),
  screenCase('OTPScreen', OTPScreen, { email: 'a@b.com' }),
  screenCase('Onboarding', OnboardingFlow),
  screenCase('Practice', PracticeHomeScreen),
  screenCase('PracticeQuestion', PracticeQuestionScreen, { index: 3 }),
  screenCase('PracticeQuestion', PracticeQuestionScreen, { index: 0 }),
  screenCase('PracticeQuestion', PracticeQuestionScreen, { index: 5 }),
  screenCase('PracticeFeedback', PracticeFeedbackScreen, { index: 3, selected: 'b' }),
  screenCase('PracticeFeedback', PracticeFeedbackScreen, {
    index: 5,
    writtenText: 'The line gets steeper, so velocity increases.',
  }),
  screenCase('PracticeRecommendation', PracticeRecommendationScreen),
  screenCase('PracticeLesson', PracticeLessonScreen),
];

function renderAndCollect(element: React.JSX.Element): string[] {
  const errors: string[] = [];
  const spy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  });
  try {
    TestRenderer.act(() => {
      TestRenderer.create(element);
    });
  } catch (e) {
    const err = e as { stack?: string } | undefined;
    errors.push('THREW: ' + (err?.stack ?? String(e)));
  } finally {
    spy.mockRestore();
  }
  return errors;
}

CASES.forEach(({ name, render }) => {
  it(`${name} renders without console errors`, () => {
    const errors = renderAndCollect(render());
    if (errors.length) {
      // eslint-disable-next-line no-console
      console.log(
        '\n##### ' + name + ' #####\n' +
          errors.map((e) => e.split('\n').slice(0, 6).join('\n')).join('\n---\n')
      );
    }
    expect(errors).toEqual([]);
  });
});