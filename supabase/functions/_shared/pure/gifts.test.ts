import { describe, expect, it } from 'vitest';

import { LOOK_MAX_LENGTH, LOOK_SLOTS } from './capsule.ts';
import { CAPSULE_CATALOG } from './capsuleCatalog.ts';
import { GIFT_CATALOG } from './giftCatalog.ts';
import {
  accessoriesOf,
  accessoryOf,
  coveredSlots,
  drawAccessory,
  fullSetOf,
  GIFT_PACKS,
  GIFT_TIERS,
  type GiftCatalog,
  isFreeLook,
  ODDS_TOTAL,
  ownsAll,
  poolOf,
  retiredParts,
  slotConflict,
  tierOdds,
  uniformInt,
  wearOne,
  withAccessories,
  withAccessory,
  withoutNewRetiredParts,
} from './gifts.ts';

const CATALOG: GiftCatalog = {
  loginsPerPack: 3,
  tiers: GIFT_TIERS.map((id) => ({ id, name: id })),
  packs: GIFT_PACKS.map((id) => {
    const themed = id === 'elf' || id === 'ninja';
    return {
      id,
      name: id,
      locked: id !== 'bronz',
      themed,
      weights: themed
        ? { siradan: 0, nadir: 0, destansi: 0, efsanevi: 100000 }
        : { siradan: 70000, nadir: 22000, destansi: 7000, efsanevi: 1000 },
      ...(id === 'elf' ? { fullSet: ['l1', 'l2'] } : {}),
    };
  }),
  accessories: [
    { id: 's1', name: 'S1', tier: 'siradan', slots: ['h'], weight: 1 },
    { id: 's2', name: 'S2', tier: 'siradan', slots: ['f'], weight: 3, replacesPart: 'h:bere' },
    { id: 'n1', name: 'N1', tier: 'nadir', slots: ['m'], weight: 1 },
    { id: 'd1', name: 'D1', tier: 'destansi', slots: ['h', 'n'], weight: 1 },
    { id: 'e1', name: 'E1', tier: 'efsanevi', slots: ['e'], weight: 999 },
    { id: 'e2', name: 'E2', tier: 'efsanevi', slots: ['c'], weight: 1 },
    { id: 'l1', name: 'L1', tier: 'efsanevi', slots: ['h'], weight: 1, pack: 'elf' },
    { id: 'l2', name: 'L2', tier: 'efsanevi', slots: ['c'], weight: 1, pack: 'elf' },
    { id: 'l3', name: 'L3', tier: 'efsanevi', slots: ['n'], weight: 2, pack: 'elf' },
    { id: 'j1', name: 'J1', tier: 'efsanevi', slots: ['h'], weight: 1, pack: 'ninja' },
    { id: 'old', name: 'Old', tier: 'efsanevi', slots: ['h'], weight: 1, retired: true },
  ],
};

const TIER_POOL = ['s1', 's2', 'n1', 'd1', 'e1', 'e2'];

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
    const all = new Set(TIER_POOL);
    expect(tierOdds('bronz', all, CATALOG)).toEqual({
      siradan: 0,
      nadir: 0,
      destansi: 0,
      efsanevi: 0,
    });
    expect(ownsAll(all, CATALOG, ['bronz'])).toBe(true);
    expect(ownsAll(new Set(['s1']), CATALOG, ['bronz'])).toBe(false);
    // With Elf and Ninja open (the dev project), their accessories count too.
    expect(ownsAll(all, CATALOG)).toBe(false);
    expect(ownsAll(new Set([...TIER_POOL, 'l1', 'l2', 'l3', 'j1']), CATALOG)).toBe(true);
  });
});

