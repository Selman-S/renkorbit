// Simulate useBoardLayout ball sizes at common mobile viewports

function computeLayout(columnCount, capacity, vw, vh) {
  const padX = 10;
  const stackAreaH = vh * 0.42;
  const slotGapRatio = 0.05;
  const ballByHeight = Math.floor(stackAreaH / (capacity * (1 + slotGapRatio)));

  const gapCandidates =
    columnCount <= 5 ? [12, 10, 8, 6] : columnCount <= 9 ? [8, 6, 5, 4] : [6, 5, 4, 3];

  let fallback = { ballSize: 12, gap: 3 };

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

const viewports = [
  ['iPhone SE', 375, 667],
  ['iPhone 14', 390, 844],
  ['Pixel', 412, 915],
  ['iPad', 768, 1024],
  ['Landscape phone', 844, 390],
];

const levels = [
  ['3 renk', 4, 3],
  ['6 renk', 7, 6],
  ['9 renk', 10, 9],
  ['12 renk', 13, 12],
];

console.log('RenkOrbit — layout simulation\n');
for (const [name, vw, vh] of viewports) {
  console.log(`${name} (${vw}×${vh})`);
  for (const [label, cols, cap] of levels) {
    const { ballSize, gap } = computeLayout(cols, cap, vw, vh);
    const totalW = cols * ballSize + (cols - 1) * gap + 20;
    const ok = totalW <= vw ? 'OK' : 'OVERFLOW';
    console.log(`  ${label}: ball ${ballSize}px, gap ${gap}px, width ~${totalW}px [${ok}]`);
  }
  console.log('');
}
