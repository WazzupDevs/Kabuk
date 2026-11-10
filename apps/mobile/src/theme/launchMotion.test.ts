import { describe, expect, it } from 'vitest';

import { MAIN, reach, SPLASH, SPLASH_REACH } from '../../../../scripts/icon/mark.ts';

import { LAUNCH_ART, LAUNCH_TEXTURE_BOX, type TextureBox } from './launchTextures';
import {
  APP_AT_REST,
  appTransform,
  bezier,
  flareCircle,
  glintPath,
  LAUNCH_BAND,
  launchFrame,
  launchKindFrom,
  launchRecord,
  launchGeometry,
  type LaunchKind,
  type LaunchScene,
  launchTimeline,
  launchWaiting,
  markReach,
  parsePath,
  type Rect,
  RISO_BOIL_MS,
  RISO_BOIL_OFFSET,
  RISO_IN_MS,
  RISO_MISREGISTER,
  risoIn,
  risoVariant,
  shiftedPath,
  SPLASH_REACH_DP,
} from './launchMotion';
import { MARK_MAIN } from './markMotion';
import { SKA_LETTERS } from './wordmark';

const KINDS: LaunchKind[] = ['cold', 'first', 'quick'];
// A 320 dp phone; the geometry only moves with the centre.
const W = 320;
const H = 640;
const g = launchGeometry(W / 2, H / 2);

function frames(kind: LaunchKind, reduce: boolean, wait = 0, step = 4): [number, LaunchScene][] {
  const T = launchTimeline(kind, reduce, wait);
  const out: [number, LaunchScene][] = [];
  for (let t = T.N; t <= T.R1; t += step) out.push([t, launchFrame(kind, reduce, g, t, wait)]);
  return out;
}

const TOGETHER = { a: [0, 0], b: [0, 0], cross: [0, 0], letters: [0, 0] };

describe('the first frame is the system splash', () => {
  it('uses the same drawing and reach as the app icon', () => {
    expect(SPLASH_REACH_DP).toBe(SPLASH_REACH);
    expect(markReach(MARK_MAIN)).toBeCloseTo(reach(MAIN), 6);
  });

  // mark.test.ts: on the 288 dp canvas the mark sits at (113.81, 75.39), 137 dp tall.
  it.each([false, true])('at the splash position (reduce motion %s)', (reduce) => {
    for (const kind of KINDS) {
      const T = launchTimeline(kind, reduce, 0);
      const s = launchFrame(kind, reduce, g, T.N, 0);
      const left = g.cx - SPLASH / 2;
      const top = g.cy - SPLASH / 2;
      expect(s.a[0] - left).toBeCloseTo(113.81, 1);
      expect(s.a[1] - top).toBeCloseTo(75.39, 1);
      expect(s.b[1] + s.b[3] - s.a[1]).toBeCloseTo(137.2, 1);
      expect(s.marks).toBe(1);
      expect(s.curtain).toBe(1);
      expect(s.apart).toEqual(TOGETHER);
      expect(s.glow).toBeCloseTo(0, 6);
      // The letters wait behind the first l.
      expect(s.letters).toEqual([g.letterStart, g.letterStart, g.letterStart]);
    }
  });
});

describe('durations (hareket.md)', () => {
  it('cold 1.45 s, first 2.45 s, quick 0.66 s after the system screen', () => {
    const after = (kind: LaunchKind) => {
      const T = launchTimeline(kind, false, 0);
      return T.R1 - T.N;
    };
    expect([after('cold'), after('first'), after('quick')]).toEqual([1450, 2450, 660]);
  });

  it('reduced: two fades of 260 and 250 ms, a 250 ms fade for quick', () => {
    const cold = launchTimeline('cold', true, 0);
    expect([cold.F1 - cold.F0, cold.R1 - cold.R0]).toEqual([260, 250]);
    const quick = launchTimeline('quick', true, 0);
    expect(quick.R1 - quick.R0).toBe(250);
  });
});

