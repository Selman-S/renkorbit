import type { ColorCount, GameSettings, LayoutMode, PlayMode } from './levelConfig';
import type { StarCount } from './stars';

const STORAGE_KEY = 'renkorbit_journey';

export interface ProgressionStep {
  index: number;
  colors: ColorCount;
  layoutMode: LayoutMode;
  playMode: PlayMode;
  title: string;
  subtitle: string;
  emoji: string;
}

/** Linear journey — complete each step to unlock the next */
export const PROGRESSION_STEPS: ProgressionStep[] = [
  {
    index: 1,
    colors: 4,
    layoutMode: 'rows',
    playMode: 'relaxed',
    title: 'İlk Yörünge',
    subtitle: '4 renk · Sıralı · Rahat',
    emoji: '🪐',
  },
  {
    index: 2,
    colors: 4,
    layoutMode: 'mixed',
    playMode: 'relaxed',
    title: 'Karışık Başlangıç',
    subtitle: '4 renk · Karışık · Rahat',
    emoji: '🎲',
  },
  {
    index: 3,
    colors: 4,
    layoutMode: 'mixed',
    playMode: 'timed',
    title: 'Zaman Baskısı',
    subtitle: '4 renk · Karışık · Süreli',
    emoji: '⏱️',
  },
  {
    index: 4,
    colors: 8,
    layoutMode: 'rows',
    playMode: 'relaxed',
    title: 'Süper Yörünge',
    subtitle: '8 renk · Sıralı · Rahat',
    emoji: '🌟',
  },
  {
    index: 5,
    colors: 8,
    layoutMode: 'mixed',
    playMode: 'relaxed',
    title: 'Süper Karışık',
    subtitle: '8 renk · Karışık · Rahat',
    emoji: '🌀',
  },
  {
    index: 6,
    colors: 8,
    layoutMode: 'mixed',
    playMode: 'timed',
    title: 'Süper Sprint',
    subtitle: '8 renk · Karışık · Süreli',
    emoji: '⚡',
  },
  {
    index: 7,
    colors: 12,
    layoutMode: 'rows',
    playMode: 'relaxed',
    title: 'Mega Galaksi',
    subtitle: '12 renk · Sıralı · Rahat',
    emoji: '🚀',
  },
  {
    index: 8,
    colors: 12,
    layoutMode: 'mixed',
    playMode: 'relaxed',
    title: 'Mega Kaos',
    subtitle: '12 renk · Karışık · Rahat',
    emoji: '🌌',
  },
  {
    index: 9,
    colors: 12,
    layoutMode: 'mixed',
    playMode: 'timed',
    title: 'Galaksi Ustası',
    subtitle: '12 renk · Karışık · Süreli',
    emoji: '👑',
  },
];

export interface StepProgress {
  stars: StarCount;
  completed: boolean;
}

type JourneyStore = Record<string, StepProgress>;

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

export function getJourneyStep(stepIndex: number): ProgressionStep | undefined {
  return PROGRESSION_STEPS.find((s) => s.index === stepIndex);
}

export function getJourneySettings(stepIndex: number): GameSettings {
  const step = getJourneyStep(stepIndex) ?? PROGRESSION_STEPS[0];
  return {
    colors: step.colors,
    layoutMode: step.layoutMode,
    playMode: step.playMode,
  };
}

export function getJourneyStepId(stepIndex: number): string {
  return `journey_${stepIndex}`;
}

export function getJourneySeed(stepIndex: number): number {
  const step = getJourneyStep(stepIndex);
  if (!step) return 1;
  return hashString(
    `renkorbit-journey-${step.colors}-${step.layoutMode}-${step.playMode}-${stepIndex}`,
  );
}

export function getJourneyLabel(stepIndex: number): string {
  const step = getJourneyStep(stepIndex);
  return step ? `${step.emoji} ${step.title}` : `Adım ${stepIndex}`;
}

function loadStore(): JourneyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as JourneyStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: JourneyStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getStepProgress(stepIndex: number): StepProgress {
  return loadStore()[getJourneyStepId(stepIndex)] ?? { stars: 0, completed: false };
}

export function isStepUnlocked(stepIndex: number): boolean {
  if (stepIndex <= 1) return true;
  return getStepProgress(stepIndex - 1).completed;
}

export function saveJourneyWin(stepIndex: number, stars: StarCount): void {
  const id = getJourneyStepId(stepIndex);
  const store = loadStore();
  const prev = store[id] ?? { stars: 0, completed: false };
  store[id] = {
    completed: true,
    stars: Math.max(prev.stars, stars) as StarCount,
  };
  saveStore(store);
}

/** First incomplete unlocked step — where the player should continue */
export function getCurrentStepIndex(): number {
  for (const step of PROGRESSION_STEPS) {
    if (!getStepProgress(step.index).completed) return step.index;
  }
  return PROGRESSION_STEPS[PROGRESSION_STEPS.length - 1].index;
}

export function getCompletedCount(): number {
  return PROGRESSION_STEPS.filter((s) => getStepProgress(s.index).completed).length;
}

export function hasNextStep(stepIndex: number): boolean {
  return stepIndex < PROGRESSION_STEPS.length && getJourneyStep(stepIndex + 1) !== undefined;
}
