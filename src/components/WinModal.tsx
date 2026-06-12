import { motion, AnimatePresence } from 'framer-motion';
import { calculateScoreBreakdown, formatTime, type BestScore } from '../game/scoring';
import type { StarCount } from '../game/stars';
import type { GameState } from '../game/types';
import { StarRow } from './StarRow';
import './WinModal.css';

interface WinModalProps {
  state: GameState;
  isNewRecord: boolean;
  isNewStars: boolean;
  earnedStars: StarCount;
  bestStars: StarCount;
  bestScore: BestScore | null;
  earnedCoins?: number;
  newAchievements?: string[];
  showNextStep?: boolean;
  onNextStep?: () => void;
  onPlayAgain: () => void;
  onMenu: () => void;
  onShare?: () => void;
}

export function WinModal({
  state,
  isNewRecord,
  isNewStars,
  earnedStars,
  bestStars,
  bestScore,
  earnedCoins = 0,
  newAchievements = [],
  showNextStep = false,
  onNextStep,
  onPlayAgain,
  onMenu,
  onShare,
}: WinModalProps) {
  const breakdown = calculateScoreBreakdown(
    state.comboScore,
    state.moves,
    state.elapsedSec,
    state.config,
    state.columns,
  );
  const open = state.status === 'won';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="win-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="win-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="win-modal-title"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <div className="win-modal__confetti" aria-hidden />
            <h2 id="win-modal-title" className="win-modal__title">Tebrikler!</h2>
            <p className="win-modal__subtitle">{state.config.label} tamamlandı</p>

            <div className="win-modal__stars-wrap">
              <StarRow count={earnedStars} size="lg" />
              {isNewStars && earnedStars > 0 && (
                <span className="win-modal__stars-badge">Yeni yıldız rekoru!</span>
              )}
            </div>

            {isNewRecord && (
              <div className="win-modal__badge">Yeni puan rekoru!</div>
            )}

            {newAchievements.length > 0 && (
              <div className="win-modal__badge win-modal__badge--achievements">
                🏅 Yeni rozet: {newAchievements.join(', ')}
              </div>
            )}

            <div className="win-modal__scores">
              <div className="win-modal__row">
                <span>Brüt puan</span>
                <strong>{breakdown.grossScore}</strong>
              </div>
              {breakdown.movePenalty > 0 && (
                <div className="win-modal__row win-modal__row--penalty">
                  <span>Hamle cezası ({breakdown.moves})</span>
                  <strong>−{breakdown.movePenalty}</strong>
                </div>
              )}
              {breakdown.timePenalty > 0 && (
                <div className="win-modal__row win-modal__row--penalty">
                  <span>Süre cezası ({formatTime(breakdown.elapsedSec)})</span>
                  <strong>−{breakdown.timePenalty}</strong>
                </div>
              )}
              <div className="win-modal__row win-modal__row--total">
                <span>Toplam puan</span>
                <strong>{breakdown.finalScore}</strong>
              </div>
              {earnedCoins > 0 && (
                <div className="win-modal__row win-modal__row--coins">
                  <span>Orbit Coin</span>
                  <strong>+{earnedCoins} 🪙</strong>
                </div>
              )}
              {state.maxCombo >= 2 && (
                <div className="win-modal__row win-modal__row--muted">
                  <span>En yüksek combo</span>
                  <strong>×{state.maxCombo}</strong>
                </div>
              )}
              {bestScore && !isNewRecord && (
                <div className="win-modal__row win-modal__row--muted">
                  <span>En iyi puan</span>
                  <strong>{bestScore.score}</strong>
                </div>
              )}
              {bestStars > 0 && !isNewStars && (
                <div className="win-modal__row win-modal__row--muted">
                  <span>En iyi yıldız</span>
                  <StarRow count={bestStars} size="sm" />
                </div>
              )}
            </div>

            <div className="win-modal__actions">
              {onShare && (
                <button type="button" className="win-modal__btn win-modal__btn--share" onClick={onShare}>
                  Paylaş
                </button>
              )}
              <button type="button" className="win-modal__btn" onClick={onMenu}>
                Menü
              </button>
              {showNextStep && onNextStep ? (
                <button type="button" className="win-modal__btn win-modal__btn--primary" onClick={onNextStep}>
                  Sonraki adım
                </button>
              ) : (
                <button type="button" className="win-modal__btn win-modal__btn--primary" onClick={onPlayAgain}>
                  Tekrar
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
