import { Modal, StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import { CatalogProvider } from '../src/catalogContext';
import { OfflineProvider } from '../src/offlineContext';
import SettingsScreen from '../src/screens/SettingsScreen';
import type { RootScreenProps } from '../src/navigation/types';

it('opens Edit profile in the full-height slide-up drawer', () => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  } as unknown as RootScreenProps<'Settings'>['navigation'];
  const route = {
    key: 'settings-test',
    name: 'Settings',
    params: undefined,
  } as RootScreenProps<'Settings'>['route'];

  const result: { renderer?: TestRenderer.ReactTestRenderer } = {};
  act(() => {
    result.renderer = TestRenderer.create(
      <CatalogProvider>
        <OfflineProvider>
          <SettingsScreen navigation={navigation} route={route} />
        </OfflineProvider>
      </CatalogProvider>,
    );
  });
  const renderer = result.renderer;
  if (!renderer) throw new Error('Settings screen did not render.');

  act(() => {
    renderer.root.findByProps({ accessibilityLabel: 'Edit profile' }).props.onPress();
  });

  expect(renderer.root.findByType(Modal).props.visible).toBe(true);
  expect(
    StyleSheet.flatten(renderer.root.findByProps({ testID: 'bottom-sheet-drawer' }).props.style),
  ).toMatchObject({ height: '100%', maxHeight: '100%' });

  act(() => renderer.unmount());
});
