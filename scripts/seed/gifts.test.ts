import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildSeed } from './build.ts';
import { buildGiftModule, GIFT_MODULE, parseGiftCatalog, readGiftCatalog } from './gifts.ts';

const root = resolve(import.meta.dirname, '../..');
const content = JSON.parse(readFileSync(resolve(root, 'content/gift-packs.json'), 'utf8'));
const parts = new Set(['h:bere', 'h:kasket', 'h:kulaklik', 'h:tac']);

describe(GIFT_MODULE, () => {
  // §4.U: the app and the server read the same catalog; it is the one built from content/.
  it('is the module built from the current content (run `pnpm seed`)', async () => {
    expect(readFileSync(resolve(root, GIFT_MODULE), 'utf8')).toBe(await buildGiftModule(root));
  });

  it('is the list the seed loads into public.gift_accessories', () => {
    const sql = buildSeed(root).sql;
    for (const a of readGiftCatalog(root).accessories) expect(sql).toContain(`('${a.id}', `);
  });
});

describe('parseGiftCatalog', () => {
  const broken = (change: (c: Record<string, unknown>) => void) => {
    const copy = structuredClone(content) as Record<string, unknown>;
    change(copy);
    return () => parseGiftCatalog(copy, parts);
  };
  const packs = (c: Record<string, unknown>) => c.packs as Record<string, unknown>[];
  const accessories = (c: Record<string, unknown>) => c.accessories as Record<string, unknown>[];
  const at = (rows: Record<string, unknown>[], i: number): Record<string, unknown> => {
    const row = rows[i];
    if (!row) throw new Error(`no row ${i}`);
    return row;
  };

  it('reads the content', () => {
    expect(parseGiftCatalog(content, parts).accessories).toHaveLength(67);
  });

  it('refuses weights that do not add up to 100000', () => {
    expect(
      broken((c) => {
        (at(packs(c), 0).weights as Record<string, number>).efsanevi = 999;
      }),
    ).toThrow(/add up/);
  });

  it('refuses a locked Bronz, packs out of order and an unknown tier', () => {
    expect(broken((c) => (at(packs(c), 0).locked = true))).toThrow(/bronz/);
    expect(broken((c) => packs(c).reverse())).toThrow(/in this order/);
    expect(broken((c) => (at(accessories(c), 0).tier = 'cok'))).toThrow(/no tier/);
  });

  it('refuses a twice-listed accessory, a weight below 1 and an unknown replaced part', () => {
    expect(broken((c) => accessories(c).push({ ...at(accessories(c), 0) }))).toThrow(/twice/);
    expect(broken((c) => (at(accessories(c), 1).weight = 0))).toThrow(/at least 1/);
    expect(broken((c) => (at(accessories(c), 0).replacesPart = 'h:yok'))).toThrow(
      /no capsule part/,
    );
  });

  it('refuses an unknown slot, a Destansı of one slot and a pack that is not themed', () => {
    expect(broken((c) => (at(accessories(c), 0).slots = ['z']))).toThrow(/no slot/);
    expect(broken((c) => (at(accessories(c), 0).slots = []))).toThrow(/one or two/);
    expect(broken((c) => (at(accessories(c), 20).slots = ['h']))).toThrow(/two slots/);
    expect(broken((c) => (at(accessories(c), 0).pack = 'bronz'))).toThrow(/themed/);
  });

  it('refuses a full set with a part its pack does not give, or two parts in one slot', () => {
    const elf = (c: Record<string, unknown>) => at(packs(c), 4);
    expect(broken((c) => (elf(c).fullSet = ['filiz']))).toThrow(/full set has no/);
    expect(broken((c) => (elf(c).fullSet = ['yapraktaci', 'aydiademi']))).toThrow(/shares a slot/);
  });
});
