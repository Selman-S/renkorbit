export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

/** Offline fallback — show only the local player */
export function buildLocalLeaderboard(playerName: string, playerScore: number): LeaderboardEntry[] {
  if (playerScore <= 0) return [];
  return [
    {
      rank: 1,
      name: playerName,
      score: playerScore,
      isPlayer: true,
    },
  ];
}
