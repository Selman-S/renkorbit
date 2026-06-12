import type { GameSettings, LevelConfig } from './levelConfig';

export type ColorId = number;

// Column: bottom index 0, top is last element
export type Column = ColorId[];

export type GameStatus = 'playing' | 'won' | 'lost';

/** Points earned per column index — deducted when a scored tube breaks */
export type TubeScores = Record<number, number>;

/** Snapshot for undo — includes combo progress */
export interface MoveSnapshot {
  columns: Column[];
  combo: number;
  comboScore: number;
  maxCombo: number;
  tubeScores: TubeScores;
}

export interface GameState {
  settings: GameSettings;
  gameKey: string;
  isJourney: boolean;
  journeyStep: number | null;
  config: LevelConfig;
  columns: Column[];
  moves: number;
  combo: number;
  comboScore: number;
  maxCombo: number;
  tubeScores: TubeScores;
  comboPops: number[];
  comboBreaks: number[];
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
    }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'CLEAR_COMBO_POPS' }
  | { type: 'CLEAR_COMBO_BREAKS' };
