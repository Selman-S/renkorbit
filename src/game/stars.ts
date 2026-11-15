import { getBaselineMinMoves, getJourneyBonusTargets } from './journeyBonusTargets';
import type { GameSettings } from './levelConfig';

export type StarCount = 0 | 1 | 2 | 3;

export interface StarThresholds {
  three: { maxMoves: number };
  two: { maxMoves: number };
}

/** Star limits as multiples of the playtest near-optimal move count */
export const STAR_RATIO = { three: 1.15, two: 1.6 } as const;

function baselineMoves(settings: GameSettings, journeyStep?: number | null): number {
  if (journeyStep && journeyStep > 0) return getJourneyBonusTargets(journeyStep).minMoves;
  return getBaselineMinMoves(settings.colors, settings.layoutMode === 'rows' ? 'rows' : 'mixed');
}

/** Move targets derived from the realistic optimum, not the board size */
export function getStarThresholds(
  settings: GameSettings,
  journeyStep?: number | null,
): StarThresholds {
  const min = baselineMoves(settings, journeyStep);
  return {
    three: { maxMoves: Math.round(min * STAR_RATIO.three) },
    two: { maxMoves: Math.round(min * STAR_RATIO.two) },
  };
}

export function calculateStars(
  moves: number,
  settings: GameSettings,
  journeyStep?: number | null,
): StarCount {
  const t = getStarThresholds(settings, journeyStep);

  if (moves <= t.three.maxMoves) return 3;
  if (moves <= t.two.maxMoves) return 2;
  return 1;
}

export function formatStarTarget(settings: GameSettings, journeyStep?: number | null): string {
  const t = getStarThresholds(settings, journeyStep);
  return `3★ ≤${t.three.maxMoves} · 2★ ≤${t.two.maxMoves} hamle`;
}

const STARS_PREFIX = 'renkorbit_stars_';

export function loadBestStars(gameKey: string): StarCount {
  try {
    let raw = localStorage.getItem(`${STARS_PREFIX}${gameKey}`);
    if (!raw) {
      const legacy = gameKey.replace(/_relaxed$/, '');
      if (legacy !== gameKey) raw = localStorage.getItem(`${STARS_PREFIX}${legacy}`);
    }
    if (!raw) return 0;
    const n = Number(raw);
    return n >= 1 && n <= 3 ? (n as StarCount) : 0;
  } catch {
    return 0;
  }
}

export function saveBestStars(gameKey: string, stars: StarCount): boolean {
  if (stars < 1) return false;
  const current = loadBestStars(gameKey);
  if (stars <= current) return false;
  try {
    localStorage.setItem(`${STARS_PREFIX}${gameKey}`, String(stars));
    return true;
  } catch {
    return false;
  }
}
