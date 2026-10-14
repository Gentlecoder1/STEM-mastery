-- Profile preferences + real progress stored in Supabase.
-- Run in the Supabase SQL editor (or via `supabase db push`) after 0001.

-- 1. Extra profile fields chosen during onboarding / settings.
alter table public.profiles
  add column if not exists class_level text,
  add column if not exists subjects text[] not null default '{}',
  add column if not exists location text,
  add column if not exists daily_goal text not null default '20 minutes',
  add column if not exists last_active_date date,
  add column if not exists onboarded_at timestamptz,
  add column if not exists placement jsonb not null default '{}'::jsonb;

-- 2. Completed concepts (the source of truth for lessons done / mastery / XP).
create table if not exists public.concept_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  concept_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

alter table public.concept_progress enable row level security;

drop policy if exists "Concept progress viewable by owner" on public.concept_progress;
create policy "Concept progress viewable by owner"
  on public.concept_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own concept progress" on public.concept_progress;
create policy "Users can insert own concept progress"
  on public.concept_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own concept progress" on public.concept_progress;
create policy "Users can delete own concept progress"
  on public.concept_progress for delete
  using (auth.uid() = user_id);

-- 3. Award XP and maintain the streak the first time a concept is completed.
create or replace function public.handle_concept_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    xp = xp + 50,
    streak = case
      when last_active_date = current_date then streak
      when last_active_date = current_date - 1 then streak + 1
      else 1
    end,
    last_active_date = current_date,
    updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists concept_progress_completed on public.concept_progress;
create trigger concept_progress_completed
  after insert on public.concept_progress
  for each row execute function public.handle_concept_completed();
