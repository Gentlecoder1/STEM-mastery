import React from 'react';
import TestRenderer from 'react-test-renderer';

import HomeDashboardScreen from '../src/screens/HomeDashboardScreen';
import SubjectsScreen from '../src/screens/SubjectsScreen';
import SplashScreen from '../src/screens/SplashScreen';
import SignUpScreen from '../src/screens/SignUpScreen';
import LoginScreen from '../src/screens/LoginScreen';
import OTPScreen from '../src/screens/OTPScreen';
import OnboardingFlow from '../src/screens/OnboardingFlow';

const nav = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  replace: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  isFocused: () => true,
  canGoBack: () => true,
};

const SCREENS = [
  ['HomeDashboardScreen', HomeDashboardScreen],
  ['SubjectsScreen', SubjectsScreen],
  ['SplashScreen', SplashScreen],
  ['SignUpScreen', SignUpScreen],
  ['LoginScreen', LoginScreen],
  ['OTPScreen', OTPScreen],
  ['OnboardingFlow', OnboardingFlow],
];

function renderAndCollect(element) {
  const errors = [];
  const spy = jest.spyOn(console, 'error').mockImplementation((...a) => {
    errors.push(a.map(String).join(' '));
  });
  try {
    TestRenderer.act(() => {
      TestRenderer.create(element);
    });
  } catch (e) {
    errors.push('THREW: ' + ((e && e.stack) || String(e)));
  } finally {
    spy.mockRestore();
  }
  return errors;
}

SCREENS.forEach(([name, Screen]) => {
  it(`${name}`, () => {
    const errors = renderAndCollect(
      <Screen navigation={nav} route={{ name, params: {} }} />
    );
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