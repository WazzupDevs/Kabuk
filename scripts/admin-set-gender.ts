// Usage: pnpm admin:set-gender <userId> <female|male|unspecified>
// Corrects a gender declared wrongly (docs/SPEC_V3.md §23.D), after a request by email or a
// "yanlış cinsiyet beyanı" report; the app cannot change a set gender. Developer machine only, with
// SUPABASE_URL and SUPABASE_SECRET_KEY in the environment; the secret key never goes into the app
// or a file.
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../supabase/functions/_shared/pure/database.ts';
import { type Gender, GENDERS } from '../supabase/functions/_shared/pure/gender.ts';
import { isUserId } from './admin/ban.ts';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const [userId, raw] = process.argv.slice(2);
if (!userId || !isUserId(userId) || !(GENDERS as readonly string[]).includes(raw ?? '')) {
  console.error(`Usage: pnpm admin:set-gender <userId> <${GENDERS.join('|')}>`);
  process.exit(1);
}
const gender = raw as Gender;

const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin
  .from('profiles')
  .update({ gender })
  .eq('id', userId)
  .select('id');
if (error) throw new Error(`profiles update failed (${error.code})`);
console.log(data.length === 1 ? `Gender of ${userId} set` : `${userId} has no profile`);
