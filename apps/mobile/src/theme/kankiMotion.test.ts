import { describe, expect, it } from 'vitest';

import { KANKI_BEATS, KANKI_LOOP_S, kankiFrame, WELCOME_KANKI } from './kankiMotion';

const beat = (id: keyof typeof KANKI_BEATS) => {
  const b = KANKI_BEATS[id];
  if (!b) throw new Error(id);
  return b;
};

describe('kankiFrame (Aura v65 §13.1)', () => {
  it('breathes and sways with the report formulas', () => {
    const b = beat('7d5ef2');
    const t = 0.7;
    const s = Math.sin((2 * Math.PI * t) / 3 + 1.1);
    const f = kankiFrame(b, t);
    expect(f.scaleY).toBeCloseTo(1 + 0.022 * s, 10);
    expect(f.scaleX).toBeCloseTo(1 - 0.012 * s, 10);
    expect(f.rotate).toBeCloseTo(2.2 * Math.sin((2 * Math.PI * t) / 3 + 0.9 * 1.1), 10);
    expect(f.translateY).toBe(0);
    expect(f.shadow).toBe(1);
  });

  it('closes the eyes for 125 ms at each blink', () => {
    const b = beat('3c95b1');
    expect(kankiFrame(b, 1.6).closed).toBe(true);
    expect(kankiFrame(b, 1.72).closed).toBe(true);
    expect(kankiFrame(b, 1.73).closed).toBe(false);
    expect(kankiFrame(b, 5.05).closed).toBe(true);
    expect(kankiFrame(b, 3).closed).toBe(false);
  });

  it('hops 12 high in 600 ms, the shadow following, the sway at 0.3', () => {
    const b = beat('f280a5');
    // The top of the hop: u = 0.15 + 0.35.
    const top = kankiFrame(b, 3.4 + 0.5 * 0.6);
    expect(top.translateY).toBeCloseTo(-12, 10);
    expect(top.shadow).toBeCloseTo(1 - 12 / 30, 10);
    const t = 3.4 + 0.3;
    const sway = 2.2 * Math.sin((2 * Math.PI * t) / 3 + 0.9 * 0.6);
    expect(kankiFrame(b, t).rotate).toBeCloseTo(0.3 * sway, 10);
    // Squatting before it, landing after it.
    expect(kankiFrame(b, 3.4 + 0.045).scaleY).toBeLessThan(kankiFrame(beat('f280a5'), 3.4).scaleY);
    expect(kankiFrame(b, 4.0).translateY).toBe(0);
  });

  it('loops in 6 s and every Main buddy has its beat', () => {
    expect(KANKI_LOOP_S).toBe(6);
    for (const k of WELCOME_KANKI) expect(KANKI_BEATS[k.id]).toBeDefined();
    const b = beat('b83534');
    expect(kankiFrame(b, 0).scaleY).toBeCloseTo(kankiFrame(b, 6).scaleY, 10);
  });
});
