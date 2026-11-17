import { describe, expect, it } from 'vitest';

import { newestSeen, pinsFull, splitInbox, tabUnread, withManaged } from './dmManage';

const row = (threadId: string, over: Partial<Row> = {}): Row => ({
  threadId,
  pinned: false,
  archived: false,
  unreadCount: 0,
  ...over,
});
type Row = { threadId: string | null; pinned: boolean; archived: boolean; unreadCount: number };

describe('splitInbox', () => {
  it('keeps the archived apart, in order, and counts their unread', () => {
    const rows = [
      row('a', { pinned: true }),
      row('b', { archived: true, unreadCount: 2 }),
      row('c', { unreadCount: 4 }),
      row('d', { archived: true, unreadCount: 1 }),
    ];
    const split = splitInbox(rows);
    expect(split.chats.map((t) => t.threadId)).toEqual(['a', 'c']);
    expect(split.archived.map((t) => t.threadId)).toEqual(['b', 'd']);
    expect(split.archivedUnread).toBe(3);
  });
});

describe('tabUnread', () => {
  it('leaves the archived conversations out of the badge', () => {
    const rows = [
      row('a', { unreadCount: 2 }),
      row('b', { archived: true, unreadCount: 5 }),
      row('c', { pinned: true, unreadCount: 1 }),
      row('d', { unreadCount: -1 }),
    ];
    expect(tabUnread(rows)).toBe(3);
    expect(tabUnread([row('e', { archived: true, unreadCount: 4 })])).toBe(0);
  });
});

describe('pinsFull', () => {
  it('is full at five pinned', () => {
    const four = ['a', 'b', 'c', 'd'].map((id) => row(id, { pinned: true }));
    expect(pinsFull(four)).toBe(false);
    expect(pinsFull([...four, row('e', { pinned: true })])).toBe(true);
  });
});

describe('withManaged', () => {
  const rows = [row('a', { pinned: true }), row('b')];
  it('archive takes the pin off; unarchive keeps it off', () => {
    const archived = withManaged(rows, 'a', 'archive');
    expect(archived[0]).toMatchObject({ pinned: false, archived: true });
    expect(withManaged(archived, 'a', 'unarchive')[0]).toMatchObject({
      pinned: false,
      archived: false,
    });
  });
  it('pins and unpins only the one', () => {
    expect(withManaged(rows, 'b', 'pin').map((t) => t.pinned)).toEqual([true, true]);
    expect(withManaged(rows, 'a', 'unpin').map((t) => t.pinned)).toEqual([false, false]);
  });
  it('clear takes the conversation out', () => {
    expect(withManaged(rows, 'a', 'clear').map((t) => t.threadId)).toEqual(['b']);
  });
});

describe('newestSeen', () => {
  const page = [
    { id: 'new', created_at: '2026-11-16T10:05:00.000Z' },
    { id: 'shown', created_at: '2026-11-16T10:00:00.000+00:00' },
    { id: 'old', created_at: '2026-11-16T09:00:00Z' },
  ];
  it('is the newest message not after the one the list showed', () => {
    expect(newestSeen(page, '2026-11-16T10:00:00Z')).toBe('shown');
  });
  it('is null when nothing was shown, or nothing on the page is that old', () => {
    expect(newestSeen(page, null)).toBeNull();
    expect(newestSeen(page, '2026-11-16T08:00:00Z')).toBeNull();
    expect(newestSeen([], '2026-11-16T10:00:00Z')).toBeNull();
  });
});
