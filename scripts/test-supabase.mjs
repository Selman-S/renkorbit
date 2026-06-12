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

const supabase = createClient(url, key);

const read = await supabase.from('leaderboard').select('player_id, username, total_score').limit(5);
if (read.error) {
  console.error('FAIL read:', read.error.message);
  process.exit(1);
}
console.log('OK read:', read.data?.length ?? 0, 'rows');

const testId = crypto.randomUUID();
const upsert = await supabase.from('leaderboard').upsert(
  {
    player_id: testId,
    username: '_test',
    total_score: 1,
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'player_id' },
);
if (upsert.error) {
  console.error('FAIL write:', upsert.error.message);
  process.exit(1);
}
console.log('OK write: test row inserted');

await supabase.from('leaderboard').delete().eq('player_id', testId);
console.log('OK cleanup: test row removed');
console.log('Supabase leaderboard ready.');
