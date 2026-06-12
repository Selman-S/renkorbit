import type { LevelConfig } from './levelConfig';
import type { ColorId, Column } from './types';

export function cloneColumns(columns: Column[]): Column[] {
  return columns.map((col) => [...col]);
}

export function getTopColor(column: Column): ColorId | null {
  if (column.length === 0) return null;
  return column[column.length - 1];
}

// Always move one ball at a time from the top
export function getMovableCount(column: Column): number {
  return column.length > 0 ? 1 : 0;
}

export function canMove(
  columns: Column[],
  from: number,
  to: number,
  capacity: number,
): boolean {
  if (from === to) return false;
  const source = columns[from];
  const target = columns[to];
  if (!source?.length) return false;

  const movable = getMovableCount(source);
  const space = capacity - target.length;
  // Any color may stack on any color — only capacity matters
  return movable > 0 && space > 0;
}

export function moveBalls(
  columns: Column[],
  from: number,
  to: number,
  capacity: number,
): Column[] {
  if (!canMove(columns, from, to, capacity)) return columns;

  const next = cloneColumns(columns);
  const movable = Math.min(getMovableCount(next[from]), capacity - next[to].length);

  for (let i = 0; i < movable; i++) {
    const ball = next[from].pop()!;
    next[to].push(ball);
  }

  return next;
}

// Win: one empty tube + every other tube full with a single color (N balls per tube)
export function checkWin(columns: Column[], capacity: number): boolean {
  let emptyTubes = 0;

  for (const col of columns) {
    if (col.length === 0) {
      emptyTubes++;
      continue;
    }
    if (col.length !== capacity) return false;
    const color = col[0];
    if (!col.every((ball) => ball === color)) return false;
  }

  return emptyTubes === 1;
}

// Columns that contain more than one color (visually "mixed")
export function countMixedColumns(columns: Column[]): number {
  return columns.filter((col) => {
    if (col.length < 2) return false;
    const first = col[0];
    return col.some((ball) => ball !== first);
  }).length;
}

export function isValidTarget(
  columns: Column[],
  selected: number | null,
  target: number,
  capacity: number,
): boolean {
  if (selected === null) return false;
  return canMove(columns, selected, target, capacity);
}

export function getValidTargets(
  columns: Column[],
  from: number,
  capacity: number,
): number[] {
  return columns
    .map((_, i) => i)
    .filter((i) => i !== from && canMove(columns, from, i, capacity));
}

export function isColumnIndexValid(index: number, config: LevelConfig): boolean {
  return index >= 0 && index < config.columns;
}
