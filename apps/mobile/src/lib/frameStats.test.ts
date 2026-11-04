import { describe, expect, it } from 'vitest';

import { FRAME_MS, frameStats, percentile, STALL_MS, switchStats } from './frameStats';

describe('frame stats (capsule avatar list measurement, 4.3)', () => {
  it('counts the frames, the stalls and the worst gap', () => {
    const smooth = Array.from({ length: 60 }, () => FRAME_MS);
    expect(frameStats(smooth)).toEqual({ frames: 60, stalls: 0, worstMs: 17, fps: 60 });
    const janky = [...smooth.slice(0, 58), 50, 100];
    const stats = frameStats(janky);
    expect(stats.stalls).toBe(2);
    expect(stats.worstMs).toBe(100);
    expect(stats.fps).toBeLessThan(60);
  });

  it('a frame one and a half budgets long is a stall, one budget is not', () => {
    expect(frameStats([STALL_MS + 0.1]).stalls).toBe(1);
    expect(frameStats([FRAME_MS * 1.4]).stalls).toBe(0);
  });

  it('nothing measured is all zero', () => {
    expect(frameStats([])).toEqual({ frames: 0, stalls: 0, worstMs: 0, fps: 0 });
  });
});

describe('tab switch stats (B4, olcum-protokolu.md)', () => {
  it('a smooth switch at 120 Hz has no jank and its budget is the screen’s', () => {
    const s = switchStats(Array.from({ length: 120 }, () => 1000 / 120));
    expect(s.budgetMs).toBeCloseTo(8.3, 1);
    expect(s.jank).toBe(0);
    expect(s.missed).toBe(0);
    expect(s.p95Ms).toBeCloseTo(8.3, 1);
  });

  it('counts jank past one and a half budgets and the frames missed', () => {
    const gaps = [...Array.from({ length: 18 }, () => FRAME_MS), FRAME_MS * 2, FRAME_MS * 4];
    const s = switchStats(gaps);
    expect(s.jank).toBe(2);
    expect(s.jankRate).toBe(0.1);
    expect(s.missed).toBe(1 + 3);
    expect(s.worstMs).toBe(67);
    expect(s.p95Ms).toBeCloseTo(FRAME_MS * 2, 0);
  });

  it('percentile by nearest rank', () => {
    expect(percentile([5, 1, 3, 2, 4], 0.5)).toBe(3);
    expect(percentile([5, 1, 3, 2, 4], 0.95)).toBe(5);
    expect(percentile([], 0.95)).toBe(0);
  });

  it('nothing measured is all zero', () => {
    expect(switchStats([]).frames).toBe(0);
    expect(switchStats([]).jankRate).toBe(0);
  });
});
