import { toDateKey } from './daily';

/**
 * Weekly league season. Weeks start Monday 00:00 on the device's local
 * clock and are keyed by that Monday (YYYY-MM-DD). Weekly points are what
 * the player earns that week: total-score credit (first clears, record
 * improvements, dailies) plus endless run scores. Rank rewards are claimed
 * once, on the first launch after the week ends.
 */

const STORAGE_KEY = 'renkorbit_weekly';
const CLAIMED_KEEP = 8;

export interface WeeklyRewardTier {
  maxRank: number;
  coins: number;
  label: string;
}

/** Checked top-down; anyone with points gets at least the last tier */
export const WEEKLY_REWARDS: WeeklyRewardTier[] = [
  { maxRank: 1, coins: 500, label: '🥇 1.' },
  { maxRank: 2, coins: 300, label: '🥈 2.' },
  { maxRank: 3, coins: 200, label: '🥉 3.' },
  { maxRank: 10, coins: 100, label: 'İlk 10' },
  { maxRank: 25, coins: 50, label: 'İlk 25' },
  { maxRank: Number.POSITIVE_INFINITY, coins: 25, label: 'Katılım' },
];

export function getWeeklyReward(rank: number | null): number {
  if (rank === null || rank < 1) return WEEKLY_REWARDS[WEEKLY_REWARDS.length - 1].coins;
  return WEEKLY_REWARDS.find((t) => rank <= t.maxRank)!.coins;
}

interface WeeklyStore {
  week: string;
  score: number;
  prev: { week: string; score: number } | null;
  claimed: string[];
}

export function getWeekKey(now: Date = new Date()): string {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const offset = (monday.getDay() + 6) % 7; // Mon=0 … Sun=6
  monday.setDate(monday.getDate() - offset);
  return toDateKey(monday);
}

export function msUntilWeekEnd(now: Date = new Date()): number {
  const offset = (now.getDay() + 6) % 7;
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - offset), 0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatWeekCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}g ${h}s`;
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function read(): WeeklyStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeeklyStore;
    if (typeof parsed.week !== 'string' || typeof parsed.score !== 'number') return null;
    return { ...parsed, claimed: Array.isArray(parsed.claimed) ? parsed.claimed : [] };
  } catch {
    return null;
  }
}

function write(store: WeeklyStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

/** Current store, rolled over to this week (last week's score kept in prev) */
function load(now: Date = new Date()): WeeklyStore {
  const week = getWeekKey(now);
  const store = read() ?? { week, score: 0, prev: null, claimed: [] };
  if (store.week === week) return store;
  const rolled: WeeklyStore = {
    week,
    score: 0,
    prev: store.score > 0 ? { week: store.week, score: store.score } : store.prev,
    claimed: store.claimed,
  };
  write(rolled);
  return rolled;
}

export function getWeeklyScore(now: Date = new Date()): { week: string; score: number } {
  const store = load(now);
  return { week: store.week, score: store.score };
}

export function addWeeklyPoints(points: number, now: Date = new Date()): { week: string; score: number } {
  const store = load(now);
  const add = Math.max(0, Math.round(points));
  if (add > 0) {
    store.score += add;
    write(store);
  }
  return { week: store.week, score: store.score };
}

/** A finished week with points that hasn't paid out yet */
export function getPendingWeeklyClaim(now: Date = new Date()): { week: string; score: number } | null {
  const store = load(now);
  const prev = store.prev;
  if (!prev || prev.score <= 0 || prev.week === store.week) return null;
  return store.claimed.includes(prev.week) ? null : prev;
}

export function markWeeklyClaimed(week: string): void {
  const store = load();
  if (store.claimed.includes(week)) return;
  store.claimed = [...store.claimed, week].slice(-CLAIMED_KEEP);
  write(store);
}
