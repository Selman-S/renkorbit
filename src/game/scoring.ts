import { checkWin } from './gameLogic';
import type { LevelConfig } from './levelConfig';
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

/** Live score — raw combo points; penalties apply only at win */
export function getLiveScore(comboScore: number): number {
  return comboScore;
}

export interface ScoreBreakdown {
  grossScore: number;
  movePenalty: number;
  timePenalty: number;
  finalScore: number;
  moves: number;
  elapsedSec: number;
}

function movePenaltyPerStep(config: LevelConfig): number {
  return 3 * config.scoreMultiplier;
}

function timePenaltyPerSec(config: LevelConfig): number {
  return 1 * config.scoreMultiplier;
}

/** End-of-game score with move and hidden-time penalties */
export function calculateScoreBreakdown(
  comboScore: number,
  moves: number,
  elapsedSec: number,
  config: LevelConfig,
  columns: Column[],
): ScoreBreakdown {
  const grossScore = comboScore;

  if (!checkWin(columns, config.capacity)) {
    return {
      grossScore,
      movePenalty: 0,
      timePenalty: 0,
      finalScore: grossScore,
      moves,
      elapsedSec,
    };
  }

  const movePenalty = Math.round(moves * movePenaltyPerStep(config));
  const timePenalty = Math.round(elapsedSec * timePenaltyPerSec(config));
  const finalScore = Math.max(0, grossScore - movePenalty - timePenalty);

  return {
    grossScore,
    movePenalty,
    timePenalty,
    finalScore,
    moves,
    elapsedSec,
  };
}

export function calculateScore(
  comboScore: number,
  moves: number,
  elapsedSec: number,
  config: LevelConfig,
  columns: Column[],
): number {
  return calculateScoreBreakdown(comboScore, moves, elapsedSec, config, columns).finalScore;
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
