import { motion } from 'framer-motion';
import './StarRow.css';

interface StarRowProps {
  count: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  /** Pop earned stars in one by one (win screen) */
  animate?: boolean;
  staggerMs?: number;
  /** Fires as each earned star begins its pop — index is 0-based */
  onStarShown?: (index: number) => void;
}

export function StarRow({
  count,
  max = 3,
  size = 'md',
  label,
  animate = false,
  staggerMs = 220,
  onStarShown,
}: StarRowProps) {
  return (
    <div className={`star-row star-row--${size}`} role="img" aria-label={label ?? `${count} yıldız`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < count;
        const className = `star-row__star ${filled ? 'star-row__star--filled' : ''}`;

        if (!animate) {
          return (
            <span key={i} className={className}>
              ★
            </span>
          );
        }

        return (
          <motion.span
            key={i}
            className={className}
            initial={filled ? { scale: 0.2, opacity: 0, rotate: -30 } : { scale: 0.9, opacity: 0.4 }}
            animate={filled ? { scale: [0.2, 1.35, 1], opacity: 1, rotate: 0 } : { scale: 1, opacity: 1 }}
            transition={
              filled
                ? { duration: 0.42, delay: (i * staggerMs) / 1000, times: [0, 0.6, 1], ease: 'easeOut' }
                : { duration: 0.25, delay: (i * staggerMs) / 1000 }
            }
            onAnimationStart={() => {
              if (filled) onStarShown?.(i);
            }}
          >
            ★
          </motion.span>
        );
      })}
    </div>
  );
}
