import { applyMoveCombo } from './combo';
import {
  getJourneyLabel,
  getJourneySeed,
  getJourneySettings,
  getJourneyStepId,
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
}

function buildInitialState(
  settings: GameSettings = DEFAULT_SETTINGS,
  seed?: number,
  options: BootOptions = {},
): GameState {
  const journeyStep = options.journeyStep;
  const isJourney = journeyStep !== undefined;

  const playSettings = isJourney ? getJourneySettings(journeyStep) : settings;

  const puzzleSeed =
    seed ?? (isJourney ? getJourneySeed(journeyStep) : undefined);

  const baseConfig = buildConfig(playSettings);
  const puzzle = generatePuzzle(baseConfig, puzzleSeed);

  const config = isJourney
    ? { ...baseConfig, label: getJourneyLabel(journeyStep) }
    : baseConfig;

  const timeLimitSec =
    playSettings.playMode === 'timed' ? getTimeLimitSec(playSettings.colors) : null;

  const gameKey = isJourney ? getJourneyStepId(journeyStep) : getGameKey(playSettings);

  return {
    settings: playSettings,
    isJourney,
    journeyStep: isJourney ? journeyStep : null,
    gameKey,
    config,
    columns: puzzle.columns,
    moves: 0,
    combo: 0,
    comboScore: 0,
    maxCombo: 0,
    tubeScores: {},
    comboPops: [],
    comboBreaks: [],
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
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME':
      return buildInitialState(action.settings, action.seed, {
        journeyStep: action.journeyStep,
      });

    case 'NEW_GAME':
      return buildInitialState(state.settings, action.seed ?? state.seed, bootOptionsFromState(state));

    case 'TICK':
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

    case 'CLEAR_SHAKE':
      return { ...state, invalidShake: null };

    case 'CLEAR_COMBO_POPS':
      return { ...state, comboPops: [] };

    case 'CLEAR_COMBO_BREAKS':
      return { ...state, comboBreaks: [] };

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
      );

      const snapshot = {
        columns: cloneColumns(prevColumns),
        combo: state.combo,
        comboScore: state.comboScore,
        maxCombo: state.maxCombo,
        tubeScores: { ...state.tubeScores },
      };

      return {
        ...state,
        columns,
        moves: state.moves + 1,
        combo: comboUpdate.combo,
        comboScore: comboUpdate.comboScore,
        maxCombo: comboUpdate.maxCombo,
        tubeScores: comboUpdate.tubeScores,
        comboPops: comboUpdate.comboPops,
        comboBreaks: comboUpdate.comboBreaks,
        history: [...state.history, snapshot],
        status: checkWin(columns, state.config.capacity) ? 'won' : 'playing',
        invalidShake: null,
      };
    }

    case 'UNDO': {
      if (state.history.length === 0 || state.status === 'won') return state;
      const history = [...state.history];
      const snapshot = history.pop()!;
      return {
        ...state,
        columns: snapshot.columns,
        combo: snapshot.combo,
        comboScore: snapshot.comboScore,
        maxCombo: snapshot.maxCombo,
        tubeScores: { ...snapshot.tubeScores },
        comboPops: [],
        comboBreaks: [],
        history,
        moves: Math.max(0, state.moves - 1),
        status: 'playing',
      };
    }

    default:
      return state;
  }
}
