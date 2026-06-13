import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import {
  getComboBreakTheme,
  getComboMultiplier,
  getComboTheme,
} from '../game/combo';
import './ComboBurst.css';

export type ComboBurstKind = 'gain' | 'break';

export interface ComboBurstItem {
  id: number;
  kind: ComboBurstKind;
  combo: number;
}

interface ComboBurstProps {
  item: ComboBurstItem;
  onDone: (id: number) => void;
}

export function ComboBurst({ item, onDone }: ComboBurstProps) {
  const isBreak = item.kind === 'break';
  const theme = isBreak ? getComboBreakTheme() : getComboTheme(item.combo);
  const multiplier = getComboMultiplier(item.combo);
  const peakScale = 1.2 + multiplier * 0.12;

  const style = {
    '--combo-text': theme.text,
    '--combo-label': theme.label,
    '--combo-ring': theme.ring,
    '--combo-ring-inner': theme.ringInner,
    '--combo-glow': theme.glow,
  } as CSSProperties;

  if (isBreak) {
    return (
      <motion.div
        className="combo-burst combo-burst--break"
        style={style}
        initial={{ scale: 1.1, opacity: 0, y: -20, rotate: -4 }}
        animate={{
          scale: [1.1, 0.92, 0.78],
          opacity: [0, 1, 0],
          y: [-20, 18, 56],
          rotate: [-4, 4, 0],
        }}
        transition={{ duration: 0.78, ease: 'easeIn', times: [0, 0.35, 1] }}
        onAnimationComplete={() => onDone(item.id)}
      >
        <motion.span
          className="combo-burst__ring combo-burst__ring--outer"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          aria-hidden
        />
        <motion.span
          className="combo-burst__text combo-burst__text--break"
          animate={{ scale: [1, 0.88, 0.82] }}
          transition={{ duration: 0.78, times: [0, 0.4, 1] }}
        >
          ×{multiplier}
        </motion.span>
        <span className="combo-burst__label combo-burst__label--break">KIRILDI!</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="combo-burst combo-burst--gain"
      style={style}
      initial={{ scale: 0.1, opacity: 0, y: 24 }}
      animate={{
        scale: [0.1, peakScale * 0.88, peakScale, peakScale * 1.08],
        opacity: [0, 1, 1, 0],
        y: [24, -36 - multiplier * 6, -108 - multiplier * 10, -150 - multiplier * 12],
      }}
      transition={{ duration: 0.72 + multiplier * 0.04, ease: 'easeOut', times: [0, 0.32, 0.62, 1] }}
      onAnimationComplete={() => onDone(item.id)}
    >
      <motion.span
        className="combo-burst__ring combo-burst__ring--outer"
        initial={{ scale: 0.4, opacity: 0.7 }}
        animate={{ scale: 1.8 + multiplier * 0.18, opacity: 0 }}
        transition={{ duration: 0.45 + multiplier * 0.03, delay: 0.18, ease: 'easeOut' }}
        aria-hidden
      />
      <motion.span
        className="combo-burst__ring combo-burst__ring--inner"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.35 + multiplier * 0.12, opacity: 0 }}
        transition={{ duration: 0.38 + multiplier * 0.03, delay: 0.24, ease: 'easeOut' }}
        aria-hidden
      />
      <motion.span
        className="combo-burst__text"
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.08, 1.15 + multiplier * 0.03] }}
        transition={{ duration: 0.72, times: [0, 0.45, 1] }}
      >
        ×{multiplier}
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
