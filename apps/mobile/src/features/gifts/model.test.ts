import type { GiftState } from '@shared/api/gifts.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import { describe, expect, it } from 'vitest';

import { tr } from '../../i18n/tr';

import { ACCESSORIES, byTier, cardState, packName, tierName } from './model';

const ODDS = { siradan: 70000, nadir: 22000, destansi: 7000, efsanevi: 1000 };
const state = (over: Partial<GiftState> = {}): GiftState => ({
  packs: [
    { id: 'bronz', locked: false, unopened: 0, odds: ODDS },
    { id: 'gumus', locked: true, unopened: 0, odds: ODDS },
    { id: 'altin', locked: true, unopened: 0, odds: ODDS },
    { id: 'elmas', locked: true, unopened: 0, odds: ODDS },
  ],
  logins: 2,
  loginsPerPack: 3,
  allOwned: false,
  owned: [],
  equipped: null,
  ...over,
});

describe('gift card', () => {
  it('shows a pack to open first', () => {
    const s = state();
    const bronz = s.packs[0];
    if (bronz) bronz.unopened = 1;
    expect(cardState(s)).toEqual({ kind: 'ready', pack: 'bronz', count: 1 });
  });

  it('shows the logins left to the next pack', () => {
    expect(cardState(state())).toEqual({
      kind: 'progress',
      pack: 'bronz',
      logins: 2,
      per: 3,
      left: 1,
    });
  });

  it('says every accessory is owned', () => {
    expect(cardState(state({ allOwned: true }))).toEqual({ kind: 'allOwned' });
  });
});

describe('gift names', () => {
  it('reads names from the catalog', () => {
    expect(packName('bronz')).toBe('Bronz');
    expect(tierName('efsanevi')).toBe('Efsanevi');
    expect(ACCESSORIES).toHaveLength(GIFT_CATALOG.accessories.length);
    expect(byTier().map((g) => g.items.length)).toEqual([2, 2, 2, 2]);
  });

  it('writes odds as the server gives them, in Turkish', () => {
    expect(tr.gifts.percent(70000, 100000)).toBe('%70');
    expect(tr.gifts.percent(1, 100000)).toBe('%0,001');
    expect(tr.gifts.percent(33333, 100000)).toBe('%33,333');
  });
});
