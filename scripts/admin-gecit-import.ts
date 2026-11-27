// Usage: pnpm admin:gecit-import --file <questions.json> | --status (docs/SPEC_V4.md §4.V). Adds the
// questions to Geçit's pool (a question already there is left as it is); the server draws each
// day's questions from it. Developer machine only: needs SUPABASE_URL and SUPABASE_SECRET_KEY in
// the environment (never in a file). Production is the owner's alone. Prints only counts, never a
// question or an answer.
import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../supabase/functions/_shared/pure/database.ts';
import { argValue } from './admin/kaupholl.ts';
import { parseGecitFile, poolStatus } from './admin/gecit.ts';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const args = process.argv.slice(2);
const file = argValue(args, '--file');
const status = args.includes('--status');
if (!file && !status) {
  console.error('pnpm admin:gecit-import --file <questions.json> | --status');
  process.exit(1);
}
const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

if (file) {
  const parsed = parseGecitFile(readFileSync(file, 'utf8'));
  if (!parsed.ok) {
    console.error(`The file has problems; nothing was imported:\n${parsed.problems.join('\n')}`);
    process.exit(1);
  }
  const { error } = await admin
    .from('gecit_pool')
    .upsert(parsed.rows, { onConflict: 'prompt', ignoreDuplicates: true });
  if (error) throw new Error(`upsert: ${error.message}`);
  console.log(`Read ${parsed.rows.length} questions; new ones were added to the pool.`);
}

const total = await admin.from('gecit_pool').select('id', { count: 'exact', head: true });
const fresh = await admin
  .from('gecit_pool')
  .select('id', { count: 'exact', head: true })
  .is('last_asked_on', null);
if (total.error) throw new Error(`count: ${total.error.message}`);
if (fresh.error) throw new Error(`count: ${fresh.error.message}`);
console.log(poolStatus(total.count ?? 0, fresh.count ?? 0));
