import { useCallback, useEffect, useRef, useState } from 'react';
import { isSoundMuted, setSoundMuted } from '../game/storage';

export type SoundEvent = 'pick' | 'drop' | 'invalid' | 'win' | 'undo' | 'combo' | 'comboBreak';

let sharedCtx: AudioContext | null = null;

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

// Short synthesized tones — no asset files needed
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
  when = 0,
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t = ctx.currentTime + when;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

// Light applause layered on win — still simple synth, no audio files
function playApplause() {
  const start = 0.35;
  for (let i = 0; i < 14; i++) {
    const when = start + i * 0.055 + Math.random() * 0.03;
    const freq = 900 + Math.random() * 1400;
    playTone(freq, 0.04 + Math.random() * 0.03, 'triangle', 0.018 + Math.random() * 0.012, when);
  }
}

function playEventSound(event: SoundEvent, comboLevel = 1) {
  switch (event) {
    case 'pick':
      playTone(520, 0.06, 'triangle', 0.06);
      break;
    case 'drop':
      playTone(380, 0.1, 'sine', 0.09);
      playTone(480, 0.08, 'sine', 0.05, 0.04);
      break;
    case 'invalid':
      playTone(180, 0.14, 'square', 0.05);
      break;
    case 'undo':
      playTone(300, 0.07, 'triangle', 0.05);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.18, 'sine', 0.07, i * 0.1));
      playApplause();
      break;
    case 'comboBreak':
      playTone(220, 0.12, 'square', 0.06);
      playTone(165, 0.16, 'sawtooth', 0.04, 0.06);
      break;
    case 'combo': {
      const level = Math.max(comboLevel, 1);
      const base = 360 + level * 95;
      playTone(base, 0.09, 'sine', 0.1);
      playTone(base * 1.28, 0.11, 'triangle', 0.08, 0.05);
      playTone(base * 1.55, 0.14, 'sine', 0.05, 0.1);
      break;
    }
  }
}

export function useSound() {
  const [muted, setMuted] = useState(() => isSoundMuted());
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    setSoundMuted(muted);
  }, [muted]);

  const play = useCallback((event: SoundEvent, comboLevel = 1) => {
    if (mutedRef.current) return;
    playEventSound(event, comboLevel);
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
