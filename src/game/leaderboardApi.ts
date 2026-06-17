import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { LeagueBoardResult, LeaderboardEntry } from './leaderboard';
import {
  getLeagueIndex,
  getLeagueMeta,
  getLeagueRank,
  getPromotionHint,
  getTotalLeagues,
  LEAGUE_SIZE,
} from './leagues';
import { loadPlayerId, loadUsername } from './storage';
import { loadTotalScore } from './scoring';

export interface LeaderboardRow {
  player_id: string;
  username: string;
  total_score: number;
}

const TABLE = 'leaderboard';

export function isOnlineLeaderboard(): boolean {
  return isSupabaseConfigured();
}

async function countPlayersAbove(score: number): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .gt('total_score', score);

  if (error || count === null) return 0;
  return count;
}

async function countTotalPlayers(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .gt('total_score', 0);

  if (error || count === null) return 0;
  return count;
}

async function fetchLeagueSlice(leagueIndex: number): Promise<LeaderboardEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const playerId = loadPlayerId();
  const rangeStart = leagueIndex * LEAGUE_SIZE;
  const rangeEnd = rangeStart + LEAGUE_SIZE - 1;

  const { data, error } = await supabase
    .from(TABLE)
    .select('player_id, username, total_score')
    .gt('total_score', 0)
    .order('total_score', { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error || !data) return [];

  return (data as LeaderboardRow[]).map((row, index) => ({
    rank: index + 1,
    globalRank: rangeStart + index + 1,
    name: row.username,
    score: Number(row.total_score),
    isPlayer: row.player_id === playerId,
  }));
}

/** Fetch one 20-player league bracket + player context */
export async function fetchLeagueBoard(viewLeagueIndex: number): Promise<LeagueBoardResult> {
  const playerScore = loadTotalScore();
  const totalPlayers = await countTotalPlayers();
  const totalLeagues = getTotalLeagues(totalPlayers);

  const safeLeagueIndex = Math.min(Math.max(0, viewLeagueIndex), totalLeagues - 1);

  let globalRank = 0;
  let playerLeagueIndex = 0;
  let leagueRank = 0;

  if (playerScore > 0) {
    const above = await countPlayersAbove(playerScore);
    globalRank = above + 1;
    playerLeagueIndex = Math.min(getLeagueIndex(globalRank), totalLeagues - 1);
    leagueRank = getLeagueRank(globalRank);
  }

  const entries = await fetchLeagueSlice(safeLeagueIndex);
  const leagueMeta = getLeagueMeta(safeLeagueIndex);

  return {
    leagueIndex: safeLeagueIndex,
    leagueMeta,
    entries,
    globalRank,
    leagueRank,
    playerLeagueIndex,
    totalPlayers,
    totalLeagues,
    promotionHint:
      playerScore > 0 ? getPromotionHint(globalRank, playerLeagueIndex) : null,
    isPlayerInView: playerScore > 0 && safeLeagueIndex === playerLeagueIndex,
  };
}

/** Default view — player's own league */
export async function fetchPlayerLeagueBoard(): Promise<LeagueBoardResult> {
  const playerScore = loadTotalScore();
  const totalPlayers = await countTotalPlayers();
  const totalLeagues = getTotalLeagues(totalPlayers);

  if (playerScore > 0) {
    const above = await countPlayersAbove(playerScore);
    const globalRank = above + 1;
    const playerLeagueIndex = Math.min(getLeagueIndex(globalRank), totalLeagues - 1);
    return fetchLeagueBoard(playerLeagueIndex);
  }

  return fetchLeagueBoard(0);
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
