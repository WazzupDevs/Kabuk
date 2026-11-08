// Usage: pnpm admin:reports list [all] | pnpm admin:reports done <reportId>
// Developer machine only. Needs SUPABASE_URL and SUPABASE_SECRET_KEY in the environment
// (Supabase dashboard → Settings → API Keys). The secret key never goes into the app.
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../supabase/functions/_shared/pure/database.ts';
import { parseReportCommand, REPORT_USAGE, runReportCommand } from './admin/reports.ts';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const command = parseReportCommand(process.argv.slice(2));
if (!command) {
  console.error(REPORT_USAGE);
  process.exit(1);
}

const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`${env('SUPABASE_URL')}\n`);
console.log(await runReportCommand(admin, command));
