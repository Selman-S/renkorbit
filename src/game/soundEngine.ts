export type SoundEvent = 'pick' | 'drop' | 'invalid' | 'win' | 'undo' | 'combo' | 'comboBreak';

let sharedCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const Ctx =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === 'suspended') void sharedCtx.resume();
  return sharedCtx;
}

/** Tiny pitch wobble so repeats feel less robotic */
function detune(freq: number, cents = 18): number {
  const spread = cents / 1200;
  return freq * (1 + (Math.random() * 2 - 1) * spread);
}

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
  osc.frequency.setValueAtTime(detune(freq), t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

function playSweep(
  fromFreq: number,
  toFreq: number,
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
  const start = Math.max(40, detune(fromFreq));
  const end = Math.max(40, detune(toFreq));

  osc.type = type;
  osc.frequency.setValueAtTime(start, t);
  osc.frequency.exponentialRampToValueAtTime(end, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

function playNoise(
  duration: number,
  volume = 0.04,
  when = 0,
  highPassHz = 900,
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const t = ctx.currentTime + when;

  filter.type = 'highpass';
  filter.frequency.value = highPassHz;

  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(t);
  source.stop(t + duration + 0.02);
}

function playPick() {
  playSweep(420, 920, 0.07, 'triangle', 0.07);
  playTone(1180, 0.05, 'sine', 0.035, 0.02);
}

function playDrop() {
  playSweep(620, 220, 0.11, 'sine', 0.09);
  playSweep(380, 160, 0.08, 'triangle', 0.05, 0.03);
  playNoise(0.04, 0.035, 0.05, 1200);
}

function playInvalid() {
  playTone(190, 0.1, 'square', 0.045);
  playTone(140, 0.14, 'square', 0.04, 0.09);
  playSweep(260, 120, 0.12, 'sawtooth', 0.03, 0.05);
}

function playUndo() {
  playSweep(520, 300, 0.09, 'triangle', 0.05);
  playSweep(360, 220, 0.08, 'sine', 0.035, 0.05);
}

/** Single hand-clap transient — bandpassed noise burst */
function playClap(when: number, volume: number, centerFreq: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 0.035 + Math.random() * 0.03;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const env = 1 - i / length;
    data[i] = (Math.random() * 2 - 1) * env * env;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const t = ctx.currentTime + when;

  filter.type = 'bandpass';
  filter.frequency.value = centerFreq;
  filter.Q.value = 0.7 + Math.random() * 0.8;

  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(t);
  source.stop(t + duration + 0.02);
}

/** Layered claps + soft crowd wash */
function playApplause(startWhen = 0.42) {
  const burstCount = 32;
  const span = 1.55;

  for (let i = 0; i < burstCount; i++) {
    const when = startWhen + Math.random() * span;
    const volume = 0.028 + Math.random() * 0.038;
    const freq = 700 + Math.random() * 2400;
    playClap(when, volume, freq);
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 1.35;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const t = ctx.currentTime + startWhen + 0.12;

  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  filter.Q.value = 0.45;

  source.buffer = buffer;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.05, t + 0.18);
  gain.gain.exponentialRampToValueAtTime(0.035, t + 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(t);
  source.stop(t + duration + 0.05);
}

function playWin() {
  const notes = [523, 659, 784, 988, 1175];
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, 'sine', 0.075, i * 0.09);
    playTone(freq * 2, 0.12, 'triangle', 0.025, i * 0.09 + 0.04);
  });
  playSweep(880, 1760, 0.25, 'sine', 0.04, 0.35);
  playNoise(0.12, 0.02, 0.42, 2000);
  playApplause(0.4);
}

function playCombo(level: number) {
  const tier = Math.min(Math.max(level, 1), 5);
  const base = 340 + tier * 85;
  const pattern = [1, 1.25, 1.5, 1.875, 2.25].slice(0, 2 + tier);

  pattern.forEach((mult, i) => {
    playTone(base * mult, 0.1, 'sine', 0.08 - i * 0.008, i * 0.055);
    playTone(base * mult * 1.5, 0.07, 'triangle', 0.035, i * 0.055 + 0.02);
  });

  if (tier >= 4) {
    playSweep(base * 1.2, base * 2.8, 0.14, 'sine', 0.045, 0.18);
    playNoise(0.06, 0.025, 0.2, 1500);
  }
}

function playComboBreak() {
  playSweep(480, 180, 0.22, 'sawtooth', 0.07);
  playSweep(360, 120, 0.2, 'triangle', 0.05, 0.08);
  playTone(110, 0.16, 'square', 0.035, 0.14);
}

export function playEventSound(event: SoundEvent, comboLevel = 1): void {
  switch (event) {
    case 'pick':
      playPick();
      break;
    case 'drop':
      playDrop();
      break;
    case 'invalid':
      playInvalid();
      break;
    case 'undo':
      playUndo();
      break;
    case 'win':
      playWin();
      break;
    case 'combo':
      playCombo(comboLevel);
      break;
    case 'comboBreak':
      playComboBreak();
      break;
  }
}
