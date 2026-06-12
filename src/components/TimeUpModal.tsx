import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '../game/scoring';
import type { GameState } from '../game/types';
import './TimeUpModal.css';

interface TimeUpModalProps {
  state: GameState;
  onRetry: () => void;
  onMenu: () => void;
}

export function TimeUpModal({ state, onRetry, onMenu }: TimeUpModalProps) {
  const open = state.status === 'lost';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="time-up__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="time-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="time-up-title"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <span className="time-up__icon" aria-hidden>
              ⏱️
            </span>
            <h2 id="time-up-title" className="time-up__title">
              Süre doldu!
            </h2>
            <p className="time-up__subtitle">{state.config.label}</p>
            <p className="time-up__meta">
              {state.moves} hamle · limit {formatTime(state.timeLimitSec ?? 0)}
            </p>

            <div className="time-up__actions">
              <button type="button" className="time-up__btn" onClick={onMenu}>
                Menü
              </button>
              <button type="button" className="time-up__btn time-up__btn--primary" onClick={onRetry}>
                Tekrar Dene
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
