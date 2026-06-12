import type { StarCount } from './stars';

const COINS_KEY = 'renkorbit_coins';

export function loadCoins(): number {
  try {
    const raw = localStorage.getItem(COINS_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveCoins(amount: number): number {
  const safe = Math.max(0, Math.floor(amount));
  try {
    localStorage.setItem(COINS_KEY, String(safe));
  } catch {
    /* ignore */
  }
  return safe;
}

export function addCoins(amount: number): number {
  if (amount <= 0) return loadCoins();
  return saveCoins(loadCoins() + amount);
}

export function spendCoins(amount: number): boolean {
  const balance = loadCoins();
  if (amount <= 0 || balance < amount) return false;
  saveCoins(balance - amount);
  return true;
}

/** Coins earned on puzzle win */
export function calculateWinCoins(
  stars: StarCount,
  score: number,
  maxCombo: number,
  isNewRecord: boolean,
): number {
  let coins = 10 + stars * 15;
  coins += Math.floor(score / 100);
  if (maxCombo >= 3) coins += maxCombo * 3;
  if (isNewRecord) coins += 25;
  return coins;
}
