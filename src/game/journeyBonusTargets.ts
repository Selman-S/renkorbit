import { PROGRESSION_STEPS, type ProgressionStep } from './progressionMap';

export interface BonusTargets {
  minMoves: number;
  maxMoves: number;
  minTimeSec: number;
  maxTimeSec: number;
}

type LayoutKind = 'rows' | 'mixed' | 'usta';

/** User playtest — near-optimal move counts per color tier */
const PLAYTEST_MOVES: Record<LayoutKind, [number, number][]> = {
  rows: [
    [3, 10],
    [4, 26],
    [5, 44],
    [6, 74],
    [11, 297],
  ],
  mixed: [
    [3, 9],
    [4, 21],
    [5, 32],
    [6, 57],
  ],
  usta: [
    [3, 11],
    [4, 23],
    [5, 31],
    [6, 52],
    [10, 241],
  ],
};

/** User playtest — near-optimal completion times (seconds) */
const PLAYTEST_TIME: Record<LayoutKind, [number, number][]> = {
  rows: [
    [3, 10],
    [4, 19],
    [5, 40],
    [6, 57],
    [11, 475],
  ],
  mixed: [
    [3, 9],
    [4, 20],
    [5, 29],
    [6, 65],
  ],
  usta: [
    [3, 10],
    [4, 21],
    [5, 32],
    [6, 62],
    [10, 405],
  ],
};

const MIN_COLORS = 3;
const MAX_COLORS = 12;

/** Piecewise-linear curve with slope extrapolation outside anchors */
export function interpolateCurve(anchors: [number, number][], x: number): number {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0][1];

  if (x <= sorted[0][0]) {
    const [x0, y0] = sorted[0];
    const [x1, y1] = sorted[1];
    if (x1 === x0) return y0;
    return Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
  }

  const lastIdx = sorted.length - 1;
  if (x >= sorted[lastIdx][0]) {
    const [x0, y0] = sorted[lastIdx - 1];
    const [x1, y1] = sorted[lastIdx];
    if (x1 === x0) return y1;
    return Math.round(y1 + ((y1 - y0) * (x - x1)) / (x1 - x0));
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const [x0, y0] = sorted[i];
    const [x1, y1] = sorted[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return Math.round(y0 + (y1 - y0) * t);
    }
  }

  return sorted[lastIdx][1];
}

/** Fill gaps via playtest interpolation; beyond last anchor follow rows × tail ratio */
function buildDerivedCurve(
  playtest: [number, number][],
  rowsCurve: [number, number][],
): [number, number][] {
  const sorted = [...playtest].sort((a, b) => a[0] - b[0]);
  const points = new Map<number, number>();
  for (const [colors, value] of sorted) {
    points.set(colors, value);
  }

  const maxKnown = sorted[sorted.length - 1][0];
  const tailRatio =
    interpolateCurve(sorted, maxKnown) / Math.max(1, interpolateCurve(rowsCurve, maxKnown));

  for (let colors = MIN_COLORS; colors <= MAX_COLORS; colors++) {
    if (points.has(colors)) continue;

    if (colors <= maxKnown) {
      points.set(colors, interpolateCurve(sorted, colors));
      continue;
    }

    points.set(
      colors,
      Math.max(
        colors + 2,
        Math.round(interpolateCurve(rowsCurve, colors) * tailRatio),
      ),
    );
  }

  return [...points.entries()].sort((a, b) => a[0] - b[0]);
}

function buildRowsCurve(playtest: [number, number][]): [number, number][] {
  const points = new Map<number, number>();
  for (const [colors, value] of playtest) {
    points.set(colors, value);
  }
  for (let colors = MIN_COLORS; colors <= MAX_COLORS; colors++) {
    if (!points.has(colors)) {
      points.set(colors, interpolateCurve(playtest, colors));
    }
  }
  return [...points.entries()].sort((a, b) => a[0] - b[0]);
}

const ROWS_MOVE_CURVE = buildRowsCurve(PLAYTEST_MOVES.rows);
const ROWS_TIME_CURVE = buildRowsCurve(PLAYTEST_TIME.rows);

const MIXED_MOVE_CURVE = buildDerivedCurve(PLAYTEST_MOVES.mixed, ROWS_MOVE_CURVE);
const MIXED_TIME_CURVE = buildDerivedCurve(PLAYTEST_TIME.mixed, ROWS_TIME_CURVE);
const USTA_MOVE_CURVE = buildDerivedCurve(PLAYTEST_MOVES.usta, ROWS_MOVE_CURVE);
const USTA_TIME_CURVE = buildDerivedCurve(PLAYTEST_TIME.usta, ROWS_TIME_CURVE);

const MOVE_CURVES: Record<LayoutKind, [number, number][]> = {
  rows: ROWS_MOVE_CURVE,
  mixed: MIXED_MOVE_CURVE,
  usta: USTA_MOVE_CURVE,
};

const TIME_CURVES: Record<LayoutKind, [number, number][]> = {
  rows: ROWS_TIME_CURVE,
  mixed: MIXED_TIME_CURVE,
  usta: USTA_TIME_CURVE,
};

function layoutKind(step: ProgressionStep): LayoutKind {
  if (step.layoutMode === 'rows') return 'rows';
  return step.title.endsWith('Usta') ? 'usta' : 'mixed';
}

function minMovesFor(colors: number, kind: LayoutKind): number {
  return interpolateCurve(MOVE_CURVES[kind], colors);
}

function minTimeFor(colors: number, kind: LayoutKind): number {
  return interpolateCurve(TIME_CURVES[kind], colors);
}

function buildMaxTargets(minMoves: number, minTimeSec: number): Pick<BonusTargets, 'maxMoves' | 'maxTimeSec'> {
  return {
    maxMoves: minMoves + Math.max(15, Math.round(minMoves * 1.5)),
    maxTimeSec: minTimeSec + Math.max(25, Math.round(minTimeSec * 2.2)),
  };
}

function buildStepTargets(step: ProgressionStep): BonusTargets {
  const kind = layoutKind(step);
  const minMoves = minMovesFor(step.colors, kind);
  const minTimeSec = minTimeFor(step.colors, kind);
  const maxTargets = buildMaxTargets(minMoves, minTimeSec);

  return {
    minMoves,
    minTimeSec,
    ...maxTargets,
  };
}

const JOURNEY_BONUS_TARGETS: Record<number, BonusTargets> = Object.fromEntries(
  PROGRESSION_STEPS.map((step) => [step.index, buildStepTargets(step)]),
);

export function getJourneyBonusTargets(stepIndex: number): BonusTargets {
  return JOURNEY_BONUS_TARGETS[stepIndex] ?? buildStepTargets(PROGRESSION_STEPS[0]);
}

/** Debug — full curve tables for reporting */
export function getBonusCurveTables(): {
  moves: Record<LayoutKind, [number, number][]>;
  time: Record<LayoutKind, [number, number][]>;
} {
  return {
    moves: { ...MOVE_CURVES },
    time: { ...TIME_CURVES },
  };
}

export function getAllJourneyBonusTargets(): Array<{
  step: ProgressionStep;
  targets: BonusTargets;
  layout: LayoutKind;
}> {
  return PROGRESSION_STEPS.map((step) => ({
    step,
    targets: getJourneyBonusTargets(step.index),
    layout: layoutKind(step),
  }));
}
