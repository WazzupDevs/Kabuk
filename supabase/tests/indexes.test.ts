import { describe, expect, it } from 'vitest';

import { sql } from './local.ts';

// Every single-column foreign key in public has a full index that starts with its column
// (20261211090000_canli_oncesi_indeksler.sql): a delete on the referenced side never scans the
// whole referencing table.
describe('foreign key indexes', () => {
  it('leaves no foreign key without an index', async () => {
    const rows = await sql<{ fk: string }[]>`
      select t.relname || '.' || a.attname as fk
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.contype = 'f' and n.nspname = 'public' and array_length(c.conkey, 1) = 1
        and not exists (
          select 1 from pg_index i
          where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1] and i.indpred is null
        )
      order by 1`;
    expect(rows.map((r) => r.fk)).toEqual([]);
  });
});
