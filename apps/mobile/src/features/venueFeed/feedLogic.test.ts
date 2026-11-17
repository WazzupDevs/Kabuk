import type { VenuePost } from '@shared/venueFeed.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  feedAge,
  feedLength,
  feedOver,
  mapPost,
  nextBefore,
  throttleCalls,
  withLike,
} from './feedLogic';

const NOW = Date.parse('2026-11-17T12:00:00Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const post = (over: Partial<VenuePost> = {}): VenuePost => ({
  id: 'p1',
  displayName: 'Elif',
  photoUrl: null,
  body: 'Merhaba',
  createdAt: ago(0),
  fromMe: false,
  likes: 2,
  liked: false,
  replies: 0,
  ...over,
});

describe('feedAge', () => {
  it('says now under a minute, and for a post from a moment ahead', () => {
    expect(feedAge(ago(30_000), NOW)).toEqual({ unit: 'now' });
    expect(feedAge(ago(-5_000), NOW)).toEqual({ unit: 'now' });
  });
  it('counts minutes, hours and days, rounding down', () => {
    expect(feedAge(ago(60_000), NOW)).toEqual({ unit: 'minutes', n: 1 });
    expect(feedAge(ago(59 * 60_000 + 59_000), NOW)).toEqual({ unit: 'minutes', n: 59 });
    expect(feedAge(ago(3_600_000), NOW)).toEqual({ unit: 'hours', n: 1 });
    expect(feedAge(ago(23 * 3_600_000 + 1), NOW)).toEqual({ unit: 'hours', n: 23 });
    expect(feedAge(ago(86_400_000), NOW)).toEqual({ unit: 'days', n: 1 });
  });
});

describe('the counter', () => {
  it('counts the trimmed text in code points', () => {
    expect(feedLength('  merhaba  ')).toBe(7);
    expect(feedLength('😀😀')).toBe(2);
  });
  it('is over only past 280', () => {
    expect(feedOver('a'.repeat(280))).toBe(false);
    expect(feedOver('a'.repeat(281))).toBe(true);
  });
});

describe('the optimistic like', () => {
  it('adds one and marks it, and takes it back', () => {
    const liked = withLike(post(), true);
    expect(liked).toMatchObject({ liked: true, likes: 3 });
    expect(withLike(liked, false)).toMatchObject({ liked: false, likes: 2 });
  });
  it('changes nothing when the state is already there', () => {
    const p = post({ liked: true });
    expect(withLike(p, true)).toBe(p);
  });
  it('never goes under zero', () => {
    expect(withLike(post({ liked: true, likes: 0 }), false).likes).toBe(0);
  });
  it('changes only the post asked for', () => {
    const a = post({ id: 'a' });
    const b = post({ id: 'b' });
    const out = mapPost([a, b], 'b', (p) => withLike(p, true));
    expect(out[0]).toBe(a);
    expect(out[1]).toMatchObject({ id: 'b', liked: true });
  });
});

describe('nextBefore', () => {
  it('is the oldest post of a full page, nothing for a short one', () => {
    const full = Array.from({ length: 30 }, (_, i) => post({ id: `p${i}`, createdAt: ago(i) }));
    expect(nextBefore(full)).toBe(full[29]?.createdAt);
    expect(nextBefore(full.slice(0, 29))).toBeUndefined();
  });
});

describe('throttleCalls', () => {
  afterEach(() => vi.useRealTimers());

  it('runs the first call at once and the calls meanwhile once at the end of the window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const fn = vi.fn();
    const t = throttleCalls(fn, 1000);
    t.call();
    expect(fn).toHaveBeenCalledTimes(1);
    t.call();
    t.call();
    t.call();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(2);
    // Quiet for a window: the next one is at once again.
    vi.advanceTimersByTime(1000);
    t.call();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('drops the call waiting on cancel', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const fn = vi.fn();
    const t = throttleCalls(fn, 1000);
    t.call();
    t.call();
    t.cancel();
    vi.advanceTimersByTime(2000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
