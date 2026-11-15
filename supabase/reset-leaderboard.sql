-- Full leaderboard wipe (run in Supabase SQL Editor).
-- The SQL Editor bypasses RLS, so no client delete policy is needed —
-- do not add one back (supabase/secure-rls.sql removes it on purpose).
-- Clients re-register their row with their local total on next launch.

delete from public.leaderboard;
