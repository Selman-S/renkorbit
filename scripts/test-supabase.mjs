import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = readFileSync('.env', 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('FAIL: .env missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const read = await supabase.from('leaderboard').select('player_id, username, total_score').limit(5);
if (read.error) {
  console.error('FAIL read:', read.error.message);
  process.exit(1);
}
console.log('OK read:', read.data?.length ?? 0, 'rows');

const auth = await supabase.auth.signInAnonymously();
if (auth.error || !auth.data.user) {
  console.error('FAIL anonymous sign-in:', auth.error?.message ?? 'no user');
  console.error('Enable Authentication → Sign In / Providers → Anonymous sign-ins.');
  process.exit(1);
}
const uid = auth.data.user.id;
console.log('OK anonymous sign-in');

// Own row with score 0 — hidden from the board (it lists total_score > 0)
const own = await supabase
  .from('leaderboard')
  .upsert(
    { player_id: uid, username: '_test', total_score: 0, updated_at: new Date().toISOString() },
    { onConflict: 'player_id' },
  );
if (own.error) {
  console.error('FAIL own write:', own.error.message);
  process.exit(1);
}
console.log('OK own write');

// Someone else's id must be rejected once supabase/secure-rls.sql is applied
const foreign = await supabase
  .from('leaderboard')
  .insert({ player_id: crypto.randomUUID(), username: '_test', total_score: 0 });
if (foreign.error) {
  console.log('OK foreign write rejected (RLS secured)');
} else {
  console.log('WARN foreign write accepted — run supabase/secure-rls.sql');
}

console.log('Supabase leaderboard ready.');
