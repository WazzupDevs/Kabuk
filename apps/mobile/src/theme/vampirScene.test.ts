import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { lampAt, paint, SCENE_ART, SCENE_PHASES } from './vampirScene';

const DIR = resolve(import.meta.dirname, '../../assets/vampir/scene');

describe('Vampir Köylü capsule table', () => {
  it('draws its pictures from the SVG text as it is now (else: node --experimental-strip-types scripts/art/vampirScene.ts)', () => {
    const manifest = JSON.parse(readFileSync(resolve(DIR, 'manifest.json'), 'utf8')) as Record<
      string,
      string
    >;
    const art = SCENE_ART();
    expect(Object.keys(manifest).sort()).toEqual(Object.keys(art).sort());
    for (const [name, svg] of Object.entries(art)) {
      expect(createHash('sha256').update(svg).digest('hex'), name).toBe(manifest[name]);
      expect(existsSync(resolve(DIR, `${name}.webp`)), name).toBe(true);
    }
    for (const phase of SCENE_PHASES) {
      expect(existsSync(resolve(DIR, `room-${phase}.webp`)), phase).toBe(true);
    }
  });

  it('lays the phase colour over a colour as multiply, and the day light as screen', () => {
    // White under the night's colour is the colour itself; black stays black.
    expect(paint('night', '#FFFFFF')).toBe('#6c76c8');
    expect(paint('night', '#000000')).toBe('#000000');
    expect(paint('end', '#FFFFFF')).toBe('#c8606e');
    // The day: no colour, its light (rgba(255, 248, 228, .12)) lifts black a little.
    expect(paint('day', '#000000')).toBe('#1f1e1b');
    expect(paint('day', '#FFFFFF')).toBe('#ffffff');
    // A see-through colour keeps its alpha.
    expect(paint('night', 'rgba(255, 255, 255, 0.5)')).toBe('rgba(108, 118, 200, 0.5)');
  });

  it("fades the lamp's light out at its edge", () => {
    expect(lampAt('night', 0)).toBeCloseTo(0.145, 5);
    expect(lampAt('night', 230)).toBe(0);
    expect(lampAt('day', 100)).toBeLessThan(lampAt('night', 100));
  });
});
