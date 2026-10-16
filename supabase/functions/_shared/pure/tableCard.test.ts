import { describe, expect, it } from 'vitest';

import { gameTag, lobbyActions, requestGone, tableState } from './tableCard.ts';

const NOW = Date.parse('2026-10-16T20:00:00Z');
const room = (status: string, visibility = 'open', revealEndsAt: string | null = null) => ({
  status,
  visibility,
  reveal_ends_at: revealEndsAt,
});

describe('tableState', () => {
  it('is off without a room or with a closed one', () => {
    expect(tableState(null, true, NOW)).toBe('off');
    expect(tableState(room('closed'), true, NOW)).toBe('off');
  });

  it('is open for the leader of a waiting room and member for the other phones on its side', () => {
    expect(tableState(room('waiting'), true, NOW)).toBe('open');
    expect(tableState(room('waiting'), false, NOW)).toBe('member');
  });

  it('is merged for every phone of a two-sided room', () => {
    expect(tableState(room('active'), true, NOW)).toBe('merged');
    expect(tableState(room('active'), false, NOW)).toBe('merged');
  });

  it('is solo for "Masanla oyna"', () => {
    expect(tableState(room('active', 'private'), true, NOW)).toBe('solo');
    expect(tableState(room('waiting', 'private'), true, NOW)).toBe('solo');
  });

  it('leads to the room while its reveal window is open, then lets the table go', () => {
    expect(tableState(room('ending', 'open', '2026-10-16T20:01:00Z'), false, NOW)).toBe('merged');
    expect(tableState(room('ending', 'open', '2026-10-16T20:00:00Z'), true, NOW)).toBe('off');
    expect(tableState(room('ending', 'open', null), true, NOW)).toBe('off');
    expect(tableState(room('ending', 'private', '2026-10-16T20:01:00Z'), true, NOW)).toBe('off');
  });
});

describe('lobbyActions', () => {
  it('offers "Katıl" without a room and from the own waiting room, "Bu masadayım" only without', () => {
    expect(lobbyActions('off')).toEqual({ join: true, member: true });
    expect(lobbyActions('open')).toEqual({ join: true, member: false });
  });

  it('offers nothing to a member, a merged table or a "Masanla oyna" table', () => {
    for (const state of ['member', 'merged', 'solo'] as const) {
      expect(lobbyActions(state)).toEqual({ join: false, member: false });
    }
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
  it('is the requester table that merged meanwhile, or a request that ended', () => {
    expect(requestGone('room_not_available')).toBe(true);
    expect(requestGone('request_expired')).toBe(true);
    expect(requestGone('request_not_found')).toBe(true);
  });

  it('leaves every other error to the card as an error', () => {
    for (const code of ['internal', 'rate_limited', 'not_leader', 'already_in_room']) {
      expect(requestGone(code)).toBe(false);
    }
  });
});
