import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import type { GiftTier } from '@shared/gifts.ts';
import { describe, expect, it } from 'vitest';

import { catalogSections, countOf, isWorn, putOn, searchItems } from './catalog';
import { accessories, accessoryItems, type Look, parse, wear, wearAccessory } from './look';
import { EMPTY_KEY } from './strip';

function accessoryById(id: string) {
  return GIFT_CATALOG.accessories.find((a) => a.id === id);
}
const setName = (n: string) => `${n} takımı`;
const ninja = GIFT_CATALOG.accessories.filter((a) => a.set === 'ninja').map((a) => a.id);

function sections(owned: readonly string[] = [], look = 'c:pembe e:klasik') {
  const color = parse(look).c;
  return catalogSections({
    optionsOf: (slot) =>
      slot === 'c'
        ? CAPSULE_CATALOG.colors.map((item) => ({
            key: `c-${item.id}`,
            name: item.name,
            part: item.id,
            tier: null,
            apply: (l: Look) => wear(l, 'c', item.id),
          }))
        : [
            {
              key: EMPTY_KEY,
              name: 'boş',
              tier: null,
              apply: (l: Look) => wear(l, slot, null),
            },
            ...accessoryItems(slot, new Set(owned)).map((item) => ({
              key: `x-${item.id}`,
              name: item.name,
              accessory: item.id,
              tier: (accessoryById(item.id)?.tier as GiftTier | undefined) ?? null,
              apply: (l: Look) => wearAccessory(l, item.id),
            })),
            ...CAPSULE_CATALOG.parts
              .filter((p) => p.slot === slot && color !== undefined)
              .map((p) => ({
                key: `p-${p.id}`,
                name: p.name,
                part: p.id,
                tier: null,
                apply: (l: Look) => wear(l, slot, p.id),
              })),
          ],
    owned: new Set(owned),
    setName,
  });
}

describe('Tüm aksesuarlar list', () => {
  it('has the sections in the board`s order and never the "boş" option', () => {
    const s = sections();
    expect(s.map((x) => x.kind)).toEqual(['h', 'e', 'f', 'm', 'n', 'c', 'sets']);
    for (const section of s) for (const item of section.items) expect(item.name).not.toMatch(/boş/);
    expect(countOf(s)).toBeGreaterThan(0);
  });

  it('offers an accessory only to whoever owns it, and a set once a piece is owned', () => {
    expect(sections().find((x) => x.kind === 'sets')?.items).toEqual([]);
    expect(ninja.length).toBeGreaterThan(0);
    const mine = sections(ninja).find((x) => x.kind === 'sets')?.items ?? [];
    expect(mine.map((i) => i.name)).toEqual(['Ninja takımı']);
    expect(mine[0]?.pieces?.length).toBeGreaterThan(1);
  });

  it('puts a piece and a whole set on the draft, and knows what is worn', () => {
    const s = sections(ninja);
    const set = s.find((x) => x.kind === 'sets')?.items[0];
    expect(set).toBeDefined();
    if (!set) return;
    expect(isWorn(set, parse('c:pembe e:klasik'))).toBe(false);
    const dressed = putOn(set, parse('c:pembe e:klasik'));
    expect(isWorn(set, dressed)).toBe(true);
    expect(accessories(dressed).length).toBeGreaterThan(0);
    const head = s.find((x) => x.kind === 'h')?.items.find((i) => i.option?.part);
    if (!head) return;
    expect(isWorn(head, putOn(head, parse('c:pembe e:klasik')))).toBe(true);
  });

  it('searches by name with Turkish letters folded', () => {
    const s = sections(ninja);
    const first = s.find((x) => x.kind === 'h')?.items[0];
    expect(first).toBeDefined();
    if (!first) return;
    const query = first.name.toLocaleUpperCase('tr-TR').slice(0, 3);
    expect(searchItems(s, query).map((i) => i.key)).toContain(first.key);
    expect(searchItems(s, '   ')).toEqual([]);
    expect(searchItems(s, 'zzzzqx')).toEqual([]);
  });
});
