import type { LevelConfig } from './levelConfig';
import { isTubeComplete, pointsPerCompletedTube } from './scoring';
import type { Column, ComboBreak, TubeCompletion, TubeScores } from './types';

/** Streak multiplier stops growing here — pitch and FX cap with it */
export const MAX_COMBO_MULTIPLIER = 8;

/** Streak multiplier — 1→×1, 2→×2 … capped at ×8 */
export function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  return Math.min(combo, MAX_COMBO_MULTIPLIER);
}

/**
 * Moves allowed between two tube completions before the streak expires.
 * Scales gently with board size so big boards can still chain.
 * N=3,4→3 · 5,6→4 · 7,8→5 · 9,10→6 · 11,12→7
 */
export function getComboWindow(config: LevelConfig): number {
  const raw = Math.ceil(config.colors / 2) + 1;
  return Math.min(7, Math.max(3, raw));
}

export interface ComboTheme {
  text: string;
  label: string;
  ring: string;
  ringInner: string;
  glow: string;
}

export function getComboTheme(combo: number): ComboTheme {
  const level = Math.min(Math.max(combo, 2), MAX_COMBO_MULTIPLIER);

  switch (level) {
    case 2:
      return {
        text: '#fff6c8',
        label: '#ffe566',
        ring: 'rgba(255, 229, 102, 0.9)',
        ringInner: 'rgba(255, 255, 255, 0.8)',
        glow: '255, 229, 102',
      };
    case 3:
      return {
        text: '#d4ffe0',
        label: '#66ff99',
        ring: 'rgba(102, 255, 153, 0.9)',
        ringInner: 'rgba(220, 255, 235, 0.85)',
        glow: '102, 255, 153',
      };
    case 4:
      return {
        text: '#d4f4ff',
        label: '#4cc9f0',
        ring: 'rgba(76, 201, 240, 0.92)',
        ringInner: 'rgba(200, 240, 255, 0.88)',
        glow: '76, 201, 240',
      };
    case 5:
      return {
        text: '#ffe0f8',
        label: '#ff6bcb',
        ring: 'rgba(255, 107, 203, 0.95)',
        ringInner: 'rgba(255, 220, 245, 0.9)',
        glow: '255, 107, 203',
      };
    case 6:
      return {
        text: '#fff0c4',
        label: '#ffb347',
        ring: 'rgba(255, 179, 71, 0.95)',
        ringInner: 'rgba(255, 235, 200, 0.9)',
        glow: '255, 179, 71',
      };
    case 7:
      return {
        text: '#e8d4ff',
        label: '#b388ff',
        ring: 'rgba(179, 136, 255, 0.95)',
        ringInner: 'rgba(230, 210, 255, 0.9)',
        glow: '179, 136, 255',
      };
    default:
      // MAX tier — gold
      return {
        text: '#fff8e0',
        label: '#ffd700',
        ring: 'rgba(255, 215, 0, 0.98)',
        ringInner: 'rgba(255, 248, 220, 0.95)',
        glow: '255, 215, 0',
      };
  }
}

export function getComboBreakTheme(): ComboTheme {
  return {
    text: '#ffd4d4',
    label: '#ff5c5c',
    ring: 'rgba(255, 92, 92, 0.9)',
    ringInner: 'rgba(255, 200, 200, 0.85)',
    glow: '255, 92, 92',
  };
}

/** Muted grey-violet — the streak faded, nothing was lost */
export function getComboExpireTheme(): ComboTheme {
  return {
    text: '#e4e0f5',
    label: '#b9b4d6',
    ring: 'rgba(185, 180, 214, 0.7)',
    ringInner: 'rgba(230, 226, 245, 0.6)',
    glow: '185, 180, 214',
  };
}

export interface ComboUpdate {
  combo: number;
  comboWindow: number;
  comboScore: number;
  maxCombo: number;
  tubeScores: TubeScores;
  newCompletions: number;
  comboPops: number[];
  comboBreaks: ComboBreak[];
  completedTubes: TubeCompletion[];
}

function completeTubeIndices(columns: Column[], capacity: number): number[] {
  const indices: number[] = [];
  columns.forEach((col, index) => {
    if (isTubeComplete(col, capacity)) indices.push(index);
  });
  return indices;
}

/**
 * Update streak and score for one move.
 * 1. Breaking a scored tube deducts its points and kills the streak.
 * 2. A move that completes nothing spends one move of the window; at 0 the streak expires (no deduction).
 * 3. Each newly completed tube extends the streak and refills the window.
 */
export function applyMoveCombo(
  prevColumns: Column[],
  nextColumns: Column[],
  config: LevelConfig,
  currentCombo: number,
  currentComboScore: number,
  currentMaxCombo: number,
  currentTubeScores: TubeScores,
  currentComboWindow: number,
): ComboUpdate {
  const capacity = config.capacity;
  const prevComplete = new Set(completeTubeIndices(prevColumns, capacity));
  const nextComplete = new Set(completeTubeIndices(nextColumns, capacity));

  const broken = [...prevComplete].filter((index) => !nextComplete.has(index));
  const newlyCompleted = [...nextComplete].filter((index) => !prevComplete.has(index));

  let combo = currentCombo;
  let comboWindow = currentComboWindow;
  let comboScore = currentComboScore;
  let maxCombo = currentMaxCombo;
  const tubeScores = { ...currentTubeScores };
  const comboBreaks: ComboBreak[] = [];

  if (broken.length > 0) {
    for (const index of broken) {
      const earned = tubeScores[index] ?? 0;
      comboScore = Math.max(0, comboScore - earned);
      delete tubeScores[index];
    }
    if (combo >= 2) comboBreaks.push({ combo, reason: 'broken' });
    combo = 0;
    comboWindow = 0;
  }

  if (newlyCompleted.length === 0 && combo > 0) {
    comboWindow -= 1;
    if (comboWindow <= 0) {
      if (combo >= 2) comboBreaks.push({ combo, reason: 'expired' });
      combo = 0;
      comboWindow = 0;
    }
  }

  const tubeValue = pointsPerCompletedTube(config);
  const comboPops: number[] = [];
  const completedTubes: TubeCompletion[] = [];

  for (const index of newlyCompleted) {
    combo += 1;
    comboPops.push(combo);
    const earned = Math.round(tubeValue * getComboMultiplier(combo));
    comboScore += earned;
    tubeScores[index] = earned;
    maxCombo = Math.max(maxCombo, combo);
    completedTubes.push({ index, points: earned, combo });
    comboWindow = getComboWindow(config);
  }

  return {
    combo,
    comboWindow,
    comboScore,
    maxCombo,
    tubeScores,
    newCompletions: newlyCompleted.length,
    comboPops,
    comboBreaks,
    completedTubes,
  };
}

export function formatComboLabel(combo: number): string {
  const level = Math.max(combo, 1);
  if (level >= MAX_COMBO_MULTIPLIER) return `×${MAX_COMBO_MULTIPLIER} MAX`;
  return `×${level}`;
}
