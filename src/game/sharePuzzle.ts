import type { GameSettings, LayoutMode, PlayMode } from './levelConfig';
import { isColorCount } from './levelConfig';
import {
  getJourneyLabel,
  getJourneySeed,
  getJourneySettings,
  getJourneyStep,
  PROGRESSION_STEPS,
} from './progressionMap';
import type { GameState } from './types';

export interface SharedPuzzlePayload {
  settings: GameSettings;
  seed: number;
  sourceLabel?: string;
}

const LAYOUT_FROM_CODE: Record<string, LayoutMode> = { r: 'rows', m: 'mixed' };
const LAYOUT_TO_CODE: Record<LayoutMode, string> = { rows: 'r', mixed: 'm' };
const PLAY_FROM_CODE: Record<string, PlayMode> = { R: 'relaxed', T: 'timed' };
const PLAY_TO_CODE: Record<PlayMode, string> = { relaxed: 'R', timed: 'T' };

/** Build share URL for the current puzzle */
export function buildShareUrl(state: GameState): string {
  const base = `${window.location.origin}${window.location.pathname}`;

  if (state.isJourney && state.journeyStep !== null) {
    return `${base}?step=${state.journeyStep}`;
  }

  const { colors, layoutMode, playMode } = state.settings;
  const layout = LAYOUT_TO_CODE[layoutMode];
  const play = PLAY_TO_CODE[playMode];
  return `${base}?p=${colors}-${layout}-${play}-${state.seed}`;
}

/** Parse ?step=3 or ?p=8-m-T-12345 from the address bar */
export function parseShareFromUrl(search: string): SharedPuzzlePayload | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);

  const stepRaw = params.get('step');
  if (stepRaw) {
    const step = Number(stepRaw);
    if (
      !Number.isInteger(step) ||
      step < 1 ||
      step > PROGRESSION_STEPS.length ||
      !getJourneyStep(step)
    ) {
      return null;
    }
    return {
      settings: getJourneySettings(step),
      seed: getJourneySeed(step),
      sourceLabel: getJourneyLabel(step),
    };
  }

  const packed = params.get('p');
  if (!packed) return null;

  const match = /^(\d+)-([rm])-([RT])-(\d+)$/.exec(packed);
  if (!match) return null;

  const colors = Number(match[1]);
  const layoutMode = LAYOUT_FROM_CODE[match[2]];
  const playMode = PLAY_FROM_CODE[match[3]];
  const seed = Number(match[4]);

  if (!isColorCount(colors) || !layoutMode || !playMode || !Number.isFinite(seed) || seed < 1) {
    return null;
  }

  return {
    settings: { colors, layoutMode, playMode },
    seed: Math.floor(seed),
  };
}

export function getShareMessage(state: GameState): string {
  const label = state.config.label;
  return `RenkOrbit bulmacası — ${label}. Sen de dene!`;
}

/** Native share sheet or clipboard fallback */
export async function sharePuzzleLink(
  url: string,
  message: string,
): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'RenkOrbit', text: message, url });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }

  await navigator.clipboard.writeText(url);
  return 'copied';
}
