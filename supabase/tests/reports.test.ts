import { afterAll, describe, expect, it } from 'vitest';

import { PHONES } from './helpers.ts';
import { signIn, sql, userIdOf } from './local.ts';

// A report limit (20261210090000_canli_oncesi_guvenlik.sql): 30 an hour, 100 a day per reporter;
// the next one raises `rate_limited` and writes nothing.
describe('report limit', () => {
  let reporter = '';

  afterAll(async () => {
    if (reporter) await sql`delete from public.reports where reporter_id = ${reporter}`;
  });

  const write = (id: string) => sql`
    insert into public.reports (reporter_id, reason, target_type, messages_snapshot)
    values (${id}, 'spam', 'profile', '[]'::jsonb)`;

  it('stops the 31st report within an hour, and the 101st within a day', async () => {
    reporter = await userIdOf(await signIn(PHONES[0]));
    for (let i = 0; i < 30; i += 1) await write(reporter);
    await expect(write(reporter)).rejects.toThrow('rate_limited');

    await sql`update public.reports set created_at = now() - interval '2 hours'
      where reporter_id = ${reporter}`;
    for (let i = 0; i < 30; i += 1) await write(reporter);
    await sql`update public.reports set created_at = now() - interval '3 hours'
      where reporter_id = ${reporter} and created_at > now() - interval '1 hour'`;
    for (let i = 0; i < 30; i += 1) await write(reporter);
    await sql`update public.reports set created_at = now() - interval '4 hours'
      where reporter_id = ${reporter} and created_at > now() - interval '1 hour'`;
    for (let i = 0; i < 10; i += 1) await write(reporter);
    await expect(write(reporter)).rejects.toThrow('rate_limited');
    const rows = await sql<{ n: number }[]>`
      select count(*)::int as n from public.reports where reporter_id = ${reporter}`;
    expect(rows[0]?.n).toBe(100);
  });
});
