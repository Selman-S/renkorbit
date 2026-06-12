import type { ColorCount, GameSettings, LayoutMode } from './levelConfig';
import { isColorCount, MIN_COLORS, MAX_COLORS } from './levelConfig';
import type { StarCount } from './stars';

const STORAGE_KEY = 'renkorbit_journey';

export interface ProgressionStep {
  index: number;
  colors: ColorCount;
  layoutMode: LayoutMode;
  title: string;
  subtitle: string;
  emoji: string;
}

const TIER_EMOJIS: Record<number, string> = {
  3: '🪐',
  4: '🌍',
  5: '🌙',
  6: '☄️',
  7: '⭐',
  8: '🌟',
  9: '💫',
  10: '🛸',
  11: '🌠',
  12: '👑',
};

const TIER_NAMES: Record<number, string> = {
  3: 'Mini',
  4: 'Küçük',
  5: 'Orta',
  6: 'Geniş',
  7: 'Süper',
  8: 'Büyük',
  9: 'Mega',
  10: 'Ultra',
  11: 'Kozmik',
  12: 'Galaksi',
};

function buildProgressionSteps(): ProgressionStep[] {
  const steps: ProgressionStep[] = [];
  let index = 1;

  for (let colors = MIN_COLORS; colors <= MAX_COLORS; colors++) {
    if (!isColorCount(colors)) continue;
    const emoji = TIER_EMOJIS[colors] ?? '✨';
    const tier = TIER_NAMES[colors] ?? `${colors}`;

    steps.push({
      index,
      colors,
      layoutMode: 'rows',
      title: `${tier} Yörünge`,
      subtitle: `${colors}×${colors} · Sıralı`,
      emoji,
    });
    index++;

    steps.push({
      index,
      colors,
      layoutMode: 'mixed',
      title: `${tier} Karışık`,
      subtitle: `${colors}×${colors} · Karışık`,
      emoji,
    });
    index++;

    steps.push({
      index,
      colors,
      layoutMode: 'mixed',
      title: `${tier} Usta`,
      subtitle: `${colors}×${colors} · Usta`,
      emoji,
    });
    index++;
  }

  return steps;
}

/** Linear journey — 30 steps from 3×3 to 12×12 */
export const PROGRESSION_STEPS: ProgressionStep[] = buildProgressionSteps();

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
    playMode: 'relaxed',
  };
}

export function getJourneyStepId(stepIndex: number): string {
  return `journey_${stepIndex}`;
}

export function getJourneySeed(stepIndex: number): number {
  const step = getJourneyStep(stepIndex);
  if (!step) return 1;
  return hashString(
    `renkorbit-journey-v2-${step.colors}-${step.layoutMode}-${stepIndex}`,
  );
}

export function getJourneyLabel(stepIndex: number): string {
  const step = getJourneyStep(stepIndex);
  return step ? `${step.emoji} ${step.title}` : `Adım ${stepIndex}`;
}

/** Step range for a color tier (3 steps each) */
export function getColorTierStepRange(colors: ColorCount): [number, number] {
  const start = (colors - MIN_COLORS) * 3 + 1;
  return [start, start + 2];
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
