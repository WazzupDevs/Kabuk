// Usage: pnpm admin:kaupholl-import --file <deck.json> (docs/decisions/kaupholl.md §4 "İçe aktarma")
// Developer machine only. Needs SUPABASE_URL and SUPABASE_SECRET_KEY in the environment; the secret
// key never goes into a file or the app. Production is the owner's alone. Prints only counts.
import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../supabase/functions/_shared/pure/database.ts';
import { argValue, importPlan, parseDeck, problemLines } from './admin/kaupholl.ts';
import { deckTerms } from './kaupholl-terms.ts';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const file = argValue(process.argv.slice(2), '--file');
if (!file) {
  console.error('pnpm admin:kaupholl-import --file <deck.json>');
  process.exit(1);
}
const parsed = parseDeck(readFileSync(file, 'utf8'), deckTerms());
if (!parsed.ok) {
  console.error(`The deck has problems; nothing was imported:\n${problemLines(parsed.problems)}`);
  process.exit(1);
}

const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: existing, error: readError } = await admin
  .from('kaupholl_questions')
  .select('id')
  .eq('active', true);
if (readError) throw new Error(`read: ${readError.message}`);
const plan = importPlan(
  parsed.deck,
  existing.map((q) => q.id),
);
if (plan.upsert.length) {
  const { error } = await admin.from('kaupholl_questions').upsert(plan.upsert);
  if (error) throw new Error(`upsert: ${error.message}`);
}
if (plan.deactivate.length) {
  const { error } = await admin
    .from('kaupholl_questions')
    .update({ active: false })
    .in('id', plan.deactivate);
  if (error) throw new Error(`deactivate: ${error.message}`);
}
const c = plan.counts;
console.log(
  `Imported ${c.verified} verified; skipped ${c.drafts} drafts and ${c.dropped} dropped; ` +
    `${c.deactivated} taken out of the deck.`,
);
