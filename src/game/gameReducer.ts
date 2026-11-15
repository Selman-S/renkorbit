import { applyMoveCombo } from './combo';
import { getDailyGameKey, getDailyLabel, getDailySeed, getDailySettings } from './daily';
import {
  getJourneyLabel,
  getJourneySeed,
  getJourneySettings,
  getJourneyStepId,
  getJourneyUndoLimit,
} from './progressionMap';
import { canMove, checkWin, cloneColumns, moveBalls } from './gameLogic';
import {
  buildConfig,
  DEFAULT_SETTINGS,
  getGameKey,
  getTimeLimitSec,
  type GameSettings,
} from './levelConfig';
import { generatePuzzle } from './puzzleGenerator';
import type { GameAction, GameState } from './types';

interface BootOptions {
  journeyStep?: number;
  dailyDate?: string;
}

function buildInitialState(
  settings: GameSettings = DEFAULT_SETTINGS,
  seed?: number,
  options: BootOptions = {},
): GameState {
  const journeyStep = options.journeyStep;
  const isJourney = journeyStep !== undefined;
  const dailyDate = !isJourney ? options.dailyDate : undefined;
  const isDaily = dailyDate !== undefined;

  const playSettings = isJourney
    ? getJourneySettings(journeyStep)
    : isDaily
      ? getDailySettings(dailyDate)
      : settings;

  const puzzleSeed =
    seed ??
    (isJourney ? getJourneySeed(journeyStep) : isDaily ? getDailySeed(dailyDate) : undefined);

  const baseConfig = buildConfig(playSettings);
  const puzzle = generatePuzzle(baseConfig, puzzleSeed);

  const config = isJourney
    ? { ...baseConfig, label: getJourneyLabel(journeyStep) }
    : isDaily
      ? { ...baseConfig, label: getDailyLabel(dailyDate) }
      : baseConfig;

  const timeLimitSec =
    playSettings.playMode === 'timed' ? getTimeLimitSec(playSettings.colors) : null;

  const gameKey = isJourney
    ? getJourneyStepId(journeyStep)
    : isDaily
      ? getDailyGameKey(dailyDate)
      : getGameKey(playSettings);
  const undoLimit = isJourney ? getJourneyUndoLimit(journeyStep) : null;

  return {
    settings: playSettings,
    isJourney,
    journeyStep: isJourney ? journeyStep : null,
    dailyDate: isDaily ? dailyDate : null,
    gameKey,
    config,
    columns: puzzle.columns,
    moves: 0,
    combo: 0,
    comboWindow: 0,
    comboScore: 0,
    maxCombo: 0,
    tubeScores: {},
    comboPops: [],
    comboBreaks: [],
    tubeCompletions: [],
    undoLimit,
    undosUsed: 0,
    elapsedSec: 0,
    timeLimitSec,
    status: 'playing',
    history: [],
    invalidShake: null,
    seed: puzzle.seed,
  };
}

export function createInitialState(settings: GameSettings = DEFAULT_SETTINGS, seed?: number): GameState {
  return buildInitialState(settings, seed);
}

function bootOptionsFromState(state: GameState): BootOptions {
  return {
    journeyStep: state.journeyStep ?? undefined,
    dailyDate: state.dailyDate ?? undefined,
  };
}

export function canUndo(state: GameState): boolean {
  if (state.history.length === 0 || state.status !== 'playing') return false;
  if (state.undoLimit !== null && state.undosUsed >= state.undoLimit) return false;
  return true;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME':
      return buildInitialState(action.settings, action.seed, {
        journeyStep: action.journeyStep,
        dailyDate: action.dailyDate,
      });

    case 'NEW_GAME':
      return buildInitialState(state.settings, action.seed ?? state.seed, bootOptionsFromState(state));

    case 'TICK': {
      if (state.status !== 'playing') return state;
      const elapsedSec = state.elapsedSec + 1;
      if (
        state.settings.playMode === 'timed' &&
        state.timeLimitSec !== null &&
        elapsedSec >= state.timeLimitSec
      ) {
        return { ...state, elapsedSec, status: 'lost' };
      }
      return { ...state, elapsedSec };
    }

    case 'CLEAR_SHAKE':
      return { ...state, invalidShake: null };

    case 'CLEAR_COMBO_POPS':
      return { ...state, comboPops: [] };

    case 'CLEAR_COMBO_BREAKS':
      return { ...state, comboBreaks: [] };

    case 'CLEAR_TUBE_COMPLETIONS':
      return { ...state, tubeCompletions: [] };

    case 'MOVE': {
      if (state.status !== 'playing') return state;

      const { from, to } = action;

      if (!canMove(state.columns, from, to, state.config.capacity)) {
        return { ...state, invalidShake: to };
      }

      const prevColumns = state.columns;
      const columns = moveBalls(prevColumns, from, to, state.config.capacity);
      const comboUpdate = applyMoveCombo(
        prevColumns,
        columns,
        state.config,
        state.combo,
        state.comboScore,
        state.maxCombo,
        state.tubeScores,
        state.comboWindow,
      );

      const snapshot = {
        columns: cloneColumns(prevColumns),
        combo: state.combo,
        comboWindow: state.comboWindow,
        comboScore: state.comboScore,
        maxCombo: state.maxCombo,
        tubeScores: { ...state.tubeScores },
      };

      return {
        ...state,
        columns,
        moves: state.moves + 1,
        combo: comboUpdate.combo,
        comboWindow: comboUpdate.comboWindow,
        comboScore: comboUpdate.comboScore,
        maxCombo: comboUpdate.maxCombo,
        tubeScores: comboUpdate.tubeScores,
        comboPops: comboUpdate.comboPops,
        comboBreaks: comboUpdate.comboBreaks,
        tubeCompletions: comboUpdate.completedTubes,
        history: [...state.history, snapshot],
        status: checkWin(columns, state.config.capacity) ? 'won' : 'playing',
        invalidShake: null,
      };
    }

    case 'UNDO': {
      if (!canUndo(state)) return state;
      const history = [...state.history];
      const snapshot = history.pop()!;
      return {
        ...state,
        columns: snapshot.columns,
        combo: snapshot.combo,
        comboWindow: snapshot.comboWindow,
        comboScore: snapshot.comboScore,
        maxCombo: snapshot.maxCombo,
        tubeScores: { ...snapshot.tubeScores },
        comboPops: [],
        comboBreaks: [],
        tubeCompletions: [],
        history,
        moves: Math.max(0, state.moves - 1),
        undosUsed: state.undosUsed + 1,
        status: 'playing',
      };
    }

    default:
      return state;
  }
}
