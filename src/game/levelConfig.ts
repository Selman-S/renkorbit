export type ColorCount = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type LayoutMode = 'rows' | 'mixed';
export type PlayMode = 'relaxed' | 'timed';

export const MIN_COLORS = 3;
export const MAX_COLORS = 12;

export const COLOR_OPTIONS: ColorCount[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export interface GameSettings {
  colors: ColorCount;
  layoutMode: LayoutMode;
  playMode: PlayMode;
}

export const DEFAULT_SETTINGS: GameSettings = {
  colors: 3,
  layoutMode: 'rows',
  playMode: 'relaxed',
};

/** Legacy timed limits — journey uses relaxed only */
export const TIME_LIMIT_SEC: Partial<Record<ColorCount, number>> = {
  4: 300,
  8: 600,
  12: 900,
};

export function getTimeLimitSec(colors: ColorCount): number {
  return TIME_LIMIT_SEC[colors] ?? 300 + colors * 45;
}

export interface LevelConfig {
  colors: ColorCount;
  layoutMode: LayoutMode;
  label: string;
  columns: number;
  ballsPerColor: number;
  capacity: number;
  scoreMultiplier: number;
}

const LAYOUT_LABEL: Record<LayoutMode, string> = {
  rows: 'Sıralı',
  mixed: 'Karışık',
};

/** Tube points scale gently with board size */
export function getScoreMultiplier(colors: ColorCount): number {
  return Math.max(1, Math.round(colors / 2));
}

export function isColorCount(value: number): value is ColorCount {
  return Number.isInteger(value) && value >= MIN_COLORS && value <= MAX_COLORS;
}

export function getGameKey(settings: GameSettings): string {
  return `${settings.colors}_${settings.layoutMode}_${settings.playMode}`;
}

// N colors × N balls → N filled tubes + 1 empty
export function buildConfig(settings: GameSettings): LevelConfig {
  const { colors, layoutMode } = settings;

  return {
    colors,
    layoutMode,
    label: `${colors}×${colors} · ${LAYOUT_LABEL[layoutMode]}`,
    columns: colors + 1,
    ballsPerColor: colors,
    capacity: colors,
    scoreMultiplier: getScoreMultiplier(colors),
  };
}

export function getConfigDescription(settings: GameSettings): string {
  const { colors } = settings;
  return `${colors + 1} sütun · ${colors}×${colors} top`;
}
