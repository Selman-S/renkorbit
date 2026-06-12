import { useCallback, useEffect, useReducer } from 'react';
import { createInitialState, gameReducer } from '../game/gameReducer';
import { canMove } from '../game/gameLogic';
import { DEFAULT_SETTINGS, type GameSettings } from '../game/levelConfig';

export function useGame(initialSettings: GameSettings = DEFAULT_SETTINGS) {
  const [state, dispatch] = useReducer(gameReducer, initialSettings, createInitialState);

  useEffect(() => {
    if (state.status !== 'playing') return;
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.invalidShake === null) return;
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_SHAKE' }), 450);
    return () => clearTimeout(id);
  }, [state.invalidShake]);

  const moveBalls = useCallback((from: number, to: number) => {
    dispatch({ type: 'MOVE', from, to });
  }, []);

  const canDrop = useCallback(
    (from: number, to: number) =>
      canMove(state.columns, from, to, state.config.capacity),
    [state.columns, state.config.capacity],
  );

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);

  const newGame = useCallback((seed?: number) => {
    dispatch({ type: 'NEW_GAME', seed });
  }, []);

  const setGame = useCallback(
    (settings: GameSettings, seed?: number, journeyStep?: number) => {
      dispatch({ type: 'SET_GAME', settings, seed, journeyStep });
    },
    [],
  );

  const clearComboPops = useCallback(() => dispatch({ type: 'CLEAR_COMBO_POPS' }), []);

  return {
    state,
    moveBalls,
    canDrop,
    undo,
    newGame,
    setGame,
    clearComboPops,
  };
}
