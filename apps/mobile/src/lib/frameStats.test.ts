import { describe, expect, it } from 'vitest';

import { FRAME_MS, frameStats, STALL_MS } from './frameStats';

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
