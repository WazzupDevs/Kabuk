import { describe, expect, it } from 'vitest';

import { inviteState, isUnseen, NOTIFICATION_DAYS, seenMark } from './notifications.ts';
import { invitePush, PUSH_PREFERENCE } from './push.ts';
import { MAX_TABLE_INVITES_PER_HOUR, TABLE_INVITE_TTL_SECONDS } from './tables.ts';

describe('the table invite (docs/SPEC_V4.md §4.G)', () => {
  it('lasts 2 minutes, 30 an hour per owner', () => {
    expect(TABLE_INVITE_TTL_SECONDS).toBe(120);
    expect(MAX_TABLE_INVITES_PER_HOUR).toBe(30);
  });

  it('shows the invitee an open, expired, joined or declined invite', () => {
    const at = Date.parse('2026-10-20T10:00:00.000Z');
    const expires = '2026-10-20T10:02:00.000Z';
    expect(inviteState('pending', expires, at)).toBe('open');
    expect(inviteState('pending', expires, at + 120_000)).toBe('expired');
    expect(inviteState('expired', expires, at)).toBe('expired');
    expect(inviteState('accepted', expires, at + 999_999)).toBe('joined');
    expect(inviteState('declined', expires, at)).toBe('declined');
  });

  // §18.3a: a push carries no name, table or venue.
  it('pushes without a name, a table or a venue, read against "Masa davetleri"', () => {
    expect(invitePush()).toEqual({
      title: expect.any(String),
      body: 'Bir arkadaşın seni masasına çağırıyor',
      target: 'notifications',
    });
    expect(PUSH_PREFERENCE.table_invite).toBe('notify_invites');
  });
});

describe('notification settings (K-53, K-62)', () => {
  it('reads each push against its own row; a match against "Arkadaşlık istekleri"', () => {
    expect(PUSH_PREFERENCE).toEqual({
      dm: 'notify_dm',
      friend_request: 'notify_friend_requests',
      friend_match: 'notify_friend_requests',
      table_invite: 'notify_invites',
    });
  });
});

describe('the bell (§4.G)', () => {
  it('keeps an accepted request and a match a week, an invite a day', () => {
    expect(NOTIFICATION_DAYS).toEqual({ accepted: 7, match: 7, invite: 1 });
  });

  it('marks the newest row the list showed, never later than now', () => {
    const now = Date.parse('2026-10-20T10:00:00.000Z');
    expect(seenMark('2026-10-20T09:59:00.000+00:00', now)).toBe('2026-10-20T09:59:00.000Z');
    expect(seenMark('2026-10-20T12:59:00.000+03:00', now)).toBe('2026-10-20T09:59:00.000Z');
    expect(seenMark('2026-10-20T10:05:00.000Z', now)).toBe('2026-10-20T10:00:00.000Z');
  });

  it('counts what came after the list was last opened, all of it before the first time', () => {
    const seen = '2026-10-20T10:00:00.000Z';
    expect(isUnseen('2026-10-20T10:00:01.000Z', seen)).toBe(true);
    expect(isUnseen('2026-10-20T09:59:59.000Z', seen)).toBe(false);
    expect(isUnseen(seen, seen)).toBe(false);
    expect(isUnseen('2020-01-01T00:00:00.000Z', null)).toBe(true);
  });
});
