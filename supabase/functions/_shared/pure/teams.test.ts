import { describe, expect, it } from 'vitest';

import { MAX_SIDE_PHONES, otherSide, roomSeat, sideHeadcount } from './teams.ts';

describe('sideHeadcount', () => {
  it('is the declared headcount until the phones outnumber it', () => {
    expect(sideHeadcount(3, 1)).toBe(3);
    expect(sideHeadcount(3, 3)).toBe(3);
    expect(sideHeadcount(1, 2)).toBe(2);
    expect(sideHeadcount(2, MAX_SIDE_PHONES)).toBe(MAX_SIDE_PHONES);
  });
});

describe('roomSeat', () => {
  const room = { owner_session_id: 'o', guest_session_id: 'g' };
  const phones = [
    { sessionId: 'o', side: 'owner' },
    { sessionId: 'm1', side: 'owner' },
    { sessionId: 'g', side: 'guest' },
    { sessionId: 'm2', side: 'guest' },
  ];

  it('knows the leaders from the room row, before room_phones is read', () => {
    expect(roomSeat(room, undefined, 'o')).toEqual({ side: 'owner', leader: true });
    expect(roomSeat(room, undefined, 'g')).toEqual({ side: 'guest', leader: true });
  });

  it('finds a member in room_phones', () => {
    expect(roomSeat(room, phones, 'm1')).toEqual({ side: 'owner', leader: false });
    expect(roomSeat(room, phones, 'm2')).toEqual({ side: 'guest', leader: false });
  });

  it('is null for a phone not in the room', () => {
    expect(roomSeat(room, phones, 'x')).toBeNull();
    expect(roomSeat(room, undefined, 'm1')).toBeNull();
    expect(roomSeat({ owner_session_id: 'o', guest_session_id: null }, [], 'g')).toBeNull();
  });

  it('turns a member into a leader with the room row', () => {
    expect(roomSeat({ ...room, owner_session_id: 'm1' }, phones, 'm1')).toEqual({
      side: 'owner',
      leader: true,
    });
  });
});

describe('otherSide', () => {
  it('is the side across', () => {
    expect(otherSide('owner')).toBe('guest');
    expect(otherSide('guest')).toBe('owner');
  });
});

describe('MAX_SIDE_PHONES', () => {
  it('is the leader and three members', () => {
    expect(MAX_SIDE_PHONES).toBe(4);
  });
});
