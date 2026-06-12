import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './TutorialOverlay.css';

const STEPS = [
  {
    title: 'Topu sürükle',
    body: 'Bir borunun en üstündeki topu parmağınla tut ve sürükle.',
    icon: '👆',
  },
  {
    title: 'Boruya bırak',
    body: 'Yeşil parlayan boruya bırak. Boş yer varsa her renk konulabilir.',
    icon: '✨',
  },
  {
    title: 'Hedef',
    body: 'Her boruda tek renk olacak şekilde düzenle. 1 boş boru kalınca kazanırsın!',
    icon: '🎯',
  },
] as const;

interface TutorialOverlayProps {
  open: boolean;
  onComplete: () => void;
}

export function TutorialOverlay({ open, onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Reset to first card when tutorial reopens
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const handleNext = () => {
    if (isLast) onComplete();
    else setStep((s) => s + 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="tutorial__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="tutorial__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <div className="tutorial__glow" aria-hidden />

            <button type="button" className="tutorial__skip" onClick={onComplete}>
              Atla
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className="tutorial__content"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tutorial__icon" aria-hidden>
                  {current.icon}
                </div>
                <p className="tutorial__step">
                  Adım {step + 1} / {STEPS.length}
                </p>
                <h2 id="tutorial-title" className="tutorial__title">
                  {current.title}
                </h2>
                <p className="tutorial__body">{current.body}</p>
              </motion.div>
            </AnimatePresence>

            <div className="tutorial__dots" aria-hidden>
              {STEPS.map((_, i) => (
                <span key={i} className={`tutorial__dot ${i === step ? 'tutorial__dot--active' : ''}`} />
              ))}
            </div>

            <div className="tutorial__actions">
              {step > 0 && (
                <button
                  type="button"
                  className="tutorial__btn"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Geri
                </button>
              )}
              <button
                type="button"
                className="tutorial__btn tutorial__btn--primary"
                onClick={handleNext}
              >
                {isLast ? 'Anladım, başla!' : 'Devam'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
