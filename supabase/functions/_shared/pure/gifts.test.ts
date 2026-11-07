import { describe, expect, it } from 'vitest';

import { GIFT_CATALOG } from './giftCatalog.ts';
import {
  accessoryOf,
  drawAccessory,
  GIFT_PACKS,
  GIFT_TIERS,
  type GiftCatalog,
  isFreeLook,
  ODDS_TOTAL,
  ownsAll,
  retiredParts,
  tierOdds,
  uniformInt,
  withAccessory,
  withoutNewRetiredParts,
} from './gifts.ts';

const CATALOG: GiftCatalog = {
  loginsPerPack: 3,
  tiers: GIFT_TIERS.map((id) => ({ id, name: id })),
  packs: GIFT_PACKS.map((id) => ({
    id,
    name: id,
    locked: id !== 'bronz',
    weights: { siradan: 70000, nadir: 22000, destansi: 7000, efsanevi: 1000 },
  })),
  accessories: [
    { id: 's1', name: 'S1', tier: 'siradan', weight: 1 },
    { id: 's2', name: 'S2', tier: 'siradan', weight: 3, replacesPart: 'h:bere' },
    { id: 'n1', name: 'N1', tier: 'nadir', weight: 1 },
    { id: 'd1', name: 'D1', tier: 'destansi', weight: 1 },
    { id: 'e1', name: 'E1', tier: 'efsanevi', weight: 999 },
    { id: 'e2', name: 'E2', tier: 'efsanevi', weight: 1 },
  ],
};

const none = new Set<string>();

describe('tierOdds (§4.U, Oranlar)', () => {
  it('is the pack weights when nothing is owned', () => {
    expect(tierOdds('bronz', none, CATALOG)).toEqual({
      siradan: 70000,
      nadir: 22000,
      destansi: 7000,
      efsanevi: 1000,
    });
  });

  it("gives a tier's share to the others in proportion once its accessories are owned", () => {
    const odds = tierOdds('bronz', new Set(['s1', 's2']), CATALOG);
    expect(odds.siradan).toBe(0);
    // 22000 : 7000 : 1000 of 30000; an equal remainder goes to the lower tier first.
    expect(odds).toEqual({ siradan: 0, nadir: 73334, destansi: 23333, efsanevi: 3333 });
    expect(odds.nadir + odds.destansi + odds.efsanevi).toBe(ODDS_TOTAL);
  });

  it('always adds up to ODDS_TOTAL, and to zero when everything is owned', () => {
    for (const owned of [
      none,
      new Set(['n1']),
      new Set(['s1', 's2', 'd1']),
      new Set(['e1', 'e2']),
    ]) {
      const odds = tierOdds('bronz', owned, CATALOG);
      expect(GIFT_TIERS.reduce((s, t) => s + odds[t], 0)).toBe(ODDS_TOTAL);
    }
    const all = new Set(CATALOG.accessories.map((a) => a.id));
    expect(tierOdds('bronz', all, CATALOG)).toEqual({
      siradan: 0,
      nadir: 0,
      destansi: 0,
      efsanevi: 0,
    });
    expect(ownsAll(all, CATALOG)).toBe(true);
    expect(ownsAll(new Set(['s1']), CATALOG)).toBe(false);
  });
});

