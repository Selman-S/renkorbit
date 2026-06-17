export const GAME_SHARE_TITLE = 'RenkOrbit';

export const GAME_SHARE_MESSAGE =
  'RenkOrbit — renkli küreleri yörüngelere yerleştir! Galaksi yolculuğuna sen de katıl.';

/** Clean invite URL without puzzle query params */
export function getGameShareUrl(): string {
  if (typeof window === 'undefined') return 'https://renkorbit.app';
  return `${window.location.origin}${window.location.pathname}`;
}

export function getGameShareText(): string {
  return `${GAME_SHARE_MESSAGE}\n${getGameShareUrl()}`;
}

export async function copyGameLink(): Promise<void> {
  const url = getGameShareUrl();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const input = document.createElement('textarea');
  input.value = url;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

export function getWhatsAppShareUrl(): string {
  return `https://wa.me/?text=${encodeURIComponent(getGameShareText())}`;
}

/** X (formerly Twitter) web intent — opens post composer */
export function getXShareUrl(): string {
  const url = getGameShareUrl();
  const params = new URLSearchParams({
    text: GAME_SHARE_MESSAGE,
    url,
  });
  return `https://x.com/intent/post?${params.toString()}`;
}

/** System share sheet when available */
export async function shareGameNative(): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = getGameShareUrl();
  const text = GAME_SHARE_MESSAGE;

  if (navigator.share) {
    try {
      await navigator.share({ title: GAME_SHARE_TITLE, text, url });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled';
    }
  }

  await copyGameLink();
  return 'copied';
}

export function openShareWindow(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
