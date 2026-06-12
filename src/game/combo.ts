import type { LevelConfig } from './levelConfig';
import { isTubeComplete, pointsPerCompletedTube } from './scoring';
import type { Column, TubeScores } from './types';

export const MAX_COMBO = 5;

/** Streak multiplier — 1→×1, 2→×2 … capped at ×5 */
export function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  return Math.min(combo, MAX_COMBO);
}

export interface ComboUpdate {
  combo: number;
  comboScore: number;
  maxCombo: number;
  tubeScores: TubeScores;
  newCompletions: number;
  /** Combo levels earned this move — drives burst FX */
  comboPops: number[];
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

  // Break scored tubes first — remove the points they previously earned
  if (broken.length > 0) {
    for (const index of broken) {
      const earned = tubeScores[index] ?? 0;
      comboScore = Math.max(0, comboScore - earned);
      delete tubeScores[index];
    }
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
  };
}

export function formatComboLabel(combo: number): string {
  return `×${getComboMultiplier(combo)}`;
}
