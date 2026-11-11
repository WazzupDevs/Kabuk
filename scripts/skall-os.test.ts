import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// docs/skall-os/assets/kapsul-aksesuarlari.md is Capsule Art Studio's record of every accessory
// drawn so far: an accessory in the catalog with no row there has no memory.
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');

describe('skall-os: the capsule accessories record', () => {
  const record = read('docs/skall-os/assets/kapsul-aksesuarlari.md');
  const catalog = JSON.parse(read('content/gift-packs.json')) as {
    accessories: { id: string; name: string }[];
  };

  // The table's rows, whatever their padding: id → name.
  const rows = new Map(
    [...record.matchAll(/^\| `([a-z0-9]+)` +\| ([^|]*?) +\|/gm)].map((m) => [
      m[1] ?? '',
      m[2] ?? '',
    ]),
  );

  it('has a row for every accessory of the catalog, by id and name', () => {
    for (const a of catalog.accessories) expect(rows.get(a.id), a.id).toBe(a.name);
  });

  it('has no row for an accessory the catalog does not have', () => {
    const ids = new Set(catalog.accessories.map((a) => a.id));
    for (const id of rows.keys()) expect(ids.has(id), id).toBe(true);
  });
});
