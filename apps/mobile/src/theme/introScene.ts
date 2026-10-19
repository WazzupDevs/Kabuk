import { type CapsuleKey, FRIEND_DARK_INK } from './capsules';
import { bezier } from './launchMotion';

// The first screen's scene (v45 report §2; the v45 file's OBS module: "Aynı mekanda, aynı
// masada."): ten capsules pop up around the venue, three tables come up, everyone but one takes a
// seat, the lamps come on, the near table's phones light up together with a burst of confetti, and
// someone from a far table hops into the empty seat, leaving theirs empty. Once, about 5 s, no loop
// (K-27). Every part is a function of the scene's size and the time since it began, so the end is
// one frame whether the scene ran, was skipped ("Geç", "Başla") or never ran (reduce motion; back
// from "Başlamadan önce", K-28). Pure; introScene.test.ts pins it, and
// src/features/onboarding/IntroScene.tsx draws it on the UI thread (the frame functions are
// worklets).

export const INTRO_LOOKS: readonly CapsuleKey[] = [
  'party',
  'captain',
  'shades',
  'patch',
  'pirate',
  'crown',
  'mustache',
  'vampire',
  'cat',
  'headphones',
];

// The seat left empty when everyone sits down: the near table's second from the right.
export const INTRO_EMPTY_SEAT = 9;

// When each part moves, in ms from the start (v45: the later() calls and the CSS transitions).
export const INTRO = {
  // 1) Everyone alone in the venue: a pop each; every third one hops aside.
  appearAt: 140,
  appearStep: 60,
  appearMs: 440,
  wanderAt: 760,
  wanderStep: 45,
  wanderMs: 520,
  // The logo and the title's first half (v45: .s1).
  logoAt: 260,
  // 2) The lamps drop in (.st) and the tables come up, far ones first.
  lampsAt: 1200,
  lampStep: 110,
  lampMs: 800,
  swayStep: 300,
  swayMs: 3600,
  tablesAt: 1250,
  tableStep: 110,
  tableMs: 550,
  tableFadeMs: 300,
  // 3) Everyone takes a seat but one.
  seatAt: 1550,
  seatStep: 70,
  seatMs: 680,
  // The lamps glow, the shadows fall, the near table's phones arrive, the empty seat shows, the
  // title's second half (.s2).
  litAt: 2550,
  // 4) The game starts: the phones light up, confetti, the line under the title (.s3).
  playAt: 2900,
  phoneGlowStep: 70,
  // 5) Someone from a far table hops into the empty seat; theirs shows empty a moment later.
  hopAt: 3200,
  hopMs: 900,
  ringBackMs: 950,
  // The button and the age line fade in from the start (v45: .obf-foot, obfIn .5s .55s).
  footAt: 550,
  footMs: 500,
  // "Geç" goes; the scene stands as it is.
  doneMs: 4500,
  // Nothing moves after this.
  endMs: 4700,
} as const;

// CSS easings as cubic-bezier control points.
type Curve = readonly [number, number, number, number];
const EASE: Curve = [0.25, 0.1, 0.25, 1];
const EASE_OUT: Curve = [0, 0, 0.58, 1];
const EASE_IN_OUT: Curve = [0.42, 0, 0.58, 1];
const RISE: Curve = [0.4, 0, 0.6, 1];
const ARC_UP: Curve = [0.2, 0.6, 0.4, 1];
const ARC_DOWN: Curve = [0.6, 0, 0.8, 0.4];
const SINK: Curve = [0.3, 1.35, 0.5, 1];
const TABLE_UP: Curve = [0.2, 0.9, 0.3, 1.15];
const LAMP_DROP: Curve = [0.25, 1.2, 0.4, 1];
const PHONE_UP: Curve = [0.2, 0.9, 0.3, 1.3];
const LOGO_IN: Curve = [0.2, 0.9, 0.3, 1];
const LINE_IN: Curve = [0.2, 0.9, 0.3, 1.25];
const BURST: Curve = [0.2, 0.7, 0.4, 1];
// A tap on a capsule (v45: obfJump .5s cubic-bezier(.3,.7,.4,1)).
const JUMP: Curve = [0.3, 0.7, 0.4, 1];
export const INTRO_JUMP_MS = 500;

