import type { StarCount } from './stars';

const HISTORY_KEY = 'renkorbit_score_history';
const MAX_ENTRIES = 50;

export interface ScoreHistoryEntry {
  id: string;
  gameKey: string;
  label: string;
  score: number;
  time: number;
  moves: number;
  stars: StarCount;
  date: string;
}

export function loadScoreHistory(): ScoreHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScoreHistory(entries: ScoreHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* ignore */
  }
}

export function addScoreHistoryEntry(
  entry: Omit<ScoreHistoryEntry, 'id' | 'date'>,
): ScoreHistoryEntry {
  const newEntry: ScoreHistoryEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  };

  const history = loadScoreHistory();
  history.unshift(newEntry);
  saveScoreHistory(history);
  return newEntry;
}

export function clearScoreHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
