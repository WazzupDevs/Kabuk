import { describe, expect, it } from 'vitest';

import { cubicBezier } from './markMotion';
import {
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
  LETTER_WHEEL,
  letterWheelTimes,
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

describe('the role card, the wheel, the record, the cover', () => {
  it('the role card turns over in 550 ms with a slight overshoot', () => {
    // With reduce motion the face fades in 120 ms instead.
    expect(ROLE_TURN).toEqual({ ms: 550, degrees: 180, reducedMs: 120 });
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

  it("the UI-thread bezier is markMotion's cubicBezier", () => {
    const curve = [0.34, 1.56, 0.64, 1] as const;
    const js = cubicBezier(...curve);
    for (const u of [0, 0.1, 0.33, 0.5, 0.8, 1]) expect(bezierAt(curve, u)).toBeCloseTo(js(u), 4);
  });
});

describe("İbre's dial", () => {
  it('the face and its cover are the half disc about the pivot (v45: 300 x 168, r 140)', () => {
    expect(dialFacePath()).toBe('M10 156A140 140 0 0 1 290 156Z');
    expect(DIAL.cy + 0).toBeLessThanOrEqual(DIAL.height);
    expect(DIAL.cx - DIAL.r).toBeGreaterThanOrEqual(0);
  });
});
