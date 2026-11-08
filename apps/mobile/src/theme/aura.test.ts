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
  semteGit: {
    gecitOpen: {
      totalMs: number;
      leaf: {
        hingeX: number;
        rotateYDeg: number[];
        perspective: number;
        ms: number[];
        curve: string;
      };
      light: { opacity: number[]; scale: number[]; origin: number[]; ms: number[]; curve: string };
      buddies: { startMs: number[]; spring: string; fromScale: number; fadeMs: number };
    };
    gecitClosed: {
      lock: { pivot: number[]; rotateDeg: number; periodMs: number };
      drops: { count: number; fallPx: number; ms: number; staggerMs: number };
    };
    typingDots: { count: number; opacity: number[]; periodMs: number; staggerMs: number };
    waitSpinner: { msPerTurn: number };
    continueBar: { durationS: number };
  };
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

  it("has Semte Git's motions of hareket.json", () => {
    const sg = spec.semteGit;
    const own = MOTION.semteGit;
    const open = own.gecitOpen;
    expect(open.totalMs).toBe(sg.gecitOpen.totalMs);
    expect({
      hingeX: open.leaf.hingeX,
      rotateYDeg: open.leaf.rotateYDeg,
      perspective: open.leaf.perspective,
      ms: open.leaf.ms,
    }).toEqual({
      hingeX: sg.gecitOpen.leaf.hingeX,
      rotateYDeg: sg.gecitOpen.leaf.rotateYDeg,
      perspective: sg.gecitOpen.leaf.perspective,
      ms: sg.gecitOpen.leaf.ms,
    });
    expect(open.light).toEqual({
      opacity: sg.gecitOpen.light.opacity,
      scale: sg.gecitOpen.light.scale,
      origin: sg.gecitOpen.light.origin,
      ms: sg.gecitOpen.light.ms,
    });
    expect(open.buddies).toEqual({
      startMs: sg.gecitOpen.buddies.startMs,
      fromScale: sg.gecitOpen.buddies.fromScale,
      fadeMs: sg.gecitOpen.buddies.fadeMs,
    });
    expect(sg.gecitOpen.leaf.curve).toBe('arrive');
    expect(sg.gecitOpen.light.curve).toBe('arrive');
    expect(sg.gecitOpen.buddies.spring).toBe('pop');
    const closed = sg.gecitClosed;
    expect(own.gecitClosed.lock).toEqual({
      pivot: closed.lock.pivot,
      rotateDeg: closed.lock.rotateDeg,
      periodMs: closed.lock.periodMs,
    });
    expect(own.gecitClosed.drops).toEqual({
      count: closed.drops.count,
      fallPx: closed.drops.fallPx,
      ms: closed.drops.ms,
      staggerMs: closed.drops.staggerMs,
    });
    expect(own.typingDots).toEqual({
      count: sg.typingDots.count,
      opacity: sg.typingDots.opacity,
      periodMs: sg.typingDots.periodMs,
      staggerMs: sg.typingDots.staggerMs,
    });
    expect(own.waitSpinner.msPerTurn).toBe(sg.waitSpinner.msPerTurn);
    expect(own.continueBar.durationS).toBe(sg.continueBar.durationS);
  });
});
