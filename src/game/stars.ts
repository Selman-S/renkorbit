import type { GameSettings } from './levelConfig';

export type StarCount = 0 | 1 | 2 | 3;

export interface StarThresholds {
  three: { maxMoves: number };
  two: { maxMoves: number };
}

/** Move targets scale with board size and layout difficulty */
export function getStarThresholds(settings: GameSettings): StarThresholds {
  const n = settings.colors;
  const hard = settings.layoutMode === 'mixed' ? 1.55 : 1;

  return {
    three: { maxMoves: Math.round(n * (settings.layoutMode === 'rows' ? 4 : 6.5) * hard) },
    two: { maxMoves: Math.round(n * (settings.layoutMode === 'rows' ? 6.5 : 10) * hard) },
  };
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
