import { loadCoins } from './coins';
import {
  getColorTierStepRange,
  getCompletedCount,
  getStepProgress,
  PROGRESSION_STEPS,
} from './progressionMap';
import { loadInventory, SHOP_ITEMS } from './shop';
import type { StarCount } from './stars';

const STORAGE_KEY = 'renkorbit_achievements';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'İlk Zafer', description: 'İlk adımı tamamla', emoji: '🏁' },
  { id: 'three_steps', title: 'Yörünge Keşfi', description: '3 adımı tamamla', emoji: '🛸' },
  { id: 'journey_half', title: 'Yarı Yol', description: '15 adımı tamamla', emoji: '🌓' },
  { id: 'all_journey', title: 'Galaksi Ustası', description: 'Tüm 30 adımı bitir', emoji: '👑' },
  { id: 'three_stars', title: 'Mükemmel', description: 'Bir adımda 3 yıldız kazan', emoji: '⭐' },
  { id: 'five_perfect', title: 'Yıldız Avcısı', description: '5 adımda 3 yıldız', emoji: '🌟' },
  { id: 'combo_5', title: 'Combo Ustası', description: 'Tek oyunda ×5 combo', emoji: '🔥' },
  { id: 'tier_4', title: 'Küçük Usta', description: '4×4 adımlarını tamamla', emoji: '🌍' },
  { id: 'tier_8', title: 'Büyük Usta', description: '8×8 adımlarını tamamla', emoji: '🌟' },
  { id: 'tier_12', title: 'Galaksi Ustası II', description: '12×12 adımlarını tamamla', emoji: '🚀' },
  { id: 'coins_200', title: 'Zengin Gezgin', description: '200 coin biriktir', emoji: '🪙' },
  { id: 'collector', title: 'Koleksiyoncu', description: '3 mağaza ürünü edin', emoji: '💎' },
];

export interface WinAchievementContext {
  stars: StarCount;
  maxCombo: number;
}

function loadUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveUnlocked(unlocked: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  } catch {
    /* ignore */
  }
}

function tierComplete(fromStep: number, toStep: number): boolean {
  for (let i = fromStep; i <= toStep; i++) {
    if (!getStepProgress(i).completed) return false;
  }
  return true;
}

function countPerfectSteps(): number {
  return PROGRESSION_STEPS.filter((s) => getStepProgress(s.index).stars === 3).length;
}

function countPurchasedItems(): number {
  const owned = loadInventory().owned;
  return SHOP_ITEMS.filter((item) => !item.free && owned.includes(item.id)).length;
}

function shouldUnlock(id: string, win?: WinAchievementContext): boolean {
  const completed = getCompletedCount();
  const perfect = countPerfectSteps();

  switch (id) {
    case 'first_win':
      return completed >= 1;
    case 'three_steps':
      return completed >= 3;
    case 'journey_half':
      return completed >= 15;
    case 'all_journey':
      return completed >= PROGRESSION_STEPS.length;
    case 'three_stars':
      return perfect >= 1 || (win?.stars === 3);
    case 'five_perfect':
      return perfect >= 5;
    case 'combo_5':
      return (win?.maxCombo ?? 0) >= 5;
    case 'tier_4': {
      const [from, to] = getColorTierStepRange(4);
      return tierComplete(from, to);
    }
    case 'tier_8': {
      const [from, to] = getColorTierStepRange(8);
      return tierComplete(from, to);
    }
    case 'tier_12': {
      const [from, to] = getColorTierStepRange(12);
      return tierComplete(from, to);
    }
    case 'coins_200':
      return loadCoins() >= 200;
    case 'collector':
      return countPurchasedItems() >= 3;
    default:
      return false;
  }
}

/** Evaluate rules and unlock new badges; returns newly unlocked ids */
export function checkAchievements(win?: WinAchievementContext): string[] {
  const unlocked = loadUnlocked();
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;
    if (!shouldUnlock(achievement.id, win)) continue;
    unlocked.add(achievement.id);
    newlyUnlocked.push(achievement.id);
  }

  if (newlyUnlocked.length > 0) saveUnlocked(unlocked);
  return newlyUnlocked;
}

export function isAchievementUnlocked(id: string): boolean {
  return loadUnlocked().has(id);
}

export function getUnlockedCount(): number {
  return loadUnlocked().size;
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
