import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import './ModalCard.css';

const CARD_SPRING = { type: 'spring' as const, stiffness: 420, damping: 28 };

interface ModalCardProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  /** dimmed = full-screen dark veil; transparent = menu stays visible behind */
  overlay?: 'dimmed' | 'transparent';
  /** contained = overlay only the parent (e.g. level select) */
  anchor?: 'fixed' | 'contained';
}

export function ModalCard({
  open,
  onClose,
  titleId,
  title,
  subtitle,
  children,
  className = '',
  overlay = 'dimmed',
  anchor = 'fixed',
}: ModalCardProps) {
  const backdropClass = [
    'modal-card__backdrop',
    overlay === 'transparent' && 'modal-card__backdrop--transparent',
    anchor === 'contained' && 'modal-card__backdrop--contained',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={backdropClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className={`modal-card ${className}`.trim()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={CARD_SPRING}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-card__glow" aria-hidden />

            <header className="modal-card__header">
              <div className="modal-card__heading">
                <h2 id={titleId} className="modal-card__title">
                  {title}
                </h2>
                {subtitle}
              </div>
              <button
                type="button"
                className="modal-card__close"
                onClick={onClose}
                aria-label="Kapat"
              >
                ✕
              </button>
            </header>

            <div className="modal-card__body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
