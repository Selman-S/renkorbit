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
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('FAIL: .env missing VITE_SUPABASE_URL or API key');
  process.exit(1);
}

const supabase = createClient(url, key);
const SENTINEL = '00000000-0000-0000-0000-000000000000';

const before = await supabase.from('leaderboard').select('player_id', { count: 'exact', head: true });
if (before.error) {
  console.error('FAIL read:', before.error.message);
  process.exit(1);
}

console.log(`Rows before reset: ${before.count ?? 0}`);

// Try full delete when service role or delete policy exists
const del = await supabase.from('leaderboard').delete().neq('player_id', SENTINEL);

if (!del.error) {
  const after = await supabase.from('leaderboard').select('player_id', { count: 'exact', head: true });
  if ((after.count ?? 0) === 0) {
    console.log('Leaderboard wiped (all rows deleted).');
    process.exit(0);
  }
}

// Fallback: zero scores (works with anon update policy)
const zero = await supabase
  .from('leaderboard')
  .update({ total_score: 0, updated_at: new Date().toISOString() })
  .neq('player_id', SENTINEL);

if (zero.error) {
  console.error('FAIL reset:', zero.error.message);
  console.error('Run supabase/reset-leaderboard.sql in Supabase SQL Editor.');
  process.exit(1);
}

const active = await supabase
  .from('leaderboard')
  .select('player_id', { count: 'exact', head: true })
  .gt('total_score', 0);

console.log(`Scores zeroed. Active ranked rows: ${active.count ?? 0}`);
console.log('Leaderboard reset complete.');
