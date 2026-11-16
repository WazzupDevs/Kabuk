import { describe, expect, it } from 'vitest';

import {
  archivedUnread,
  canEditDm,
  DM_EDIT_WINDOW_MS,
  DM_PIN_MAX,
  pinnedFirst,
} from './dmManage.ts';

describe('limits (docs/SPEC_V4.md §4.X)', () => {
  it('pins at most five and edits within fifteen minutes', () => {
    expect(DM_PIN_MAX).toBe(5);
    expect(DM_EDIT_WINDOW_MS).toBe(15 * 60 * 1000);
  });
});

describe('canEditDm', () => {
  const sent = '2026-11-16T10:00:00.000Z';
  const at = Date.parse(sent);

  it('is open up to and including fifteen minutes after sending', () => {
    expect(canEditDm(sent, at)).toBe(true);
    expect(canEditDm(sent, at + DM_EDIT_WINDOW_MS)).toBe(true);
  });

  it('is closed after it, and for a time it cannot read', () => {
    expect(canEditDm(sent, at + DM_EDIT_WINDOW_MS + 1)).toBe(false);
    expect(canEditDm('not a time', at)).toBe(false);
  });
});

describe('pinnedFirst', () => {
  it('puts the pinned first, the earliest pinned first, and keeps the rest in order', () => {
    const rows = [
      { id: 'a', pinnedAt: null },
      { id: 'b', pinnedAt: '2026-11-16T10:05:00Z' },
      { id: 'c', pinnedAt: null },
      { id: 'd', pinnedAt: '2026-11-16T10:01:00Z' },
      { id: 'e', pinnedAt: null },
    ];
    expect(pinnedFirst(rows).map((r) => r.id)).toEqual(['d', 'b', 'a', 'c', 'e']);
    // The input stays as it was.
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('changes nothing without a pin', () => {
    const rows = [
      { id: 'a', pinnedAt: null },
      { id: 'b', pinnedAt: null },
    ];
    expect(pinnedFirst(rows)).toEqual(rows);
  });
});

describe('archivedUnread', () => {
  it('counts the unread of the archived conversations only', () => {
    expect(
      archivedUnread([
        { archived: true, unreadCount: 2 },
        { archived: false, unreadCount: 5 },
        { archived: true, unreadCount: 1 },
        { archived: true, unreadCount: -1 },
      ]),
    ).toBe(3);
    expect(archivedUnread([])).toBe(0);
  });
});
