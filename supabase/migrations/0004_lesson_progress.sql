-- Offline lesson reading progress.
-- Run in the Supabase SQL editor (or via `supabase db push`) after 0003.
--
-- Authoritative writes are performed by the FastAPI backend using the
-- service-role key (which bypasses RLS); the owner read policy below lets the
-- app read its own synced progress directly.

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  concept_id text not null,
  lesson_id text,
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  last_section text,
  lesson_completed boolean not null default false,
  quiz_pending boolean not null default false,
  completed_offline boolean not null default false,
  started_at timestamptz,
  last_opened_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

create index if not exists lesson_progress_quiz_pending_idx
  on public.lesson_progress (user_id)
  where quiz_pending;

alter table public.lesson_progress enable row level security;

drop policy if exists "Lesson progress viewable by owner" on public.lesson_progress;
create policy "Lesson progress viewable by owner"
  on public.lesson_progress for select
  using (auth.uid() = user_id);
