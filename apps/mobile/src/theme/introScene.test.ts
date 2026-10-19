import { describe, expect, it } from 'vitest';

import {
  bodyFrame,
  blinkMask,
  charFrame,
  confettiFrame,
  copyFrame,
  type CopyPart,
  INTRO,
  INTRO_CONFETTI,
  INTRO_EMPTY_SEAT,
  INTRO_LOOKS,
  introMinHeight,
  introScene,
  jumpRoom,
  lampFrame,
  phoneFrame,
  ringFrame,
  shadowFrame,
  tableFrame,
} from './introScene';

const SIZES: readonly [number, number][] = [
  [320, 160],
  [360, 290],
  [400, 420],
];
const COPY: readonly CopyPart[] = ['logo', 'line1', 'line2', 'body', 'foot'];

// Every part of the scene at `t`, in one comparable object.
function frame(w: number, h: number, t: number) {
  const s = introScene(w, h);
  return {
    chars: s.chars.map((c) => ({ ...charFrame(c, t), body: bodyFrame(c, t, 0) })),
    blink: blinkMask(s.chars, t),
    tables: s.tables.map((tb) => tableFrame(tb, t)),
    shadow: shadowFrame(t),
    lamps: s.lamps.map((l) => lampFrame(l, t)),
    phones: s.phones.map((p) => phoneFrame(p, t)),
    rings: s.rings.map((r) => ringFrame(r, t)),
    confetti: s.confetti.map((p) => confettiFrame(p, t)),
    copy: COPY.map((p) => copyFrame(p, t)),
  };
}

