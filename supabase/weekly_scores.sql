-- RenkOrbit weekly league (run once in Supabase SQL Editor).
-- Requires anonymous sign-ins (see supabase/secure-rls.sql): each player
-- writes only their own row, keyed by the Monday that starts the week.

create table if not exists public.weekly_scores (
  week_start date not null check (extract(isodow from week_start) = 1),
  player_id uuid not null,
  username text not null check (char_length(username) between 2 and 16),
  score bigint not null default 0 check (score between 0 and 5000000),
  updated_at timestamptz not null default now(),
  primary key (week_start, player_id)
);

create index if not exists weekly_scores_rank_idx
  on public.weekly_scores (week_start, score desc);

alter table public.weekly_scores enable row level security;

drop policy if exists "weekly_public_read" on public.weekly_scores;
create policy "weekly_public_read"
  on public.weekly_scores for select
  using (true);

-- Client weeks follow local time; the 8-day window covers every timezone
-- and late syncs on Monday, but no writes to older weeks.
drop policy if exists "weekly_own_insert" on public.weekly_scores;
create policy "weekly_own_insert"
  on public.weekly_scores for insert
  to authenticated
  with check (
    player_id = auth.uid()
    and week_start between current_date - 8 and current_date + 1
  );

drop policy if exists "weekly_own_update" on public.weekly_scores;
create policy "weekly_own_update"
  on public.weekly_scores for update
  to authenticated
  using (player_id = auth.uid())
  with check (
    player_id = auth.uid()
    and week_start between current_date - 8 and current_date + 1
  );