export type IntroPos = { x: number; y: number; s: number };
export type IntroTable = {
  cx: number;
  y: number;
  w: number;
  h: number;
  s: number;
  n: number;
  z: number;
  far: boolean;
  upAt: number;
};
export type IntroSeat = { table: number; bx: number; by: number; s: number; z: number };
export type IntroHop = {
  at: number;
  ms: number;
  from: IntroPos;
  to: IntroPos;
  // Up behind the table first (rise), down behind the target table last (sink), so a body is never
  // in front of a table; in the air it is above everything.
  rise: number;
  sink: number;
  outY: number;
  inY: number;
  mid: IntroPos;
  zBefore: number;
  zAfter: number;
};
export type IntroChar = {
  look: CapsuleKey;
  spot: IntroPos;
  appearAt: number;
  z0: number;
  hops: IntroHop[];
  // One bob and one blink while the scene runs.
  bobAt: number;
  blinkAt: number;
};
export type IntroLamp = {
  x: number;
  y: number;
  w: number;
  h: number;
  cord: number;
  glowW: number;
  glowH: number;
  at: number;
  swayAt: number;
  far: boolean;
};
export type IntroPhone = { seat: number; x: number; y: number; w: number; h: number; onAt: number };
export type IntroRing = {
  x: number;
  y: number;
  w: number;
  z: number;
  at: number;
  until: number;
  pulse: boolean;
};
export type IntroConfetti = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  ms: number;
  color: number;
};
export type IntroScene = {
  width: number;
  height: number;
  cw: number;
  ch: number;
  tables: IntroTable[];
  seats: IntroSeat[];
  chars: IntroChar[];
  lamps: IntroLamp[];
  phones: IntroPhone[];
  rings: IntroRing[];
  confetti: IntroConfetti[];
  // Who hops at the end, and the seat they leave.
  hopper: number;
  from: number;
};

export const INTRO_CONFETTI_COUNT = 18;
// A pose's lift while hopping: above every table, phone and seated capsule.
const AIR_Z = 20;
const BLINK_MS = 100;
// A ring that stays once it shows.
const FOREVER = 1e9;
const BOB_MS = 2600;
const BOB_SHARE = 0.03;
// The pop's peak, as a share of the capsule's size.
const POP_PEAK = 1.14;
export const INTRO_BLINK_OPEN = 0.12;

