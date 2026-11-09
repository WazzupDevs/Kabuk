import { beforeAll } from 'vitest';

import { sql } from './local.ts';

// The same test phones report again in every file; a report limit (30 an hour, 100 a day,
// 20261210090000_canli_oncesi_guvenlik.sql) counts only what this file writes.
beforeAll(async () => {
  await sql`update public.reports set created_at = created_at - interval '2 days'
    where created_at > now() - interval '1 day'`;
});
