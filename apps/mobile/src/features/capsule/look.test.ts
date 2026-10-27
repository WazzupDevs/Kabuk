import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { describe, expect, it } from 'vitest';

import { bare, code, packsFor, parse, shuffle, takeOff, wear, wearPack, worn } from './look';

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
