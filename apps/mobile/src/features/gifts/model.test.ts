import type { GiftState } from '@shared/api/gifts.ts';
import { GIFT_CATALOG } from '@shared/giftCatalog.ts';
import { type GiftPack } from '@shared/gifts.ts';
import { describe, expect, it } from 'vitest';

import { tr } from '../../i18n/tr';

import {
  ACCESSORIES,
  cardState,
  packName,
  packsInOrder,
  tierName,
} from './model';

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
  worn: [],
  equipped: null,
  ...over,
});

const any = (_p: GiftPack): _p is GiftPack => true;

describe('gift card', () => {
  it('shows a pack to open first', () => {
    const s = state();
    const bronz = s.packs[0];
    if (bronz) bronz.unopened = 1;
    expect(cardState(s, any)).toEqual({ kind: 'ready', pack: 'bronz', count: 1 });
  });

  it('shows the logins left to the next pack', () => {
    expect(cardState(state(), any)).toEqual({
      kind: 'progress',
      pack: 'bronz',
      logins: 2,
      per: 3,
      left: 1,
    });
  });

  it('puts the packs in order of worth, only the ones that can be shown', () => {
    const s = state();
    expect(packsInOrder(s, any).map((p) => p.id)).toEqual(['bronz', 'gumus', 'altin', 'elmas']);
    const notBronz = (p: GiftPack): p is 'gumus' | 'altin' | 'elmas' => p !== 'bronz';
    expect(packsInOrder(s, notBronz).map((p) => p.id)).toEqual(['gumus', 'altin', 'elmas']);
    // A pack that is not shown is not the card's either.
    expect(cardState(s, notBronz).kind).toBe('progress');
  });

  it('says every accessory is owned', () => {
    expect(cardState(state({ allOwned: true }), any)).toEqual({ kind: 'allOwned' });
  });
});

describe('gift names', () => {
  it('reads names from the catalog', () => {
    expect(packName('bronz')).toBe('Bronz');
    expect(tierName('efsanevi')).toBe('Efsanevi');
    expect(ACCESSORIES).toHaveLength(GIFT_CATALOG.accessories.length);
  });

  it('writes odds as the server gives them, in Turkish', () => {
    expect(tr.gifts.percent(70000, 100000)).toBe('%70');
    expect(tr.gifts.percent(1, 100000)).toBe('%0,001');
    expect(tr.gifts.percent(33333, 100000)).toBe('%33,333');
  });
});
