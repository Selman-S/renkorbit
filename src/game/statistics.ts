import type { StarCount } from './stars';

const STORAGE_KEY = 'renkorbit_stats';

export interface GameStats {
  gameKey: string;
  label: string;
  wins: number;
  bestScore: number;
  bestStars: StarCount;
  bestCombo: number;
  bestMoves: number | null;
  totalMoves: number;
  lastPlayed: string | null;
}

export interface GlobalSummary {
  totalWins: number;
  combinationsPlayed: number;
}

type StatsStore = Record<string, GameStats>;

function loadStore(): StatsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StatsStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: StatsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function emptyStats(gameKey: string, label: string): GameStats {
  return {
    gameKey,
    label,
    wins: 0,
    bestScore: 0,
    bestStars: 0,
    bestCombo: 0,
    bestMoves: null,
    totalMoves: 0,
    lastPlayed: null,
  };
}

/** Persist win aggregates per game key */
export function recordWinStats(data: {
  gameKey: string;
  label: string;
  score: number;
  moves: number;
  stars: StarCount;
  maxCombo: number;
}): void {
  const store = loadStore();
  const prev = store[data.gameKey] ?? emptyStats(data.gameKey, data.label);

  store[data.gameKey] = {
    gameKey: data.gameKey,
    label: data.label,
    wins: prev.wins + 1,
    bestScore: Math.max(prev.bestScore, data.score),
    bestStars: Math.max(prev.bestStars, data.stars) as StarCount,
    bestCombo: Math.max(prev.bestCombo, data.maxCombo),
    bestMoves: prev.bestMoves === null ? data.moves : Math.min(prev.bestMoves, data.moves),
    totalMoves: prev.totalMoves + data.moves,
    lastPlayed: new Date().toISOString(),
  };

  saveStore(store);
}

/** Stats for combinations with at least one win */
export function loadStatsList(): GameStats[] {
  const store = loadStore();
  return Object.values(store)
    .filter((s) => s.wins > 0)
    .sort((a, b) => b.wins - a.wins || b.bestScore - a.bestScore);
}

export function getGlobalSummary(stats: GameStats[]): GlobalSummary {
  return {
    totalWins: stats.reduce((sum, s) => sum + s.wins, 0),
    combinationsPlayed: stats.length,
  };
}

export function formatStatsDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}
