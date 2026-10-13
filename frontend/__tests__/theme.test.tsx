import TestRenderer from 'react-test-renderer';
import type { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from '../src/screens/LoginScreen';
import { ThemeProvider } from '../src/themeContext';
import { applyColors, colors, darkColors, lightColors } from '../src/theme';
import type { RootStackParamList, RootScreenProps } from '../src/navigation/types';

const THEME_KEY = 'stem-mastery.theme.mode';

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

const loginProps = () =>
  ({
    navigation: makeNavigation(),
    route: { key: 'Login-1', name: 'Login' },
  }) as unknown as RootScreenProps<'Login'>;

afterEach(async () => {
  applyColors('light');
  await AsyncStorage.removeItem(THEME_KEY);
});

it('applyColors swaps the active palette', () => {
  expect(colors.canvas).toBe(lightColors.canvas);
  applyColors('dark');
  expect(colors.canvas).toBe(darkColors.canvas);
  expect(colors.surface).toBe(darkColors.surface);
  applyColors('light');
  expect(colors.canvas).toBe(lightColors.canvas);
});

it('renders screen styles from the dark palette after applyColors(dark)', async () => {
  applyColors('dark');

  let renderer: TestRenderer.ReactTestRenderer | undefined;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(<LoginScreen {...loginProps()} />);
  });

  const root = renderer?.toJSON() as TestRenderer.ReactTestRendererJSON | null;
  expect(root).not.toBeNull();
  const style = root!.props.style as { backgroundColor?: string };
  expect(style.backgroundColor).toBe(darkColors.canvas);
});

it('renders screens inside ThemeProvider without errors', async () => {
  const errors: string[] = [];
  const spy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  });
  try {
    await TestRenderer.act(async () => {
      TestRenderer.create(
        <ThemeProvider>
          <LoginScreen {...loginProps()} />
        </ThemeProvider>,
      );
    });
  } catch (e) {
    errors.push('THREW: ' + String(e));
  } finally {
    spy.mockRestore();
  }
  expect(errors).toEqual([]);
});

it('ThemeProvider restores persisted dark mode on mount', async () => {
  await AsyncStorage.setItem(THEME_KEY, 'dark');

  let renderer: TestRenderer.ReactTestRenderer | undefined;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <LoginScreen {...loginProps()} />
      </ThemeProvider>,
    );
  });
  await TestRenderer.act(async () => {
    await Promise.resolve();
  });
  await TestRenderer.act(async () => {
    await Promise.resolve();
  });

  const root = renderer?.toJSON() as TestRenderer.ReactTestRendererJSON | null;
  expect(root).not.toBeNull();
  const style = root!.props.style as { backgroundColor?: string };
  expect(style.backgroundColor).toBe(darkColors.canvas);
});
