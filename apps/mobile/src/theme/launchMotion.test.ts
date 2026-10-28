import { describe, expect, it } from 'vitest';

import { MAIN, reach, SPLASH, SPLASH_REACH } from '../../../../scripts/icon/mark.ts';

import {
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

const inCapsule = ([x, y, w, h]: Rect, px: number, py: number): boolean => {
  const r = w / 2;
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return Math.hypot(px - (x + r), py - cy) <= r;
};

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
      expect(s.window).toBeNull();
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

  it.each(KINDS)('%s opens the window over the whole screen', (kind) => {
    const T = launchTimeline(kind, false, 0);
    const last = launchFrame(kind, false, g, T.R1, 0);
    expect(last.done).toBe(true);
    expect(last.appScale).toBeCloseTo(1, 3);
    const win = last.window;
    if (!win) throw new Error('no window');
    for (const [px, py] of [
      [0, 0],
      [W, 0],
      [0, H],
      [W, H],
    ] as const) {
      expect(inCapsule(win.a, px, py) || inCapsule(win.b, px, py)).toBe(true);
    }
  });

  it.each(KINDS)('%s: the window starts as the capsules, white', (kind) => {
    const T = launchTimeline(kind, false, 0);
    const before = launchFrame(kind, false, g, T.R0 - 1, 0);
    const at = launchFrame(kind, false, g, T.R0, 0);
    expect(at.window?.white).toBe(1);
    at.window?.a.forEach((v, i) => expect(v).toBeCloseTo(before.a[i] ?? 0, 0));
  });

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

// LaunchCurtain draws the frames before the window only in a band around the centre: everything
// that shows on them stays inside it (the capsules, the letters' height, the ring and the flare).
describe('the band before the window', () => {
  it(`holds every mark, ring and flare within ${LAUNCH_BAND / 2} dp of the centre`, () => {
    const half = LAUNCH_BAND / 2;
    for (const kind of KINDS)
      for (const reduce of [false, true])
        for (const wait of [0, 1200, 1400])
          for (const [t, s] of frames(kind, reduce, wait)) {
            if (s.window) continue;
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
      const late = launchFrame(kind, false, g, T.R0 + u * (T.R1 - T.R0), wait).window;
      const now = launchFrame(kind, false, g, T0.R0 + u * (T0.R1 - T0.R0), 0).window;
      expect(late?.white).toBeCloseTo(now?.white ?? -1, 6);
      expect(late?.rim).toBeCloseTo(now?.rim ?? -1, 6);
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
      expect(s.window).toBeNull();
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
