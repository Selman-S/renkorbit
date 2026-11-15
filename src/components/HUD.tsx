import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties } from 'react';
import { formatComboLabel, getComboTheme, getComboWindow } from '../game/combo';
import { getLiveScore } from '../game/scoring';
import type { GameState } from '../game/types';
import { useCountUp } from '../hooks/useCountUp';
import './HUD.css';

interface HUDProps {
  state: GameState;
  totalScore: number;
  onOpenScoreboard: () => void;
}

export function HUD({ state, totalScore, onOpenScoreboard }: HUDProps) {
  const score = getLiveScore(state.comboScore);
  const shownScore = useCountUp(score, 450);

  const hasStreak = state.combo >= 1 && state.status === 'playing';
  const comboTheme = state.combo >= 2 ? getComboTheme(state.combo) : null;
  const comboStyle = comboTheme
    ? ({
        '--hud-combo-text': comboTheme.label,
        '--hud-combo-glow': comboTheme.glow,
      } as CSSProperties)
    : undefined;

  const windowSize = getComboWindow(state.config);
  const lastPip = state.comboWindow === 1;
  const undoLeft =
    state.undoLimit !== null ? Math.max(0, state.undoLimit - state.undosUsed) : null;

  return (
    <header className="hud">
      <div className="hud__top">
        <div className="hud__record" title="Toplam puan">
          <span className="hud__crown" aria-hidden>
            👑
          </span>
          <span className="hud__record-value">{totalScore}</span>
        </div>

        <div className="hud__score-wrap">
          <motion.span
            key={score}
            className="hud__score"
            initial={{ scale: 1 }}
            animate={score > 0 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {shownScore}
          </motion.span>
          <AnimatePresence>
            {hasStreak && (
              <motion.div
                key="combo-strip"
                className={`hud__combo-strip${state.combo >= 2 ? ' hud__combo-strip--hot' : ''}`}
                style={comboStyle}
                initial={{ scale: 0.6, opacity: 0, y: 6 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                aria-label={`Combo ${state.combo}, ${state.comboWindow} hamle kaldı`}
              >
                <motion.span
                  key={state.combo}
                  className="hud__combo"
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                >
                  {state.combo >= 2 ? `${formatComboLabel(state.combo)} COMBO` : 'ZİNCİR'}
                </motion.span>
                <span className="hud__pips" aria-hidden>
                  {Array.from({ length: windowSize }, (_, i) => (
                    <span
                      key={i}
                      className={[
                        'hud__pip',
                        i < state.comboWindow && 'hud__pip--on',
                        i === 0 && lastPip && 'hud__pip--last',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  ))}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          className="hud__board-btn"
          onClick={onOpenScoreboard}
          aria-label="Liderlik tablosu"
          title="Liderlik tablosu"
        >
          🏆
        </button>
      </div>

      <div className="hud__meta">
        <span className="hud__meta-item">{state.config.label}</span>
        <span className="hud__meta-divider">·</span>
        {state.moveLimit !== null ? (
          <span
            className={`hud__meta-item${
              state.moveLimit - state.moves <= Math.max(3, Math.round(state.moveLimit * 0.1))
                ? ' hud__meta-item--urgent'
                : ''
            }`}
          >
            {state.moves}/{state.moveLimit} hamle
          </span>
        ) : (
          <span className="hud__meta-item">{state.moves} hamle</span>
        )}
        {undoLeft !== null && (
          <>
            <span className="hud__meta-divider">·</span>
            <span className={`hud__meta-item${undoLeft === 0 ? ' hud__meta-item--urgent' : ''}`}>
              {undoLeft} geri alma
            </span>
          </>
        )}
      </div>
    </header>
  );
}
