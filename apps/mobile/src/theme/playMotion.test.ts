import { describe, expect, it } from 'vitest';

import { BAR_ICONS } from './barIcons';
import { cubicBezier } from './markMotion';
import {
  BADGE_BUMP,
  BELL_RING,
  BELL_RING_MS,
  bezierAt,
  CARD_EXITS,
  CARD_IN,
  CARD_OUT_MS,
  COVER_OPEN,
  DIAL,
  dialFacePath,
  DECK,
  EASE_COVER,
  EASE_SWAP,
  EASE_TURN,
  EQUALISER,
  equaliserHeight,
  fingerOnCard,
  ICON_SPRINGS,
  iconFormAt,
  keyAt,
  LETTER_WHEEL,
  letterWheelTimes,
  lobbyMorphAt,
  MARK_BARS,
  mixBar,
  ROLE_TURN,
  TILT,
  tiltFor,
  VINYL_TURN_MS,
} from './playMotion';

describe("the card's tilt (v45: tilt())", () => {
  it('leans toward the finger, up to 16° and 12°, 98 % while held', () => {
    expect(tiltFor(1, 1)).toEqual({
      rotateY: 16,
      rotateX: -12,
      scale: 0.98,
      shadowX: -12,
      shadowY: 24,
      glareX: 1,
      glareY: 1,
    });
    expect(tiltFor(0, 0).rotateY).toBe(0);
    expect(tiltFor(0, 0, false).scale).toBe(1);
  });

  it('never leans further than the edge', () => {
    expect(tiltFor(3, -5).rotateY).toBe(TILT.maxY);
    expect(tiltFor(3, -5).rotateX).toBe(TILT.maxX);
  });

  it('reads the finger from the centre of the card', () => {
    expect(fingerOnCard(150, 200, 300, 400)).toEqual([0, 0]);
    expect(fingerOnCard(0, 400, 300, 400)).toEqual([-1, 1]);
    expect(fingerOnCard(10, 10, 0, 0)).toEqual([0, 0]);
  });
});

describe('the deck', () => {
  it('shows two cards behind, the new card rising from the first', () => {
    expect(DECK).toHaveLength(2);
    expect(CARD_IN.from).toEqual(DECK[0]);
    expect(CARD_IN.ms).toBe(460);
  });

  it('Doğru leaves right, Pas left, "Yasak!" down, in 260 ms', () => {
    expect(CARD_OUT_MS).toBe(260);
    expect(CARD_EXITS.correct.x).toBeGreaterThan(1);
    expect(CARD_EXITS.pass.x).toBeLessThan(-1);
    expect(CARD_EXITS.forbidden).toMatchObject({ x: 0, scale: 0.86 });
  });
});

describe('the role card, the wheel, the record, the cover, the bell', () => {
  it('the role card turns over in 550 ms with a slight overshoot', () => {
    expect(ROLE_TURN).toEqual({ ms: 550, degrees: 180 });
    expect(Math.max(...[0.6, 0.7, 0.8].map(EASE_TURN))).toBeGreaterThan(1);
  });

  it('the wheel slows down tick by tick and lands before the question opens at 3 s', () => {
    const t = letterWheelTimes();
    expect(t).toHaveLength(LETTER_WHEEL.ticks);
    expect(t[0]).toBe(50);
    for (let i = 2; i < t.length; i++) {
      expect((t[i] as number) - (t[i - 1] as number)).toBeGreaterThan(
        (t[i - 1] as number) - (t[i - 2] as number),
      );
    }
    expect(t.at(-1)).toBe(1974);
    expect((t.at(-1) as number) + LETTER_WHEEL.landMs).toBeLessThan(LETTER_WHEEL.openMs);
  });

  it('the record turns every 2.4 s; the bars move between 30 % and full every 0.9 s', () => {
    expect(VINYL_TURN_MS).toBe(2400);
    expect(equaliserHeight(0)).toBeCloseTo(EQUALISER.low);
    expect(equaliserHeight(EQUALISER.periodMs / 2)).toBeCloseTo(1);
    expect(equaliserHeight(EQUALISER.periodMs)).toBeCloseTo(EQUALISER.low);
    expect(equaliserHeight(0, 450)).toBeCloseTo(1);
  });

  it("İbre's cover swings 175° away over 1 s after a 250 ms pause", () => {
    expect(COVER_OPEN).toMatchObject({ delayMs: 250, ms: 1000, degrees: -175 });
    expect(EASE_COVER(0)).toBeCloseTo(0);
    expect(EASE_COVER(1)).toBeCloseTo(1);
    expect(EASE_SWAP(0.5)).toBeCloseTo(0.5, 1);
  });

  it('the bell swings smaller each time, each swing with the pop, and rests where it started', () => {
    expect(BELL_RING_MS).toBe(900);
    const ring = BELL_RING.rotate;
    expect(keyAt(0, ring)).toBe(0);
    expect(keyAt(0.15, ring)).toBe(16);
    // Between two keys the pop overshoots the next one, as in v45's CSS keyframes.
    expect(Math.min(...[0.24, 0.26, 0.28].map((u) => keyAt(u, ring)))).toBeLessThan(-13);
    expect(keyAt(1, ring)).toBe(0);
    const peaks = ring.v.slice(1, -1).map(Math.abs);
    for (let i = 1; i < peaks.length; i++) {
      expect(peaks[i] as number).toBeLessThan(peaks[i - 1] as number);
    }
    expect(keyAt(0.15, BELL_RING.clapper)).toBe(-2);
    expect(keyAt(1, BELL_RING.clapper)).toBe(0);
    for (const k of [BELL_RING.rotate, BELL_RING.clapper]) expect(k.at).toHaveLength(k.v.length);
  });

  it('the badge bumps from 50 % past full size in 450 ms and settles at full size', () => {
    expect(BADGE_BUMP.ms).toBe(450);
    expect(keyAt(0, BADGE_BUMP.keys)).toBe(0.5);
    expect(keyAt(0.6, BADGE_BUMP.keys)).toBeCloseTo(1.22);
    expect(keyAt(1, BADGE_BUMP.keys)).toBe(1);
  });

  it("the UI-thread bezier is markMotion's cubicBezier", () => {
    const curve = [0.34, 1.56, 0.64, 1] as const;
    const js = cubicBezier(...curve);
    for (const u of [0, 0.1, 0.33, 0.5, 0.8, 1]) expect(bezierAt(curve, u)).toBeCloseTo(js(u), 4);
  });
});

