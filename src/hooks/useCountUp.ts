import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Eases a displayed number toward `value` whenever it changes */
export function useCountUp(value: number, durationMs = 450): number {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const span = Math.max(1, durationMs);
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / span);
      const next = Math.round(from + (to - from) * easeOutCubic(t));
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return shown;
}
