-- Stores the latest assessment result for each topic without treating placement
-- or a failed attempt as completed learning progress.
create table if not exists public.topic_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null,
  score_pct integer not null check (score_pct between 0 and 100),
  passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.topic_progress enable row level security;

drop policy if exists "Topic progress viewable by owner" on public.topic_progress;
create policy "Topic progress viewable by owner"
  on public.topic_progress for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own topic progress" on public.topic_progress;
create policy "Users can insert own topic progress"
  on public.topic_progress for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own topic progress" on public.topic_progress;
create policy "Users can update own topic progress"
  on public.topic_progress for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
