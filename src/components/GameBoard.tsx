import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { LevelConfig } from '../game/levelConfig';
import type { BallSkinId } from '../game/shop';
import type { ColorId, Column } from '../game/types';
import { useBoardLayout } from '../hooks/useBoardLayout';
import { DragFloatingBall } from './DragFloatingBall';
import { Tube } from './Tube';
import './GameBoard.css';

interface GameBoardProps {
  columns: Column[];
  config: LevelConfig;
  invalidShake: number | null;
  disabled: boolean;
  canDrop: (from: number, to: number) => boolean;
  onBallMove: (from: number, to: number) => void;
  onPick?: () => void;
  onDrop?: () => void;
  ballSkin?: BallSkinId;
}

type FloatingBallState =
  | { mode: 'drag'; from: number; colorId: ColorId; x: number; y: number; liftY: number }
  | {
      mode: 'drop';
      from: number;
      to: number;
      colorId: ColorId;
      x: number;
      y: number;
      targetX: number;
      targetY: number;
    };

const TOUCH_LIFT_MIN_PX = 56;

/** Lift floating ball above finger on touch / coarse-pointer devices */
function getTouchLiftPx(event: PointerEvent | ReactPointerEvent<HTMLElement>, ballSize: number): number {
  const isTouchLike =
    event.pointerType === 'touch' ||
    (event.pointerType === '' && typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

  if (!isTouchLike) return 0;
  return Math.max(TOUCH_LIFT_MIN_PX, Math.round(ballSize * 1.15));
}

interface TubeSnapInfo {
  index: number;
  centerX: number;
  width: number;
}

function getLandingPosition(tubeEl: HTMLDivElement, stackHeight: number): { x: number; y: number } | null {
  const slotsEl = tubeEl.querySelector('.tube__slots');
  if (!slotsEl) return null;

  const landingSlot = slotsEl.querySelectorAll('.tube__slot')[stackHeight];
  if (!landingSlot) return null;

  const rect = landingSlot.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Snap to the column whose center is closest on the X axis */
function findNearestTube(x: number, tubeRefs: Map<number, HTMLDivElement>): number | null {
  const tubes: TubeSnapInfo[] = [...tubeRefs.entries()]
    .map(([index, el]) => {
      const rect = el.getBoundingClientRect();
      return { index, centerX: rect.left + rect.width / 2, width: rect.width };
    })
    .sort((a, b) => a.centerX - b.centerX);

  if (tubes.length === 0) return null;

  let best = tubes[0];
  let bestDist = Math.abs(x - best.centerX);

  for (let i = 1; i < tubes.length; i++) {
    const dist = Math.abs(x - tubes[i].centerX);
    if (dist < bestDist) {
      bestDist = dist;
      best = tubes[i];
    }
  }

  const sortedIdx = tubes.findIndex((t) => t.index === best.index);
  let maxSnap = best.width * 0.65;

  if (sortedIdx > 0) {
    maxSnap = Math.max(maxSnap, (best.centerX - tubes[sortedIdx - 1].centerX) / 2);
  }
  if (sortedIdx < tubes.length - 1) {
    maxSnap = Math.max(maxSnap, (tubes[sortedIdx + 1].centerX - best.centerX) / 2);
  }

  if (bestDist > maxSnap) return null;

  return best.index;
}

export function GameBoard({
  columns,
  config,
  invalidShake,
  disabled,
  canDrop,
  onBallMove,
  onPick,
  onDrop,
  ballSkin = 'classic',
}: GameBoardProps) {
  const { ballSize, gap } = useBoardLayout(config.columns, config.capacity);

  const tubeRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [floating, setFloating] = useState<FloatingBallState | null>(null);
  const [hoverTarget, setHoverTarget] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const floatingRef = useRef<FloatingBallState | null>(null);

  useEffect(() => {
    floatingRef.current = floating;
  }, [floating]);

  const setTubeRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) tubeRefs.current.set(index, el);
    else tubeRefs.current.delete(index);
  }, []);

  const resolveDropTarget = useCallback(
    (x: number, from: number): number | null => {
      const target = findNearestTube(x, tubeRefs.current);
      if (target === null || target === from || !canDrop(from, target)) return null;
      return target;
    },
    [canDrop],
  );

  const setHoverIfChanged = useCallback((target: number | null) => {
    if (hoverRef.current === target) return;
    hoverRef.current = target;
    setHoverTarget(target);
  }, []);

  const commitPendingDrop = useCallback(() => {
    const pending = floatingRef.current;
    if (pending?.mode !== 'drop') return;
    onDrop?.();
    onBallMove(pending.from, pending.to);
    setFloating(null);
    setHoverIfChanged(null);
  }, [onBallMove, onDrop, setHoverIfChanged]);

  const handleTubePointerDown = useCallback(
    (from: number, colorId: ColorId, event: ReactPointerEvent<HTMLElement>, _anchorEl: HTMLElement) => {
      if (disabled) return;

      const pending = floatingRef.current;
      if (pending?.mode === 'drop') {
        commitPendingDrop();
      } else if (pending) {
        return;
      }

      const liftY = getTouchLiftPx(event, ballSize);

      setFloating({
        mode: 'drag',
        from,
        colorId,
        x: event.clientX,
        y: event.clientY - liftY,
        liftY,
      });
      setHoverIfChanged(null);
      onPick?.();
    },
    [disabled, commitPendingDrop, setHoverIfChanged, onPick, ballSize],
  );

  const handleDropComplete = useCallback(() => {
    if (floatingRef.current?.mode !== 'drop') return;
    commitPendingDrop();
  }, [commitPendingDrop]);

  useEffect(() => {
    if (floating?.mode !== 'drag') return;

    const drag = floating;

    const handlePointerMove = (e: PointerEvent) => {
      setFloating((f) =>
        f?.mode === 'drag'
          ? { ...f, x: e.clientX, y: e.clientY - f.liftY }
          : f,
      );

      const target = resolveDropTarget(e.clientX, drag.from);
      setHoverIfChanged(target);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const target = resolveDropTarget(e.clientX, drag.from);

      if (target !== null) {
        const tubeEl = tubeRefs.current.get(target);
        const landing = tubeEl ? getLandingPosition(tubeEl, columns[target].length) : null;

        if (landing) {
          setFloating({
            mode: 'drop',
            from: drag.from,
            to: target,
            colorId: drag.colorId,
            x: e.clientX,
            y: e.clientY - drag.liftY,
            targetX: landing.x,
            targetY: landing.y,
          });
          setHoverIfChanged(target);
          return;
        }

        onDrop?.();
        onBallMove(drag.from, target);
      }

      setFloating(null);
      setHoverIfChanged(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [floating, resolveDropTarget, onBallMove, onDrop, columns, setHoverIfChanged]);

  const isDragging = floating?.mode === 'drag';
  const dragFrom = floating?.from ?? null;

  return (
    <div className="game-board-wrap">
      {floating && (
        <DragFloatingBall
          colorId={floating.colorId}
          colorCount={config.colors}
          size={ballSize}
          ballSkin={ballSkin}
          x={floating.x}
          y={floating.y}
          dropping={floating.mode === 'drop'}
          targetX={floating.mode === 'drop' ? floating.targetX : undefined}
          targetY={floating.mode === 'drop' ? floating.targetY : undefined}
          onDropComplete={handleDropComplete}
        />
      )}

      <div
        className="game-board"
        style={{
          gap,
          gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column, index) => (
          <Tube
            key={index}
            ref={(el) => setTubeRef(index, el)}
            index={index}
            column={column}
            config={config}
            dropTarget={hoverTarget === index}
            invalid={invalidShake === index}
            ballSize={ballSize}
            disabled={disabled || isDragging}
            dragFrom={dragFrom}
            ballSkin={ballSkin}
            onTubePointerDown={handleTubePointerDown}
          />
        ))}
      </div>
    </div>
  );
}
