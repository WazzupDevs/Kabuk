import { describe, expect, it } from 'vitest';

import { gameTag, lobbyActions, requestGone, tableState } from './tableCard.ts';

const room = (status: string, visibility = 'open') => ({ status, visibility });

// docs/SPEC_V4.md §4.E: a person has no table, owns one (in the lobby or not) or sits at another's.
describe('tableState', () => {
  it('is none without a table or with a closed one', () => {
    expect(tableState(null, true)).toBe('none');
    expect(tableState(room('closed'), true)).toBe('none');
    expect(tableState(room('closed'), false)).toBe('none');
  });

  it('is the owner’s lobby state, whether anyone else sits at the table or not', () => {
    for (const status of ['waiting', 'active']) {
      expect(tableState(room(status, 'private'), true)).toBe('private');
      expect(tableState(room(status, 'open'), true)).toBe('open');
    }
  });

  it('is participant for everyone else at the table', () => {
    expect(tableState(room('active', 'open'), false)).toBe('participant');
    expect(tableState(room('waiting', 'private'), false)).toBe('participant');
  });
});

describe('lobbyActions', () => {
  it('offers "Katıl" without a table and to an owner, "Bu masadayım" only without a table', () => {
    expect(lobbyActions('none', 1, 3)).toEqual({ join: true, full: false, member: true });
    expect(lobbyActions('private', 2, 3)).toEqual({ join: true, full: false, member: false });
    expect(lobbyActions('open', 2, 3)).toEqual({ join: true, full: false, member: false });
  });

  // A participant asks from no table of its own: it leaves first (not_owner).
  it('offers a participant nothing', () => {
    expect(lobbyActions('participant', 4, 3)).toEqual({ join: false, full: false, member: false });
  });

  // The owner's table and the other together may not pass 12 (table_full; MAX_TABLE_PHONES): the
  // button stays and is closed ("Masan 12 kişi, Katıl kapalı").
  it('closes the owner’s "Katıl" when the two tables together pass 12', () => {
    expect(lobbyActions('open', 6, 6)).toEqual({ join: true, full: false, member: false });
    expect(lobbyActions('open', 12, 1)).toEqual({ join: true, full: true, member: false });
    expect(lobbyActions('private', 11, 2)).toEqual({ join: true, full: true, member: false });
  });

  // Alone, the person counts as one; the server still refuses a full table (table_full).
  it('leaves a person without a table to the server', () => {
    expect(lobbyActions('none', 1, 12)).toEqual({ join: true, full: false, member: true });
  });
});

describe('gameTag', () => {
  it('keeps the six games and reads anything else as "fark etmez"', () => {
    expect(gameTag('tabu')).toBe('tabu');
    expect(gameTag('ibre')).toBe('ibre');
    expect(gameTag(null)).toBeNull();
    expect(gameTag('')).toBeNull();
    expect(gameTag('poker')).toBeNull();
  });
});

describe('requestGone', () => {
  it('is the requester’s table that moved meanwhile, or a request that ended', () => {
    expect(requestGone('room_not_available')).toBe(true);
    expect(requestGone('request_expired')).toBe(true);
    expect(requestGone('request_not_found')).toBe(true);
  });

  it('leaves every other error to the card as an error', () => {
    for (const code of ['internal', 'rate_limited', 'not_owner', 'already_in_table']) {
      expect(requestGone(code)).toBe(false);
    }
  });
});
