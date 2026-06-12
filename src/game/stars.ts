import type { GameSettings } from './levelConfig';

export type StarCount = 0 | 1 | 2 | 3;

export interface StarThresholds {
  three: { maxMoves: number };
  two: { maxMoves: number };
}

// Star targets — move efficiency only (no time)
const THRESHOLDS: Record<string, StarThresholds> = {
  '4_rows': { three: { maxMoves: 15 }, two: { maxMoves: 25 } },
  '4_mixed': { three: { maxMoves: 25 }, two: { maxMoves: 40 } },
  '8_rows': { three: { maxMoves: 40 }, two: { maxMoves: 70 } },
  '8_mixed': { three: { maxMoves: 60 }, two: { maxMoves: 100 } },
  '12_rows': { three: { maxMoves: 80 }, two: { maxMoves: 140 } },
  '12_mixed': { three: { maxMoves: 120 }, two: { maxMoves: 200 } },
};

/** Star move targets depend on color/layout only, not play mode */
function getThresholdKey(settings: GameSettings): string {
  return `${settings.colors}_${settings.layoutMode}`;
}

export function getStarThresholds(settings: GameSettings): StarThresholds {
  return THRESHOLDS[getThresholdKey(settings)];
}

export function calculateStars(moves: number, settings: GameSettings): StarCount {
  const t = getStarThresholds(settings);

  if (moves <= t.three.maxMoves) return 3;
  if (moves <= t.two.maxMoves) return 2;
  return 1;
}

export function formatStarTarget(settings: GameSettings): string {
  const t = getStarThresholds(settings);
  return `3★ ≤${t.three.maxMoves} hamle`;
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
