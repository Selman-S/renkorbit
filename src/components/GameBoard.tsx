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
  | { mode: 'drag'; from: number; colorId: ColorId; x: number; y: number }
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

function getLandingPosition(tubeEl: HTMLDivElement, stackHeight: number): { x: number; y: number } | null {
  const slotsEl = tubeEl.querySelector('.tube__slots');
  if (!slotsEl) return null;

  const landingSlot = slotsEl.querySelectorAll('.tube__slot')[stackHeight];
  if (!landingSlot) return null;

  const rect = landingSlot.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
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

  const setTubeRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) tubeRefs.current.set(index, el);
    else tubeRefs.current.delete(index);
  }, []);

  const findTubeAt = useCallback((x: number, y: number): number | null => {
    for (const [index, el] of tubeRefs.current.entries()) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return index;
      }
    }
    return null;
  }, []);

  const setHoverIfChanged = useCallback((target: number | null) => {
    if (hoverRef.current === target) return;
    hoverRef.current = target;
    setHoverTarget(target);
  }, []);

  const handleBallPointerDown = useCallback(
    (from: number, colorId: ColorId, _event: ReactPointerEvent<HTMLElement>, el: HTMLElement) => {
      if (disabled || floating) return;
      const rect = el.getBoundingClientRect();
      setFloating({
        mode: 'drag',
        from,
        colorId,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setHoverIfChanged(null);
      onPick?.();
    },
    [disabled, floating, setHoverIfChanged, onPick],
  );

  const handleDropComplete = useCallback(() => {
    if (floating?.mode !== 'drop') return;
    onDrop?.();
    onBallMove(floating.from, floating.to);
    setFloating(null);
    setHoverIfChanged(null);
  }, [floating, onBallMove, onDrop, setHoverIfChanged]);

  useEffect(() => {
    if (floating?.mode !== 'drag') return;

    const drag = floating;

    const handlePointerMove = (e: PointerEvent) => {
      setFloating((f) => (f?.mode === 'drag' ? { ...f, x: e.clientX, y: e.clientY } : f));

      const target = findTubeAt(e.clientX, e.clientY);
      const nextHover =
        target !== null && target !== drag.from && canDrop(drag.from, target) ? target : null;
      setHoverIfChanged(nextHover);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const target = findTubeAt(e.clientX, e.clientY);

      if (target !== null && target !== drag.from && canDrop(drag.from, target)) {
        const tubeEl = tubeRefs.current.get(target);
        const landing = tubeEl ? getLandingPosition(tubeEl, columns[target].length) : null;

        if (landing) {
          setFloating({
            mode: 'drop',
            from: drag.from,
            to: target,
            colorId: drag.colorId,
            x: e.clientX,
            y: e.clientY,
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
  }, [floating, findTubeAt, canDrop, onBallMove, onDrop, columns, setHoverIfChanged]);

  const isBusy = floating !== null;
  const dragFrom = floating?.from ?? null;

  return (
    <div className="game-board-wrap">
      {floating && (
        <DragFloatingBall
          colorId={floating.colorId}
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
            disabled={disabled || isBusy}
            dragFrom={dragFrom}
            ballSkin={ballSkin}
            onBallPointerDown={handleBallPointerDown}
          />
        ))}
      </div>
    </div>
  );
}