// v45's fixed-seed generator: the same places on every launch.
function rng(seed: number): () => number {
  let h = seed >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

// A capsule is drawn in its ch-high box at (x, y) and scaled from its feet (the box's bottom
// middle), so its top is ch * (1 - s) below y. Kept this far below the scene box's top, with room for
// its bob (the words and the logo sit right above the box).
const EDGE = 2;
const topLimit = (ch: number, s: number) => EDGE - ch * (1 - s) + ch * s * BOB_SHARE;

function hop(
  from: IntroPos,
  to: IntroPos,
  at: number,
  ms: number,
  lift: number,
  ch: number,
  zBefore: number,
  zAfter: number,
  rise: boolean,
  sink: boolean,
): IntroHop {
  const outY = rise ? from.y - (ch * 0.32 * from.s + 4) : from.y;
  const inY = sink ? to.y - (ch * 0.32 * to.s + 4) : to.y;
  const midS = from.s + (to.s - from.s) * 0.55;
  return {
    at,
    ms,
    from,
    to,
    rise: rise ? ms * 0.2 : 0,
    sink: sink ? ms * 0.2 : 0,
    outY,
    inY,
    mid: {
      x: from.x + (to.x - from.x) * 0.62,
      // The arc's top stays inside the box: on a short screen the lift is cut, never the box. The
      // capsule grows on the way to a nearer seat, so its top is held where the grown one fits.
      y: Math.max(Math.min(outY, inY) - lift, topLimit(ch, midS)),
      s: midS,
    },
    zBefore,
    zAfter,
  };
}

// The scene laid out in a box `width` x `height`: two far tables and the near one along the
// bottom, right above the words; a lamp over each; the near table's phones.
export function introScene(width: number, height: number): IntroScene {
  const W = width;
  const H = height;
  const cw = Math.min(W * 0.15, 66);
  const ch = (cw * 66) / 48;
  const at = (bx: number, by: number, s: number): IntroPos => ({ x: bx - cw / 2, y: by - ch, s });
  const order = [1, 0, 2];
  const tables: IntroTable[] = [
    { cx: 0.26 * W, y: 0.54 * H, w: 0.46 * W, s: 0.7, n: 3, z: 4, far: true },
    { cx: 0.76 * W, y: 0.42 * H, w: 0.4 * W, s: 0.58, n: 3, z: 2, far: true },
    { cx: 0.5 * W, y: H - ch * 0.52, w: 0.92 * W, s: 1, n: 5, z: 8, far: false },
  ].map((t, i) => ({
    ...t,
    h: Math.max(12, ch * 0.4 * t.s),
    upAt: INTRO.tablesAt + order.indexOf(i) * INTRO.tableStep,
  }));
  const seats: IntroSeat[] = tables.flatMap((t, ti) =>
    Array.from({ length: t.n }, (_, i) => ({
      table: ti,
      bx: t.cx - t.w * 0.4 + (i + 0.5) * ((t.w * 0.8) / t.n),
      by: t.y + ch * 0.3 * t.s,
      s: t.s,
      z: t.z - 1,
    })),
  );
  const seatPos = (i: number) => at(seats[i]!.bx, seats[i]!.by, seats[i]!.s);

  // 1) Everyone somewhere in the venue, not on top of each other.
  const r = rng(7);
  const k = POP_PEAK + BOB_SHARE;
  const spots: [number, number][] = [];
  const chars: IntroChar[] = INTRO_LOOKS.map((look, i) => {
    let bx = 0;
    let by = 0;
    let tries = 0;
    do {
      bx = W * (0.1 + r() * 0.8);
      // Low enough that the pop (114 %) and the bob stay inside the box: s grows with by
      // (s = 0.5 + 0.45 by / H), so the lowest by solves by = k ch s for k = 1.14 + BOB_SHARE.
      by = Math.max(H * (0.28 + r() * 0.4), (0.5 * k * ch) / (1 - (0.45 * k * ch) / H) + EDGE);
      tries++;
    } while (
      tries < 30 &&
      spots.some(([x, y]) => Math.abs(x - bx) < cw * 0.9 && Math.abs(y - by) < ch * 0.5)
    );
    spots.push([bx, by]);
    const s = 0.5 + (by / H) * 0.45;
    const blinkDelay = i % 3 === 1 ? 600 : i % 3 === 2 ? 1200 : 0;
    return {
      look,
      spot: at(bx, by, s),
      appearAt: INTRO.appearAt + i * INTRO.appearStep,
      z0: 12 + Math.round(by / 10),
      hops: [],
      bobAt: (i * 230) % 1300,
      blinkAt: blinkDelay + 2260,
    };
  });
  // Every third one hops aside.
  chars.forEach((c, i) => {
    if (i % 3 !== 1) return;
    const [bx, by] = spots[i]!;
    const nb = Math.min(W - cw * 0.6, Math.max(cw * 0.6, bx + (r() - 0.5) * cw * 2.4));
    const to = at(nb, by, c.spot.s);
    const start = INTRO.wanderAt + i * INTRO.wanderStep;
    c.hops.push(hop(c.spot, to, start, INTRO.wanderMs, ch * 0.35, ch, c.z0, c.z0, false, false));
  });
  // 3) Everyone takes a seat but one: down behind the table.
  const seatOf: number[] = [];
  seats
    .map((_, i) => i)
    .filter((i) => i !== INTRO_EMPTY_SEAT)
    .forEach((si, k) => {
      const c = chars[k]!;
      const last = c.hops[c.hops.length - 1];
      const from = last ? last.to : c.spot;
      const z = last ? last.zAfter : c.z0;
      const start = INTRO.seatAt + k * INTRO.seatStep;
      c.hops.push(
        hop(from, seatPos(si), start, INTRO.seatMs, ch * 0.45, ch, z, seats[si]!.z, false, true),
      );
      seatOf[k] = si;
    });
  // 5) Someone from a far table hops into the empty seat (v45 picks at random; here the same
  // generator picks, so every launch is the same).
  const emptyTable = seats[INTRO_EMPTY_SEAT]!.table;
  const cand = chars.map((_, k) => k).filter((k) => seats[seatOf[k]!]!.table !== emptyTable);
  const hopper = cand[Math.floor(r() * cand.length)]!;
  const from = seatOf[hopper]!;
  const hc = chars[hopper]!;
  hc.hops.push(
    hop(
      seatPos(from),
      seatPos(INTRO_EMPTY_SEAT),
      INTRO.hopAt,
      INTRO.hopMs,
      ch * 0.5,
      ch,
      seats[from]!.z,
      seats[INTRO_EMPTY_SEAT]!.z,
      true,
      true,
    ),
  );

  const lamps: IntroLamp[] = tables.map((t, i) => {
    const w = cw * (t.far ? 0.95 * t.s : 0.9);
    const h = w * 0.5;
    const y = t.far ? t.y - ch * t.s * 1.5 - h : H * 0.1;
    return {
      x: t.cx - w / 2,
      y,
      w,
      h,
      cord: Math.max(18, y),
      glowW: t.w * (t.far ? 0.9 : 0.8),
      glowH: t.y - y,
      at: INTRO.lampsAt + i * INTRO.lampStep,
      swayAt: i * INTRO.swayStep,
      far: t.far,
    };
  });

  // Everyone at the near table has their own phone: it comes and goes with them.
  const near = tables[2]!;
  const pw = cw * 0.34;
  const ph = cw * 0.42;
  const phones: IntroPhone[] = seats.flatMap((q, i) =>
    q.table === 2
      ? [
          {
            seat: i,
            x: q.bx - pw / 2,
            y: near.y - ph * 0.55,
            w: pw,
            h: ph,
            onAt: i === INTRO_EMPTY_SEAT ? INTRO.hopAt + INTRO.hopMs : INTRO.litAt,
          },
        ]
      : [],
  );

  const ring = (seat: number, at: number, until: number, pulse: boolean): IntroRing => {
    const q = seats[seat]!;
    const t = tables[q.table]!;
    const w = cw * q.s * 0.9;
    return { x: q.bx - w / 2, y: t.y + 2, w, z: t.z + 1, at, until, pulse };
  };
  const rings = [
    ring(INTRO_EMPTY_SEAT, INTRO.litAt, INTRO.hopAt, true),
    ring(from, INTRO.hopAt + INTRO.ringBackMs, FOREVER, false),
  ];

  const cr = rng(31);
  const confetti: IntroConfetti[] = Array.from({ length: INTRO_CONFETTI_COUNT }, (_, i) => {
    const ang = -Math.PI * (0.12 + cr() * 0.76);
    const dist = H * (0.22 + cr() * 0.3);
    const rot = Math.trunc(cr() * 540 - 270);
    return {
      x: near.cx,
      y: near.y,
      dx: Math.cos(ang) * dist,
      dy: Math.sin(ang) * dist,
      rot,
      ms: 1300 + cr() * 500,
      color: i % 6,
    };
  });

  return {
    width: W,
    height: H,
    cw,
    ch,
    tables,
    seats,
    chars,
    lamps,
    phones,
    rings,
    confetti,
    hopper,
    from,
  };
}

// ------------------------------------------------------------------ frames (worklets)

function ease(c: Curve, u: number): number {
  'worklet';
  return bezier(c[0], c[1], c[2], c[3], u);
}
function lerp(a: number, b: number, u: number): number {
  'worklet';
  return a + (b - a) * u;
}
// Progress of a transition that starts at `at` and lasts `ms`, eased.
function step(t: number, at: number, ms: number, c: Curve): number {
  'worklet';
  if (t <= at) return 0;
  if (t >= at + ms) return 1;
  return ease(c, (t - at) / ms);
}

export type CharFrame = { x: number; y: number; s: number; opacity: number; z: number };

// A capsule's place, size, visibility and layer at `t`.
export function charFrame(c: IntroChar, t: number): CharFrame {
  'worklet';
  if (t < c.appearAt + INTRO.appearMs) {
    // The pop: from nothing to 114 % and back (ease-out over the whole pop).
    const u = t <= c.appearAt ? 0 : ease(EASE_OUT, (t - c.appearAt) / INTRO.appearMs);
    const big = c.spot.s * POP_PEAK;
    const s = u < 0.65 ? lerp(0.01, big, u / 0.65) : lerp(big, c.spot.s, (u - 0.65) / 0.35);
    const opacity = u < 0.65 ? u / 0.65 : 1;
    return { x: c.spot.x, y: c.spot.y, s, opacity, z: c.z0 };
  }
  let x = c.spot.x;
  let y = c.spot.y;
  let s = c.spot.s;
  let z = c.z0;
  for (let i = 0; i < c.hops.length; i++) {
    const h = c.hops[i]!;
    if (t < h.at) break;
    const e = t - h.at;
    if (e >= h.ms) {
      x = h.to.x;
      y = h.to.y;
      s = h.to.s;
      z = h.zAfter;
      continue;
    }
    const air = h.ms - h.rise - h.sink;
    if (e < h.rise) {
      const u = ease(RISE, e / h.rise);
      return { x: h.from.x, y: lerp(h.from.y, h.outY, u), s: h.from.s, opacity: 1, z: h.zBefore };
    }
    if (e < h.rise + air) {
      const k = (e - h.rise) / air;
      if (k < 0.5) {
        const u = ease(ARC_UP, k / 0.5);
        return {
          x: lerp(h.from.x, h.mid.x, u),
          y: lerp(h.outY, h.mid.y, u),
          s: lerp(h.from.s, h.mid.s, u),
          opacity: 1,
          z: AIR_Z,
        };
      }
      const u = ease(ARC_DOWN, (k - 0.5) / 0.5);
      return {
        x: lerp(h.mid.x, h.to.x, u),
        y: lerp(h.mid.y, h.inY, u),
        s: lerp(h.mid.s, h.to.s, u),
        opacity: 1,
        z: AIR_Z,
      };
    }
    const u = ease(SINK, (e - h.rise - air) / h.sink);
    return { x: h.to.x, y: lerp(h.inY, h.to.y, u), s: h.to.s, opacity: 1, z: h.zAfter };
  }
  return { x, y, s, opacity: 1, z };
}

// How far a tapped capsule's top rises at the jump's peak, as a share of its height: the lift and
// half the stretch (the body stretches from its middle).
const JUMP_TOP = 0.34 + 0.04 / 2;

// The room over a capsule at this frame for its jump, as a share of its height: from its top (it
// is scaled from its feet) to the scene box's top, less the edge the layout keeps.
export function jumpRoom(f: CharFrame, ch: number): number {
  'worklet';
  return (f.y + ch * (1 - f.s) - EDGE) / (ch * f.s);
}

// The body's bob inside its place, as a share of its height (negative: up), and, after a tap, the
// jump (`jump` 0…1 over INTRO_JUMP_MS; 0 when there is none). The jump is cut to `room`
// (jumpRoom): a capsule high in its arc on a short screen jumps less and stays inside the box.
export function bodyFrame(
  c: IntroChar,
  t: number,
  jump: number,
  room?: number,
): { dy: number; sy: number } {
  'worklet';
  if (jump > 0 && jump < 1) {
    const k = room === undefined ? 1 : Math.min(1, Math.max(0, room) / JUMP_TOP);
    let dy: number;
    let sy: number;
    if (jump < 0.4) {
      const u = ease(JUMP, jump / 0.4);
      dy = lerp(0, -0.34, u);
      sy = lerp(1, 1.04, u);
    } else if (jump < 0.8) {
      const u = ease(JUMP, (jump - 0.4) / 0.4);
      dy = lerp(-0.34, 0.02, u);
      sy = lerp(1.04, 0.96, u);
    } else {
      const u = ease(JUMP, (jump - 0.8) / 0.2);
      dy = lerp(0.02, 0, u);
      sy = lerp(0.96, 1, u);
    }
    return { dy: dy * k, sy: 1 + (sy - 1) * k };
  }
  const e = t - c.bobAt;
  if (e <= 0 || e >= BOB_MS) return { dy: 0, sy: 1 };
  const k = e / BOB_MS;
  const u = k < 0.5 ? ease(EASE_IN_OUT, k / 0.5) : 1 - ease(EASE_IN_OUT, (k - 0.5) / 0.5);
  return { dy: -BOB_SHARE * u, sy: 1 };
}

// Which capsules have their eyes shut at `t`, one bit each.
export function blinkMask(chars: readonly IntroChar[], t: number): number {
  'worklet';
  let mask = 0;
  for (let i = 0; i < chars.length; i++) {
    const b = chars[i]!.blinkAt;
    if (t >= b && t < b + BLINK_MS) mask |= 1 << i;
  }
  return mask;
}

export function tableFrame(tb: IntroTable, t: number): { scaleX: number; opacity: number } {
  'worklet';
  return {
    scaleX: step(t, tb.upAt, INTRO.tableMs, TABLE_UP),
    opacity: step(t, tb.upAt, INTRO.tableFadeMs, EASE),
  };
}

// The shadow under a table, once everyone sits.
export function shadowFrame(t: number): number {
  'worklet';
  return step(t, INTRO.litAt + 300, 600, EASE);
}

export type LampFrame = {
  drop: number;
  opacity: number;
  lit: number;
  glow: number;
  rotate: number;
};

// A lamp drops in on its cord (`drop` 1 → 0 of its way down), sways once and comes on.
export function lampFrame(l: IntroLamp, t: number): LampFrame {
  'worklet';
  const e = t - l.swayAt;
  let rotate = 0;
  if (e > 0 && e < INTRO.swayMs) {
    const k = e / INTRO.swayMs;
    if (k < 0.25) rotate = lerp(0, -1.2, ease(EASE_IN_OUT, k / 0.25));
    else if (k < 0.75) rotate = lerp(-1.2, 1.2, ease(EASE_IN_OUT, (k - 0.25) / 0.5));
    else rotate = lerp(1.2, 0, ease(EASE_IN_OUT, (k - 0.75) / 0.25));
  }
  const delay = l.at - INTRO.lampsAt;
  return {
    drop: 1 - step(t, l.at, INTRO.lampMs, LAMP_DROP),
    opacity: step(t, l.at, 300, EASE),
    lit: step(t, INTRO.litAt + delay, 300, EASE),
    glow: step(t, INTRO.litAt + delay, 500, EASE),
    rotate,
  };
}

export type PhoneFrame = { opacity: number; rise: number; lit: number; glow: number };

// A near-table phone: up onto the table with its owner (`rise` 1 → 0 of 30 % of its height), its
// screen on with everyone's at once, its glow a beat apart.
export function phoneFrame(p: IntroPhone, t: number): PhoneFrame {
  'worklet';
  const glowAt = INTRO.playAt + (p.seat - 6) * INTRO.phoneGlowStep;
  return {
    opacity: step(t, p.onAt, 300, EASE),
    rise: 1 - step(t, p.onAt, 450, PHONE_UP),
    lit: t >= INTRO.playAt ? 1 : 0,
    glow: step(t, glowAt, 300, EASE),
  };
}

// The empty seat's mark: it pulses once when everyone has sat down, then stays quiet.
export function ringFrame(rg: IntroRing, t: number): { opacity: number; glow: number } {
  'worklet';
  if (t < rg.at || t >= rg.until) return { opacity: 0, glow: 0 };
  const e = t - rg.at;
  if (rg.pulse && e < 1600) {
    const k = e / 1600;
    const u = k < 0.5 ? ease(EASE_IN_OUT, k / 0.5) : 1 - ease(EASE_IN_OUT, (k - 0.5) / 0.5);
    return { opacity: lerp(0.35, 1, u), glow: u };
  }
  return { opacity: 0.9, glow: 0 };
}

export type ConfettiFrame = { x: number; y: number; rot: number; s: number; opacity: number };

// A confetti piece thrown up from the near table when the game starts.
export function confettiFrame(p: IntroConfetti, t: number): ConfettiFrame {
  'worklet';
  const e = t - INTRO.playAt;
  if (e <= 0) return { x: 0, y: 0, rot: 0, s: 0.4, opacity: 0 };
  if (e >= p.ms)
    return { x: p.dx * 1.15, y: p.dy * 0.7 + 40, rot: p.rot * 1.3, s: 0.9, opacity: 0 };
  const u = ease(BURST, e / p.ms);
  if (u < 0.6) {
    const k = u / 0.6;
    return { x: p.dx * k, y: p.dy * k, rot: p.rot * k, s: lerp(0.4, 1, k), opacity: 1 };
  }
  const k = (u - 0.6) / 0.4;
  return {
    x: lerp(p.dx, p.dx * 1.15, k),
    y: lerp(p.dy, p.dy * 0.7 + 40, k),
    rot: lerp(p.rot, p.rot * 1.3, k),
    s: lerp(1, 0.9, k),
    opacity: 1 - k,
  };
}

export type CopyPart = 'logo' | 'line1' | 'line2' | 'body' | 'foot';
export const COPY_PARTS: readonly CopyPart[] = ['logo', 'line1', 'line2', 'body', 'foot'];
// Where each piece of the words starts from (px down; the logo comes from above).
const COPY_FROM: Record<CopyPart, number> = { logo: -6, line1: 16, line2: 16, body: 8, foot: 0 };
// When each piece comes in and how long its fade and its rise take (v45: .s1, .s2, .s3, obfIn).
const COPY_TIMES: Record<CopyPart, { at: number; fade: number; rise: number }> = {
  logo: { at: INTRO.logoAt, fade: 500, rise: 600 },
  line1: { at: INTRO.logoAt, fade: 450, rise: 600 },
  line2: { at: INTRO.litAt, fade: 450, rise: 600 },
  body: { at: INTRO.playAt, fade: 500, rise: 500 },
  foot: { at: INTRO.footAt, fade: INTRO.footMs, rise: 0 },
};

// The words come in with the scene: the logo and the title's first half first, its second half
// when everyone sits, the line under it when the game starts; the button from the start.
export function copyFrame(part: CopyPart, t: number): { opacity: number; dy: number } {
  'worklet';
  const from = COPY_FROM[part];
  const { at, fade, rise } = COPY_TIMES[part];
  const curve = part === 'logo' ? LOGO_IN : part === 'body' ? EASE : LINE_IN;
  return {
    opacity: step(t, at, fade, EASE),
    dy: rise > 0 ? from - from * step(t, at, rise, curve) : 0,
  };
}

// When a piece of the words stands still at full opacity, in ms from the scene's start: from then
// on it is drawn without motion (src/features/onboarding/introGate.ts).
export function copySettledAt(part: CopyPart): number {
  const { at, fade, rise } = COPY_TIMES[part];
  return at + Math.max(fade, rise);
}

// Sizes in px (v45: .obf-top svg, .obf-ring, .obf-fx i, .obf-ph, .obf-sw), and the scene's least
// height: it takes the room left over, shrinks on short screens and with large text, never under
// 160 (v45: .obf-scene min-height: max(160px, min(290px, 100svh - 392px))).
export const INTRO_SHAPE = {
  logo: 30,
  ring: 7,
  confetti: { w: 7, h: 14, r: 4 },
  phoneCorner: 0.22,
  screenCorner: 0.18,
  lampFoot: 6,
  bulb: 0.34,
  minHeight: 160,
  maxMinHeight: 290,
  words: 392,
} as const;

export function introMinHeight(windowHeight: number): number {
  return Math.max(
    INTRO_SHAPE.minHeight,
    Math.min(INTRO_SHAPE.maxMinHeight, windowHeight - INTRO_SHAPE.words),
  );
}

// The scene's colours (v45: .obf and its parts; the v45-dark block for the dark scheme).
type IntroPalette = {
  sky: {
    glow: string;
    stops: readonly [string, string, string];
    at: readonly [number, number, number];
  };
  table: { top: string; body: string; band: number };
  far: { top: string; body: string; band: number };
  shadow: { color: string; opacity: number };
  phone: {
    body: string;
    rim: string;
    screen: string;
    lit: readonly [string, string];
    glow: string;
  };
  ring: { fill: string; edge: string; glow: string };
  lamp: {
    shade: string;
    bulb: string;
    lit: string;
    glow: string;
    cone: string;
    coneOpacity: number;
  };
  skip: { fill: string; text: string };
  // The capsules' ink (accessories, shade, dark visor; the eyes stay dark).
  ink: string | undefined;
};

export const INTRO_CONFETTI = [
  '#FFB547',
  '#FF7A59',
  '#00B8A9',
  '#3BA9FF',
  '#9C86FF',
  '#FF6FA3',
] as const;

const LIGHT: IntroPalette = {
  sky: { glow: '#FFDCEA', stops: ['#FBE9F4', '#EEE7FF', '#F5F3FC'], at: [0, 0.52, 0.82] },
  table: { top: '#8C72FF', body: '#6A47F5', band: 0.26 },
  far: { top: '#DCD3FF', body: '#B9A6FF', band: 0.28 },
  shadow: { color: '#4A22A8', opacity: 0.16 },
  phone: {
    body: '#14112B',
    rim: '#14112B',
    screen: '#3B3458',
    lit: ['#C9BAFF', '#7F62FF'],
    glow: '0 0 14px 3px rgba(156, 134, 255, 0.75)',
  },
  ring: {
    fill: '#FFFFFF',
    edge: '0 0 0 2px rgba(106, 71, 245, 0.45)',
    glow: '0 0 14px 5px rgba(255, 255, 255, 0.85)',
  },
  lamp: {
    shade: '#3B3458',
    bulb: '#8F89AB',
    lit: '#FFE2A8',
    glow: '0 0 10px 4px rgba(255, 214, 150, 0.9)',
    cone: '#FFD696',
    coneOpacity: 0.55,
  },
  skip: { fill: 'rgba(20, 17, 43, 0.78)', text: '#FFFFFF' },
  ink: undefined,
};

export const INTRO_COLORS: Record<'light' | 'dark', IntroPalette> = {
  light: LIGHT,
  dark: {
    ...LIGHT,
    sky: { glow: '#3B2B92', stops: ['#1E1840', '#151131', '#110E1F'], at: [0, 0.55, 0.82] },
    far: { top: '#5B49A8', body: '#46378A', band: 0.28 },
    shadow: { color: '#000000', opacity: 0.45 },
    phone: { ...LIGHT.phone, body: '#0B0918', rim: '#2E2850' },
    ring: { ...LIGHT.ring, edge: '0 0 0 2px rgba(156, 134, 255, 0.5)' },
    lamp: { ...LIGHT.lamp, shade: '#5B5384', bulb: '#6E6890', coneOpacity: 0.42 },
    ink: FRIEND_DARK_INK,
  },
};
