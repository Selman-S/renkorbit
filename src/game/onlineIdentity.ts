import { ensureSupabaseUser } from '../lib/supabase';
import { loadPlayerId, savePlayerId } from './storage';

/**
 * Player id for online writes. Prefers the anonymous auth uid (required by
 * the owner-only RLS policies) and stores it as the local player id so
 * "isPlayer" highlighting keeps working. Falls back to the legacy local
 * UUID when anonymous sign-in is unavailable.
 */
export async function resolveOnlinePlayerId(): Promise<string> {
  const uid = await ensureSupabaseUser();
  if (!uid) return loadPlayerId();
  if (uid !== loadPlayerId()) savePlayerId(uid);
  return uid;
}
