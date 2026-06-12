import { motion } from 'framer-motion';
import { getComboMultiplier } from '../game/combo';
import './ComboBurst.css';

export interface ComboBurstItem {
  id: number;
  combo: number;
}

interface ComboBurstProps {
  item: ComboBurstItem;
  onDone: (id: number) => void;
}

/** Center burst — scales up, floats upward, then pops */
export function ComboBurst({ item, onDone }: ComboBurstProps) {
  const label = `×${getComboMultiplier(item.combo)}`;

  return (
    <motion.div
      className="combo-burst"
      initial={{ scale: 0.1, opacity: 0, y: 24 }}
      animate={{
        scale: [0.1, 1.05, 1.35, 1.55],
        opacity: [0, 1, 1, 0],
        y: [24, -36, -108, -150],
      }}
      transition={{ duration: 0.72, ease: 'easeOut', times: [0, 0.32, 0.62, 1] }}
      onAnimationComplete={() => onDone(item.id)}
    >
      <motion.span
        className="combo-burst__ring combo-burst__ring--outer"
        initial={{ scale: 0.4, opacity: 0.7 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
        aria-hidden
      />
      <motion.span
        className="combo-burst__ring combo-burst__ring--inner"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.42, delay: 0.28, ease: 'easeOut' }}
        aria-hidden
      />
      <motion.span
        className="combo-burst__text"
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.08, 1.22] }}
        transition={{ duration: 0.72, times: [0, 0.45, 1] }}
      >
        {label}
      </motion.span>
      <span className="combo-burst__label">COMBO</span>
    </motion.div>
  );
}

interface ComboBurstLayerProps {
  bursts: ComboBurstItem[];
  onDone: (id: number) => void;
}

export function ComboBurstLayer({ bursts, onDone }: ComboBurstLayerProps) {
  if (bursts.length === 0) return null;

  return (
    <div className="combo-burst-layer" aria-live="polite">
      {bursts.map((item) => (
        <ComboBurst key={item.id} item={item} onDone={onDone} />
      ))}
    </div>
  );
}
