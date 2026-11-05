import { readSprengjaState, type SprengjaState } from '@shared/sprengja.ts';
import { describe, expect, it } from 'vitest';

import { sprengjaRing } from '../../../theme/sprengja';
import {
  arcPath,
  blastBuzz,
  endWords,
  mostHit,
  onCircle,
  ringSeats,
  scoreRows,
  throwsUntil,
} from './sprengjaView';

function state(over: Partial<SprengjaState> = {}): SprengjaState {
  const base = readSprengjaState({
    gameNo: 3,
    phase: 'lit',
    step: 5,
    round: 2,
    rounds: 5,
    players: 5,
    order: ['me', 'b', 'c', 'd', 'e'],
    gone: [],
    starter: 'me',
    holder: 'me',
    passes: 4,
    letters: 'KA',
    hits: {},
  });
  if (!base) throw new Error('state');
  return { ...base, ...over };
}

describe('the ring (Aura v99, 360/n clockwise, the caller at 90°)', () => {
  it('puts the caller at the bottom and the next clockwise', () => {
    const seats = ringSeats(['b', 'me', 'c'], [], 'me');
    expect(seats.map((s) => [s.sid, s.angle])).toEqual([
      ['b', 330],
      ['me', 90],
      ['c', 210],
    ]);
  });

  it('puts the order’s first at the bottom for a watcher', () => {
    expect(ringSeats(['a', 'b', 'c', 'd'], ['c'], 'w').map((s) => [s.angle, s.out])).toEqual([
      [90, false],
      [180, false],
      [270, true],
      [360, false],
    ]);
  });

  it('places the seats as the 390 panel does (SprengjaSende: Burak at 53, 215)', () => {
    const r = sprengjaRing(390, 5);
    const p = onCircle(162, r.radius, r.side / 2);
    expect(Math.round(p.x)).toBe(53);
    expect(Math.round(p.y - r.face / 2)).toBe(189);
  });

  it('has the 390 and the 320 panel’s sizes', () => {
    expect(sprengjaRing(390, 5)).toMatchObject({ side: 350, radius: 128, face: 52, label: 96 });
    expect(sprengjaRing(390, 8)).toMatchObject({ side: 350, radius: 132, face: 44, label: 88 });
    expect(sprengjaRing(320, 8)).toMatchObject({ side: 280, radius: 106, face: 40, label: 72 });
    expect(sprengjaRing(430, 3).side).toBe(350);
  });

  it('draws the arc clockwise and over a left seat (SprengjaSende, SprengjaHalka8)', () => {
    expect(arcPath(90, 162, 96, 175)).toBe('M175 271 A96 96 0 0 1 83.7 204.67');
    expect(arcPath(270, 360, 99, 175)).toMatch(/^M175 76 A99 99 0 0 1 274 175/);
    expect(arcPath(90, 330, 96, 175)).toContain(' 0 1 1 ');
  });
});

describe('throws until the bomb comes', () => {
  it('counts the players still in the game', () => {
    expect(throwsUntil(state({ holder: 'c' }), 'me')).toBe(3);
    expect(throwsUntil(state({ holder: 'c', gone: ['d'] }), 'me')).toBe(2);
    expect(throwsUntil(state({ holder: 'e' }), 'me')).toBe(1);
    expect(throwsUntil(state({ holder: 'c' }), 'watcher')).toBeNull();
  });
});

describe('scores', () => {
  it('lists those in the game by fewest blasts, those who left last', () => {
    const rows = scoreRows(state({ hits: { c: 2, b: 1, e: 1 }, gone: ['d'] }));
    expect(rows.map((r) => r.sid)).toEqual(['me', 'b', 'e', 'c', 'd']);
    expect([...mostHit(rows)]).toEqual(['c']);
  });

  it('marks nobody when everyone is equal', () => {
    const rows = scoreRows(state({ hits: { me: 1, b: 1, c: 1, d: 1, e: 1 } }));
    expect(mostHit(rows).size).toBe(0);
  });
});