describe('poolOf (§4.U, Elf and Ninja)', () => {
  it('gives a themed pack only its own accessories, a tier pack none of them, and none retired', () => {
    expect(poolOf('bronz', CATALOG).map((a) => a.id)).toEqual(TIER_POOL);
    expect(poolOf('elmas', CATALOG).map((a) => a.id)).toEqual(TIER_POOL);
    expect(poolOf('elf', CATALOG).map((a) => a.id)).toEqual(['l1', 'l2', 'l3']);
    expect(poolOf('ninja', CATALOG).map((a) => a.id)).toEqual(['j1']);
    expect(tierOdds('elf', none, CATALOG)).toEqual({
      siradan: 0,
      nadir: 0,
      destansi: 0,
      efsanevi: 100000,
    });
  });

  it('draws a full-set part at half the weight of the others', () => {
    // l1 1, l2 1, l3 2 of 4.
    const roll = (v: number) => {
      let i = 0;
      return (n: number) => (i++ === 0 ? 0 : Math.min(v, n - 1));
    };
    expect(drawAccessory('elf', none, roll(0), CATALOG)?.id).toBe('l1');
    expect(drawAccessory('elf', none, roll(1), CATALOG)?.id).toBe('l2');
    expect(drawAccessory('elf', none, roll(2), CATALOG)?.id).toBe('l3');
    expect(drawAccessory('elf', none, roll(3), CATALOG)?.id).toBe('l3');
    expect(drawAccessory('elf', new Set(['l1', 'l2', 'l3']), roll(0), CATALOG)).toBeNull();
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

describe('the worn accessories in the look code', () => {
  it('are "x:" tokens after the slots, one in each slot', () => {
    expect(withAccessories('c:mor e:klasik x:tac', ['s1', 'n1'])).toBe('c:mor e:klasik x:s1 x:n1');
    expect(accessoriesOf('c:mor e:klasik x:s1 x:n1')).toEqual(['s1', 'n1']);
    expect(accessoriesOf(null)).toEqual([]);
    expect(slotConflict(['s1', 'n1', 'e1'], CATALOG)).toBe(false);
    expect(slotConflict(['s1', 'd1'], CATALOG)).toBe(true);
    expect(slotConflict(['n1', 'n1'], CATALOG)).toBe(true);
    // A two-slot set takes off whatever is worn in either slot.
    expect(wearOne(['s1', 'n1', 'e1'], 'd1', CATALOG)).toEqual(['n1', 'e1', 'd1']);
    expect(wearOne(['d1', 'n1'], 's1', CATALOG)).toEqual(['n1', 's1']);
    expect(wearOne(['n1'], 'n1', CATALOG)).toEqual(['n1']);
    expect(coveredSlots(['d1', 'e2'], CATALOG)).toEqual({ h: 'd1', n: 'd1', c: 'e2' });
  });

  it('wear a full set when every part of it is on', () => {
    expect(fullSetOf('c:mor e:klasik x:l1 x:l2', CATALOG)).toBe('elf');
    expect(fullSetOf('c:mor e:klasik x:l1 x:l2 x:n1', CATALOG)).toBe('elf');
    expect(fullSetOf('c:mor e:klasik x:l1', CATALOG)).toBeNull();
    expect(fullSetOf(null, CATALOG)).toBeNull();
  });

  it('fit in a look at their longest (profiles.capsule_look)', () => {
    // The longest id of each slot, the slot's own and one accessory's.
    const longest = (ids: readonly string[]) => Math.max(0, ...ids.map((id) => id.length));
    const own: Record<string, readonly string[]> = {
      c: CAPSULE_CATALOG.colors.map((c) => c.id),
      e: CAPSULE_CATALOG.eyes.map((e) => e.id),
    };
    let length = 0;
    for (const slot of LOOK_SLOTS) {
      const parts =
        own[slot] ?? CAPSULE_CATALOG.parts.filter((p) => p.slot === slot).map((p) => p.id);
      const accessories = GIFT_CATALOG.accessories.filter((a) => a.slots.includes(slot));
      length += 2 + longest(parts) + 1 + 2 + longest(accessories.map((a) => a.id)) + 1;
    }
    expect(length - 1).toBeLessThanOrEqual(LOOK_MAX_LENGTH);
  });

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
  it('holds the six packs, only Bronz open, and the 40 + 20 accessories of §4.U', () => {
    expect(GIFT_CATALOG.packs.map((p) => [p.id, p.locked, p.themed])).toEqual([
      ['bronz', false, false],
      ['gumus', true, false],
      ['altin', true, false],
      ['elmas', true, false],
      ['elf', true, true],
      ['ninja', true, true],
    ]);
    expect(tierOdds('bronz', none)).toEqual({
      siradan: 70000,
      nadir: 22000,
      destansi: 7000,
      efsanevi: 1000,
    });
    expect(GIFT_CATALOG.loginsPerPack).toBe(3);
    const pool = poolOf('bronz');
    for (const tier of GIFT_TIERS) expect(pool.filter((a) => a.tier === tier)).toHaveLength(10);
    for (const a of pool) expect(a.slots).toHaveLength(a.tier === 'destansi' ? 2 : 1);
    for (const pack of ['elf', 'ninja'] as const) {
      const own = poolOf(pack);
      expect(own).toHaveLength(10);
      expect(own.every((a) => a.tier === 'efsanevi')).toBe(true);
      const set = GIFT_CATALOG.packs.find((p) => p.id === pack)?.fullSet ?? [];
      // The full-set parts come at half the weight of the others (the owner's call, 7 Kasım).
      for (const a of own) expect(a.weight).toBe(set.includes(a.id) ? 1 : 2);
      expect(slotConflict(set)).toBe(false);
    }
    expect(GIFT_CATALOG.packs.find((p) => p.id === 'elf')?.fullSet).toHaveLength(6);
    expect(GIFT_CATALOG.packs.find((p) => p.id === 'ninja')?.fullSet).toHaveLength(5);
    // The first eight but Ejder boynuzu left the catalog; whoever owns one keeps it.
    expect(GIFT_CATALOG.accessories.filter((a) => a.retired).map((a) => a.name)).toEqual([
      'Bere',
      'Yuvarlak gözlük',
      'Kasket',
      'Kulaklık',
      'Büyücü şapkası',
      'Yıldız gözlük',
      'Taç',
    ]);
    expect(pool.some((a) => a.id === 'ejderboynuzu')).toBe(true);
    expect(retiredParts()).toEqual(['h:bere', 'h:kasket', 'h:kulaklik', 'h:tac']);
  });
});
