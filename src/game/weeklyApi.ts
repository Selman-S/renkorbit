import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { LeaderboardEntry } from './leaderboard';
import { resolveOnlinePlayerId } from './onlineIdentity';
import { loadPlayerId, loadUsername } from './storage';

const TABLE = 'weekly_scores';
const BOARD_SIZE = 50;

interface WeeklyRow {
  player_id: string;
  username: string;
  score: number;
}

export interface WeeklyBoardResult {
  /** false when Supabase is off or the weekly_scores table is missing */
  available: boolean;
  entries: LeaderboardEntry[];
  totalPlayers: number;
  /** 1-based rank this week, 0 when the player has no points */
  playerRank: number;
}

const UNAVAILABLE: WeeklyBoardResult = {
  available: false,
  entries: [],
  totalPlayers: 0,
  playerRank: 0,
};

/** Upsert the player's running weekly total (own row only, see RLS) */
export async function submitWeeklyScore(week: string, score: number): Promise<boolean> {
  const supabase = getSupabase();
  const username = loadUsername();
  if (!supabase || !username || score <= 0) return false;

  const playerId = await resolveOnlinePlayerId();
  const { error } = await supabase.from(TABLE).upsert(
    {
      week_start: week,
      player_id: playerId,
      username,
      score: Math.round(score),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'week_start,player_id' },
  );
  return !error;
}

/** Rank by counting who scored more; null when the board can't be read */
export async function fetchWeeklyRank(week: string, score: number): Promise<number | null> {
  const supabase = getSupabase();
  if (!supabase || score <= 0) return null;
  const { count, error } = await supabase
    .from(TABLE)
    .select('player_id', { count: 'exact', head: true })
    .eq('week_start', week)
    .gt('score', score);
  if (error || count === null) return null;
  return count + 1;
}

export async function fetchWeeklyBoard(week: string, localScore: number): Promise<WeeklyBoardResult> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured() || !supabase) return UNAVAILABLE;

  const playerId = loadPlayerId();
  const [list, total] = await Promise.all([
    supabase
      .from(TABLE)
      .select('player_id, username, score')
      .eq('week_start', week)
      .gt('score', 0)
      .order('score', { ascending: false })
      .limit(BOARD_SIZE),
    supabase
      .from(TABLE)
      .select('player_id', { count: 'exact', head: true })
      .eq('week_start', week)
      .gt('score', 0),
  ]);

  if (list.error || !list.data) return UNAVAILABLE;

  const entries: LeaderboardEntry[] = (list.data as WeeklyRow[]).map((row, index) => ({
    rank: index + 1,
    name: row.username,
    score: Number(row.score),
    isPlayer: row.player_id === playerId,
  }));

  let playerRank = entries.find((e) => e.isPlayer)?.rank ?? 0;
  if (playerRank === 0 && localScore > 0) {
    playerRank = (await fetchWeeklyRank(week, localScore)) ?? 0;
  }

  return {
    available: true,
    entries,
    totalPlayers: total.count ?? entries.length,
    playerRank,
  };
}