describe('the end’s words', () => {
  const result = (winners: string[], hits: Record<string, number>, abandoned = false) => ({
    order: ['d', 'me', 'e', 'b', 'c'],
    gone: [],
    hits,
    round: 5,
    rounds: 5,
    winners,
    abandoned,
  });

  it('tells one, two, many, everyone and abandoned apart', () => {
    expect(endWords(result(['d'], { me: 1, e: 1, b: 1, c: 2 }), 'me')).toEqual({
      kind: 'one',
      sid: 'd',
      you: false,
      hits: 0,
    });
    expect(endWords(result(['me', 'd'], { e: 1, b: 2, c: 2 }), 'me')).toEqual({
      kind: 'two',
      others: ['d'],
      you: true,
      hits: 0,
    });
    expect(endWords(result(['e', 'd', 'me'], { b: 2, c: 3 }), 'me')).toMatchObject({
      kind: 'many',
      winners: ['d', 'me', 'e'],
      you: true,
    });
    const all = { d: 1, me: 1, e: 1, b: 1, c: 1 };
    expect(endWords(result(['d', 'me', 'e', 'b', 'c'], all), 'me')).toEqual({
      kind: 'all',
      hits: 1,
    });
    expect(endWords(result([], {}, true), 'me')).toEqual({ kind: 'abandoned' });
  });

  it('has as many blasts as rounds in the drawn finished games (v99)', () => {
    for (const hits of [
      { me: 1, e: 1, b: 1, c: 2 },
      { e: 1, b: 2, c: 2 },
      { b: 2, c: 3 },
      { d: 1, me: 1, e: 1, b: 1, c: 1 },
    ]) {
      expect(Object.values(hits).reduce((a, b) => a + b, 0)).toBe(5);
    }
  });
});

describe('the blast’s touch (K-85, the owner’s decision of 5 Kasım)', () => {
  const lit = { gameNo: 3, round: 2, phase: 'lit' as const };
  const blasted = (holder: string, gone = false) =>
    state({
      phase: 'summary',
      holder,
      lastBlast: { round: 2, holder, gone },
      hits: { [holder]: 1 },
    });

  it('buzzes the one it went off with, once the server settled it', () => {
    expect(blastBuzz(new Set(), lit, blasted('me'), 'me')).toBe('3:2');
  });

  it('never buzzes the others, a watcher or one who left', () => {
    expect(blastBuzz(new Set(), lit, blasted('b'), 'me')).toBeNull();
    expect(blastBuzz(new Set(), lit, blasted('b'), 'watcher')).toBeNull();
    expect(blastBuzz(new Set(), lit, blasted('me', true), 'me')).toBeNull();
  });

  it('never buzzes while the fuse burns, nor without having seen it burn', () => {
    expect(blastBuzz(new Set(), lit, state(), 'me')).toBeNull();
    expect(blastBuzz(new Set(), null, blasted('me'), 'me')).toBeNull();
    expect(blastBuzz(new Set(), { ...lit, phase: 'summary' }, blasted('me'), 'me')).toBeNull();
    expect(blastBuzz(new Set(), { ...lit, gameNo: 2 }, blasted('me'), 'me')).toBeNull();
  });

  it('buzzes at most once a game and round', () => {
    const done = new Set<string>();
    const seen: string[] = [];
    let before: { gameNo: number; round: number; phase: SprengjaState['phase'] } | null = lit;
    for (const now of [blasted('me'), blasted('me'), blasted('me')]) {
      const key = blastBuzz(done, before, now, 'me');
      if (key) {
        done.add(key);
        seen.push(key);
      }
      before = lit;
    }
    expect(seen).toEqual(['3:2']);
    const next = { ...blasted('me'), round: 3, lastBlast: { round: 3, holder: 'me', gone: false } };
    expect(blastBuzz(done, { ...lit, round: 3 }, next, 'me')).toBe('3:3');
    expect(blastBuzz(done, lit, { ...blasted('me'), gameNo: 4 }, 'me')).toBeNull();
    expect(blastBuzz(done, { ...lit, gameNo: 4 }, { ...blasted('me'), gameNo: 4 }, 'me')).toBe(
      '4:2',
    );
  });
});
