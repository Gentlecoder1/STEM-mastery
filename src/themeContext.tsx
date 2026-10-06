import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export type ThemeReveal = {
  x: number;
  y: number;
  next: ThemeMode;
};

export type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  statusBarStyle: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  reveal: ThemeReveal | null;
  startThemeReveal: (x: number, y: number) => void;
  commitThemeReveal: () => void;
  clearThemeReveal: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  isDark: false,
  statusBarStyle: 'dark',
  setMode: () => {},
  toggleTheme: () => {},
  reveal: null,
  startThemeReveal: () => {},
  commitThemeReveal: () => {},
  clearThemeReveal: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [reveal, setReveal] = useState<ThemeReveal | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

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

  const startThemeReveal = useCallback(
    (x: number, y: number) => {
      setReveal((prev) => {
        if (prev) return prev;
        const current = modeRef.current;
        return { x, y, next: current === 'dark' ? 'light' : 'dark' };
      });
    },
    [],
  );

  const commitThemeReveal = useCallback(() => {
    if (reveal) setMode(reveal.next);
  }, [reveal, setMode]);

  const clearThemeReveal = useCallback(() => {
    setReveal(null);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      statusBarStyle: mode === 'dark' ? 'light' : 'dark',
      setMode,
      toggleTheme: () => setMode(mode === 'dark' ? 'light' : 'dark'),
      reveal,
      startThemeReveal,
      commitThemeReveal,
      clearThemeReveal,
    }),
    [mode, setMode, reveal, startThemeReveal, commitThemeReveal, clearThemeReveal],
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