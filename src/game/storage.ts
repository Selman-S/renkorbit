const TUTORIAL_KEY = 'renkorbit_tutorial_done';
const SOUND_MUTED_KEY = 'renkorbit_sound_muted';
const USERNAME_KEY = 'renkorbit_username';
const PLAYER_ID_KEY = 'renkorbit_player_id';
export const MAX_USERNAME_LEN = 16;
export const MIN_USERNAME_LEN = 2;

/** Return validation error message, or null when valid */
export function validateUsername(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < MIN_USERNAME_LEN) return 'En az 2 karakter gir';
  if (trimmed.length > MAX_USERNAME_LEN) return `En fazla ${MAX_USERNAME_LEN} karakter`;
  return null;
}

/** Stable anonymous id for cloud leaderboard rows */
export function loadPlayerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

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
