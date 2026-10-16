// The table-end switch (private.table_end_on(), docs/SPEC_V3.md §23.N): on since step 23.3b, so a
// two-sided room closes at once and no "Tanışalım mı?" window opens. The window's code stays until
// step 23.4 removes it; the files that test it turn the switch off for their own run and put back
// what they found (files run one at a time, vitest.integration.config.ts). A run killed in such a
// file leaves it off until `pnpm db:reset`.
import { sql } from './local.ts';

export async function setTableEnd(on: boolean): Promise<void> {
  await sql.unsafe(`
    create or replace function private.table_end_on()
    returns boolean
    language sql
    stable
    set search_path = ''
    as $$ select ${on ? 'true' : 'false'}; $$
  `);
}

// The switch off; what it was, to put back.
export async function windowOn(): Promise<boolean> {
  const [row] = await sql`select private.table_end_on() as on`;
  await setTableEnd(false);
  return row?.on === true;
}

// For one test about the window in a file that otherwise runs with the switch on.
export async function withWindow<T>(run: () => Promise<T>): Promise<T> {
  const wasOn = await windowOn();
  try {
    return await run();
  } finally {
    await setTableEnd(wasOn);
  }
}
