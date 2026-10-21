import { describe, expect, it } from 'vitest';

import { MARK_SMALL, MARK_SMALL_MAX } from './markMotion';
import { V46_PULL as p } from './parts.generated';
import { pullEase, pullIndicator, pullMark, pullOffset } from './pullRefresh';

describe('pull to refresh', () => {
  it('locks into the mark the loaders draw at its size, so the turning mark takes over unchanged', () => {
    expect(p.size).toBeLessThanOrEqual(MARK_SMALL_MAX);
    expect(p.capsule).toEqual(MARK_SMALL);
    expect(pullMark(p.lockAt, p)).toEqual({ dx: MARK_SMALL.dx, dy: MARK_SMALL.dy, scale: 1 });
    expect(pullMark(p.lockAt * 2, p)).toEqual(pullMark(p.lockAt, p));
  });

  it('starts with the capsules apart and small', () => {
    expect(pullMark(0, p)).toEqual({ dx: p.capsule.w + p.gap, dy: 0, scale: p.scaleFrom });
  });

  it("brings them together on v46's cubic in and out", () => {
    expect(pullEase(0)).toBe(0);
    expect(pullEase(0.5)).toBe(0.5);
    expect(pullEase(1)).toBe(1);
    expect(pullEase(0.25)).toBeCloseTo(4 * 0.25 ** 3, 9);
    const half = pullMark(p.lockAt / 2, p);
    expect(half.dy).toBeCloseTo(p.capsule.dy / 2, 9);
  });

  it('lets the list follow the finger to the lock, then by a share', () => {
    expect(pullOffset(-10, p)).toBe(0);
    expect(pullOffset(40, p)).toBe(40);
    expect(pullOffset(p.lockAt, p)).toBe(p.lockAt);
    expect(pullOffset(p.lockAt + 100, p)).toBeCloseTo(p.lockAt + 100 * p.stretch, 9);
  });

  it('fades the indicator in and lifts it with half the pull', () => {
    expect(pullIndicator(0, p)).toEqual({ opacity: 0, y: -p.lift });
    expect(pullIndicator(p.fadeOver / 2, p).opacity).toBe(0.5);
    expect(pullIndicator(p.lockAt, p)).toEqual({ opacity: 1, y: p.lockAt / 2 - p.lift });
    // While it refreshes the mark sits inside the gap the list leaves above it.
    const rest = pullIndicator(p.restAt, p);
    expect(rest.y).toBeGreaterThanOrEqual(0);
    expect(rest.y + p.size).toBeLessThanOrEqual(p.restAt);
  });
});
