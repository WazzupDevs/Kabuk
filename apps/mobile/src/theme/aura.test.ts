import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MOTION } from './aura';

// The app plays the motion standard the film plays (docs/design/aura/project/hareket.json).
const spec = JSON.parse(
  readFileSync(join(__dirname, '../../../../docs/design/aura/project/hareket.json'), 'utf8'),
) as {
  springs: Record<string, { stiffness: number; damping: number; mass: number }>;
  curves: Record<string, number[]>;
  dissolve: { blurPx: number; risePx: number; fromScale: number; inMs: number; outMs: number };
  stagger: { listRowMs: number; screenPartMs: number };
  cardOpen: { contentAfterMs: number };
};

describe('motion standard', () => {
  it('has the springs of hareket.json', () => {
    for (const [name, s] of Object.entries(spec.springs)) {
      const own = MOTION.springs[name as keyof typeof MOTION.springs];
      expect(own, name).toBeDefined();
      expect({ stiffness: own.stiffness, damping: own.damping, mass: own.mass }, name).toEqual({
        stiffness: s.stiffness,
        damping: s.damping,
        mass: s.mass,
      });
    }
  });

  it('has the curves, the dissolve and the stagger of hareket.json', () => {
    expect(MOTION.curves).toEqual(spec.curves);
    expect(MOTION.dissolve).toEqual({
      blur: spec.dissolve.blurPx,
      rise: spec.dissolve.risePx,
      fromScale: spec.dissolve.fromScale,
      inMs: spec.dissolve.inMs,
      outMs: spec.dissolve.outMs,
    });
    expect(MOTION.stagger.row).toBe(spec.stagger.listRowMs);
    expect(MOTION.stagger.part).toBe(spec.stagger.screenPartMs);
    expect(MOTION.cardOpen.contentAfterMs).toBe(spec.cardOpen.contentAfterMs);
  });
});
