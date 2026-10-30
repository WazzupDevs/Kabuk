import { describe, expect, it } from 'vitest';

import { svgGradient } from './svgGradient';
import { BUTTON_GLASS, GLASS_FACE } from './glass';

describe('svgGradient', () => {
  it('reads the tab bar glass gradient: 135deg runs from the top left to the bottom right', () => {
    const g = svgGradient(GLASS_FACE.light.gradient);
    expect(g).not.toBeNull();
    expect(g?.x1).toBeCloseTo(0.5 - Math.SQRT1_2 / 2, 6);
    expect(g?.y1).toBeCloseTo(0.5 - Math.SQRT1_2 / 2, 6);
    expect(g?.x2).toBeCloseTo(0.5 + Math.SQRT1_2 / 2, 6);
    expect(g?.y2).toBeCloseTo(0.5 + Math.SQRT1_2 / 2, 6);
    expect(g?.stops.map((s) => s.offset)).toEqual([0, 1]);
    expect(g?.stops[0]?.color).toBe('rgba(255, 255, 255, 0.62)');
  });

  it('keeps a stop at its own place and runs 180deg down', () => {
    const g = svgGradient(BUTTON_GLASS.gloss.light);
    expect(g?.stops.map((s) => s.offset)).toEqual([0, 0.58]);
    expect([g?.x1, g?.y1, g?.x2, g?.y2].map((v) => Number(v?.toFixed(6)))).toEqual([
      0.5, 0, 0.5, 1,
    ]);
  });

  it('reads hex colours and spreads stops without a place evenly', () => {
    const g = svgGradient('linear-gradient(90deg, #5A3AE6, #FF4F8B)');
    expect(g?.stops).toEqual([
      { color: '#5A3AE6', offset: 0 },
      { color: '#FF4F8B', offset: 1 },
    ]);
    expect(g?.x1).toBeCloseTo(0, 6);
    expect(g?.x2).toBeCloseTo(1, 6);
  });

  it('gives nothing for what it cannot read', () => {
    expect(svgGradient('radial-gradient(red, blue)')).toBeNull();
    expect(svgGradient('linear-gradient(90deg, red)')).toBeNull();
  });
});
