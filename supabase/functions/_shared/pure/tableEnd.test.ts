import { describe, expect, it } from 'vitest';

import { pairFriendState, showsTableEnd } from './tableEnd.ts';

describe('pairFriendState', () => {
  it('offers "Arkadaş ekle" on a record not pressed yet', () => {
    expect(pairFriendState({ friend_action_at: null }, false)).toBe('add');
  });

  it('says only "Sen bastın" after a press, until the two are friends', () => {
    expect(pairFriendState({ friend_action_at: '2026-10-16T20:00:00Z' }, false)).toBe('pressed');
    expect(pairFriendState({ friend_action_at: '2026-10-16T20:00:00Z' }, true)).toBe('friends');
    // Friends by another way (a request, an earlier table) before any press here.
    expect(pairFriendState({ friend_action_at: null }, true)).toBe('friends');
  });

  it('has no button without a record (less than 3 minutes together)', () => {
    expect(pairFriendState(undefined, false)).toBe('short');
    expect(pairFriendState(undefined, true)).toBe('short');
  });
});

describe('showsTableEnd', () => {
  it('shows the end of a table that closed under the phone, records or not', () => {
    expect(showsTableEnd({ hadOtherSide: true, leftOnItsOwn: false, records: 0 })).toBe(true);
    expect(showsTableEnd({ hadOtherSide: true, leftOnItsOwn: false, records: 2 })).toBe(true);
  });

  it('shows it to a phone that left on its own only with a record', () => {
    expect(showsTableEnd({ hadOtherSide: true, leftOnItsOwn: true, records: 0 })).toBe(false);
    expect(showsTableEnd({ hadOtherSide: true, leftOnItsOwn: true, records: 1 })).toBe(true);
  });

  it('never shows it for a table that had no other side', () => {
    expect(showsTableEnd({ hadOtherSide: false, leftOnItsOwn: false, records: 0 })).toBe(false);
    expect(showsTableEnd({ hadOtherSide: false, leftOnItsOwn: true, records: 3 })).toBe(false);
  });
});
