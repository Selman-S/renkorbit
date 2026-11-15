-- RenkOrbit daily puzzle leaderboard (run once in Supabase SQL Editor).
-- Insert-only: the first finish of the day is final. No update/delete
-- policies exist, so anon clients cannot rewrite or remove rows.

create table if not exists public.daily_scores (
  day date not null,
  player_id uuid not null,
  username text not null check (char_length(username) between 2 and 16),
  score integer not null check (score between 0 and 200000),
  moves integer not null check (moves between 1 and 5000),
  time_sec integer not null check (time_sec between 0 and 86400),
  created_at timestamptz not null default now(),
  primary key (day, player_id)
);

create index if not exists daily_scores_rank_idx
  on public.daily_scores (day, score desc, moves asc, time_sec asc);

alter table public.daily_scores enable row level security;

drop policy if exists "daily_public_read" on public.daily_scores;
create policy "daily_public_read"
  on public.daily_scores for select
  using (true);

-- Client dates are local; ±1 day covers every timezone without allowing backfill
drop policy if exists "daily_insert_recent" on public.daily_scores;
create policy "daily_insert_recent"
  on public.daily_scores for insert
  with check (day between current_date - 1 and current_date + 1);
