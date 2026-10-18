import { describe, expect, it } from 'vitest';

import {
  CONFETTI,
  confettiPieces,
  COUNT_IN,
  COUNT_IN_MS,
  countInStep,
  EASE_BACK,
  EASE_FALL,
  isLow,
  LOW_SECONDS,
  RING,
  RING_CIRCUMFERENCE,
  RING_HALVES,
  ringHalves,
  timeShare,
  TOAST,
} from './gameMotion';

describe('3-2-1 (v43: .tg-cd)', () => {
  it('shows "3", "2", "1" and "Başla" 650 ms apart, then is done 250 ms after "Başla"', () => {
    expect(COUNT_IN_MS).toBe(2850);
    expect([0, 649, 650, 1300, 1949, 1950, 2849].map(countInStep)).toEqual([0, 0, 1, 2, 2, 3, 3]);
    expect(countInStep(2850)).toBeNull();
    expect(countInStep(10_000)).toBeNull();
  });

  it('a step pops from 40 % over 700 ms and overshoots before it settles', () => {
    expect(COUNT_IN).toMatchObject({ popMs: 700, popFrom: 0.4 });
    expect(EASE_BACK(0)).toBeCloseTo(0);
    expect(EASE_BACK(1)).toBeCloseTo(1);
    expect(Math.max(...[0.5, 0.6, 0.7, 0.8].map(EASE_BACK))).toBeGreaterThan(1);
  });
});

describe('timer bar and ring (v43: .tg-timer, .bx-ring)', () => {
  it('turn orange in the last five seconds, not at zero', () => {
    expect(LOW_SECONDS).toBe(5);
    expect([0, 1, 5, 6, 60].map(isLow)).toEqual([false, true, true, false, false]);
  });

  it('run a second ahead and are empty when the time is up', () => {
    expect(timeShare(60, 60)).toBeCloseTo(59 / 60);
    expect(timeShare(1, 60)).toBe(0);
    expect(timeShare(0, 60)).toBe(0);
    expect(timeShare(70, 60)).toBe(1);
    expect(timeShare(5, 0)).toBe(0);
  });

  it("the ring is v43's: radius 53 and stroke 6 in a 120 box, the face 13 % in", () => {
    expect(RING).toEqual({ box: 120, radius: 53, stroke: 6, faceInset: 0.13 });
    expect(RING_CIRCUMFERENCE).toBeCloseTo(333, 0);
    expect(RING.radius + RING.stroke / 2).toBeLessThanOrEqual(RING.box / 2);
  });

  it('turns the two half arcs so they show the time left from 12 o’clock, clockwise', () => {
    // The right half fills first, the left half after half the time.
    for (const s of [0, 0.1, 0.25, 0.5, 0.6, 0.9, 1]) {
      const { right, left } = ringHalves(s);
      expect(right + left).toBeCloseTo(s * 360);
      expect(right).toBeLessThanOrEqual(180);
      expect(left).toBe(s <= 0.5 ? 0 : (s - 0.5) * 360);
    }
    // The component's interpolation table is the same function, linear between its points.
    RING_HALVES.at.forEach((s, i) => {
      expect(ringHalves(s)).toEqual({ right: RING_HALVES.right[i], left: RING_HALVES.left[i] });
    });
    expect(ringHalves(-1)).toEqual({ right: 0, left: 0 });
    expect(ringHalves(2)).toEqual({ right: 180, left: 180 });
  });
});

describe('toast (v43: .tg-flash)', () => {
  it('pops in over 400 ms and is gone after 1.6 s', () => {
    expect(TOAST).toEqual({ showMs: 1600, inMs: 400, fromScale: 0.85, fromY: -10 });
  });
});

describe('confetti (v43: conf())', () => {
  const pieces = confettiPieces(7);

  it('26 pieces in the four colours, in turn', () => {
    expect(pieces).toHaveLength(CONFETTI.count);
    expect(pieces.map((p) => p.color).slice(0, 8)).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
  });

  it("stay within v43's ranges", () => {
    for (const p of pieces) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThan(1);
      expect(p.delayMs).toBeGreaterThanOrEqual(0);
      expect(p.delayMs).toBeLessThanOrEqual(CONFETTI.maxDelayMs);
      expect(Math.abs(p.dx)).toBeLessThanOrEqual(CONFETTI.driftPx);
      expect(Math.abs(p.turnDeg)).toBeLessThanOrEqual(CONFETTI.turnDeg);
    }
  });

  it('are the same for the same seed and differ for another', () => {
    expect(confettiPieces(7)).toEqual(pieces);
    expect(confettiPieces(8)).not.toEqual(pieces);
  });

  it('fall on an ease out that ends where it should', () => {
    expect(CONFETTI.fallMs).toBe(2600);
    expect(EASE_FALL(0)).toBeCloseTo(0);
    expect(EASE_FALL(1)).toBeCloseTo(1);
    expect(EASE_FALL(0.5)).toBeGreaterThan(0.5);
  });
});
