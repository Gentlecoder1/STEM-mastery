jest.mock('expo-font', () => ({
  loadAsync: jest.fn(async () => {}),
  isLoaded: jest.fn(() => true),
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-status-bar', () => {
  const { View } = require('react-native');
  return { StatusBar: () => null, __esModule: true, default: () => null };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 42, right: 0, bottom: 24, left: 0 };
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: inset },
  };
});

jest.mock('@expo-google-fonts/inter', () => ({
  useFonts: jest.fn(() => [true, null]),
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
  Inter_800ExtraBold: 'Inter_800ExtraBold',
}));