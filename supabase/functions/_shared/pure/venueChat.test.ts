import { describe, expect, it } from 'vitest';

import {
  prepareVenueMessage,
  senderLabel,
  shouldHide,
  VENUE_CHAT,
  venueChatActive,
  venueChatChannel,
  venueChatLastAt,
  venueChatRate,
  withVenueChatExtras,
} from './venueChat.ts';

describe('VENUE_CHAT rules', () => {
  it('match the spec', () => {
    expect(VENUE_CHAT).toMatchObject({
      maxLength: 200,
      minIntervalMs: 3000,
      windowSeconds: 600,
      windowMax: 20,
      hideAfterReports: 3,
      reportSnapshotSize: 50,
      keepHours: 24,
      dailyFriendRequests: 10,
    });
  });
});

describe('prepareVenueMessage', () => {
  it('trims and keeps 1–200 characters', () => {
    expect(prepareVenueMessage('  selam  ')).toBe('selam');
    expect(prepareVenueMessage('   ')).toBeNull();
    expect(prepareVenueMessage('ç'.repeat(200))).toBe('ç'.repeat(200));
    expect(prepareVenueMessage('a'.repeat(201))).toBeNull();
  });
});

describe('venueChatRate', () => {
  const t0 = 1_000_000;

  it('allows the first message and one every 3 seconds', () => {
    const first = venueChatRate(null, t0);
    expect(first).toEqual({ ok: true, next: { windowStartedAt: t0, count: 1, lastSentAt: t0 } });
    const prev = { windowStartedAt: t0, count: 1, lastSentAt: t0 };
    expect(venueChatRate(prev, t0 + 2999)).toEqual({ ok: false, reason: 'too_soon' });
    expect(venueChatRate(prev, t0 + 3000)).toEqual({
      ok: true,
      next: { windowStartedAt: t0, count: 2, lastSentAt: t0 + 3000 },
    });
  });

  it('stops at 20 in 10 minutes and starts a new window after', () => {
    const full = { windowStartedAt: t0, count: 20, lastSentAt: t0 + 60_000 };
    expect(venueChatRate(full, t0 + 120_000)).toEqual({ ok: false, reason: 'rate_limited' });
    expect(venueChatRate(full, t0 + 600_000)).toEqual({
      ok: true,
      next: { windowStartedAt: t0 + 600_000, count: 1, lastSentAt: t0 + 600_000 },
    });
  });
});

describe('shouldHide', () => {
  it('needs 3 different accounts, not counting the sender or repeats', () => {
    expect(shouldHide(['a', 'b'], 's')).toBe(false);
    expect(shouldHide(['a', 'a', 'a'], 's')).toBe(false);
    expect(shouldHide(['a', 'b', 's'], 's')).toBe(false);
    expect(shouldHide(['a', 'b', 'c'], 's')).toBe(true);
  });
});

describe('labels and channels', () => {
  it('shows the display name of a profiled message and the alias of an anonymous one', () => {
    expect(senderLabel({ displayName: 'Ayşe', senderAlias: null })).toBe('Ayşe');
    expect(senderLabel({ displayName: null, senderAlias: 'Mor Kedi' })).toBe('Mor Kedi');
  });

  it('names the channel by venue', () => {
    expect(venueChatChannel('v1')).toBe('venue_chat:v1');
  });
});

describe('withVenueChatExtras', () => {
  const base = {
    id: 'm1',
    profiled: false,
    senderAlias: 'Mor Kedi',
    displayName: null,
    photoUrl: null,
    body: 'selam',
    createdAt: '2026-10-12T10:00:00Z',
    fromMe: false,
  };

  it('gives a message from a server before replies and reactions no quote and no reactions', () => {
    expect(withVenueChatExtras(base)).toEqual({ ...base, replyTo: null, reactions: [] });
  });

  it('keeps what the server sent', () => {
    const replyTo = { gone: true } as const;
    const reactions = [{ emoji: 'begen' as const, count: 1, mine: true }];
    expect(withVenueChatExtras({ ...base, replyTo, reactions })).toEqual({
      ...base,
      replyTo,
      reactions,
    });
  });
});

describe('venueChatActive (K-12)', () => {
  const now = Date.parse('2026-10-19T12:00:00Z');
  it('lights for a message in the last 10 minutes', () => {
    expect(venueChatActive('2026-10-19T11:50:01Z', now)).toBe(true);
    expect(venueChatActive('2026-10-19T11:59:59Z', now)).toBe(true);
  });
  it('stays dark for an older message, none, or an unreadable time', () => {
    expect(venueChatActive('2026-10-19T11:50:00Z', now)).toBe(false);
    expect(venueChatActive('2026-10-19T09:00:00Z', now)).toBe(false);
    expect(venueChatActive(null, now)).toBe(false);
    expect(venueChatActive('dün', now)).toBe(false);
  });
});

describe('venueChatLastAt (K-12)', () => {
  it('takes the later of the page and the last broadcast heard', () => {
    expect(venueChatLastAt('2026-10-19T11:00:00Z', '2026-10-19T11:30:00Z')).toBe(
      '2026-10-19T11:30:00Z',
    );
    expect(venueChatLastAt('2026-10-19T11:30:00Z', '2026-10-19T11:00:00Z')).toBe(
      '2026-10-19T11:30:00Z',
    );
  });

  it('uses whichever there is', () => {
    expect(venueChatLastAt(null, '2026-10-19T11:30:00Z')).toBe('2026-10-19T11:30:00Z');
    expect(venueChatLastAt('2026-10-19T11:00:00Z', null)).toBe('2026-10-19T11:00:00Z');
    expect(venueChatLastAt(null, null)).toBeNull();
  });
});
