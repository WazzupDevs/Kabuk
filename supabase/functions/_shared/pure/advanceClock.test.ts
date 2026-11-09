import { describe, expect, it } from 'vitest';

import {
  ADVANCE_AGAIN_MS,
  ADVANCE_AGAIN_SPREAD_MS,
  ADVANCE_SPREAD_MS,
  firstAdvanceDelay,
  nextAdvanceDelay,
} from './advanceClock.ts';

describe('advance clock', () => {
  const now = Date.parse('2026-11-09T12:00:00Z');

  it('waits for the end of the phase, then a spread under a second', () => {
    expect(firstAdvanceDelay('2026-11-09T12:00:05Z', now, 0)).toBe(5000);
    expect(firstAdvanceDelay('2026-11-09T12:00:05Z', now, 0.999)).toBeLessThan(
      5000 + ADVANCE_SPREAD_MS,
    );
    expect(ADVANCE_SPREAD_MS).toBeLessThanOrEqual(1000);
  });

  it('asks at once, with the spread, for a time already up', () => {
    expect(firstAdvanceDelay('2026-11-09T11:59:00Z', now, 0)).toBe(0);
    expect(firstAdvanceDelay('2026-11-09T11:59:00Z', now, 0.5)).toBe(ADVANCE_SPREAD_MS / 2);
  });

  it('spreads the asks again', () => {
    expect(nextAdvanceDelay(0)).toBe(ADVANCE_AGAIN_MS);
    expect(nextAdvanceDelay(0.999)).toBeLessThan(ADVANCE_AGAIN_MS + ADVANCE_AGAIN_SPREAD_MS);
  });
});