describe("the bar icons' springs (v45: IC)", () => {
  // Within a twentieth of a unit and half a degree (v45 stops the springs at these times too): when
  // the motion stops, BarIcon draws the resting icon; the step is under a tenth of a pixel.
  const near = (a: { c: readonly number[]; L: number; r: number }, b: typeof a) => {
    expect(a.c[0]).toBeCloseTo(b.c[0] as number, 1);
    expect(a.c[1]).toBeCloseTo(b.c[1] as number, 1);
    expect(a.L).toBeCloseTo(b.L, 1);
    expect(Math.abs(a.r - b.r)).toBeLessThan(0.5);
  };

  it('a two-bar icon starts as the mark and springs into its drawing', () => {
    for (const kind of ['plus', 'cross', 'check'] as const) {
      near(iconFormAt(kind, 0).a, MARK_BARS.a);
      near(iconFormAt(kind, ICON_SPRINGS.formDelayMs).b, MARK_BARS.b);
      near(iconFormAt(kind, ICON_SPRINGS.formMs).a, BAR_ICONS[kind].a);
      near(iconFormAt(kind, ICON_SPRINGS.formMs).b, BAR_ICONS[kind].b);
    }
    // The spring overshoots: the plus's second bar turns past 90°.
    const turns = [200, 240, 280, 320].map((ms) => iconFormAt('plus', ms).b.r);
    expect(Math.max(...turns)).toBeGreaterThan(90);
  });

  it('pressed, it folds into the mark in 220 ms and springs out again', () => {
    near(iconFormAt('plus', 0, true).a, BAR_ICONS.plus.a);
    near(iconFormAt('plus', ICON_SPRINGS.foldMs, true).a, MARK_BARS.a);
    near(iconFormAt('plus', ICON_SPRINGS.pressMs, true).b, BAR_ICONS.plus.b);
  });

  it('the lobby bar turns flat with a softer spring, the slot going at once and back after 120 ms', () => {
    near(lobbyMorphAt('minus', 0).a, BAR_ICONS.lobby.a);
    near(lobbyMorphAt('minus', ICON_SPRINGS.morphMs).a, BAR_ICONS.minus.a);
    expect(lobbyMorphAt('minus', ICON_SPRINGS.slotAwayMs).s.o).toBeCloseTo(0);
    expect(lobbyMorphAt('lobby', 100).s.o).toBeCloseTo(0);
    expect(lobbyMorphAt('lobby', ICON_SPRINGS.slotBackDelayMs + ICON_SPRINGS.slotBackMs).s.o).toBe(
      BAR_ICONS.lobby.s.o,
    );
    near(lobbyMorphAt('lobby', ICON_SPRINGS.morphMs).a, BAR_ICONS.lobby.a);
  });

  it('mixes a bar part way, opacity and scale default to 1', () => {
    expect(mixBar(MARK_BARS.a, BAR_ICONS.plus.a, 0.5)).toEqual({
      c: [11.15, 11.2],
      L: 16,
      r: 0,
      o: 1,
      k: 1,
    });
  });
});

describe("İbre's dial", () => {
  it('the face and its cover are the half disc about the pivot (v45: 300 x 168, r 140)', () => {
    expect(dialFacePath()).toBe('M10 156A140 140 0 0 1 290 156Z');
    expect(DIAL.cy + 0).toBeLessThanOrEqual(DIAL.height);
    expect(DIAL.cx - DIAL.r).toBeGreaterThanOrEqual(0);
  });
});
