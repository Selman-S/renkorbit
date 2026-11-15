import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_COMBO_MULTIPLIER } from '../game/combo';
import { isSoundMuted, setSoundMuted } from '../game/storage';
import { haptic, type HapticKind } from '../lib/haptics';

export type SoundEvent =
  | 'pick'
  | 'drop'
  | 'invalid'
  | 'win'
  | 'undo'
  | 'tubeComplete'
  | 'combo'
  | 'comboBreak'
  | 'comboExpire'
  | 'star';

let sharedCtx: AudioContext | null = null;
let masterBus: AudioNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === 'suspended') void sharedCtx.resume();
  return sharedCtx;
}

/** Master gain → compressor so stacked combo notes never clip */
function getBus(ctx: AudioContext): AudioNode {
  if (masterBus) return masterBus;
  const gain = ctx.createGain();
  gain.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.12;
  gain.connect(comp);
  comp.connect(ctx.destination);
  masterBus = gain;
  return gain;
}

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  when?: number;
  /** Seconds to reach full volume — removes the click of an instant start */
  attack?: number;
  /** Lowpass cutoff in Hz — softens square/saw tones */
  lowpass?: number;
  /** Cents offset — small ± values on a pair give shimmer */
  detune?: number;
  /** Glide the pitch to this frequency over the duration */
  glideTo?: number;
}

// Short synthesized tones — no asset files needed
function playTone({
  freq,
  duration,
  type = 'sine',
  volume = 0.08,
  when = 0,
  attack = 0.006,
  lowpass,
  detune = 0,
  glideTo,
}: ToneOptions) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t = ctx.currentTime + when;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(glideTo, t + duration);
  if (detune) osc.detune.setValueAtTime(detune, t);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  let tail: AudioNode = osc;
  if (lowpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    tail.connect(filter);
    tail = filter;
  }

  tail.connect(gain);
  gain.connect(getBus(ctx));
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

// Light applause layered on win — still simple synth, no audio files
function playApplause(start: number) {
  for (let i = 0; i < 14; i++) {
    const when = start + i * 0.055 + Math.random() * 0.03;
    const freq = 900 + Math.random() * 1400;
    playTone({
      freq,
      duration: 0.04 + Math.random() * 0.03,
      type: 'triangle',
      volume: 0.016 + Math.random() * 0.01,
      when,
      lowpass: 2400,
    });
  }
}

const HAPTIC_FOR: Partial<Record<SoundEvent, HapticKind>> = {
  pick: 'pick',
  drop: 'drop',
  invalid: 'invalid',
  tubeComplete: 'complete',
  combo: 'combo',
  win: 'win',
};

/**
 * `level` is reused per event: stack height for pick/drop,
 * combo level for combo, star index for star.
 */
function playEventSound(event: SoundEvent, level = 1) {
  switch (event) {
    case 'pick': {
      const h = Math.max(0, level);
      playTone({ freq: 460 + h * 38, duration: 0.055, type: 'triangle', volume: 0.05 });
      break;
    }
    case 'drop': {
      const h = Math.max(0, level);
      const base = 300 + h * 32;
      playTone({ freq: base, duration: 0.09, type: 'sine', volume: 0.09 });
      playTone({ freq: base * 1.26, duration: 0.07, type: 'sine', volume: 0.04, when: 0.035 });
      break;
    }
    case 'invalid':
      playTone({ freq: 170, duration: 0.12, type: 'square', volume: 0.045, lowpass: 900 });
      playTone({ freq: 128, duration: 0.15, type: 'sine', volume: 0.05, when: 0.01 });
      break;
    case 'undo':
      playTone({ freq: 330, duration: 0.06, type: 'triangle', volume: 0.05 });
      playTone({ freq: 260, duration: 0.07, type: 'triangle', volume: 0.045, when: 0.06 });
      break;
    case 'tubeComplete':
      [784, 1047, 1319].forEach((f, i) => {
        playTone({ freq: f, duration: 0.16, type: 'sine', volume: 0.07, when: i * 0.055 });
        playTone({ freq: f, duration: 0.12, type: 'triangle', volume: 0.03, when: i * 0.055 + 0.01 });
      });
      break;
    case 'combo': {
      const L = Math.min(Math.max(level, 1), MAX_COMBO_MULTIPLIER);
      const base = 360 + L * 80;
      const stagger = 0.02 * L;
      playTone({ freq: base, duration: 0.1, type: 'sine', volume: 0.1 });
      playTone({ freq: base * 1.5, duration: 0.12, type: 'triangle', volume: 0.07, when: stagger });
      playTone({ freq: base * 2, duration: 0.15, type: 'sine', volume: 0.05, when: stagger * 2 });
      if (L >= 5) {
        playTone({ freq: base * 2, duration: 0.15, type: 'sine', volume: 0.03, when: stagger * 2, detune: 7 });
        playTone({ freq: base * 2, duration: 0.15, type: 'sine', volume: 0.03, when: stagger * 2, detune: -7 });
      }
      break;
    }
    case 'comboBreak':
      playTone({ freq: 240, duration: 0.18, type: 'sine', volume: 0.045, glideTo: 170 });
      playTone({ freq: 120, duration: 0.14, type: 'triangle', volume: 0.03, when: 0.02, lowpass: 600 });
      break;
    case 'comboExpire':
      playTone({ freq: 300, duration: 0.14, type: 'triangle', volume: 0.03, glideTo: 220 });
      break;
    case 'star': {
      const i = Math.max(0, level);
      const f = 880 * Math.pow(1.25, i);
      playTone({ freq: f, duration: 0.12, type: 'sine', volume: 0.07 });
      playTone({ freq: f * 2, duration: 0.09, type: 'sine', volume: 0.025, when: 0.01 });
      break;
    }
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => {
        playTone({ freq: f, duration: 0.25, type: 'sine', volume: 0.07, when: i * 0.1 });
        playTone({ freq: f / 2, duration: 0.3, type: 'triangle', volume: 0.025, when: i * 0.1 });
      });
      playApplause(0.4);
      break;
  }
}

export function useSound() {
  const [muted, setMuted] = useState(() => isSoundMuted());
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
    setSoundMuted(muted);
  }, [muted]);

  // Haptics fire regardless of mute — they are a separate channel
  const play = useCallback((event: SoundEvent, level = 1) => {
    const kind = HAPTIC_FOR[event];
    if (kind) haptic(kind);
    if (mutedRef.current) return;
    playEventSound(event, level);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  // Unlock audio on first user gesture (mobile browsers)
  const unlock = useCallback(() => {
    getAudioContext();
  }, []);

  return { play, muted, toggleMute, unlock };
}
