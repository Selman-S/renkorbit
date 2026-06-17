import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerRank } from '../game/ranks';
import './RankUpModal.css';

interface RankUpModalProps {
  rank: PlayerRank | null;
  onClose: () => void;
}

export function RankUpModal({ rank, onClose }: RankUpModalProps) {
  const open = rank !== null;

  return (
    <AnimatePresence>
      {open && rank && (
        <motion.div
          className="rank-up__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`rank-up rank-up--tier-${rank.tier}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rank-up-title"
            initial={{ scale: 0.75, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <div className="rank-up__aurora" aria-hidden />
            <div className="rank-up__rays" aria-hidden />

            <p className="rank-up__kicker">Yeni rütbe!</p>
            <motion.span
              className="rank-up__emoji"
              aria-hidden
              initial={{ scale: 0.2, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.08 }}
            >
              {rank.emoji}
            </motion.span>
            <h2 id="rank-up-title" className="rank-up__title">
              {rank.title}
            </h2>
            <p className="rank-up__tagline">{rank.tagline}</p>
            <p className="rank-up__tier">Rütbe {rank.tier} / {5}</p>

            <button type="button" className="rank-up__btn" onClick={onClose}>
              Harika!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
