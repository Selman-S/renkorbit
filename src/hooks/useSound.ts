import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioContext, playEventSound, type SoundEvent } from '../game/soundEngine';
import { isSoundMuted, setSoundMuted } from '../game/storage';

export type { SoundEvent };

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
