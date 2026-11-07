import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { describe, expect, it } from 'vitest';

import {
  accessoryIn,
  accessoryItems,
  bare,
  code,
  packsFor,
  parse,
  showsPart,
  shuffle,
  takeAccessoryOff,
  takeOff,
  wear,
  wearAccessory,
  wearPack,
  worn,
} from './look';

describe('capsule editor', () => {
  it('round-trips a ready look', () => {
    for (const r of CAPSULE_CATALOG.readyLooks) expect(code(parse(r.code))).toBe(r.code);
  });

  it('wears and takes off', () => {
    const look = wear(parse('c:pembe e:klasik'), 'h', 'kedi');
    expect(code(look)).toBe('c:pembe e:klasik h:kedi');
    expect(worn(look).map((w) => w.id)).toEqual(['kedi']);
    expect(code(takeOff(look, 'h'))).toBe('c:pembe e:klasik');
    expect(code(takeOff(wear(look, 'e', 'koyu'), 'e'))).toBe('c:pembe e:klasik h:kedi');
    expect(code(bare(wear(look, 'f', 'yuvarlak')))).toBe('c:pembe e:klasik');
  });

  it('lists packs with something for the slot and wears a pack whole', () => {
    const packs = packsFor('tema', 'h');
    expect(packs.length).toBeGreaterThan(0);
    for (const p of packs) expect(p.items.every((i) => i.slot === 'h')).toBe(true);
    const first = packs[0];
    if (!first) return;
    const look = wearPack(parse('c:mor'), 'tema', first.pack);
    expect(parse(code(look)).h).toBeDefined();
  });

  it('shuffles to canonical looks', () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 20; i++) {
      const look = shuffle(random);
      expect(code(parse(code(look)))).toBe(code(look));
    }
  });
});

describe('pack accessory in the editor', () => {
  it('wears several accessories, one in each slot, over the parts there', () => {
    const look = parse('c:pembe e:klasik h:kedi x:filiz x:ipkravat');
    expect(code(look)).toBe('c:pembe e:klasik h:kedi x:filiz x:ipkravat');
    expect(accessoryIn(look, 'h')).toBe('filiz');
    expect(showsPart(look, 'h', 'kedi')).toBe(false);
    // The covered part is not among the chips; the accessories are.
    expect(worn(look).map((w) => w.id)).toEqual(['filiz', 'ipkravat']);
    // Another in the same slot takes the first's place; a two-slot set both of its slots'.
    expect(code(wearAccessory(look, 'percem'))).toBe('c:pembe e:klasik h:kedi x:ipkravat x:percem');
    expect(code(wearAccessory(look, 'kistakimi'))).toBe('c:pembe e:klasik h:kedi x:kistakimi');
    // Taking it off shows the part again.
    expect(showsPart(takeAccessoryOff(look, 'filiz'), 'h', 'kedi')).toBe(true);
  });

  it('takes the accessory off when a part or an empty slot is chosen there', () => {
    const look = parse('c:pembe e:klasik x:filiz x:ipkravat');
    expect(code(wear(look, 'h', 'kedi'))).toBe('c:pembe e:klasik h:kedi x:ipkravat');
    expect(code(wear(look, 'h', null))).toBe('c:pembe e:klasik x:ipkravat');
    expect(code(wear(parse('c:mor x:ormanteni'), 'c', 'pembe'))).toBe('c:pembe e:klasik');
    expect(code(bare(look))).toBe('c:pembe e:klasik');
    expect(parse(code(shuffle(() => 0.3, look))).x).toEqual(['filiz', 'ipkravat']);
  });

  it('offers the owned accessories of a slot, a set in each of its slots', () => {
    const owned = new Set(['filiz', 'kistakimi', 'baklagoz']);
    expect(accessoryItems('h', owned).map((i) => i.id)).toEqual(['filiz', 'kistakimi']);
    expect(accessoryItems('n', owned).map((i) => i.id)).toEqual(['kistakimi']);
    expect(accessoryItems('e', owned).map((i) => i.id)).toEqual(['baklagoz']);
  });

  it('offers the parts that became accessories only to a look that wears one', () => {
    const ids = (kept: string) =>
      packsFor('tema', 'h', parse(kept)).flatMap((p) => p.items.map((i) => i.id));
    const all = CAPSULE_CATALOG.racks.flatMap((r) =>
      packsFor(r.id, 'h').flatMap((p) => p.items.map((i) => i.id)),
    );
    for (const retired of ['bere', 'kasket', 'kulaklik', 'tac']) expect(all).not.toContain(retired);
    const keptAll = CAPSULE_CATALOG.racks.flatMap((r) =>
      packsFor(r.id, 'h', parse('c:mor h:tac')).flatMap((p) => p.items.map((i) => i.id)),
    );
    expect(keptAll).toContain('tac');
    expect(ids('c:mor')).not.toContain('tac');
  });

  it('never shuffles a retired part', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 200; i++) {
      expect(['bere', 'kasket', 'kulaklik', 'tac']).not.toContain(shuffle(random).h);
    }
  });
});
