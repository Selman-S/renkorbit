#!/usr/bin/env node
/**
 * Print bonus curve tables and ASCII charts from playtest anchors.
 * Run: npm run report:bonus
 */

const PLAYTEST_MOVES = {
  rows: [[3, 10], [4, 26], [5, 44], [6, 74], [11, 297]],
  mixed: [[3, 9], [4, 21], [5, 32], [6, 57]],
  usta: [[3, 11], [4, 23], [5, 31], [6, 52], [10, 241]],
};

const PLAYTEST_TIME = {
  rows: [[3, 10], [4, 19], [5, 40], [6, 57], [11, 475]],
  mixed: [[3, 9], [4, 20], [5, 29], [6, 65]],
  usta: [[3, 10], [4, 21], [5, 32], [6, 62], [10, 405]],
};

const TIER_NAMES = {
  3: 'Mini', 4: 'Küçük', 5: 'Orta', 6: 'Geniş', 7: 'Süper', 8: 'Büyük',
  9: 'Mega', 10: 'Ultra', 11: 'Kozmik', 12: 'Galaksi',
};

const MIN_COLORS = 3;
const MAX_COLORS = 12;

function interpolateCurve(anchors, x) {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  if (sorted.length <= 1) return sorted[0]?.[1] ?? 0;

  if (x <= sorted[0][0]) {
    const [x0, y0] = sorted[0];
    const [x1, y1] = sorted[1];
    return Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
  }

  const lastIdx = sorted.length - 1;
  if (x >= sorted[lastIdx][0]) {
    const [x0, y0] = sorted[lastIdx - 1];
    const [x1, y1] = sorted[lastIdx];
    return Math.round(y1 + ((y1 - y0) * (x - x1)) / (x1 - x0));
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const [x0, y0] = sorted[i];
    const [x1, y1] = sorted[i + 1];
    if (x >= x0 && x <= x1) {
      return Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
    }
  }
  return sorted[lastIdx][1];
}

/** Build ratio curve (layout / rows) from sparse playtest points — used in reports */
function buildRatioCurve(playtest, rowsCurve) {
  return playtest.map(([colors, value]) => {
    const rowsValue = interpolateCurve(rowsCurve, colors);
    return [colors, rowsValue > 0 ? value / rowsValue : 1];
  });
}

/** Fill gaps via playtest interpolation; beyond last anchor follow rows × tail ratio */
function buildDerivedCurve(playtest, rowsCurve) {
  const sorted = [...playtest].sort((a, b) => a[0] - b[0]);
  const points = new Map(sorted);
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

function buildRowsCurve(playtest) {
  const points = new Map(playtest);
  for (let colors = MIN_COLORS; colors <= MAX_COLORS; colors++) {
    if (!points.has(colors)) points.set(colors, interpolateCurve(playtest, colors));
  }
  return [...points.entries()].sort((a, b) => a[0] - b[0]);
}

const rowsMove = buildRowsCurve(PLAYTEST_MOVES.rows);
const rowsTime = buildRowsCurve(PLAYTEST_TIME.rows);
const curves = {
  moves: {
    rows: rowsMove,
    mixed: buildDerivedCurve(PLAYTEST_MOVES.mixed, rowsMove),
    usta: buildDerivedCurve(PLAYTEST_MOVES.usta, rowsMove),
  },
  time: {
    rows: rowsTime,
    mixed: buildDerivedCurve(PLAYTEST_TIME.mixed, rowsTime),
    usta: buildDerivedCurve(PLAYTEST_TIME.usta, rowsTime),
  },
};

function asciiChart(curvesByLayout, label) {
  const width = 50;
  const allValues = Object.values(curvesByLayout).flatMap((c) => c.map(([, y]) => y));
  const max = Math.max(...allValues);
  const lines = [`\n=== ${label} ===`];

  for (const [layout, points] of Object.entries(curvesByLayout)) {
    lines.push(`\n${layout}:`);
    for (const [colors, value] of points) {
      const barLen = Math.max(1, Math.round((value / max) * width));
      const bar = '█'.repeat(barLen);
      const tier = TIER_NAMES[colors] ?? colors;
      lines.push(`  n=${String(colors).padStart(2)} ${tier.padEnd(8)} ${String(value).padStart(4)} ${bar}`);
    }
  }
  return lines.join('\n');
}

function buildMax(minVal) {
  return {
    maxMoves: minVal + Math.max(15, Math.round(minVal * 1.5)),
    maxTime: minVal + Math.max(25, Math.round(minVal * 2.2)),
  };
}

function stepLayout(colors, slot) {
  if (slot === 0) return 'rows';
  if (slot === 1) return 'mixed';
  return 'usta';
}

function stepTitle(colors, slot) {
  const tier = TIER_NAMES[colors];
  if (slot === 0) return `${tier} Yörünge`;
  if (slot === 1) return `${tier} Karışık`;
  return `${tier} Usta`;
}

console.log(asciiChart(curves.moves, 'Hamle eğrisi (min hamle)'));
console.log(asciiChart(curves.time, 'Süre eğrisi (min sn)'));

console.log('\n=== 30 adım — min / max hedefler ===\n');
console.log(' #  Adım              Tür     hamle      süre');
console.log('--- ------------------ ------ ---------- ----------');

let stepIndex = 1;
for (let colors = MIN_COLORS; colors <= MAX_COLORS; colors++) {
  for (let slot = 0; slot < 3; slot++) {
    const layout = stepLayout(colors, slot);
    const minM = interpolateCurve(curves.moves[layout], colors);
    const minT = interpolateCurve(curves.time[layout], colors);
    const maxM = buildMax(minM).maxMoves;
    const maxT = buildMax(minT).maxTime;
    const title = stepTitle(colors, slot);
    const hasData =
      PLAYTEST_MOVES[layout].some(([n]) => n === colors) ||
      PLAYTEST_TIME[layout].some(([n]) => n === colors);
    const marker = hasData ? '*' : ' ';
    console.log(
      `${String(stepIndex).padStart(2)}${marker} ${title.padEnd(18)} ${layout.padEnd(6)} ` +
        `${String(minM).padStart(3)}-${String(maxM).padStart(3)}  ` +
        `${String(minT).padStart(3)}s-${String(maxT).padStart(4)}s`,
    );
    stepIndex++;
  }
}

console.log('\n* = playtest verisi olan nokta');
