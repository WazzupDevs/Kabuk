// Usage: pnpm admin:kaupholl-stats (docs/decisions/kaupholl.md §3 "Pilotta ne bakılır", §4)
// Developer machine only. Needs SUPABASE_URL and SUPABASE_SECRET_KEY in the environment. The counts
// carry no person, table or time; the output holds ids and numbers only.
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../supabase/functions/_shared/pure/database.ts';
import { statsReport } from './admin/kaupholl.ts';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const [stats, counter] = await Promise.all([
  admin.from('kaupholl_question_stats').select('*'),
  admin.from('kaupholl_counters').select('n').eq('name', 'exhausted').maybeSingle(),
]);
if (stats.error) throw new Error(`stats: ${stats.error.message}`);
if (counter.error) throw new Error(`counter: ${counter.error.message}`);
console.log(statsReport(stats.data, Number(counter.data?.n ?? 0)));
