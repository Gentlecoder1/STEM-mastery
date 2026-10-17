import TestRenderer from 'react-test-renderer';
import type { NavigationProp } from '@react-navigation/native';

import HomeDashboardScreen from '../src/screens/HomeDashboardScreen';
import SubjectsScreen from '../src/screens/SubjectsScreen';
import SubjectDashboardScreen from '../src/screens/SubjectDashboardScreen';
import TopicOverviewScreen from '../src/screens/TopicOverviewScreen';
import ConceptDetailsScreen from '../src/screens/ConceptDetailsScreen';
import ConceptLearningScreen from '../src/screens/ConceptLearningScreen';
import TopicQuizScreen from '../src/screens/TopicQuizScreen';
import ProgressScreen from '../src/screens/ProgressScreen';
import TopicProgressScreen from '../src/screens/TopicProgressScreen';
import ChallengeScreen from '../src/screens/ChallengeScreen';
import SearchScreen from '../src/screens/SearchScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import SettingsScreen from '../src/screens/SettingsScreen';
import SplashScreen from '../src/screens/SplashScreen';
import SignUpScreen from '../src/screens/SignUpScreen';
import LoginScreen from '../src/screens/LoginScreen';
import VerifyEmailScreen from '../src/screens/VerifyEmailScreen';
import OnboardingFlow from '../src/screens/OnboardingFlow';
import { CatalogProvider } from '../src/catalogContext';
import { OfflineProvider } from '../src/offlineContext';
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
  screenCase('TopicQuiz', TopicQuizScreen, { topicId: 'topic-speed-velocity', topicTitle: 'Speed and velocity' }),
  screenCase('Splash', SplashScreen),
  screenCase('SignUp', SignUpScreen),
  screenCase('Login', LoginScreen),
  screenCase('VerifyEmail', VerifyEmailScreen, { email: 'a@b.com' }),
  screenCase('Onboarding', OnboardingFlow),
  screenCase('Progress', ProgressScreen),
  screenCase('TopicProgress', TopicProgressScreen),
  screenCase('Challenge', ChallengeScreen),
  screenCase('Search', SearchScreen),
  screenCase('Profile', ProfileScreen),
  screenCase('Settings', SettingsScreen),
];

function renderAndCollect(element: React.JSX.Element): string[] {
  const errors: string[] = [];
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;
  const spy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  });
  try {
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <CatalogProvider>
          <OfflineProvider>{element}</OfflineProvider>
        </CatalogProvider>,
      );
    });
  } catch (e) {
    const err = e as { stack?: string } | undefined;
    errors.push('THREW: ' + (err?.stack ?? String(e)));
  } finally {
    if (renderer) TestRenderer.act(() => renderer?.unmount());
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