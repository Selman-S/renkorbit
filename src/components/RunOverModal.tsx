import { motion, AnimatePresence } from 'framer-motion';
import type { EndlessRun, EndlessRunResult } from '../game/endless';
import './TimeUpModal.css';
import './RunOverModal.css';

interface RunOverModalProps {
  /** Ask before abandoning a live run */
  confirmQuit: EndlessRun | null;
  /** Final summary once the run is over */
  result: EndlessRunResult | null;
  /** Why the run ended — only moves-out shows the "out of moves" headline */
  reason: 'moves' | 'quit';
  onCancelQuit: () => void;
  onConfirmQuit: () => void;
  onNewRun: () => void;
  onMenu: () => void;
  onShare: () => void;
}

export function RunOverModal({
  confirmQuit,
  result,
  reason,
  onCancelQuit,
  onConfirmQuit,
  onNewRun,
  onMenu,
  onShare,
}: RunOverModalProps) {
  const open = confirmQuit !== null || result !== null;

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
            className="time-up run-over"
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-over-title"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            {result ? (
              <>
                <span className="time-up__icon" aria-hidden>
                  {result.isNewBest ? '🏆' : reason === 'moves' ? '🪫' : '♾️'}
                </span>
                <h2 id="run-over-title" className="time-up__title run-over__title">
                  {reason === 'moves' ? 'Hamle bitti!' : 'Koşu bitti'}
                </h2>
                <p className="time-up__subtitle">Sonsuz mod</p>

                <div className="run-over__stats">
                  <div className="run-over__stat">
                    <strong>{result.stagesCleared}</strong>
                    <span>aşama</span>
                  </div>
                  <div className="run-over__stat">
                    <strong>{result.runScore}</strong>
                    <span>puan</span>
                  </div>
                </div>

                {result.isNewBest ? (
                  <p className="run-over__best run-over__best--new">Yeni rekor!</p>
                ) : (
                  result.previousBest && (
                    <p className="run-over__best">
                      En iyi: {result.previousBest.stagesCleared} aşama · {result.previousBest.runScore} puan
                    </p>
                  )
                )}
                {result.coins > 0 && <p className="run-over__coins">+{result.coins} 🪙</p>}

                <div className="time-up__actions run-over__actions">
                  {result.stagesCleared > 0 && (
                    <button type="button" className="time-up__btn run-over__share" onClick={onShare}>
                      Paylaş
                    </button>
                  )}
                  <button type="button" className="time-up__btn" onClick={onMenu}>
                    Menü
                  </button>
                  <button type="button" className="time-up__btn run-over__primary" onClick={onNewRun}>
                    Yeni koşu
                  </button>
                </div>
              </>
            ) : (
              confirmQuit && (
                <>
                  <span className="time-up__icon" aria-hidden>
                    ♾️
                  </span>
                  <h2 id="run-over-title" className="time-up__title run-over__title">
                    Koşuyu bitir?
                  </h2>
                  <p className="time-up__meta">
                    {confirmQuit.stagesCleared} aşama · {confirmQuit.runScore} puan kaydedilir.
                    Menüye dönersen bu koşuya devam edemezsin.
                  </p>
                  <div className="time-up__actions">
                    <button type="button" className="time-up__btn" onClick={onConfirmQuit}>
                      Bitir
                    </button>
                    <button type="button" className="time-up__btn run-over__primary" onClick={onCancelQuit}>
                      Devam et
                    </button>
                  </div>
                </>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
