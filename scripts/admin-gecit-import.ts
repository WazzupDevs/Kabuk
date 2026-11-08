// Usage: pnpm admin:gecit-import --file <questions.json> (docs/SPEC_V4.md §4.V). Loads the day's
// questions; a day already loaded is replaced. Developer machine only: needs SUPABASE_URL and
// SUPABASE_SECRET_KEY in the environment (never in a file). Production is the owner's alone. Prints
// only counts, never a question or an answer.
import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../supabase/functions/_shared/pure/database.ts';
import { argValue } from './admin/kaupholl.ts';
import { parseGecitFile } from './admin/gecit.ts';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const file = argValue(process.argv.slice(2), '--file');
if (!file) {
  console.error('pnpm admin:gecit-import --file <questions.json>');
  process.exit(1);
}
const parsed = parseGecitFile(readFileSync(file, 'utf8'));
if (!parsed.ok) {
  console.error(`The file has problems; nothing was imported:\n${parsed.problems.join('\n')}`);
  process.exit(1);
}
const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error } = await admin.from('gecit_questions').upsert(parsed.rows, { onConflict: 'day' });
if (error) throw new Error(`upsert: ${error.message}`);
console.log(`Imported ${parsed.rows.length} days of questions.`);
