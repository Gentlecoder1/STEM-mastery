import type { SupabaseClient, User } from '@supabase/supabase-js';

import type { ClassLevel, SubjectId } from '../theme';
import { getSupabase } from './supabase';

export type Profile = {
  id: string;
  fullName: string;
  streak: number;
  xp: number;
  dailyGoal: string;
  classLevel: ClassLevel | null;
  subjects: SubjectId[];
  location: string;
  lastActiveDate: string | null;
  onboardedAt: string | null;
};

export type ProfilePatch = Partial<Omit<Profile, 'id'>>;

type ProfileRow = {
  id: string;
  full_name: string | null;
  streak: number | null;
  xp: number | null;
  daily_goal: string | null;
  class_level: string | null;
  subjects: string[] | null;
  location: string | null;
  last_active_date: string | null;
  onboarded_at: string | null;
};

const NO_ROWS = 'PGRST116';

const PROFILE_COLUMNS =
  'id, full_name, streak, xp, daily_goal, class_level, subjects, location, last_active_date, onboarded_at';

function mapRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    streak: row.streak ?? 0,
    xp: row.xp ?? 0,
    dailyGoal: row.daily_goal ?? '20 minutes',
    classLevel: (row.class_level as ClassLevel | null) ?? null,
    subjects: (row.subjects as SubjectId[] | null) ?? [],
    location: row.location ?? '',
    lastActiveDate: row.last_active_date ?? null,
    onboardedAt: row.onboarded_at ?? null,
  };
}

/** Loads the signed-in user's profile, creating an empty one if it is missing. */
export async function getOrCreateProfile(
  client: SupabaseClient,
  user: User,
): Promise<Profile> {
  const existing = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
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
    .select(PROFILE_COLUMNS)
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
  if (patch.classLevel !== undefined) row.class_level = patch.classLevel;
  if (patch.subjects !== undefined) row.subjects = patch.subjects;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.lastActiveDate !== undefined) row.last_active_date = patch.lastActiveDate;
  if (patch.onboardedAt !== undefined) row.onboarded_at = patch.onboardedAt;

  const { data, error } = await client
    .from('profiles')
    .update(row)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return mapRow(data as ProfileRow);
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export { getSupabase };
