import { forwardRef, useRef, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import type { LevelConfig } from '../game/levelConfig';
import type { BallSkinId } from '../game/shop';
import type { ColorId, Column } from '../game/types';
import { Ball } from './Ball';
import './Tube.css';

interface TubeProps {
  index: number;
  column: Column;
  config: LevelConfig;
  dropTarget: boolean;
  invalid: boolean;
  ballSize: number;
  disabled: boolean;
  dragFrom: number | null;
  ballSkin?: BallSkinId;
  onTubePointerDown: (
    from: number,
    colorId: ColorId,
    event: PointerEvent<HTMLElement>,
    anchorEl: HTMLElement,
  ) => void;
}

export const Tube = forwardRef<HTMLDivElement, TubeProps>(function Tube(
  {
    index,
    column,
    config,
    dropTarget,
    invalid,
    ballSize,
    disabled,
    dragFrom,
    ballSkin = 'classic',
    onTubePointerDown,
  },
  ref,
) {
  const gap = ballSize * 0.06;
  const slotsHeight = config.capacity * ballSize + (config.capacity - 1) * gap;
  const isDraggingFromHere = dragFrom === index;
  const topBallRef = useRef<HTMLDivElement>(null);
  const hasBalls = column.length > 0;
  const canPick = hasBalls && !disabled;

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!canPick) return;
    e.preventDefault();

    const topColorId = column[column.length - 1];
    const anchor = topBallRef.current ?? (e.currentTarget as HTMLElement);
    e.currentTarget.setPointerCapture(e.pointerId);
    onTubePointerDown(index, topColorId, e, anchor);
  };

  return (
    <motion.div
      ref={ref}
      className={[
        'tube',
        canPick && 'tube--pickable',
        dropTarget && 'tube--valid',
        invalid && 'tube--invalid',
      ]
        .filter(Boolean)
        .join(' ')}
      animate={invalid ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      data-tube-index={index}
      onPointerDown={canPick ? handlePointerDown : undefined}
    >
      <div className="tube__rim" aria-hidden />
      <div className="tube__glass" style={{ minHeight: slotsHeight }}>
        <div className="tube__slots" style={{ height: slotsHeight, gap }}>
          {Array.from({ length: config.capacity }, (_, slot) => {
            const colorId = slot < column.length ? column[slot] : null;
            const isTop = colorId !== null && slot === column.length - 1;
            const showGhost = isTop && isDraggingFromHere;

            return (
              <div
                key={`${index}-slot-${slot}`}
                className={`tube__slot ${colorId === null ? 'tube__slot--empty' : ''}`}
                style={{ width: ballSize, height: ballSize }}
              >
                {colorId !== null &&
                  (showGhost ? (
                    <Ball colorId={colorId} size={ballSize} ghost />
                  ) : (
                    <div
                      ref={isTop ? topBallRef : undefined}
                      className="tube__ball-wrap"
                    >
                      <Ball colorId={colorId} size={ballSize} skin={ballSkin} />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="tube__base" />
    </motion.div>
  );
});
