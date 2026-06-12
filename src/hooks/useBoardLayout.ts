import { useEffect, useState } from 'react';

export interface BoardLayout {
  ballSize: number;
  gap: number;
}

// Prefer wider column gaps; shrink ball size so all columns fit without scroll
function computeLayout(columnCount: number, capacity: number): BoardLayout {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const padX = 10;
  const stackAreaH = vh * 0.42;
  const slotGapRatio = 0.05;
  const ballByHeight = Math.floor(stackAreaH / (capacity * (1 + slotGapRatio)));

  const gapCandidates =
    columnCount <= 5 ? [12, 10, 8, 6] : columnCount <= 9 ? [8, 6, 5, 4] : [6, 5, 4, 3];

  let fallback: BoardLayout = { ballSize: 12, gap: 3 };

  for (const gap of gapCandidates) {
    const availableW = vw - padX * 2 - gap * (columnCount - 1);
    const ballByWidth = Math.floor(availableW / columnCount);

    if (ballByWidth >= 12) {
      const ballSize = Math.max(12, Math.min(ballByWidth, ballByHeight));
      return { ballSize, gap };
    }

    fallback = {
      ballSize: Math.max(12, Math.min(ballByWidth, ballByHeight)),
      gap,
    };
  }

  return fallback;
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
