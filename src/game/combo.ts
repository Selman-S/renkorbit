import type { LevelConfig } from './levelConfig';
import { isTubeComplete, pointsPerCompletedTube } from './scoring';
import type { Column, TubeScores } from './types';

/** Streak multiplier — 1→×1, 2→×2, 3→×3 … no cap */
export function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  return combo;
}

export interface ComboTheme {
  text: string;
  label: string;
  ring: string;
  ringInner: string;
  glow: string;
}

export function getComboTheme(combo: number): ComboTheme {
  const level = Math.max(combo, 2);

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
    case 8:
      return {
        text: '#d4fff4',
        label: '#3dffb8',
        ring: 'rgba(61, 255, 184, 0.95)',
        ringInner: 'rgba(200, 255, 235, 0.9)',
        glow: '61, 255, 184',
      };
    default:
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

export interface ComboUpdate {
  combo: number;
  comboScore: number;
  maxCombo: number;
  tubeScores: TubeScores;
  newCompletions: number;
  comboPops: number[];
  comboBreaks: number[];
}

function completeTubeIndices(columns: Column[], capacity: number): number[] {
  const indices: number[] = [];
  columns.forEach((col, index) => {
    if (isTubeComplete(col, capacity)) indices.push(index);
  });
  return indices;
}

/** Update streak and score when tubes complete or break on a move */
export function applyMoveCombo(
  prevColumns: Column[],
  nextColumns: Column[],
  config: LevelConfig,
  currentCombo: number,
  currentComboScore: number,
  currentMaxCombo: number,
  currentTubeScores: TubeScores,
): ComboUpdate {
  const capacity = config.capacity;
  const prevComplete = new Set(completeTubeIndices(prevColumns, capacity));
  const nextComplete = new Set(completeTubeIndices(nextColumns, capacity));

  const broken = [...prevComplete].filter((index) => !nextComplete.has(index));
  const newlyCompleted = [...nextComplete].filter((index) => !prevComplete.has(index));

  let combo = currentCombo;
  let comboScore = currentComboScore;
  let maxCombo = currentMaxCombo;
  const tubeScores = { ...currentTubeScores };
  const comboBreaks: number[] = [];

  if (broken.length > 0) {
    for (const index of broken) {
      const earned = tubeScores[index] ?? 0;
      comboScore = Math.max(0, comboScore - earned);
      delete tubeScores[index];
    }
    if (currentCombo >= 2) comboBreaks.push(currentCombo);
    combo = 0;
  }

  const tubeValue = pointsPerCompletedTube(config);
  const comboPops: number[] = [];

  for (const index of newlyCompleted) {
    combo += 1;
    comboPops.push(combo);
    const earned = Math.round(tubeValue * getComboMultiplier(combo));
    comboScore += earned;
    tubeScores[index] = earned;
    maxCombo = Math.max(maxCombo, combo);
  }

  return {
    combo,
    comboScore,
    maxCombo,
    tubeScores,
    newCompletions: newlyCompleted.length,
    comboPops,
    comboBreaks,
  };
}

export function formatComboLabel(combo: number): string {
  return `×${Math.max(combo, 1)}`;
}
