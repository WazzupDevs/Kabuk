import { describe, expect, it } from 'vitest';

import { MAIN, SMALL } from '../../../../scripts/icon/mark.ts';

import {
  capsules,
  drawingFor,
  type LoaderKind,
  loaderMotion,
  MARK_MAIN,
  MARK_SMALL,
  MARK_WINDOW,
  MISS_MS,
  missMotion,
  sampleCurve,
  squirclePath,
  stateMotion,
  STILL_MOTION,
} from './markMotion';

const KINDS: LoaderKind[] = ['seesaw', 'swap', 'meet', 'spin'];

describe('the mark', () => {
  // The in-app mark is the app icon's drawing, seen through the 340-unit window.
  it('is the app icon drawing', () => {
    for (const [m, icon] of [
      [MARK_MAIN, MAIN],
      [MARK_SMALL, SMALL],
    ] as const) {
      expect({ w: m.w, h: m.h, dx: m.dx, dy: m.dy }).toEqual({
        w: icon.w,
        h: icon.h,
        dx: icon.dx,
        dy: icon.dy,
      });
      const [a, b] = capsules(m);
      const origin = 256 - MARK_WINDOW / 2;
      expect([a.x + origin, a.y + origin]).toEqual([icon.x, icon.y]);
      expect([b.x - a.x, b.y - a.y]).toEqual([icon.dx, icon.dy]);
    }
  });

  it('overlaps by 35 % of a capsule (main drawing)', () => {
    const [a, b] = capsules(MARK_MAIN);
    expect((a.x + a.w - b.x) / a.w).toBeCloseTo(0.35, 2);
  });

  it('uses the small drawing at 48 px and below', () => {
    expect(drawingFor(48)).toBe(MARK_SMALL);
    expect(drawingFor(49)).toBe(MARK_MAIN);
  });

  it('fits the window', () => {
    for (const m of [MARK_MAIN, MARK_SMALL]) {
      for (const r of capsules(m)) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(MARK_WINDOW);
        expect(r.y + r.h).toBeLessThanOrEqual(MARK_WINDOW);
      }
    }
  });
});

describe('loaders', () => {
  // hareket.md: Tahterevalli 1.4 s, Kesişme 1.6 s, Buluş 1.5 s, Dönüş 1.8 s.
  it('loop in the design system’s periods', () => {
    expect(KINDS.map((k) => loaderMotion(k, MARK_MAIN).period)).toEqual([1400, 1600, 1500, 1800]);
  });

  it.each(KINDS)('%s starts and ends at rest, so the loop has no jump', (kind) => {
    const { period, channels } = loaderMotion(kind, MARK_MAIN);
    for (const [name, curve] of Object.entries(channels)) {
      const start = curve(0);
      const end = curve(period);
      if (name === 'rot') {
        expect(start % 360).toBeCloseTo(0, 3);
        expect(end % 360).toBeCloseTo(0, 3);
      } else {
        // Buluş's spring is still settling: a tenth of a unit, a hundredth of a pixel at 24 px.
        expect(Math.abs(start)).toBeLessThan(0.2);
        expect(Math.abs(end)).toBeLessThan(0.2);
      }
    }
  });

  it.each(KINDS)('%s keeps the pair centred', (kind) => {
    const { period, channels } = loaderMotion(kind, MARK_MAIN);
    for (let t = 0; t < period; t += 50) {
      expect((channels.aX?.(t) ?? 0) + (channels.bX?.(t) ?? 0)).toBeCloseTo(0, 6);
      expect((channels.aY?.(t) ?? 0) + (channels.bY?.(t) ?? 0)).toBeCloseTo(0, 6);
    }
  });

  it('Tahterevalli tips the capsules to the mirror position halfway', () => {
    const { period, channels } = loaderMotion('seesaw', MARK_MAIN);
    // dy goes from 60 to −60: each capsule moves 60 units.
    expect(channels.bY?.(period / 2)).toBeCloseTo(-MARK_MAIN.dy, 3);
  });

  it('Buluş parts the capsules until they no longer touch', () => {
    const { channels } = loaderMotion('meet', MARK_MAIN);
    const gap = (channels.bX?.(600) ?? 0) - (channels.aX?.(600) ?? 0) + MARK_MAIN.dx - MARK_MAIN.w;
    expect(gap).toBe(26);
  });

  it('with reduce motion only the opacity changes', () => {
    expect(Object.keys(STILL_MOTION.channels)).toEqual(['opacity']);
    const values = [0, 300, 600, 900].map((t) => STILL_MOTION.channels.opacity?.(t) ?? 0);
    expect(Math.max(...values)).toBeCloseTo(1, 3);
    expect(Math.min(...values)).toBeCloseTo(0.45, 3);
  });
});

