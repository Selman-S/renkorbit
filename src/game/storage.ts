const TUTORIAL_KEY = 'renkorbit_tutorial_done';
const SOUND_MUTED_KEY = 'renkorbit_sound_muted';
const USERNAME_KEY = 'renkorbit_username';
const MAX_USERNAME_LEN = 16;

export function loadUsername(): string | null {
  try {
    const raw = localStorage.getItem(USERNAME_KEY);
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function hasUsername(): boolean {
  return loadUsername() !== null;
}

/** Persist display name shown on the leaderboard */
export function saveUsername(name: string): string {
  const trimmed = name.trim().slice(0, MAX_USERNAME_LEN);
  try {
    localStorage.setItem(USERNAME_KEY, trimmed);
  } catch {
    /* ignore */
  }
  return trimmed;
}

export function isTutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTutorialDone(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(SOUND_MUTED_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}
