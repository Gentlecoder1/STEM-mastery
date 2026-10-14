import type { SupabaseClient } from '@supabase/supabase-js';

/** Loads the concept ids the user has completed, most recent first. */
export async function loadCompletedConceptIds(
  client: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from('concept_progress')
    .select('concept_id, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.concept_id as string);
}

/** Marks concepts complete. Duplicates are ignored (no extra XP). */
export async function addCompletedConcepts(
  client: SupabaseClient,
  userId: string,
  conceptIds: readonly string[],
): Promise<void> {
  if (conceptIds.length === 0) return;
  const rows = Array.from(new Set(conceptIds)).map((concept_id) => ({
    user_id: userId,
    concept_id,
  }));
  const { error } = await client
    .from('concept_progress')
    .upsert(rows, { onConflict: 'user_id,concept_id', ignoreDuplicates: true });

  if (error) throw error;
}

/** Removes a completed concept. */
export async function removeCompletedConcept(
  client: SupabaseClient,
  userId: string,
  conceptId: string,
): Promise<void> {
  const { error } = await client
    .from('concept_progress')
    .delete()
    .eq('user_id', userId)
    .eq('concept_id', conceptId);

  if (error) throw error;
}

/** Clears all progress rows for the user. */
export async function clearConceptProgress(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from('concept_progress')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

export type StoredPlacement = Record<string, unknown>;

/** Loads the placement results stored on the user's profile. */
export async function loadPlacement(
  client: SupabaseClient,
  userId: string,
): Promise<StoredPlacement> {
  const { data, error } = await client
    .from('profiles')
    .select('placement')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return ((data as { placement?: StoredPlacement } | null)?.placement ?? {}) as StoredPlacement;
}

/** Persists placement results onto the user's profile. */
export async function savePlacement(
  client: SupabaseClient,
  userId: string,
  placement: StoredPlacement,
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ placement })
    .eq('id', userId);

  if (error) throw error;
}