describe('drawAccessory (rule 3: on the server)', () => {
  // Walks every roll of a fixed sequence: the first call picks the tier, the second the accessory.
  function rolls(...values: number[]) {
    let i = 0;
    return (n: number) => {
      const v = values[i++] ?? 0;
      expect(v).toBeLessThan(n);
      return v;
    };
  }

  it('picks the tier by the live weights, then the accessory by its weight', () => {
    expect(drawAccessory('bronz', none, rolls(0, 0), CATALOG)).toEqual({
      id: 's1',
      tier: 'siradan',
    });
    expect(drawAccessory('bronz', none, rolls(69999, 1), CATALOG)).toEqual({
      id: 's2',
      tier: 'siradan',
    });
    expect(drawAccessory('bronz', none, rolls(70000, 0), CATALOG)?.tier).toBe('nadir');
    expect(drawAccessory('bronz', none, rolls(99000, 998), CATALOG)).toEqual({
      id: 'e1',
      tier: 'efsanevi',
    });
    // One in a thousand inside the tier: e2's weight is 1 of 1000.
    expect(drawAccessory('bronz', none, rolls(99999, 999), CATALOG)).toEqual({
      id: 'e2',
      tier: 'efsanevi',
    });
  });

  it('never gives an owned accessory, and nothing when everything is owned', () => {
    const owned = new Set(['s1', 's2', 'n1', 'd1', 'e1']);
    // Only e2 is left: every roll lands on it.
    expect(drawAccessory('bronz', owned, rolls(0, 0), CATALOG)).toEqual({
      id: 'e2',
      tier: 'efsanevi',
    });
    expect(drawAccessory('bronz', new Set([...owned, 'e2']), rolls(), CATALOG)).toBeNull();
  });

  it('matches the odds over many draws (seeded)', () => {
    let seed = 7;
    const random = (n: number) => {
      seed = (seed * 16807) % 2147483647;
      return seed % n;
    };
    const counts: Record<string, number> = {};
    for (let i = 0; i < 100000; i++) {
      const tier = drawAccessory('bronz', none, random, CATALOG)?.tier ?? '';
      counts[tier] = (counts[tier] ?? 0) + 1;
    }
    expect((counts.siradan ?? 0) / 100000).toBeCloseTo(0.7, 1);
    expect((counts.nadir ?? 0) / 100000).toBeCloseTo(0.22, 1);
  });
});

describe('uniformInt', () => {
  it('draws again past the last whole multiple', () => {
    const words = [0xffffffff, 5];
    expect(uniformInt(3, () => words.shift() ?? 0)).toBe(2);
    expect(uniformInt(1, () => 123)).toBe(0);
    expect(() => uniformInt(0, () => 0)).toThrow();
  });
});

describe('the worn accessory in the look code', () => {
  it('is one "x:" token after the slots', () => {
    expect(withAccessory('c:mor e:klasik h:anten', 'tac')).toBe('c:mor e:klasik h:anten x:tac');
    expect(withAccessory('c:mor e:klasik x:tac', 'kasket')).toBe('c:mor e:klasik x:kasket');
    expect(withAccessory('c:mor e:klasik x:tac', null)).toBe('c:mor e:klasik');
    expect(accessoryOf('c:mor e:klasik x:tac')).toBe('tac');
    expect(accessoryOf('c:mor e:klasik')).toBeNull();
    expect(accessoryOf(null)).toBeNull();
  });
});

describe('capsule parts that became pack accessories (7 Kasım)', () => {
  it('cannot be picked up by a new look, but stay on a look that wears them', () => {
    expect(retiredParts(CATALOG)).toEqual(['h:bere']);
    expect(withoutNewRetiredParts('c:mor e:klasik h:bere', 'c:mor e:klasik', CATALOG)).toBe(
      'c:mor e:klasik',
    );
    expect(withoutNewRetiredParts('c:limon e:koyu h:bere', 'c:mor e:klasik h:bere', CATALOG)).toBe(
      'c:limon e:koyu h:bere',
    );
    expect(isFreeLook('c:limon e:klasik h:bere', CATALOG)).toBe(false);
    expect(isFreeLook('c:limon e:klasik h:anten', CATALOG)).toBe(true);
  });
});

describe('content/gift-packs.json', () => {
  it('holds the four packs, only Bronz open, and the eight accessories of §4.U', () => {
    expect(GIFT_CATALOG.packs.map((p) => [p.id, p.locked])).toEqual([
      ['bronz', false],
      ['gumus', true],
      ['altin', true],
      ['elmas', true],
    ]);
    expect(tierOdds('bronz', none)).toEqual({
      siradan: 70000,
      nadir: 22000,
      destansi: 7000,
      efsanevi: 1000,
    });
    expect(GIFT_CATALOG.loginsPerPack).toBe(3);
    const byTier = (tier: string) =>
      GIFT_CATALOG.accessories.filter((a) => a.tier === tier).map((a) => a.name);
    expect(byTier('siradan')).toEqual(['Bere', 'Yuvarlak gözlük']);
    expect(byTier('nadir')).toEqual(['Kasket', 'Kulaklık']);
    expect(byTier('destansi')).toEqual(['Büyücü şapkası', 'Yıldız gözlük']);
    expect(byTier('efsanevi')).toEqual(['Taç', 'Ejder boynuzu']);
    expect(retiredParts()).toEqual(['h:bere', 'h:kasket', 'h:kulaklik', 'h:tac']);
  });
});
