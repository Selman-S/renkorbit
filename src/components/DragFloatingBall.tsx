import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import type { BallSkinId } from '../game/shop';
import { Ball } from './Ball';
import type { ColorId } from '../game/types';

export type FloatingTransition = 'drop' | 'return';

interface DragFloatingBallProps {
  colorId: ColorId;
  colorCount?: number;
  size: number;
  ballSkin?: BallSkinId;
  x: number;
  y: number;
  /** When set, the ball tweens to target instead of following the pointer */
  animating?: boolean;
  transitionPreset?: FloatingTransition;
  targetX?: number;
  targetY?: number;
  onAnimationDone?: () => void;
}

const TRANSITIONS = {
  drop: { type: 'tween' as const, duration: 0.28, ease: [0.34, 1.15, 0.64, 1] as [number, number, number, number] },
  return: { type: 'tween' as const, duration: 0.22, ease: 'easeOut' as const },
};

// Floating ball — follows finger; drop/return use tween animation
export function DragFloatingBall({
  colorId,
  colorCount = 12,
  size,
  ballSkin = 'classic',
  x,
  y,
  animating = false,
  transitionPreset = 'drop',
  targetX,
  targetY,
  onAnimationDone,
}: DragFloatingBallProps) {
  const left = (animating && targetX !== undefined ? targetX : x) - size / 2;
  const top = (animating && targetY !== undefined ? targetY : y) - size / 2;

  return createPortal(
    <motion.div
      className="drag-floating-ball"
      style={{ width: size, height: size }}
      initial={false}
      animate={{ left, top, scale: animating ? 1 : 1.08 }}
      transition={animating ? TRANSITIONS[transitionPreset] : { duration: 0 }}
      onAnimationComplete={() => {
        if (animating) onAnimationDone?.();
      }}
    >
      <Ball
        colorId={colorId}
        colorCount={colorCount}
        size={size}
        skin={ballSkin}
        className="ball--floating"
      />
    </motion.div>,
    document.body,
  );
}
