import { describe, expect, it } from 'vitest';

import { type Dated, mergeOlder, olderBefore } from './olderPages';

const m = (n: number): Dated => ({
  id: `m${n}`,
  at: `2026-11-04T10:${String(n).padStart(2, '0')}:00Z`,
});
const run = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => m(from + i));
const id = (d: Dated) => d;

describe('mergeOlder', () => {
  it('draws the older pages before the newest, each message once', () => {
    const { rows, gap } = mergeOlder(run(5, 9), run(1, 5), m(6).at, id, 5);
    expect(rows.map((r) => r.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9']);
    expect(gap).toBe(false);
  });

  it('is the newest page alone before anything older is read', () => {
    expect(mergeOlder(run(1, 3), [], null, id, 5)).toEqual({ rows: run(1, 3), gap: false });
  });

  it('sees a gap when a full newest page no longer reaches the older ones', () => {
    // Older 1–5 read before 6 (the newest page was 6–10); then 11–12 came: 8–12 starts after 6.
    const gapped = mergeOlder(run(8, 12), run(1, 5), m(6).at, id, 5);
    expect(gapped.gap).toBe(true);
    expect(gapped.rows).toEqual(run(8, 12));
    // Still reaching back to 6 is no gap, though 5 and 6 share no message.
    expect(mergeOlder(run(6, 10), run(1, 5), m(6).at, id, 5).gap).toBe(false);
    // A newest page short of the page size is the whole chat since: no gap.
    expect(mergeOlder(run(8, 9), run(1, 5), m(6).at, id, 5).gap).toBe(false);
  });
});

describe('olderBefore', () => {
  it('reads before the oldest message the screen has', () => {
    expect(olderBefore(run(6, 10), [], id, 5, false)).toBe(m(6).at);
    expect(olderBefore(run(6, 10), run(1, 5), id, 5, false)).toBe(m(1).at);
  });

  it('reads nothing when the first message is in', () => {
    // A newest page short of the page size is the whole chat.
    expect(olderBefore(run(1, 3), [], id, 5, false)).toBeNull();
    // An older page came back short.
    expect(olderBefore(run(6, 10), run(4, 5), id, 5, true)).toBeNull();
    expect(olderBefore([], [], id, 5, false)).toBeNull();
  });
});