describe('motion', () => {
  it.each(KINDS)('%s never jumps', (kind) => {
    const list = frames(kind, false);
    for (let i = 1; i < list.length; i++) {
      const [, prev] = list[i - 1] as [number, LaunchScene];
      const [t, next] = list[i] as [number, LaunchScene];
      for (const key of ['a', 'b'] as const) {
        for (let j = 0; j < 4; j++) {
          const d = Math.abs((next[key][j] ?? 0) - (prev[key][j] ?? 0));
          if (d >= 12) throw new Error(`${kind} ${key}[${j}] jumps ${d} dp at ${t} ms`);
        }
      }
      const letterJump = Math.max(
        ...next.letters.map((v, j) => Math.abs(v - (prev.letters[j] ?? 0))),
      );
      expect(letterJump * g.wordScale).toBeLessThan(12);
    }
  });

  it.each(KINDS)('%s: the print parts as the curtain fades (§14.2.1)', (kind) => {
    const T = launchTimeline(kind, false, 0);
    const at = (u: number) => launchFrame(kind, false, g, T.R0 + u * (T.R1 - T.R0), 0);
    const start = at(0);
    expect(start.apart).toEqual(TOGETHER);
    expect(start.curtain).toBe(1);
    expect(start.appScale).toBeCloseTo(1.06, 6);
    expect(launchFrame(kind, false, g, T.R0 - 1, 0).appScale).toBeCloseTo(1.06, 6);
    const mid = at(0.5);
    const p = Math.pow(0.5, 1.6);
    expect(mid.apart.a[0]).toBeCloseTo(-60 * p, 6);
    expect(mid.apart.a[1]).toBeCloseTo(-30 * p, 6);
    expect(mid.apart.b[0]).toBeCloseTo(60 * p, 6);
    expect(mid.apart.b[1]).toBeCloseTo(30 * p, 6);
    expect(mid.apart.cross).toEqual([0, -20 * p]);
    expect(mid.apart.letters).toEqual([0, -40 * p]);
    expect(mid.curtain).toBeCloseTo(1 - bezier(0.65, 0, 0.35, 1, (0.5 - 0.2) / 0.8), 6);
    expect(mid.appScale).toBeCloseTo(1 + 0.06 * (1 - bezier(0.2, 0.8, 0.2, 1, 0.5)), 6);
    // The curtain holds until a fifth of the way.
    expect(at(0.2).curtain).toBe(1);
    const last = at(1);
    expect(last.done).toBe(true);
    expect(last.curtain).toBe(0);
    expect(last.appScale).toBeCloseTo(1, 6);
    expect(last.apart).toEqual({ a: [-60, -30], b: [60, 30], cross: [0, -20], letters: [0, -40] });
  });

  it.each(['cold', 'first'] as const)(
    '%s: the wordmark stays where it is at R0 and does not grow',
    (kind) => {
      const T = launchTimeline(kind, false, 0);
      const r0 = launchFrame(kind, false, g, T.R0, 0);
      for (let t = T.R0; t <= T.R1; t += 20) {
        const s = launchFrame(kind, false, g, t, 0);
        expect(s.a).toEqual(r0.a);
        expect(s.b).toEqual(r0.b);
        expect(s.letters).toEqual(r0.letters);
        expect(s.lettersClip).toBe(r0.lettersClip);
      }
    },
  );

  it('cold and first end as the wordmark ll', () => {
    for (const kind of ['cold', 'first'] as const) {
      const T = launchTimeline(kind, false, 0);
      const s = launchFrame(kind, false, g, T.gate, 0);
      s.a.forEach((v, i) => expect(v).toBeCloseTo(g.llA[i] ?? 0, 0));
      s.b.forEach((v, i) => expect(v).toBeCloseTo(g.llB[i] ?? 0, 0));
      s.letters.forEach((v) => expect(Math.abs(v)).toBeLessThan(2));
    }
  });
});

