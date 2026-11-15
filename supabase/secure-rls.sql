-- RenkOrbit: owner-only writes (run once in Supabase SQL Editor).
--
-- BEFORE running:
--   1. Authentication → Sign In / Providers → enable "Anonymous sign-ins"
--   2. Deploy the client that calls signInAnonymously() (writes player_id = auth.uid())
--
-- After this, a client can only insert/update its own leaderboard row and
-- insert its own daily score. Nobody can delete rows from the client.
-- Safe to re-run.

-- ── leaderboard ─────────────────────────────────────────────
drop policy if exists "leaderboard_public_insert" on public.leaderboard;
drop policy if exists "leaderboard_public_update" on public.leaderboard;
drop policy if exists "leaderboard_public_delete" on public.leaderboard;
drop policy if exists "leaderboard_own_insert" on public.leaderboard;
drop policy if exists "leaderboard_own_update" on public.leaderboard;

create policy "leaderboard_own_insert"
  on public.leaderboard for insert
  to authenticated
  with check (player_id = auth.uid());

create policy "leaderboard_own_update"
  on public.leaderboard for update
  to authenticated
  using (player_id = auth.uid())
  with check (player_id = auth.uid());

alter table public.leaderboard
  drop constraint if exists leaderboard_total_score_cap;
alter table public.leaderboard
  add constraint leaderboard_total_score_cap check (total_score <= 50000000);

-- Rows keyed by the old device UUID can never be updated again (no owner).
-- Clients re-register under their auth id on next launch, so drop them to
-- avoid duplicate names. Rows already migrated to an auth id are kept.
delete from public.leaderboard l
where not exists (select 1 from auth.users u where u.id = l.player_id);

-- ── daily_scores ────────────────────────────────────────────
drop policy if exists "daily_insert_recent" on public.daily_scores;
drop policy if exists "daily_insert_own_recent" on public.daily_scores;

create policy "daily_insert_own_recent"
  on public.daily_scores for insert
  to authenticated
  with check (
    player_id = auth.uid()
    and day between current_date - 1 and current_date + 1
  );
