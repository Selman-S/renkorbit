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

-- Everyone reads; writes only to your own row. Clients sign in with
-- Supabase anonymous auth and use auth.uid() as player_id, so enable
-- Authentication → Sign In / Providers → "Anonymous sign-ins".
create policy "leaderboard_public_read"
  on public.leaderboard for select
  using (true);

-- Owner-only insert/update, score cap and daily policy:
-- run supabase/secure-rls.sql after this file.

-- Daily puzzle board: see supabase/daily_scores.sql
