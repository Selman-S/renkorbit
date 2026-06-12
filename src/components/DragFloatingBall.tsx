import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import type { BallSkinId } from '../game/shop';
import { Ball } from './Ball';
import type { ColorId } from '../game/types';

interface DragFloatingBallProps {
  colorId: ColorId;
  size: number;
  ballSkin?: BallSkinId;
  x: number;
  y: number;
  dropping?: boolean;
  targetX?: number;
  targetY?: number;
  onDropComplete?: () => void;
}

// Floating ball — follows finger; drop uses tween animation
export function DragFloatingBall({
  colorId,
  size,
  ballSkin = 'classic',
  x,
  y,
  dropping = false,
  targetX,
  targetY,
  onDropComplete,
}: DragFloatingBallProps) {
  const left = (dropping && targetX !== undefined ? targetX : x) - size / 2;
  const top = (dropping && targetY !== undefined ? targetY : y) - size / 2;

  return createPortal(
    <motion.div
      className="drag-floating-ball"
      style={{ width: size, height: size }}
      initial={false}
      animate={{ left, top }}
      transition={
        dropping
          ? { type: 'tween', duration: 0.28, ease: [0.34, 1.15, 0.64, 1] }
          : { duration: 0 }
      }
      onAnimationComplete={() => {
        if (dropping) onDropComplete?.();
      }}
    >
      <Ball colorId={colorId} size={size} skin={ballSkin} className="ball--floating" />
    </motion.div>,
    document.body,
  );
}
