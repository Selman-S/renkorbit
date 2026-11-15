import { addCoins } from './coins';
import { getCompletedCount, PROGRESSION_STEPS } from './progressionMap';

const RANK_TIER_KEY = 'renkorbit_rank_tier';

export interface PlayerRank {
  id: string;
  tier: number;
  title: string;
  emoji: string;
  minSteps: number;
  tagline: string;
  /** One-time coin reward on promotion (0 for the starting rank) */
  reward: number;
}

/** Five ranks — swap titles here if player picks another name set */
export const PLAYER_RANKS: PlayerRank[] = [
  {
    id: 'rookie',
    tier: 1,
    title: 'Çaylak',
    emoji: '🌱',
    minSteps: 0,
    tagline: 'Galaksi yolculuğunun başlangıcı',
    reward: 0,
  },
  {
    id: 'orbiter',
    tier: 2,
    title: 'Yörüngeci',
    emoji: '🪐',
    minSteps: 3,
    tagline: 'Mini yörünge tamamlandı',
    reward: 50,
  },
  {
    id: 'meteor',
    tier: 3,
    title: 'Göktaşı Avcısı',
    emoji: '☄️',
    minSteps: 9,
    tagline: 'Orta seviye galaksi yolu fethedildi',
    reward: 100,
  },
  {
    id: 'captain',
    tier: 4,
    title: 'Kozmik Kaptan',
    emoji: '🛸',
    minSteps: 18,
    tagline: 'Büyük yörüngelerin ustası',
    reward: 200,
  },
  {
    id: 'galaxy',
    tier: 5,
    title: 'Galaksi Efendisi',
    emoji: '👑',
    minSteps: PROGRESSION_STEPS.length,
    tagline: 'Tüm 30 adım tamamlandı',
    reward: 500,
  },
];

/** Sum of promotion rewards for every rank up to and including `tier` */
export function getRankRewardsUpTo(tier: number): number {
  return PLAYER_RANKS.filter((r) => r.tier <= tier).reduce((sum, r) => sum + r.reward, 0);
}

export function getRankForCompletedSteps(completedSteps: number): PlayerRank {
  let rank = PLAYER_RANKS[0];
  for (const candidate of PLAYER_RANKS) {
    if (completedSteps >= candidate.minSteps) rank = candidate;
  }
  return rank;
}

export function getPlayerRank(): PlayerRank {
  return getRankForCompletedSteps(getCompletedCount());
}

export function getNextRank(current: PlayerRank): PlayerRank | null {
  return PLAYER_RANKS.find((r) => r.tier === current.tier + 1) ?? null;
}

export function loadHighestRankTier(): number {
  try {
    const raw = localStorage.getItem(RANK_TIER_KEY);
    if (!raw) return 0;
    const tier = Number(raw);
    return Number.isFinite(tier) && tier >= 1 && tier <= PLAYER_RANKS.length ? tier : 0;
  } catch {
    return 0;
  }
}

function saveHighestRankTier(tier: number): void {
  try {
    localStorage.setItem(RANK_TIER_KEY, String(tier));
  } catch {
    /* ignore */
  }
}

/** Silent sync for existing saves — no popup, but skipped tiers still pay */
export function migratePlayerRank(): void {
  const current = getPlayerRank();
  const stored = loadHighestRankTier();
  if (current.tier <= stored) return;
  saveHighestRankTier(current.tier);
  addCoins(getRankRewardsUpTo(current.tier) - getRankRewardsUpTo(stored));
}

/**
 * After a journey win — returns the new rank if the player just promoted.
 * Pays every skipped tier's reward too (e.g. jumping from tier 2 to 4).
 */
export function checkRankPromotion(): PlayerRank | null {
  const current = getPlayerRank();
  const stored = loadHighestRankTier();
  if (current.tier <= stored) return null;
  saveHighestRankTier(current.tier);
  addCoins(getRankRewardsUpTo(current.tier) - getRankRewardsUpTo(stored));
  return current;
}

export function getRankById(id: string): PlayerRank | undefined {
  return PLAYER_RANKS.find((r) => r.id === id);
}
