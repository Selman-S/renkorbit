import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { DailyResult } from './daily';
import type { LeaderboardEntry } from './leaderboard';
import { loadPlayerId, loadUsername } from './storage';
import { resolveOnlinePlayerId } from './onlineIdentity';

const TABLE = 'daily_scores';
const BOARD_SIZE = 50;

interface DailyRow {
  player_id: string;
  username: string;
  score: number;
  moves: number;
  time_sec: number;
}

export interface DailyBoardEntry extends LeaderboardEntry {
  moves: number;
  timeSec: number;
}

export interface DailyBoardResult {
  /** false when Supabase is off or the daily_scores table is missing */
  available: boolean;
  entries: DailyBoardEntry[];
  totalPlayers: number;
  /** 1-based rank today, 0 when the player hasn't finished */
  playerRank: number;
}

const UNAVAILABLE: DailyBoardResult = {
  available: false,
  entries: [],
  totalPlayers: 0,
  playerRank: 0,
};

export type DailySubmitResult = 'ok' | 'duplicate' | 'offline' | 'error';

/**
 * Insert-only — the table has no update policy, so the first finish
 * of the day is final. A duplicate is reported, not treated as failure.
 */
export async function submitDailyScore(day: string, result: DailyResult): Promise<DailySubmitResult> {
  const supabase = getSupabase();
  const username = loadUsername();
  if (!supabase || !username) return 'offline';

  const playerId = await resolveOnlinePlayerId();
  const { error } = await supabase.from(TABLE).insert({
    day,
    player_id: playerId,
    username,
    score: Math.max(0, Math.round(result.score)),
    moves: Math.max(1, Math.round(result.moves)),
    time_sec: Math.max(0, Math.round(result.time)),
  });

  if (!error) return 'ok';
  if (error.code === '23505') return 'duplicate';
  return 'error';
}

export async function fetchDailyBoard(
  day: string,
  local: DailyResult | null,
): Promise<DailyBoardResult> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured() || !supabase) return UNAVAILABLE;

  const playerId = loadPlayerId();

  const [list, total] = await Promise.all([
    supabase
      .from(TABLE)
      .select('player_id, username, score, moves, time_sec')
      .eq('day', day)
      .order('score', { ascending: false })
      .order('moves', { ascending: true })
      .order('time_sec', { ascending: true })
      .limit(BOARD_SIZE),
    supabase.from(TABLE).select('player_id', { count: 'exact', head: true }).eq('day', day),
  ]);

  if (list.error || !list.data) return UNAVAILABLE;

  const entries: DailyBoardEntry[] = (list.data as DailyRow[]).map((row, index) => ({
    rank: index + 1,
    name: row.username,
    score: Number(row.score),
    moves: Number(row.moves),
    timeSec: Number(row.time_sec),
    isPlayer: row.player_id === playerId,
  }));

  let playerRank = entries.find((e) => e.isPlayer)?.rank ?? 0;

  // Outside the top list — rank by counting who beat us (score, then moves)
  if (playerRank === 0 && local) {
    const { count } = await supabase
      .from(TABLE)
      .select('player_id', { count: 'exact', head: true })
      .eq('day', day)
      .or(`score.gt.${local.score},and(score.eq.${local.score},moves.lt.${local.moves})`);
    if (count !== null) playerRank = count + 1;
  }

  return {
    available: true,
    entries,
    totalPlayers: total.count ?? entries.length,
    playerRank,
  };
}
