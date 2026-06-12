export type ColorCount = 4 | 8 | 12;
export type LayoutMode = 'rows' | 'mixed';
export type PlayMode = 'relaxed' | 'timed';

export const COLOR_OPTIONS: ColorCount[] = [4, 8, 12];

export interface GameSettings {
  colors: ColorCount;
  layoutMode: LayoutMode;
  playMode: PlayMode;
}

export const DEFAULT_SETTINGS: GameSettings = {
  colors: 4,
  layoutMode: 'rows',
  playMode: 'relaxed',
};

/** Countdown limits for timed mode (seconds) */
export const TIME_LIMIT_SEC: Record<ColorCount, number> = {
  4: 300,
  8: 600,
  12: 900,
};

export function getTimeLimitSec(colors: ColorCount): number {
  return TIME_LIMIT_SEC[colors];
}

const PLAY_MODE_LABEL: Record<PlayMode, string> = {
  relaxed: 'Rahat',
  timed: 'Zaman Yarışı',
};

export interface LevelConfig {
  colors: ColorCount;
  layoutMode: LayoutMode;
  label: string;
  columns: number;
  ballsPerColor: number;
  capacity: number;
  scoreMultiplier: number;
}

const SCORE_MULTIPLIER: Record<ColorCount, number> = {
  4: 1,
  8: 2,
  12: 3,
};

const LAYOUT_LABEL: Record<LayoutMode, string> = {
  rows: 'Sıralı',
  mixed: 'Karışık',
};

export function getGameKey(settings: GameSettings): string {
  return `${settings.colors}_${settings.layoutMode}_${settings.playMode}`;
}

// N colors × N balls → N filled tubes + 1 empty
export function buildConfig(settings: GameSettings): LevelConfig {
  const { colors, layoutMode } = settings;

  return {
    colors,
    layoutMode,
    label: `${colors} · ${LAYOUT_LABEL[layoutMode]} · ${PLAY_MODE_LABEL[settings.playMode]}`,
    columns: colors + 1,
    ballsPerColor: colors,
    capacity: colors,
    scoreMultiplier: SCORE_MULTIPLIER[colors],
  };
}

export function getConfigDescription(settings: GameSettings): string {
  const { colors } = settings;
  return `${colors + 1} sütun · ${colors}×${colors} top`;
}
