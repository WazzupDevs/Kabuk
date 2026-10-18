import { describe, expect, it } from 'vitest';

import {
  figurePoly,
  fitFriend,
  FRIEND,
  FRIEND_LOOKS,
  friendMoves,
  greeting,
  placeFriend,
  polyHits,
  type Rect,
  rectsHit,
} from './signupFriend';
import { SIGNUP_STEPS } from './signupSteps';

const SCREEN = 360;

describe('sign-up friends (v45 report §3)', () => {
  it('a different capsule on each of the seven steps', () => {
    const looks = SIGNUP_STEPS.map((s) => FRIEND_LOOKS[s]);
    expect(looks).toEqual(['shades', 'pirate', 'patch', 'cat', 'party', 'none', 'captain']);
    expect(new Set(looks).size).toBe(7);
  });

  it('the figure leans -14° about its bottom-right corner, 16 dp past the edge', () => {
    const poly = figurePoly(SCREEN, 100);
    // The bottom-right corner is the turning point.
    expect(poly[0]).toEqual([SCREEN + FRIEND.overhang, 100 + FRIEND.height]);
    // Its top sits about 2.4 dp under the box's top, its top-left corner about 60 dp in.
    const top = Math.min(...poly.map(([, y]) => y));
    expect(top).toBeCloseTo(102.4, 0);
    const left = Math.min(...poly.map(([x]) => x));
    expect(SCREEN - left).toBeCloseTo(59.7, 0);
  });

  it('stays clear of words and fields, moving up to 18 dp before it hides', () => {
    const top = 100;
    const topLimit = 60;
    expect(fitFriend(SCREEN, top, [], topLimit)).toBe(0);
    // Turned, its lowest corner sits about 14 dp under the box. A field 10 dp into its feet (with
    // the 4 dp margin): it moves up as little as it can.
    const field: Rect = { x: 20, y: top + 88, width: SCREEN - 40, height: 56 };
    expect(fitFriend(SCREEN, top, [field], topLimit)).toBe(12);
    // A field right across it: no room within 18 dp.
    const across: Rect = { x: 20, y: top + 20, width: SCREEN - 40, height: 56 };
    expect(fitFriend(SCREEN, top, [across], topLimit)).toBeNull();
    // A title line that ends 70 dp from the edge clears it; one that runs to the 42 dp inset meets
    // its top corner, and it moves up.
    const short: Rect = { x: 20, y: top + 6, width: SCREEN - 20 - 70, height: 34 };
    expect(fitFriend(SCREEN, top, [short], topLimit)).toBe(0);
    const long: Rect = {
      x: 20,
      y: top + 6,
      width: SCREEN - 20 - 20 - FRIEND.textInset,
      height: 34,
    };
    expect(fitFriend(SCREEN, top, [long], topLimit)).not.toBe(0);
  });

  // The CTO's 4.3d review: its moves must not cover anything either.
  it("does not jump over the step counter; the rest of its moves go on", () => {
    const top = 100;
    // "2/7" in the top row, right above it: its rest and shake stay under the row, its jump's top
    // (18 up) would reach the counter.
    const counter: Rect = { x: SCREEN - 64, y: top - 34, width: 32, height: 20 };
    expect(fitFriend(SCREEN, top, [counter], 60)).toBe(0);
    expect(friendMoves(SCREEN, top, 0, [counter], 60)).toEqual({
      jump: false,
      shake: true,
      nod: true,
    });
    expect(friendMoves(SCREEN, top, 0, [], 60)).toEqual({ jump: true, shake: true, nod: true });
  });

  it('does not shake its head over a title line that runs close to the edge', () => {
    const top = 100;
    // A line ending 70 dp from the edge clears it at rest; the shake's -24° reaches about 10 dp
    // further left, over the line's end. One ending 80 dp from the edge clears both.
    const near: Rect = { x: 20, y: top + 6, width: SCREEN - 20 - 70, height: 34 };
    expect(placeFriend(SCREEN, top, [near], 60)?.moves.shake).toBe(false);
    const far: Rect = { x: 20, y: top + 6, width: SCREEN - 20 - 80, height: 34 };
    expect(placeFriend(SCREEN, top, [far], 60)?.moves).toEqual({
      jump: true,
      shake: true,
      nod: true,
    });
  });

  it('rests a little higher when that lets it nod, and shows exactly where it fits at rest', () => {
    const top = 100;
    // A field 10 dp into its feet: at rest it needs 12 dp up, where the nod (6 down) would touch
    // the field; 18 dp up it nods too.
    const field: Rect = { x: 20, y: top + 88, width: SCREEN - 40, height: 56 };
    expect(fitFriend(SCREEN, top, [field], 60)).toBe(12);
    expect(friendMoves(SCREEN, top, 12, [field], 60).nod).toBe(false);
    expect(placeFriend(SCREEN, top, [field], 60)).toEqual({
      shift: 18,
      moves: { jump: true, shake: false, nod: true },
    });
    // Where it does not fit at rest it does not show, moves or not.
    const across: Rect = { x: 20, y: top + 20, width: SCREEN - 40, height: 56 };
    expect(placeFriend(SCREEN, top, [across], 60)).toBeNull();
  });

  it('never climbs into the top row', () => {
    const field: Rect = { x: 20, y: 170, width: 320, height: 56 };
    // With the top row right above, it cannot move up and so hides.
    expect(fitFriend(SCREEN, 100, [field], 102)).toBeNull();
  });

  it('separating axes: apart, touching within the margin, overlapping', () => {
    const poly = figurePoly(SCREEN, 100);
    expect(polyHits(poly, { x: 0, y: 0, width: 100, height: 20 })).toBe(false);
    expect(polyHits(poly, { x: SCREEN - 30, y: 150, width: 10, height: 10 })).toBe(true);
  });

  it('greets a valid name, a long one without the name, nobody before it is valid', () => {
    const labels = { named: (n: string) => `Selam ${n}!`, plain: 'Selam!' };
    expect(greeting(' Elif ', true, labels)).toBe('Selam Elif!');
    expect(greeting('Abdurrahmanım', true, labels)).toBe('Selam!');
    expect(greeting('Elif', false, labels)).toBeNull();
    expect(
      rectsHit({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 0, width: 5, height: 5 }, 14),
    ).toBe(true);
    expect(
      rectsHit({ x: 0, y: 0, width: 10, height: 10 }, { x: 30, y: 0, width: 5, height: 5 }, 14),
    ).toBe(false);
  });
});
