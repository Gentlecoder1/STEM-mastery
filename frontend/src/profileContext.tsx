import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './auth/AuthContext';
import { usePreferences } from './preferencesContext';
import { getSupabase } from './lib/supabase';
import {
  firstNameOf,
  getOrCreateProfile,
  updateProfile as persistProfile,
  type Profile,
  type ProfilePatch,
} from './lib/profile';

type ProfileContextValue = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  /** First word of the profile's full name, for greetings. */
  firstName: string;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  isLoading: false,
  error: null,
  firstName: '',
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setProfile(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setProfile(await getOrCreateProfile(supabase, user));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load profile.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      const supabase = getSupabase();
      if (!supabase || !user) return;
      setProfile(await persistProfile(supabase, user.id, patch));
    },
    [user],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isLoading,
      error,
      firstName: profile ? firstNameOf(profile.fullName) : '',
      updateProfile,
      refreshProfile: load,
    }),
    [profile, isLoading, error, updateProfile, load],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  return useContext(ProfileContext);
}

/**
 * The name to greet the user with, sourced from their Supabase profile and
 * falling back to the locally saved preference. Returns '' when unknown.
 */
export function useDisplayName(): string {
  const { firstName } = useProfile();
  const { userName } = usePreferences();
  return firstName || userName.trim();
}