// LaunchCurtain draws the ring, the flare and the glint (clipped by the capsules) only in a band
// around the centre: everything that shows there stays inside it.
describe('the band', () => {
  it(`holds every mark, ring and flare within ${LAUNCH_BAND / 2} dp of the centre`, () => {
    const half = LAUNCH_BAND / 2;
    for (const kind of KINDS)
      for (const reduce of [false, true])
        for (const wait of [0, 1200, 1400])
          for (const [t, s] of frames(kind, reduce, wait)) {
            const at = `${kind} ${reduce} ${wait} ${t}`;
            if (s.marks > 0)
              for (const r of [s.a, s.b]) {
                if (r[2] <= 0) continue;
                expect(Math.abs(r[1] - g.cy), at).toBeLessThanOrEqual(half);
                expect(Math.abs(r[1] + r[3] - g.cy), at).toBeLessThanOrEqual(half);
              }
            if (s.ring && s.ring.opacity > 0)
              expect(Math.abs(s.ring.cy - g.cy) + s.ring.r + s.ring.width, at).toBeLessThanOrEqual(
                half,
              );
            if (s.flare && s.flare.opacity > 0)
              expect(Math.abs(s.flare.cy - g.cy) + s.flare.r, at).toBeLessThanOrEqual(half);
          }
  });
});

describe('waiting for the app', () => {
  it.each(KINDS)('%s: nothing before the gate changes; the window opens later', (kind) => {
    const T0 = launchTimeline(kind, false, 0);
    const wait = T0.cycle * 2;
    const T = launchTimeline(kind, false, wait);
    for (let t = T0.N; t < T0.gate; t += 37) {
      expect(launchFrame(kind, false, g, t, wait)).toEqual(launchFrame(kind, false, g, t, 0));
    }
    expect([T.R0 - T0.R0, T.R1 - T0.R1]).toEqual([wait, wait]);
    for (let u = 0; u <= 1; u += 0.1) {
      const late = launchFrame(kind, false, g, T.R0 + u * (T.R1 - T.R0), wait);
      const now = launchFrame(kind, false, g, T0.R0 + u * (T0.R1 - T0.R0), 0);
      expect(late.curtain).toBeCloseTo(now.curtain, 6);
      expect(late.apart).toEqual(now.apart);
    }
  });

  it.each(KINDS)('%s never jumps while it waits', (kind) => {
    const wait = launchTimeline(kind, false, 0).cycle * 2;
    const list = frames(kind, false, wait);
    for (let i = 1; i < list.length; i++) {
      const prev = (list[i - 1] as [number, LaunchScene])[1];
      const next = (list[i] as [number, LaunchScene])[1];
      expect(Math.abs(next.a[1] - prev.a[1])).toBeLessThan(12);
      expect(Math.abs(next.b[1] - prev.b[1])).toBeLessThan(12);
    }
  });

  it.each(KINDS)('%s: the wait motion moves and comes back each cycle', (kind) => {
    const T = launchTimeline(kind, false, 0);
    const wait = T.cycle * 3;
    const W3 = launchTimeline(kind, false, wait);
    expect(launchWaiting(W3, T.gate, wait)).toBe(true);
    expect(launchWaiting(W3, T.gate + wait, wait)).toBe(false);
    const at = (t: number) => launchFrame(kind, false, g, t, wait).a[1];
    // A quarter into a cycle the capsules are off their place; at its end they are back.
    expect(Math.abs(at(T.gate + T.cycle * 1.25) - at(T.gate + T.cycle))).toBeGreaterThan(5);
    expect(at(T.gate + T.cycle * 2)).toBeCloseTo(at(T.gate + T.cycle), 2);
  });
});

describe('reduce motion', () => {
  it.each(KINDS)('%s moves nothing: only opacities change', (kind) => {
    for (const [, s] of frames(kind, true, 1200)) {
      expect(s.apart).toEqual(TOGETHER);
      expect(s.glint).toBeNull();
      expect(s.ring).toBeNull();
      expect(s.flare).toBeNull();
      expect(s.appScale).toBe(1);
      const atMark = s.a.every((v, i) => v === g.a0[i]);
      const atWord = s.a.every((v, i) => v === g.llA[i]);
      expect(atMark || atWord).toBe(true);
    }
  });

  it.each(KINDS)('%s ends with the curtain gone', (kind) => {
    const T = launchTimeline(kind, true, 0);
    expect(launchFrame(kind, true, g, T.R1, 0).curtain).toBe(0);
  });
});

