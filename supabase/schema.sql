-- RenkOrbit all-time leaderboard (run in Supabase SQL Editor)

create table if not exists public.leaderboard (
  player_id uuid primary key,
  username text not null check (char_length(username) between 2 and 16),
  total_score bigint not null default 0 check (total_score >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_score_idx
  on public.leaderboard (total_score desc);

alter table public.leaderboard enable row level security;

-- Small friend-group game: anon clients may read and upsert scores
create policy "leaderboard_public_read"
  on public.leaderboard for select
  using (true);

create policy "leaderboard_public_insert"
  on public.leaderboard for insert
  with check (true);

create policy "leaderboard_public_update"
  on public.leaderboard for update
  using (true)
  with check (true);

-- Optional: allows scripts/reset-leaderboard.mjs to wipe rows via anon key
create policy "leaderboard_public_delete"
  on public.leaderboard for delete
  using (true);