describe('states', () => {
  it('with reduce motion nothing moves or scales', () => {
    for (const kind of ['empty', 'error', 'offline'] as const) {
      const { motions, flare } = stateMotion(kind, MARK_MAIN, true);
      expect(flare).toBe(false);
      for (const { period, channels } of motions) {
        for (let t = 0; t < period; t += 20) {
          for (const c of ['aX', 'aY', 'bX', 'bY', 'rot'] as const) {
            expect(channels[c]?.(t) ?? 0).toBeCloseTo(0, 6);
          }
          expect(channels.bScale?.(t) ?? 1).toBe(1);
        }
      }
    }
  });

  it('error: the capsules collide but never overlap', () => {
    const { scene, motions } = stateMotion('error', MARK_MAIN, false);
    const [m] = motions;
    for (let t = 0; t < (m?.period ?? 0); t += 5) {
      const ax = m?.channels.aX?.(t) ?? 0;
      const bx = m?.channels.bX?.(t) ?? 0;
      // B's left edge never enters A.
      expect(scene.dx + bx - ax).toBeGreaterThanOrEqual(MARK_MAIN.w - 1e-6);
    }
  });
});

describe('miss (a request that did not meet)', () => {
  it('collides, never overlaps, and fades out by its end', () => {
    const { scene, motion } = missMotion(MARK_SMALL, false);
    let touched = false;
    for (let t = 0; t <= MISS_MS; t += 5) {
      const gap = scene.dx + (motion.channels.bX?.(t) ?? 0) - (motion.channels.aX?.(t) ?? 0);
      // B's left edge never enters A.
      expect(gap).toBeGreaterThanOrEqual(MARK_SMALL.w - 1e-6);
      if (gap - MARK_SMALL.w < 1) touched = true;
    }
    expect(touched).toBe(true);
    expect(motion.channels.opacity?.(0)).toBe(0);
    expect(motion.channels.opacity?.(MISS_MS)).toBeCloseTo(0, 6);
    expect(motion.channels.opacity?.(600)).toBe(1);
  });

  it('with reduce motion only fades', () => {
    const { motion } = missMotion(MARK_SMALL, true);
    for (let t = 0; t <= MISS_MS; t += 20) {
      expect(motion.channels.aX?.(t) ?? 0).toBeCloseTo(0, 6);
      expect(motion.channels.bX?.(t) ?? 0).toBeCloseTo(0, 6);
    }
  });
});

describe('sampleCurve', () => {
  it('covers the whole period, ascending', () => {
    const { inputRange, outputRange } = sampleCurve(1000, (t) => t, 100);
    expect(inputRange[0]).toBe(0);
    expect(inputRange.at(-1)).toBe(1);
    expect(inputRange).toEqual([...inputRange].sort((a, b) => a - b));
    expect(outputRange.at(-1)).toBe(1000);
  });
});

describe('squirclePath', () => {
  // The design system's tile (Mekan tab): a superellipse, exponent 5, filling its square.
  it('touches the edges and rounds the corners', () => {
    const points = squirclePath(512)
      .replace(/Z$/, '')
      .split(/[ML]/)
      .filter(Boolean)
      .map((p) => p.split(' ').map(Number) as [number, number]);
    const xs = points.map(([x]) => x);
    expect(Math.min(...xs)).toBeCloseTo(0, 1);
    expect(Math.max(...xs)).toBeCloseTo(512, 1);
    for (const [x, y] of points) {
      const u = Math.abs(x - 256) / 256;
      const v = Math.abs(y - 256) / 256;
      expect(u ** 5 + v ** 5).toBeCloseTo(1, 2);
    }
  });
});
