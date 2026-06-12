import type { LevelConfig } from './levelConfig';
import { checkWin, countMixedColumns } from './gameLogic';
import type { Column } from './types';

export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function defaultSeed(): number {
  return Date.now() ^ (Math.random() * 0xffffffff);
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Every filled tube has exactly `capacity` balls; last tube is empty
export function hasStandardHeights(columns: Column[], config: LevelConfig): boolean {
  const emptyIndex = config.colors;

  for (let i = 0; i < config.columns; i++) {
    const expected = i === emptyIndex ? 0 : config.capacity;
    if (columns[i].length !== expected) return false;
  }

  return true;
}

function minMixedColumns(config: LevelConfig): number {
  return Math.max(2, Math.floor(config.colors / 2));
}

/**
 * Simple start: each horizontal row is one color across filled tubes.
 * All filled tubes have equal height (capacity balls); last tube empty.
 */
export function createRowLayout(config: LevelConfig, seed: number): Column[] {
  const { ballsPerColor, columns: columnCount } = config;
  const rng = createRng(seed);
  const filledCount = config.colors;

  const palette = Array.from({ length: config.colors }, (_, i) => i);
  shuffleInPlace(palette, rng);
  const rowColors = palette.slice(0, ballsPerColor);

  const cols: Column[] = Array.from({ length: columnCount }, () => []);

  for (let row = 0; row < ballsPerColor; row++) {
    const color = rowColors[row];
    for (let c = 0; c < filledCount; c++) {
      cols[c].push(color);
    }
  }

  return cols;
}

/**
 * Hard start: fully shuffled balls, equal full tubes + one empty tube.
 * No BFS — instant on mobile; shuffle + deal is fast and well mixed.
 */
export function createShuffledDeal(config: LevelConfig, seed: number): Column[] {
  const rng = createRng(seed);
  const pool: number[] = [];

  for (let c = 0; c < config.colors; c++) {
    for (let i = 0; i < config.capacity; i++) {
      pool.push(c);
    }
  }

  shuffleInPlace(pool, rng);

  const columns: Column[] = Array.from({ length: config.columns }, () => []);
  let idx = 0;

  for (let col = 0; col < config.colors; col++) {
    for (let i = 0; i < config.capacity; i++) {
      columns[col].push(pool[idx++]);
    }
  }

  return columns;
}

function isPlayableHard(columns: Column[], config: LevelConfig): boolean {
  if (checkWin(columns, config.capacity)) return false;
  if (!hasStandardHeights(columns, config)) return false;
  return countMixedColumns(columns) >= minMixedColumns(config);
}

export function generatePuzzle(
  config: LevelConfig,
  seed: number = defaultSeed(),
): { columns: Column[]; seed: number } {
  if (config.layoutMode === 'rows') {
    return { columns: createRowLayout(config, seed), seed };
  }

  const maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const trySeed = seed + attempt;
    const columns = createShuffledDeal(config, trySeed);

    if (isPlayableHard(columns, config)) {
      return { columns, seed: trySeed };
    }
  }

  return { columns: createShuffledDeal(config, seed), seed };
}
