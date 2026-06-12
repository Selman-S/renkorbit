import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { LeaderboardEntry } from './leaderboard';
import { loadPlayerId, loadUsername } from './storage';
import { loadTotalScore } from './scoring';

export interface LeaderboardRow {
  player_id: string;
  username: string;
  total_score: number;
}

const TABLE = 'leaderboard';
const FETCH_LIMIT = 50;

export function isOnlineLeaderboard(): boolean {
  return isSupabaseConfigured();
}

/** Pull all-time top scores from Supabase */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const playerId = loadPlayerId();
  const { data, error } = await supabase
    .from(TABLE)
    .select('player_id, username, total_score')
    .gt('total_score', 0)
    .order('total_score', { ascending: false })
    .limit(FETCH_LIMIT);

  if (error || !data) return [];

  return (data as LeaderboardRow[]).map((row, index) => ({
    rank: index + 1,
    name: row.username,
    score: Number(row.total_score),
    isPlayer: row.player_id === playerId,
  }));
}

/** Register or refresh the local player row */
export async function syncLeaderboardScore(totalScore: number): Promise<void> {
  const supabase = getSupabase();
  const username = loadUsername();
  if (!supabase || !username) return;

  const safeScore = Math.max(0, Math.round(totalScore));
  await supabase.from(TABLE).upsert(
    {
      player_id: loadPlayerId(),
      username,
      total_score: safeScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'player_id' },
  );
}

/** First-time username — create leaderboard row */
export async function registerLeaderboardPlayer(): Promise<void> {
  await syncLeaderboardScore(loadTotalScore());
}
