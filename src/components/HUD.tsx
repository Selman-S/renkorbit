import { motion, AnimatePresence } from 'framer-motion';
import { formatComboLabel, getComboTheme } from '../game/combo';
import { getLiveScore } from '../game/scoring';
import type { GameState } from '../game/types';
import './HUD.css';

interface HUDProps {
  state: GameState;
  totalScore: number;
  onOpenScoreboard: () => void;
}

export function HUD({ state, totalScore, onOpenScoreboard }: HUDProps) {
  const score = getLiveScore(state.comboScore);
  const comboTheme = state.combo >= 2 ? getComboTheme(state.combo) : null;

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
          <span className="hud__score">{score}</span>
          <AnimatePresence>
            {state.combo >= 2 && comboTheme && (
              <motion.span
                key={state.combo}
                className="hud__combo"
                style={{
                  color: comboTheme.label,
                  textShadow: `0 0 10px rgba(${comboTheme.glow}, 0.65)`,
                }}
                initial={{ scale: 0.6, opacity: 0, y: 6 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              >
                {formatComboLabel(state.combo)} COMBO
              </motion.span>
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
        <span className="hud__meta-item">{state.moves} hamle</span>
      </div>
    </header>
  );
}
