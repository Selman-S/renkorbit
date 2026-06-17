import type { LeagueMeta } from './leagues';
import { getLeagueMeta, getPromotionHint } from './leagues';

export interface LeaderboardEntry {
  rank: number;
  globalRank?: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

export interface LeagueBoardResult {
  leagueIndex: number;
  leagueMeta: LeagueMeta;
  entries: LeaderboardEntry[];
  globalRank: number;
  leagueRank: number;
  playerLeagueIndex: number;
  totalPlayers: number;
  totalLeagues: number;
  promotionHint: string | null;
  isPlayerInView: boolean;
}

/** Offline fallback — solo Altın Lig */
export function buildLocalLeagueBoard(
  playerName: string,
  playerScore: number,
): LeagueBoardResult {
  const leagueMeta = getLeagueMeta(0);
  const entries: LeaderboardEntry[] =
    playerScore > 0
      ? [{ rank: 1, globalRank: 1, name: playerName, score: playerScore, isPlayer: true }]
      : [];

  return {
    leagueIndex: 0,
    leagueMeta,
    entries,
    globalRank: playerScore > 0 ? 1 : 0,
    leagueRank: playerScore > 0 ? 1 : 0,
    playerLeagueIndex: 0,
    totalPlayers: playerScore > 0 ? 1 : 0,
    totalLeagues: 1,
    promotionHint: playerScore > 0 ? getPromotionHint(1, 0) : null,
    isPlayerInView: true,
  };
}