// The riso textures are cut to boxes around the centre (launchTextures.ts, `pnpm launch:textures`):
// each capsule's texture covers everywhere that capsule goes, with its boil jitter.
describe('riso texture boxes', () => {
  const c = launchGeometry(0, 0);
  const JITTER = 0.5;
  const holds = (box: TextureBox, r: Rect, at: string) => {
    const [x, y, w, h] = box;
    expect(r[0], at).toBeGreaterThanOrEqual(x + JITTER);
    expect(r[1], at).toBeGreaterThanOrEqual(y + JITTER);
    expect(r[0] + r[2], at).toBeLessThanOrEqual(x + w - JITTER);
    expect(r[1] + r[3], at).toBeLessThanOrEqual(y + h - JITTER);
  };

  it('are whole pixels inside the set’s screen', () => {
    for (const [x, y, w, h] of Object.values(LAUNCH_TEXTURE_BOX)) {
      for (const v of [x, y, w, h]) expect(Number.isInteger(v)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(-LAUNCH_ART.w / 2);
      expect(y).toBeGreaterThanOrEqual(-LAUNCH_ART.h / 2);
      expect(x + w).toBeLessThanOrEqual(LAUNCH_ART.w / 2);
      expect(y + h).toBeLessThanOrEqual(LAUNCH_ART.h / 2);
    }
  });

  it('cover the capsules and their overlap in every frame', () => {
    for (const kind of KINDS)
      for (const reduce of [false, true])
        for (const wait of [0, 1200, 1400]) {
          const T = launchTimeline(kind, reduce, wait);
          for (let t = T.N; t <= T.R1; t += 2) {
            const s = launchFrame(kind, reduce, c, t, wait);
            const at = `${kind} ${reduce} ${wait} ${t}`;
            holds(LAUNCH_TEXTURE_BOX.a, s.a, at);
            holds(LAUNCH_TEXTURE_BOX.b, s.b, at);
            const x0 = Math.max(s.a[0], s.b[0]);
            const y0 = Math.max(s.a[1], s.b[1]);
            const x1 = Math.min(s.a[0] + s.a[2], s.b[0] + s.b[2]);
            const y1 = Math.min(s.a[1] + s.a[3], s.b[1] + s.b[3]);
            if (x1 > x0 && y1 > y0) holds(LAUNCH_TEXTURE_BOX.cross, [x0, y0, x1 - x0, y1 - y0], at);
          }
        }
  });

  it('cover the letters where the word ends', () => {
    for (const letter of SKA_LETTERS) {
      const { nums } = parsePath(letter);
      const xs = nums.flatMap((n) => n.filter((_, i) => i % 2 === 0));
      const ys = nums.flatMap((n) => n.filter((_, i) => i % 2 === 1));
      const x0 = c.wordX + Math.min(...xs) * c.wordScale;
      const y0 = c.wordY + Math.min(...ys) * c.wordScale;
      const x1 = c.wordX + Math.max(...xs) * c.wordScale;
      const y1 = c.wordY + Math.max(...ys) * c.wordScale;
      holds(LAUNCH_TEXTURE_BOX.letters, [x0, y0, x1 - x0, y1 - y0], letter.slice(0, 8));
    }
  });
});

describe('riso', () => {
  it('comes in over the flat mark in 300 ms, within the splash hand-off (420 ms)', () => {
    expect(RISO_IN_MS).toBe(300);
    expect(risoIn(-1)).toBe(0);
    expect(risoIn(0)).toBe(0);
    expect(risoIn(150)).toBeCloseTo(bezier(0.65, 0, 0.35, 1, 0.5), 6);
    expect(risoIn(RISO_IN_MS)).toBe(1);
    expect(risoIn(420)).toBe(1);
  });

  it('boils at 8 fps through three variants', () => {
    expect(RISO_BOIL_MS).toBe(125);
    expect([0, 124, 125, 249, 250, 374, 375, 500].map((ms) => risoVariant(ms, false))).toEqual([
      0, 0, 1, 1, 2, 2, 0, 1,
    ]);
    expect(risoVariant(-1, false)).toBe(0);
  });

  it('does not boil with reduce motion', () => {
    for (let ms = 0; ms < 3000; ms += 25) expect(risoVariant(ms, true)).toBe(0);
  });

  it('misregisters the inks and jitters each variant by half a dp at most', () => {
    expect(RISO_MISREGISTER.a).toEqual([-1, -0.7]);
    expect(RISO_MISREGISTER.b).toEqual([1, 0.7]);
    expect(RISO_MISREGISTER.cross).toEqual([0, 0.5]);
    expect(RISO_MISREGISTER.letters).toEqual([0, 0.5]);
    for (const variants of Object.values(RISO_BOIL_OFFSET)) {
      expect(variants).toHaveLength(3);
      for (const [dx, dy] of variants) {
        expect(Math.abs(dx)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(dy)).toBeLessThanOrEqual(0.5);
      }
      expect(new Set(variants.map((v) => v.join())).size).toBe(3);
    }
  });
});

describe('gradient fills', () => {
  // The flare is a radial gradient: Android throws on a zero radius, so no frame may give one.
  it('the flare never has a zero radius', () => {
    expect(flareCircle(null).r).toBeGreaterThan(0);
    expect(flareCircle(null).opacity).toBe(0);
    for (const kind of KINDS) {
      for (const reduce of [false, true]) {
        for (const [, s] of frames(kind, reduce, 1200, 2)) {
          expect(flareCircle(s.flare).r).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('paths', () => {
  it('a letter moved by 0 is the same outline', () => {
    for (const letter of SKA_LETTERS) {
      const p = parsePath(letter);
      expect(parsePath(shiftedPath(p, 0))).toEqual(p);
    }
  });

  it('moves every x and no y', () => {
    const p = parsePath('M10 20L30 40Q50 60 70 80Z');
    expect(shiftedPath(p, 5)).toBe('M15 20L35 40Q55 60 75 80Z');
  });

  it('the glint leans right going up', () => {
    const d = glintPath(100, 300, 250, 350);
    const [x1] = d.slice(1).split(' ').map(Number);
    expect(x1).toBeGreaterThan(100);
  });
});

describe('which launch', () => {
  it('first after install, cold after that, quick after an update or in memory', () => {
    expect(launchKindFrom(null, 'u1', false)).toBe('first');
    expect(launchKindFrom(launchRecord('u1'), 'u1', false)).toBe('cold');
    expect(launchKindFrom(launchRecord('u1'), 'u2', false)).toBe('quick');
    expect(launchKindFrom(launchRecord('u1'), 'u1', true)).toBe('quick');
    expect(launchKindFrom(null, 'u1', true)).toBe('quick');
  });

  it('an unreadable record is a cold launch', () => {
    expect(launchKindFrom('not json', 'u1', false)).toBe('cold');
    expect(launchKindFrom('{}', 'u1', false)).toBe('quick');
  });
});

describe('the app under the curtain (audit M15-22)', () => {
  const scene = { appScale: 1.06, origin: [200, 400] as [number, number] };

  it('is at its own size at rest, in the same five steps as when it moves', () => {
    const rest = appTransform(false, scene, 400, 800);
    expect(rest).toBe(APP_AT_REST);
    expect(rest).toEqual([
      { translateX: 0 },
      { translateY: 0 },
      { scale: 1 },
      { translateX: 0 },
      { translateY: 0 },
    ]);
    expect(appTransform(true, scene, 400, 800).map((s) => Object.keys(s)[0])).toEqual(
      rest.map((s) => Object.keys(s)[0]),
    );
  });

  it('scales around the overlap while the curtain moves', () => {
    expect(appTransform(true, scene, 400, 600)).toEqual([
      { translateX: 0 },
      { translateY: 100 },
      { scale: 1.06 },
      { translateX: -0 },
      { translateY: -100 },
    ]);
  });
});
