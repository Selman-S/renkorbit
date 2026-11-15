/**
 * Daily puzzle — one date-seeded board shared by every player,
 * plus a consecutive-day streak. Dates are the device's local calendar day.
 */
import type { ColorCount, GameSettings } from './levelConfig';
import { getCompletedCount, hashString } from './progressionMap';
import type { StarCount } from './stars';

const STORAGE_KEY = 'renkorbit_daily';
/** Daily #1 — numbering is cosmetic, seeds don't depend on it */
const DAILY_EPOCH = '2026-11-16';
/** Journey steps required before the daily card unlocks */
export const DAILY_UNLOCK_STEPS = 1;
const MAX_STORED_RESULTS = 60;

/** Sun..Sat — weekends get the bigger board */
const WEEKDAY_COLORS: ColorCount[] = [8, 5, 5, 6, 6, 7, 7];

/** One-time streak rewards, keyed by streak length in days */
const STREAK_MILESTONES: Record<number, number> = { 3: 50, 7: 150, 14: 300, 30: 600 };

export interface DailyResult {
  score: number;
  moves: number;
  time: number;
  stars: StarCount;
}

interface DailyStore {
  lastDate: string | null;
  streak: number;
  bestStreak: number;
  results: Record<string, DailyResult>;
}

const EMPTY_STORE: DailyStore = { lastDate: null, streak: 0, bestStreak: 0, results: {} };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar date as YYYY-MM-DD */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getTodayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/** Noon avoids DST edges when shifting by whole days */
function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function shiftKey(key: string, days: number): string {
  const date = parseKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function getDailyNumber(key: string): number {
  const ms = parseKey(key).getTime() - parseKey(DAILY_EPOCH).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function getDailySettings(key: string): GameSettings {
  return {
    colors: WEEKDAY_COLORS[parseKey(key).getDay()],
    layoutMode: 'mixed',
    playMode: 'relaxed',
  };
}

export function getDailySeed(key: string): number {
  return hashString(`renkorbit-daily-v1-${key}`);
}

export function getDailyGameKey(key: string): string {
  return `daily_${key}`;
}

export function getDailyLabel(key: string): string {
  return `📅 Günlük #${getDailyNumber(key)}`;
}

function loadStore(): DailyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STORE, results: {} };
    const parsed = JSON.parse(raw) as Partial<DailyStore>;
    return {
      lastDate: parsed.lastDate ?? null,
      streak: parsed.streak ?? 0,
      bestStreak: parsed.bestStreak ?? 0,
      results: parsed.results ?? {},
    };
  } catch {
    return { ...EMPTY_STORE, results: {} };
  }
}

function saveStore(store: DailyStore): void {
  const keys = Object.keys(store.results).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - MAX_STORED_RESULTS))) {
    delete store.results[old];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

/** Streak still alive = last solve was today or yesterday */
function liveStreak(store: DailyStore, today: string): number {
  if (store.lastDate === today || store.lastDate === shiftKey(today, -1)) return store.streak;
  return 0;
}

export interface DailyStatus {
  today: string;
  number: number;
  settings: GameSettings;
  unlocked: boolean;
  completedToday: boolean;
  result: DailyResult | null;
  /** Current streak (0 once a day was missed) */
  streak: number;
  bestStreak: number;
}

export function getDailyStatus(now: Date = new Date()): DailyStatus {
  const today = getTodayKey(now);
  const store = loadStore();
  const result = store.results[today] ?? null;
  return {
    today,
    number: getDailyNumber(today),
    settings: getDailySettings(today),
    unlocked: getCompletedCount() >= DAILY_UNLOCK_STEPS,
    completedToday: result !== null,
    result,
    streak: liveStreak(store, today),
    bestStreak: store.bestStreak,
  };
}

export function getDailyResult(key: string): DailyResult | null {
  return loadStore().results[key] ?? null;
}

export function getBestDailyStreak(): number {
  return loadStore().bestStreak;
}

export function getStreakCoins(streak: number): number {
  return Math.min(Math.max(streak, 0), 10) * 5;
}

export interface DailyWinOutcome {
  /** Only the first finish of a day counts for streak, coins and the daily board */
  firstClear: boolean;
  streak: number;
  bonusCoins: number;
  /** Streak length that just paid a milestone, if any */
  milestoneDays: number | null;
  milestoneCoins: number;
}

/** Record a daily finish; idempotent per date */
export function recordDailyWin(key: string, result: DailyResult): DailyWinOutcome {
  const store = loadStore();

  if (store.results[key]) {
    return {
      firstClear: false,
      streak: liveStreak(store, getTodayKey()),
      bonusCoins: 0,
      milestoneDays: null,
      milestoneCoins: 0,
    };
  }

  store.results[key] = result;

  // Finished an older day after midnight — keep the result, never rewind the streak
  if (store.lastDate && store.lastDate > key) {
    saveStore(store);
    return {
      firstClear: true,
      streak: store.streak,
      bonusCoins: 0,
      milestoneDays: null,
      milestoneCoins: 0,
    };
  }

  const continues = store.lastDate === shiftKey(key, -1);
  const streak = continues ? store.streak + 1 : 1;
  store.lastDate = key;
  store.streak = streak;
  store.bestStreak = Math.max(store.bestStreak, streak);
  saveStore(store);

  const milestoneCoins = STREAK_MILESTONES[streak] ?? 0;
  return {
    firstClear: true,
    streak,
    bonusCoins: getStreakCoins(streak) + milestoneCoins,
    milestoneDays: milestoneCoins > 0 ? streak : null,
    milestoneCoins,
  };
}

export function msUntilNextDaily(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatClock(totalSec: number): string {
  return `${pad(Math.floor(totalSec / 60))}:${pad(totalSec % 60)}`;
}

export function buildDailyShareUrl(): string {
  return `${window.location.origin}${window.location.pathname}?daily=1`;
}

/** Wordle-style result text — no spoilers, just the outcome */
export function getDailyShareText(key: string, result: DailyResult, streak: number): string {
  const stars = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
  const lines = [
    `RenkOrbit Günlük #${getDailyNumber(key)} 🪐`,
    `${stars} · ${result.moves} hamle · ${formatClock(result.time)}`,
    `${result.score} puan`,
  ];
  if (streak >= 2) lines.push(`🔥 ${streak} günlük seri`);
  return lines.join('\n');
}

export function getDailyInviteText(key: string): string {
  return `RenkOrbit Günlük #${getDailyNumber(key)} — günün bulmacasını sen de çöz!`;
}

/** ?daily=1 opens today's puzzle */
export function parseDailyFromUrl(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  return params.has('daily');
}
