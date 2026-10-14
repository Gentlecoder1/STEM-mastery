import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export type AuthResult = { error: string | null };
export type SignUpResult = AuthResult & { needsVerification: boolean };

export type SignUpParams = {
  email: string;
  password: string;
  fullName?: string;
};

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** True while the persisted session is being restored on startup. */
  isInitializing: boolean;
  isAuthenticated: boolean;
  /** False when EXPO_PUBLIC_SUPABASE_* env vars are missing. */
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  verifySignupOtp: (email: string, token: string) => Promise<AuthResult>;
  resendSignupOtp: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const NOT_CONFIGURED = 'Authentication is not configured yet.';

/** Collects params from both the query string and the URL hash fragment. */
function parseAuthParams(url: string): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};
  const collect = (segment: string) => {
    for (const pair of segment.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
      const value = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : '';
      if (key) params[key] = value;
    }
  };
  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');
  if (queryIndex >= 0) {
    const end = hashIndex > queryIndex ? hashIndex : url.length;
    collect(url.slice(queryIndex + 1, end));
  }
  if (hashIndex >= 0) collect(url.slice(hashIndex + 1));
  return params;
}

const DEFAULT_AUTH: AuthContextValue = {
  session: null,
  user: null,
  isInitializing: false,
  isAuthenticated: false,
  isConfigured: false,
  signIn: async () => ({ error: NOT_CONFIGURED }),
  signUp: async () => ({ error: NOT_CONFIGURED, needsVerification: false }),
  verifySignupOtp: async () => ({ error: NOT_CONFIGURED }),
  resendSignupOtp: async () => ({ error: NOT_CONFIGURED }),
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextValue>(DEFAULT_AUTH);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(isSupabaseConfigured);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setIsInitializing(false);
      })
      .catch(() => {
        if (mounted) setIsInitializing(false);
      });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const params = parseAuthParams(url);
      try {
        if (params.code) {
          await supabase.auth.exchangeCodeForSession(params.code);
        } else if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
      } catch {
        // Ignore malformed or expired links; the user can log in manually.
      }
    };

    void Linking.getInitialURL().then(handleUrl).catch(() => {});
    const linkSub = Linking.addEventListener('url', (event) => {
      void handleUrl(event.url);
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
      linkSub.remove();
      appStateSub.remove();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error ? error.message : null };
  }, []);

  const signUp = useCallback(async (params: SignUpParams): Promise<SignUpResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED, needsVerification: false };
    const { data, error } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        ...(params.fullName ? { data: { full_name: params.fullName.trim() } } : {}),
      },
    });
    if (error) return { error: error.message, needsVerification: false };
    // When email confirmation is disabled a session is returned immediately.
    return { error: null, needsVerification: !data.session };
  }, []);

  const verifySignupOtp = useCallback(async (email: string, token: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'signup',
    });
    return { error: error ? error.message : null };
  }, []);

  const resendSignupOtp = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isInitializing,
      isAuthenticated: Boolean(session),
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      verifySignupOtp,
      resendSignupOtp,
      signOut,
    }),
    [session, isInitializing, signIn, signUp, verifySignupOtp, resendSignupOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
