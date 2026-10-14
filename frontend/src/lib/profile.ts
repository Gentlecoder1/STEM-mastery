import type { SupabaseClient, User } from '@supabase/supabase-js';

import { getSupabase } from './supabase';

export type Profile = {
  id: string;
  fullName: string;
  streak: number;
  xp: number;
  dailyGoal: string;
};

export type ProfilePatch = Partial<Omit<Profile, 'id'>>;

type ProfileRow = {
  id: string;
  full_name: string | null;
  streak: number | null;
  xp: number | null;
  daily_goal: string | null;
};

const NO_ROWS = 'PGRST116';

function mapRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    streak: row.streak ?? 0,
    xp: row.xp ?? 0,
    dailyGoal: row.daily_goal ?? '20 minutes',
  };
}

/** Loads the signed-in user's profile, creating an empty one if it is missing. */
export async function getOrCreateProfile(
  client: SupabaseClient,
  user: User,
): Promise<Profile> {
  const existing = await client
    .from('profiles')
    .select('id, full_name, streak, xp, daily_goal')
    .eq('id', user.id)
    .single();

  if (!existing.error && existing.data) {
    return mapRow(existing.data as ProfileRow);
  }
  if (existing.error && existing.error.code !== NO_ROWS) {
    throw existing.error;
  }

  const metaName =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  const created = await client
    .from('profiles')
    .insert({ id: user.id, full_name: metaName })
    .select('id, full_name, streak, xp, daily_goal')
    .single();

  if (created.error) throw created.error;
  return mapRow(created.data as ProfileRow);
}

/** Applies a partial update and returns the refreshed profile. */
export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  patch: ProfilePatch,
): Promise<Profile> {
  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.streak !== undefined) row.streak = patch.streak;
  if (patch.xp !== undefined) row.xp = patch.xp;
  if (patch.dailyGoal !== undefined) row.daily_goal = patch.dailyGoal;

  const { data, error } = await client
    .from('profiles')
    .update(row)
    .eq('id', userId)
    .select('id, full_name, streak, xp, daily_goal')
    .single();

  if (error) throw error;
  return mapRow(data as ProfileRow);
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export { getSupabase };