describe('the intro scene (v45 §2, K-27, K-28)', () => {
  it('lays out ten capsules, three tables and eleven seats, the same on every launch', () => {
    const a = introScene(360, 290);
    expect(a.chars.map((c) => c.look)).toEqual(INTRO_LOOKS);
    expect(a.tables).toHaveLength(3);
    expect(a.seats).toHaveLength(11);
    expect(a.phones.map((p) => p.seat)).toEqual([6, 7, 8, 9, 10]);
    expect(a.confetti).toHaveLength(18);
    expect(new Set(a.confetti.map((p) => p.color)).size).toBe(INTRO_CONFETTI.length);
    expect(introScene(360, 290)).toEqual(a);
  });

  it('ends within about 5 s and has no loop: nothing moves after the end', () => {
    expect(INTRO.endMs).toBeLessThanOrEqual(5000);
    expect(INTRO.doneMs).toBeLessThan(INTRO.endMs);
    for (const [w, h] of SIZES) {
      const end = frame(w, h, INTRO.endMs);
      expect(frame(w, h, INTRO.endMs + 1)).toEqual(end);
      expect(frame(w, h, INTRO.endMs + 60_000)).toEqual(end);
    }
  });

  it('is still moving until close to the end (the confetti and the last hop)', () => {
    const late = frame(360, 290, INTRO.endMs - 300);
    expect(late).not.toEqual(frame(360, 290, INTRO.endMs));
  });

  it('starts empty: no capsule, table, lamp or phone shows, the words wait', () => {
    const f = frame(360, 290, 0);
    expect(f.chars.every((c) => c.opacity === 0)).toBe(true);
    expect(f.tables.every((tb) => tb.opacity === 0 && tb.scaleX === 0)).toBe(true);
    expect(f.lamps.every((l) => l.opacity === 0 && l.drop === 1)).toBe(true);
    expect(f.phones.every((p) => p.opacity === 0)).toBe(true);
    expect(f.rings.every((r) => r.opacity === 0)).toBe(true);
    expect(f.confetti.every((p) => p.opacity === 0)).toBe(true);
    expect(f.copy.every((c) => c.opacity === 0)).toBe(true);
  });

  it('ends with everyone seated, one seat empty: the one the hopper left', () => {
    for (const [w, h] of SIZES) {
      const s = introScene(w, h);
      const end = INTRO.endMs;
      const seated = s.chars.map((c) => {
        const f = charFrame(c, end);
        return s.seats.findIndex(
          (q) => Math.abs(q.bx - s.cw / 2 - f.x) < 1e-6 && Math.abs(q.by - s.ch - f.y) < 1e-6,
        );
      });
      expect(seated.every((i) => i >= 0)).toBe(true);
      expect(new Set(seated).size).toBe(10);
      const empty = s.seats.map((_, i) => i).filter((i) => !seated.includes(i));
      expect(empty).toEqual([s.from]);
      expect(seated[s.hopper]).toBe(INTRO_EMPTY_SEAT);
      // The hopper came from a far table; the near table is full.
      expect(s.seats[s.from]!.table).not.toBe(2);
      // The empty seat's mark is over the seat the hopper left, the first one is gone.
      const rings = s.rings.map((r) => ringFrame(r, end));
      expect(rings[0]!.opacity).toBe(0);
      expect(rings[1]!.opacity).toBeGreaterThan(0);
      const q = s.seats[s.from]!;
      expect(s.rings[1]!.x + s.rings[1]!.w / 2).toBeCloseTo(q.bx);
      // Every near-table phone is on and lit.
      expect(s.phones.map((p) => phoneFrame(p, end))).toEqual(
        s.phones.map(() => ({ opacity: 1, rise: 0, lit: 1, glow: 1 })),
      );
    }
  });

  it('keeps a seated body behind its table, and a body in the air above every table', () => {
    const s = introScene(360, 290);
    for (const c of s.chars) {
      for (const h of c.hops) {
        for (let e = 0; e < h.ms; e += 5) {
          const f = charFrame(c, h.at + e);
          if (e < h.rise) expect(f.z).toBe(h.zBefore);
          else if (e < h.ms - h.sink) expect(f.z).toBeGreaterThan(8);
          else expect(f.z).toBe(h.zAfter);
        }
      }
      // Seated: one under the table's layer.
      const end = charFrame(c, INTRO.endMs);
      const seat = s.seats.find(
        (q) => Math.abs(q.bx - s.cw / 2 - end.x) < 1e-6 && Math.abs(q.by - s.ch - end.y) < 1e-6,
      )!;
      expect(end.z).toBe(s.tables[seat.table]!.z - 1);
    }
  });

  it('keeps every capsule inside the scene box at every frame, at every tested size', () => {
    for (const [w, h] of SIZES) {
      const s = introScene(w, h);
      for (const c of s.chars) {
        for (let t = 0; t <= INTRO.endMs; t += 5) {
          const f = charFrame(c, t);
          if (f.opacity === 0) continue;
          // Scaled from its feet (the box's bottom middle); the bob lifts the body inside it.
          const lift = Math.min(0, bodyFrame(c, t, 0).dy) * s.ch * f.s;
          const top = f.y + s.ch * (1 - f.s) + lift;
          const half = (s.cw * f.s) / 2;
          const mid = f.x + s.cw / 2;
          expect(top, `${w}x${h} ${c.look} at ${t} ms`).toBeGreaterThanOrEqual(0);
          expect(f.y + s.ch).toBeLessThanOrEqual(h);
          expect(mid - half).toBeGreaterThanOrEqual(0);
          expect(mid + half).toBeLessThanOrEqual(w);
        }
      }
    }
  });

  it('keeps a tapped capsule inside the scene box too: its jump is cut near the top', () => {
    for (const [w, h] of SIZES) {
      const s = introScene(w, h);
      for (const c of s.chars) {
        for (let t = 0; t <= INTRO.endMs + 1000; t += 5) {
          const f = charFrame(c, t);
          if (f.opacity === 0) continue;
          // At the jump's peak: the body lifts by dy and stretches from its middle.
          const b = bodyFrame(c, t, 0.4, jumpRoom(f, s.ch));
          const rise = (-b.dy + (b.sy - 1) / 2) * s.ch * f.s;
          const top = f.y + s.ch * (1 - f.s) - rise;
          expect(top, `${w}x${h} ${c.look} at ${t} ms`).toBeGreaterThanOrEqual(0);
        }
      }
    }
    // Where there is room (every seat at the end, at a phone's usual size), the whole jump.
    const s = introScene(360, 290);
    for (const c of s.chars) {
      const b = bodyFrame(c, INTRO.endMs, 0.4, jumpRoom(charFrame(c, INTRO.endMs), s.ch));
      expect(b.dy).toBeCloseTo(-0.34);
      expect(b.sy).toBeCloseTo(1.04);
    }
  });

  it('moves smoothly: no capsule jumps between two frames', () => {
    const s = introScene(360, 290);
    for (const c of s.chars) {
      let prev = charFrame(c, c.appearAt + INTRO.appearMs);
      for (let t = c.appearAt + INTRO.appearMs + 8; t <= INTRO.endMs; t += 8) {
        const f = charFrame(c, t);
        expect(Math.hypot(f.x - prev.x, f.y - prev.y)).toBeLessThan(s.ch * 0.6);
        prev = f;
      }
    }
  });

  it('keeps hops apart: no capsule starts a hop before the last one ended', () => {
    const s = introScene(360, 290);
    for (const c of s.chars) {
      expect(c.hops[0]!.at).toBeGreaterThanOrEqual(c.appearAt + INTRO.appearMs);
      for (let i = 1; i < c.hops.length; i++) {
        expect(c.hops[i]!.at).toBeGreaterThanOrEqual(c.hops[i - 1]!.at + c.hops[i - 1]!.ms);
        expect(c.hops[i]!.from).toEqual(c.hops[i - 1]!.to);
      }
    }
  });

  it('blinks each capsule once and bobs it once', () => {
    const s = introScene(360, 290);
    const shut = new Array<number>(s.chars.length).fill(0);
    let last = 0;
    for (let t = 0; t <= INTRO.endMs; t += 4) {
      const m = blinkMask(s.chars, t);
      s.chars.forEach((_, i) => {
        if (m & (1 << i) && !(last & (1 << i))) shut[i]! += 1;
      });
      last = m;
    }
    expect(shut).toEqual(s.chars.map(() => 1));
    for (const c of s.chars) {
      expect(bodyFrame(c, c.bobAt + 1300, 0).dy).toBeLessThan(0);
      expect(bodyFrame(c, INTRO.endMs, 0)).toEqual({ dy: 0, sy: 1 });
    }
  });

  it('jumps a tapped capsule up and back (v45: obfJump)', () => {
    const c = introScene(360, 290).chars[0]!;
    expect(bodyFrame(c, INTRO.endMs, 0.4).dy).toBeCloseTo(-0.34);
    expect(bodyFrame(c, INTRO.endMs, 0.4).sy).toBeCloseTo(1.04);
    expect(bodyFrame(c, INTRO.endMs, 0.8).dy).toBeCloseTo(0.02);
    expect(bodyFrame(c, INTRO.endMs, 1)).toEqual({ dy: 0, sy: 1 });
  });

  it('brings the words in with the scene: logo and first half, second half, the line under', () => {
    expect(copyFrame('logo', INTRO.logoAt).opacity).toBe(0);
    expect(copyFrame('line1', INTRO.logoAt + 450).opacity).toBe(1);
    expect(copyFrame('line2', INTRO.litAt - 1).opacity).toBe(0);
    expect(copyFrame('line2', INTRO.litAt + 600)).toEqual({ opacity: 1, dy: 0 });
    expect(copyFrame('body', INTRO.playAt - 1).opacity).toBe(0);
    expect(copyFrame('foot', INTRO.footAt + INTRO.footMs).opacity).toBe(1);
    for (const p of COPY) expect(copyFrame(p, INTRO.endMs)).toEqual({ opacity: 1, dy: 0 });
  });

  it('lights the near table’s phones together when the game starts', () => {
    const s = introScene(360, 290);
    const before = s.phones.map((p) => phoneFrame(p, INTRO.playAt - 1).lit);
    const after = s.phones.map((p) => phoneFrame(p, INTRO.playAt).lit);
    expect(before.every((l) => l === 0)).toBe(true);
    expect(after.every((l) => l === 1)).toBe(true);
    // The empty seat's phone comes with the hopper.
    const p9 = s.phones.find((p) => p.seat === INTRO_EMPTY_SEAT)!;
    expect(phoneFrame(p9, INTRO.hopAt).opacity).toBe(0);
    expect(p9.onAt).toBe(INTRO.hopAt + INTRO.hopMs);
  });

  it('gives the scene at least 160, up to 290 when the screen is tall', () => {
    expect(introMinHeight(568)).toBe(176);
    expect(introMinHeight(480)).toBe(160);
    expect(introMinHeight(900)).toBe(290);
  });
});
