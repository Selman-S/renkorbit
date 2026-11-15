import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
let userPromise: Promise<string | null> | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) client = createClient(url!, anonKey!);
  return client;
}

async function signIn(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const res = await supabase.auth.signInAnonymously();
  return res.error ? null : (res.data.user?.id ?? null);
}

/**
 * Anonymous Supabase Auth user id (session persists in localStorage).
 * RLS only lets a user write rows whose player_id = auth.uid().
 * Returns null when Supabase is off or anonymous sign-ins are disabled;
 * a failed attempt is retried on the next call.
 */
export function ensureSupabaseUser(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return Promise.resolve(null);
  if (!userPromise) {
    userPromise = signIn(supabase)
      .catch(() => null)
      .then((id) => {
        if (!id) userPromise = null;
        return id;
      });
  }
  return userPromise;
}
