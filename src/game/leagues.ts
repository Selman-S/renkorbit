/** Players per league bracket — rank 42 → Bronz Lig #2 */
export const LEAGUE_SIZE = 20;

export interface LeagueMeta {
  id: string;
  index: number;
  name: string;
  emoji: string;
  slug: string;
}

export const LEAGUE_TIERS: Omit<LeagueMeta, 'index'>[] = [
  { id: 'gold', name: 'Altın Lig', emoji: '🥇', slug: 'gold' },
  { id: 'silver', name: 'Gümüş Lig', emoji: '🥈', slug: 'silver' },
  { id: 'bronze', name: 'Bronz Lig', emoji: '🥉', slug: 'bronze' },
  { id: 'iron', name: 'Demir Lig', emoji: '⚔️', slug: 'iron' },
  { id: 'crystal', name: 'Kristal Lig', emoji: '💎', slug: 'crystal' },
  { id: 'obsidian', name: 'Obsidyen Lig', emoji: '🌑', slug: 'obsidian' },
  { id: 'cosmic', name: 'Kozmik Lig', emoji: '☄️', slug: 'cosmic' },
  { id: 'orbit', name: 'Yörünge Lig', emoji: '🪐', slug: 'orbit' },
];

export function getLeagueMeta(leagueIndex: number): LeagueMeta {
  const tier = LEAGUE_TIERS[leagueIndex];
  if (tier) return { ...tier, index: leagueIndex };
  return {
    id: `league-${leagueIndex + 1}`,
    index: leagueIndex,
    name: `${leagueIndex + 1}. Lig`,
    emoji: '🏟️',
    slug: 'default',
  };
}

export function getTotalLeagues(totalPlayers: number): number {
  return Math.max(1, Math.ceil(Math.max(totalPlayers, 1) / LEAGUE_SIZE));
}

/** 0-based league index from 1-based global rank */
export function getLeagueIndex(globalRank: number): number {
  return Math.max(0, Math.floor((Math.max(globalRank, 1) - 1) / LEAGUE_SIZE));
}

/** 1-based position inside the league (e.g. global #42 → #2 in Bronz) */
export function getLeagueRank(globalRank: number): number {
  return ((Math.max(globalRank, 1) - 1) % LEAGUE_SIZE) + 1;
}

export function getGlobalRankRange(leagueIndex: number): { from: number; to: number } {
  const from = leagueIndex * LEAGUE_SIZE + 1;
  const to = from + LEAGUE_SIZE - 1;
  return { from, to };
}

/** Hint for climbing to the next tier */
export function getPromotionHint(globalRank: number, playerLeagueIndex: number): string | null {
  if (playerLeagueIndex <= 0) {
    return 'Altın Ligdesin — genel zirvede yarışıyorsun!';
  }

  const targetGlobalMax = playerLeagueIndex * LEAGUE_SIZE;
  const steps = globalRank - targetGlobalMax;
  if (steps <= 0) return null;

  const nextLeague = getLeagueMeta(playerLeagueIndex - 1);
  return `${nextLeague.emoji} ${nextLeague.name}'e çıkmak için ${steps} sıra yüksel (genel #${targetGlobalMax})`;
}
