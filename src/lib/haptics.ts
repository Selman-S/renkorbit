export type HapticKind = 'pick' | 'drop' | 'invalid' | 'complete' | 'combo' | 'win';

const PATTERNS: Record<HapticKind, number | number[]> = {
  pick: 8,
  drop: 12,
  invalid: [30, 40, 30],
  complete: 25,
  combo: [15, 30, 15],
  win: [40, 60, 40, 60, 90],
};

/** Short vibration on devices that support it — silently a no-op elsewhere */
export function haptic(kind: HapticKind): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* ignore */
  }
}
