-- Full leaderboard wipe (run in Supabase SQL Editor)

-- One-time: allow delete from client scripts (skip if already applied)
create policy if not exists "leaderboard_public_delete"
  on public.leaderboard for delete
  using (true);

delete from public.leaderboard;
