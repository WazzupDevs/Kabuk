import { describe, expect, it } from 'vitest';

import { keyframeCurve } from './keyframeCurve';
import { cubicBezier, sampleCurve } from './markMotion';
import { V46_EXPLORE_MOTION } from './parts.generated';

const m = V46_EXPLORE_MOTION;

describe('keyframeCurve', () => {
  it("runs a round as long as the channel's steps, from its first keyframe to its last", () => {
    const rise = keyframeCurve(m.steam, 'translateY');
    expect(rise?.period).toBe(2400);
    expect(rise?.at(0)).toBe(8);
    expect(rise?.at(2400)).toBe(-16);
    const fade = keyframeCurve(m.steam, 'opacity');
    expect(fade?.period).toBe(2400);
    expect(fade?.at(960)).toBeCloseTo(0.8, 6);
    expect(fade?.at(2400)).toBe(0);
  });

  it("eases every step with the animation's timing function, as CSS does", () => {
    const fade = keyframeCurve(m.steam, 'opacity');
    const ease = cubicBezier(...m.steam.ease);
    expect(fade?.at(240)).toBeCloseTo(0.8 * ease(0.25), 6);
    expect(fade?.at(960 + 360)).toBeCloseTo(0.8 + (0 - 0.8) * ease(0.25), 6);
  });

  it("scales lengths, not scales or opacities (keyframes in a drawing's units)", () => {
    expect(keyframeCurve(m.steam, 'translateY', 2)?.at(0)).toBe(16);
    expect(keyframeCurve(m.livePulse, 'scale', 2)?.at(800)).toBeCloseTo(1.25, 6);
  });

  it('meets itself where a round ends, so the loop has no seam', () => {
    for (const [motion, channel] of [
      [m.livePulse, 'scale'],
      [m.liveHalo, 'scale'],
      [m.liveHalo, 'opacity'],
      [m.liveFade, 'opacity'],
    ] as const) {
      const curve = keyframeCurve(motion, channel);
      expect(curve?.at(curve.period)).toBeCloseTo(curve?.at(0) ?? NaN, 6);
    }
  });

  it('has nothing for a channel the animation does not move', () => {
    expect(keyframeCurve(m.livePulse, 'opacity')).toBeUndefined();
  });

  it('samples into an interpolation that starts and ends on the keyframes', () => {
    const curve = keyframeCurve(m.livePulse, 'scale');
    if (!curve) throw new Error('no curve');
    const { inputRange, outputRange } = sampleCurve(curve.period, curve.at);
    expect(inputRange[0]).toBe(0);
    expect(inputRange.at(-1)).toBe(1);
    expect(outputRange[0]).toBe(0.8);
    expect(Math.max(...outputRange)).toBe(1.25);
    expect(outputRange.at(-1)).toBe(0.8);
  });
});
