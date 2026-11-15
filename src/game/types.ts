import type { GameSettings, LevelConfig } from './levelConfig';

export type ColorId = number;

// Column: bottom index 0, top is last element
export type Column = ColorId[];

export type GameStatus = 'playing' | 'won' | 'lost';

/** Points earned per column index — deducted when a scored tube breaks */
export type TubeScores = Record<number, number>;

/** One tube finished on the last move — drives per-tube FX */
export interface TubeCompletion {
  index: number;
  points: number;
  combo: number;
}

/** Why a streak ended: a scored tube was broken, or the move window ran out */
export interface ComboBreak {
  combo: number;
  reason: 'broken' | 'expired';
}

/** Snapshot for undo — includes combo progress */
export interface MoveSnapshot {
  columns: Column[];
  combo: number;
  comboWindow: number;
  comboScore: number;
  maxCombo: number;
  tubeScores: TubeScores;
}

export interface GameState {
  settings: GameSettings;
  gameKey: string;
  isJourney: boolean;
  journeyStep: number | null;
  /** YYYY-MM-DD when playing the daily puzzle, else null */
  dailyDate: string | null;
  config: LevelConfig;
  columns: Column[];
  moves: number;
  combo: number;
  /** Moves left to extend the streak; 0 when no streak is active */
  comboWindow: number;
  comboScore: number;
  maxCombo: number;
  tubeScores: TubeScores;
  comboPops: number[];
  comboBreaks: ComboBreak[];
  tubeCompletions: TubeCompletion[];
  undoLimit: number | null;
  undosUsed: number;
  elapsedSec: number;
  timeLimitSec: number | null;
  status: GameStatus;
  history: MoveSnapshot[];
  invalidShake: number | null;
  seed: number;
}

export type GameAction =
  | { type: 'MOVE'; from: number; to: number }
  | { type: 'UNDO' }
  | { type: 'TICK' }
  | { type: 'NEW_GAME'; seed?: number }
  | {
      type: 'SET_GAME';
      settings: GameSettings;
      seed?: number;
      journeyStep?: number;
      dailyDate?: string;
    }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'CLEAR_COMBO_POPS' }
  | { type: 'CLEAR_COMBO_BREAKS' }
  | { type: 'CLEAR_TUBE_COMPLETIONS' };
