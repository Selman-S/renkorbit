import { forwardRef, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getColorDef } from '../game/constants';
import type { LevelConfig } from '../game/levelConfig';
import { isTubeComplete } from '../game/scoring';
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
  /** Points this tube is currently worth — shown as "+N" when it completes */
  earnedPoints?: number;
  celebrate?: boolean;
  celebrateDelay?: number;
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
    earnedPoints,
    celebrate = false,
    celebrateDelay = 0,
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

  const complete = isTubeComplete(column, config.capacity);
  const prevComplete = useRef(complete);
  const [pop, setPop] = useState<{ id: number; points: number } | null>(null);
  const popId = useRef(0);

  // Rising edge: the tube just became a full single color
  useEffect(() => {
    if (complete && !prevComplete.current && earnedPoints) {
      popId.current += 1;
      setPop({ id: popId.current, points: earnedPoints });
    }
    prevComplete.current = complete;
  }, [complete, earnedPoints]);

  const tubeColor = complete ? getColorDef(column[0], config.colors) : null;
  const colorStyle = tubeColor
    ? ({
        '--tube-color': tubeColor.hex,
        '--tube-color-hi': tubeColor.highlight,
      } as CSSProperties)
    : undefined;

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!canPick) return;
    e.preventDefault();

    const topColorId = column[column.length - 1];
    const anchor = topBallRef.current ?? (e.currentTarget as HTMLElement);
    e.currentTarget.setPointerCapture(e.pointerId);
    onTubePointerDown(index, topColorId, e, anchor);
  };

  const animate = invalid
    ? { x: [0, -6, 6, -6, 6, 0], scale: 1 }
    : celebrate
      ? { x: 0, scale: [1, 1.05, 1] }
      : pop
        ? { x: 0, scale: [1, 1.06, 1] }
        : { x: 0, scale: 1 };

  const transition = invalid
    ? { duration: 0.4 }
    : celebrate
      ? { duration: 0.5, delay: celebrateDelay, repeat: 1, repeatDelay: 0.6 }
      : { duration: 0.45, ease: 'easeOut' as const };

  return (
    <motion.div
      ref={ref}
      className={[
        'tube',
        canPick && 'tube--pickable',
        dropTarget && 'tube--valid',
        invalid && 'tube--invalid',
        complete && 'tube--complete',
      ]
        .filter(Boolean)
        .join(' ')}
      style={colorStyle}
      animate={animate}
      transition={transition}
      data-tube-index={index}
      onPointerDown={canPick ? handlePointerDown : undefined}
    >
      <div className="tube__rim" aria-hidden />
      <div className="tube__glass" style={{ minHeight: slotsHeight }}>
        <AnimatePresence>
          {pop && (
            <motion.span
              key={pop.id}
              className="tube__points"
              initial={{ opacity: 0, y: 6, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: [6, -18, -34, -46], scale: [0.8, 1.1, 1, 0.95] }}
              transition={{ duration: 0.85, ease: 'easeOut', times: [0, 0.2, 0.7, 1] }}
              onAnimationComplete={() => setPop(null)}
              aria-hidden
            >
              +{pop.points}
            </motion.span>
          )}
        </AnimatePresence>
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
                    <Ball colorId={colorId} colorCount={config.colors} size={ballSize} ghost />
                  ) : (
                    <div
                      ref={isTop ? topBallRef : undefined}
                      className="tube__ball-wrap"
                    >
                      <Ball
                        colorId={colorId}
                        colorCount={config.colors}
                        size={ballSize}
                        skin={ballSkin}
                      />
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
