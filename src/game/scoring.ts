import { checkWin } from './gameLogic';
import { getJourneyBonusTargets, type BonusTargets } from './journeyBonusTargets';
import type { LevelConfig } from './levelConfig';
import type { GameSettings } from './levelConfig';
import { getStarThresholds } from './stars';
import type { Column } from './types';

export function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Full tube with a single color only */
export function isTubeComplete(column: Column, capacity: number): boolean {
  return (
    column.length === capacity &&
    column.length > 0 &&
    column.every((ball) => ball === column[0])
  );
}

export function countCompleteTubes(columns: Column[], capacity: number): number {
  return columns.filter((col) => isTubeComplete(col, capacity)).length;
}

/** Points earned per completed tube (scales with level size) */
export function pointsPerCompletedTube(config: LevelConfig): number {
  return config.capacity * 20 * config.scoreMultiplier;
}

/** Live score — raw combo points; bonuses apply only at win */
export function getLiveScore(comboScore: number): number {
  return comboScore;
}

export const MOVE_BONUS_RATIO = 0.125;
export const TIME_BONUS_RATIO = 0.125;

export interface ScoreBreakdown {
  grossScore: number;
  moveBonus: number;
  timeBonus: number;
  finalScore: number;
  moves: number;
  elapsedSec: number;
  targets: BonusTargets;
}

/** Linear bonus — best at min, zero at max */
export function calculatePerformanceBonus(
  value: number,
  min: number,
  max: number,
  maxBonus: number,
): number {
  if (maxBonus <= 0) return 0;
  if (value <= min) return maxBonus;
  if (value >= max) return 0;
  if (max <= min) return value <= min ? maxBonus : 0;

  const ratio = (max - value) / (max - min);
  return Math.round(maxBonus * ratio);
}

/** Fallback targets for shared / non-journey games */
export function getBonusTargets(
  config: LevelConfig,
  journeyStep?: number | null,
): BonusTargets {
  if (journeyStep && journeyStep > 0) {
    return getJourneyBonusTargets(journeyStep);
  }

  const settings: GameSettings = {
    colors: config.colors,
    layoutMode: config.layoutMode,
    playMode: 'relaxed',
  };
  const stars = getStarThresholds(settings);
  const minMoves = stars.three.maxMoves;
  const maxMoves = Math.round(stars.two.maxMoves * 1.35);
  const minTimeSec = Math.max(12, Math.round(config.colors * config.colors * 0.75));
  const maxTimeSec = minTimeSec + Math.max(30, Math.round(minTimeSec * 2.5));

  return { minMoves, maxMoves, minTimeSec, maxTimeSec };
}

/** End-of-game score with move and time performance bonuses */
export function calculateScoreBreakdown(
  comboScore: number,
  moves: number,
  elapsedSec: number,
  config: LevelConfig,
  columns: Column[],
  journeyStep?: number | null,
): ScoreBreakdown {
  const grossScore = comboScore;
  const targets = getBonusTargets(config, journeyStep);

  if (!checkWin(columns, config.capacity)) {
    return {
      grossScore,
      moveBonus: 0,
      timeBonus: 0,
      finalScore: grossScore,
      moves,
      elapsedSec,
      targets,
    };
  }

  const moveBonus = calculatePerformanceBonus(
    moves,
    targets.minMoves,
    targets.maxMoves,
    Math.round(grossScore * MOVE_BONUS_RATIO),
  );
  const timeBonus = calculatePerformanceBonus(
    elapsedSec,
    targets.minTimeSec,
    targets.maxTimeSec,
    Math.round(grossScore * TIME_BONUS_RATIO),
  );
  const finalScore = grossScore + moveBonus + timeBonus;

  return {
    grossScore,
    moveBonus,
    timeBonus,
    finalScore,
    moves,
    elapsedSec,
    targets,
  };
}

export function calculateScore(
  comboScore: number,
  moves: number,
  elapsedSec: number,
  config: LevelConfig,
  columns: Column[],
  journeyStep?: number | null,
): number {
  return calculateScoreBreakdown(
    comboScore,
    moves,
    elapsedSec,
    config,
    columns,
    journeyStep,
  ).finalScore;
}

const STORAGE_PREFIX = 'renkorbit_best_';
const TOTAL_SCORE_KEY = 'renkorbit_total_score';

export interface BestScore {
  score: number;
  time: number;
  moves: number;
}

export function loadBestScore(levelId: string): BestScore | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${levelId}`);
    if (raw) return JSON.parse(raw) as BestScore;
    // Legacy key before play modes (relaxed only)
    const legacy = levelId.replace(/_relaxed$/, '');
    if (legacy !== levelId) {
      const old = localStorage.getItem(`${STORAGE_PREFIX}${legacy}`);
      return old ? (JSON.parse(old) as BestScore) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveBestScore(levelId: string, data: BestScore): boolean {
  const current = loadBestScore(levelId);
  if (current && current.score >= data.score) return false;
  localStorage.setItem(`${STORAGE_PREFIX}${levelId}`, JSON.stringify(data));
  return true;
}

/** Cumulative score earned across all completed games */
export function loadTotalScore(): number {
  try {
    const raw = localStorage.getItem(TOTAL_SCORE_KEY);
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  } catch {
    return 0;
  }
}

/** Add a finished game's final score to the running total */
export function addToTotalScore(points: number): number {
  const earned = Math.max(0, Math.round(points));
  const next = loadTotalScore() + earned;
  try {
    localStorage.setItem(TOTAL_SCORE_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}
