/** Placeholder rivals until online leaderboard ships */
const MOCK_PLAYERS: { name: string; score: number }[] = [
  { name: 'NovaStar', score: 4850 },
  { name: 'OrbitKing', score: 4620 },
  { name: 'Nebula99', score: 4410 },
  { name: 'Comet_X', score: 4180 },
  { name: 'VegaPulse', score: 3950 },
  { name: 'Pulsar', score: 3720 },
  { name: 'Kozmik', score: 3490 },
  { name: 'GalaksiUsta', score: 3260 },
  { name: 'YıldızAvcısı', score: 3010 },
];

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

/** Merge mock rivals with the local player and assign ranks */
export function buildLeaderboard(playerName: string, playerScore: number): LeaderboardEntry[] {
  const rows = [
    ...MOCK_PLAYERS.map((p) => ({ name: p.name, score: p.score, isPlayer: false })),
    { name: playerName, score: playerScore, isPlayer: true },
  ];

  rows.sort((a, b) => b.score - a.score || Number(a.isPlayer) - Number(b.isPlayer));

  return rows.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    score: row.score,
    isPlayer: row.isPlayer,
  }));
}
