import { useEffect, useState } from 'react';

export interface BoardLayout {
  ballSize: number;
  gap: number;
}

// Fit all columns on screen without horizontal scroll
function computeLayout(columnCount: number, capacity: number): BoardLayout {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const padX = 12;
  const gap = columnCount <= 5 ? 8 : columnCount <= 9 ? 4 : 2;

  const availableW = vw - padX * 2 - gap * (columnCount - 1);
  const ballByWidth = Math.floor(availableW / columnCount) - 1;

  // ~42% of viewport height for the tube stack (below HUD, above controls)
  const stackAreaH = vh * 0.42;
  const slotGapRatio = 0.05;
  const ballByHeight = Math.floor(stackAreaH / (capacity * (1 + slotGapRatio)));

  const ballSize = Math.max(14, Math.min(ballByWidth, ballByHeight));

  return { ballSize, gap };
}

export function useBoardLayout(columnCount: number, capacity: number): BoardLayout {
  const [layout, setLayout] = useState<BoardLayout>(() =>
    typeof window !== 'undefined'
      ? computeLayout(columnCount, capacity)
      : { ballSize: 28, gap: 4 },
  );

  useEffect(() => {
    const update = () => setLayout(computeLayout(columnCount, capacity));
    // iOS reports new dimensions slightly after orientationchange
    const onOrientation = () => window.setTimeout(update, 150);

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', onOrientation);
    window.visualViewport?.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', onOrientation);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [columnCount, capacity]);

  return layout;
}
