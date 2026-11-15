/**
 * Endless mode — an arcade run of ever-bigger boards. Each board has a move
 * limit; running out ends the run. Score grows with a per-stage multiplier.
 */
import { getBaselineMinMoves } from './journeyBonusTargets';
import type { ColorCount, GameSettings } from './levelConfig';
import { MAX_COLORS } from './levelConfig';
import { getCompletedCount, hashString } from './progressionMap';

const BEST_KEY = 'renkorbit_endless_best';

/** Journey steps required before endless unlocks */
export const ENDLESS_UNLOCK_STEPS = 6;
export const ENDLESS_UNDO_LIMIT = 3;
const START_COLORS = 4;

export interface EndlessRun {
  /** Random per run so every run is new; stage seeds derive from it */
  seedBase: number;
  /** 1-based stage currently being played */
  stage: number;
  runScore: number;
  stagesCleared: number;
}

export interface EndlessBest {
  runScore: number;
  stagesCleared: number;
  at: string;
}

export function isEndlessUnlocked(): boolean {
  return getCompletedCount() >= ENDLESS_UNLOCK_STEPS;
}

export function newEndlessRun(): EndlessRun {
  return {
    seedBase: Math.floor(Math.random() * 0x7fffffff) + 1,
    stage: 1,
    runScore: 0,
    stagesCleared: 0,
  };
}

/** 4 colors, +1 every 2 stages, capped at 12. Stage 1 is a sorted warm-up. */
export function getEndlessStageSettings(stage: number): GameSettings {
  const colors = Math.min(MAX_COLORS, START_COLORS + Math.floor((stage - 1) / 2)) as ColorCount;
  return {
    colors,
    layoutMode: stage === 1 ? 'rows' : 'mixed',
    playMode: 'relaxed',
  };
}

export function getEndlessSeed(run: EndlessRun, stage: number = run.stage): number {
  return hashString(`renkorbit-endless-v1-${run.seedBase}-${stage}`);
}

/** Score multiplier: ×1.0, ×1.1, ×1.2 … */
export function getEndlessMultiplier(stage: number): number {
  return Math.round((1 + 0.1 * (stage - 1)) * 10) / 10;
}

/** Slack over the playtest optimum shrinks from ×2.2 to ×1.5 as the run goes on */
export function getEndlessMoveLimit(stage: number): number {
  const settings = getEndlessStageSettings(stage);
  const kind = settings.layoutMode === 'rows' ? 'rows' : 'mixed';
  const baseline = getBaselineMinMoves(settings.colors, kind);
  const slack = Math.max(1.5, 2.2 - 0.05 * (stage - 1));
  return Math.round(baseline * slack);
}

export function getEndlessLabel(stage: number): string {
  return `♾️ Aşama ${stage}`;
}

export function loadEndlessBest(): EndlessBest | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EndlessBest;
    return typeof parsed.runScore === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export function calculateEndlessCoins(stagesCleared: number, isNewBest: boolean): number {
  if (stagesCleared <= 0) return 0;
  return stagesCleared * 5 + (isNewBest ? 50 : 0);
}

export interface EndlessRunResult {
  runScore: number;
  stagesCleared: number;
  isNewBest: boolean;
  previousBest: EndlessBest | null;
  coins: number;
}

/** Close out a run: store a new best if beaten, report coins to award */
export function finishEndlessRun(run: EndlessRun): EndlessRunResult {
  const previousBest = loadEndlessBest();
  const isNewBest =
    run.stagesCleared > 0 && (previousBest === null || run.runScore > previousBest.runScore);

  if (isNewBest) {
    try {
      const best: EndlessBest = {
        runScore: run.runScore,
        stagesCleared: run.stagesCleared,
        at: new Date().toISOString(),
      };
      localStorage.setItem(BEST_KEY, JSON.stringify(best));
    } catch {
      /* ignore */
    }
  }

  return {
    runScore: run.runScore,
    stagesCleared: run.stagesCleared,
    isNewBest,
    previousBest,
    coins: calculateEndlessCoins(run.stagesCleared, isNewBest),
  };
}

export function getEndlessShareText(result: EndlessRunResult): string {
  return [
    'RenkOrbit Sonsuz Mod ♾️',
    `${result.stagesCleared} aşama · ${result.runScore} puan`,
    'Sen kaç aşama gidebilirsin?',
  ].join('\n');
}
