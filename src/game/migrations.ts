/**
 * One-time storage migrations. Scoring v2 (window-based combo, ×8 cap,
 * realistic star limits) made every old score incomparable, so score data
 * is wiped once. Journey progress, stars, coins and cosmetics are kept.
 */

import { getAchievementRewardTotal, getUnlockedIds } from './achievements';
import { addCoins } from './coins';
import { getRankRewardsUpTo, loadHighestRankTier } from './ranks';

const VERSION_KEY = 'renkorbit_scoring_version';
const SCORING_VERSION = 2;

const SCORE_PREFIXES = ['renkorbit_best_'];
const SCORE_KEYS = ['renkorbit_total_score', 'renkorbit_score_history'];
const STATS_KEY = 'renkorbit_stats';

const REWARDS_BACKFILL_KEY = 'renkorbit_rewards_backfill_v1';

export interface MigrationResult {
  scoringReset: boolean;
  /** Coins paid once for badges/ranks earned before rewards existed */
  backfillCoins: number;
}

/**
 * Badges and ranks started paying coins in Faz 4. Players who earned them
 * earlier get the sum once. Fresh installs have nothing unlocked → 0.
 */
function backfillRewards(): number {
  try {
    if (localStorage.getItem(REWARDS_BACKFILL_KEY)) return 0;
    const coins =
      getAchievementRewardTotal(getUnlockedIds()) + getRankRewardsUpTo(loadHighestRankTier());
    if (coins > 0) addCoins(coins);
    localStorage.setItem(REWARDS_BACKFILL_KEY, '1');
    return coins;
  } catch {
    return 0;
  }
}

function readVersion(): number {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function removeByPrefix(prefixes: string[]): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some((p) => key.startsWith(p))) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

/** Keep play counts, drop per-key records that used the old formula */
function resetStatsRecords(): void {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return;
    const store = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    for (const entry of Object.values(store)) {
      entry.bestScore = 0;
      entry.bestCombo = 0;
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function resetScoring(): void {
  removeByPrefix(SCORE_PREFIXES);
  try {
    SCORE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
  resetStatsRecords();
}

export function runStorageMigrations(): MigrationResult {
  const version = readVersion();
  let scoringReset = false;

  if (version < SCORING_VERSION) {
    // Fresh installs have no scores to wipe — skip the reset notice
    const hadScores = (() => {
      try {
        return localStorage.getItem('renkorbit_total_score') !== null;
      } catch {
        return false;
      }
    })();
    resetScoring();
    scoringReset = hadScores;
  }

  try {
    localStorage.setItem(VERSION_KEY, String(SCORING_VERSION));
  } catch {
    /* ignore */
  }

  return { scoringReset, backfillCoins: backfillRewards() };
}
