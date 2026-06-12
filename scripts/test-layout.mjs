// Simulate useBoardLayout ball sizes at common mobile viewports

function computeLayout(columnCount, capacity, vw, vh) {
  const padX = 12;
  const gap = columnCount <= 5 ? 8 : columnCount <= 9 ? 4 : 2;
  const availableW = vw - padX * 2 - gap * (columnCount - 1);
  const ballByWidth = Math.floor(availableW / columnCount) - 1;
  const stackAreaH = vh * 0.42;
  const slotGapRatio = 0.05;
  const ballByHeight = Math.floor(stackAreaH / (capacity * (1 + slotGapRatio)));
  const ballSize = Math.max(14, Math.min(ballByWidth, ballByHeight));
  return { ballSize, gap };
}

const viewports = [
  ['iPhone SE', 375, 667],
  ['iPhone 14', 390, 844],
  ['Pixel', 412, 915],
  ['iPad', 768, 1024],
  ['Landscape phone', 844, 390],
];

const levels = [
  ['4 renk', 5, 4],
  ['8 renk', 9, 8],
  ['12 renk', 13, 12],
];

console.log('RenkOrbit — layout simulation\n');
for (const [name, vw, vh] of viewports) {
  console.log(`${name} (${vw}×${vh})`);
  for (const [label, cols, cap] of levels) {
    const { ballSize, gap } = computeLayout(cols, cap, vw, vh);
    const totalW = cols * ballSize + (cols - 1) * gap + 24;
    const ok = totalW <= vw ? 'OK' : 'OVERFLOW';
    console.log(`  ${label}: ball ${ballSize}px, gap ${gap}px, width ~${totalW}px [${ok}]`);
  }
  console.log('');
}
