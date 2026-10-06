import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyColors, colors, type ThemeColors, type ThemeMode } from './theme';

const THEME_STORAGE_KEY = 'stem-mastery.theme.mode';

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const STORAGE: StorageLike | null = (() => {
  try {
    const api = AsyncStorage as Partial<StorageLike> | null | undefined;
    return api && typeof api.getItem === 'function' ? (api as StorageLike) : null;
  } catch {
    return null;
  }
})();

async function readStoredMode(): Promise<ThemeMode | null> {
  if (!STORAGE) return null;
  try {
    const raw = await STORAGE.getItem(THEME_STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  } catch {
    return null;
  }
}

function writeStoredMode(mode: ThemeMode) {
  if (!STORAGE) return;
  STORAGE.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
}

export type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  statusBarStyle: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  isDark: false,
  statusBarStyle: 'dark',
  setMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    let mounted = true;
    readStoredMode().then((stored) => {
      if (!mounted || !stored) return;
      applyColors(stored);
      setModeState(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    applyColors(next);
    setModeState(next);
    writeStoredMode(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      statusBarStyle: mode === 'dark' ? 'light' : 'dark',
      setMode,
      toggleTheme: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (c: ThemeColors) => T,
): T {
  const { mode } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [mode]);
}