import { describe, expect, it } from 'vitest';

import type { DmPageRow } from './dmInbox.ts';
import { withNewestPage, withSamePage } from './dmPages.ts';

function row(id: string, at: string, fromMe = false, status: string | null = null): DmPageRow {
  return { id, body: id, created_at: at, from_me: fromMe, status, reply_to: null, reactions: [] };
}

describe('withNewestPage', () => {
  it('adds a new message to the newest page, newest first, the others the same objects', () => {
    const a = row('a', '2026-10-29T10:00:00Z');
    const b = row('b', '2026-10-29T10:01:00Z');
    const older = [row('z', '2026-10-28T10:00:00Z')];
    const c = row('c', '2026-10-29T10:02:00Z');
    const pages = withNewestPage([[b, a], older], [c, { ...b }, { ...a }], 3);
    expect(pages[0]?.map((m) => m.id)).toEqual(['c', 'b', 'a']);
    expect(pages[0]?.[1]).toBe(b);
    expect(pages[0]?.[2]).toBe(a);
    expect(pages[1]?.[0]).toBe(older[0]);
  });

  it('keeps cached rows the full fresh page no longer reaches', () => {
    const a = row('a', '2026-10-29T10:00:00Z');
    const b = row('b', '2026-10-29T10:01:00Z');
    const c = row('c', '2026-10-29T10:02:00Z');
    expect(withNewestPage([[b, a]], [c, b], 2)[0]?.map((m) => m.id)).toEqual(['c', 'b', 'a']);
  });

  it('drops cached rows the server no longer has', () => {
    const a = row('a', '2026-10-29T10:00:00Z');
    const b = row('b', '2026-10-29T10:01:00Z');
    const c = row('c', '2026-10-29T10:02:00Z');
    // The whole conversation fits in the fresh page: a is gone.
    expect(withNewestPage([[b, a]], [c, b], 50)[0]?.map((m) => m.id)).toEqual(['c', 'b']);
    // b lies among the fresh rows and is not one of them: gone.
    expect(withNewestPage([[c, b, a]], [c, a], 2)[0]?.map((m) => m.id)).toEqual(['c', 'a']);
  });

  it('drops the cached rows of a copy that shares nothing with a full fresh page', () => {
    // Many messages since: the rows between the two are not here.
    const a = row('a', '2026-10-20T10:00:00Z');
    const c = row('c', '2026-10-29T10:02:00Z');
    const d = row('d', '2026-10-29T10:03:00Z');
    expect(withNewestPage([[a]], [d, c], 2)[0]?.map((m) => m.id)).toEqual(['d', 'c']);
  });

  it('takes a changed row (a reaction, a tick) from the fresh page', () => {
    const a = row('a', '2026-10-29T10:00:00Z', true, 'sent');
    const fresh = { ...a, status: 'delivered' };
    expect(withNewestPage([[a]], [fresh], 50)[0]?.[0]).toBe(fresh);
  });

  it('moves the ticks of older own messages forward, in every page', () => {
    const old = row('old', '2026-10-27T10:00:00Z', true, 'delivered');
    const mid = row('mid', '2026-10-29T09:00:00Z', true, 'sent');
    const theirs = row('t', '2026-10-29T09:30:00Z', false, null);
    const now = row('now', '2026-10-29T10:00:00Z', true, 'read');
    const pages = withNewestPage([[mid], [old]], [now, theirs, mid], 50);
    expect(pages[0]?.find((m) => m.id === 'mid')?.status).toBe('read');
    expect(pages[1]?.[0]?.status).toBe('read');
    expect(pages[0]?.find((m) => m.id === 't')?.status).toBeNull();
  });

  it('never moves a tick back', () => {
    const old = row('old', '2026-10-29T08:00:00Z', true, 'read');
    const a = row('a', '2026-10-29T09:00:00Z', true, 'read');
    const b = row('b', '2026-10-29T10:00:00Z', true, 'delivered');
    const pages = withNewestPage([[a], [old]], [b, { ...a }], 2);
    expect(pages[0]?.find((m) => m.id === 'a')?.status).toBe('read');
    expect(pages[1]?.[0]?.status).toBe('read');
  });
});

describe('withSamePage', () => {
  it('takes the fresh rows, the unchanged ones the cached objects', () => {
    const a = row('a', '2026-10-20T10:00:00Z');
    const b = row('b', '2026-10-20T10:01:00Z');
    const fresh = { ...b, reactions: [{ emoji: 'x', count: 1, mine: false }] };
    const page = withSamePage([b, a], [fresh, { ...a }]);
    expect(page[0]).toBe(fresh);
    expect(page[1]).toBe(a);
  });
});
