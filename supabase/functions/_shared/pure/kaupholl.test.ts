import { describe, expect, it } from 'vitest';

import {
  buildBoard,
  C3_ODDS,
  decideAction,
  fewQuestions,
  formatTrNumber,
  KAUPHOLL,
  type KauphollCandidate,
  type KauphollDecision,
  type KauphollDifficulty,
  type KauphollQuestion,
  type KauphollRequest,
  type KauphollSecret,
  type KauphollState,
  leaveGame,
  limitsFor,
  mixFor,
  oddsFor,
  orderQuestions,
  parseTrNumber,
  publicState,
  respond,
  roundStats,
  scoreRound,
  selectQuestions,
  startGame,
  unusedCount,
  viewFor,
  winBucket,
  winnersOf,
  winningPos,
} from './kaupholl.ts';

// A seeded generator (mulberry32): the same seed, the same draw.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const T0 = new Date('2026-11-05T12:00:00.000Z');
const later = (from: Date, seconds: number) => new Date(from.getTime() + seconds * 1000);

// Fake questions: their secrets are marked so a leak is easy to find in any JSON.
const QUESTIONS: KauphollQuestion[] = [0, 1, 2, 3, 4].map((i) => ({
  id: `q${i}`,
  text: `Örnek soru ${i}`,
  unit: 'birim',
  decimals: 0,
  answer: 100,
  note: `SECRET_NOTE_${i}`,
  difficulty: (['hard', 'easy', 'medium', 'easy', 'medium'] as const)[i] as KauphollDifficulty,
}));

const SEATS = ['a', 'b', 'c', 'd'];

function started(seats = SEATS, questions = QUESTIONS) {
  const s = startGame({ seats, questions, now: T0 });
  if (!s.ok) throw new Error(s.code);
  return { state: s.state, secret: s.secret };
}

type Game = { state: KauphollState; secret: KauphollSecret };

function act(game: Game, sid: string, request: KauphollRequest, now = T0): KauphollDecision {
  return decideAction(game.state, game.secret, { sid }, request, now);
}

function apply(game: Game, sid: string, request: KauphollRequest, now = T0): Game {
  const d = act(game, sid, request, now);
  if (d.kind !== 'applied') throw new Error(`not applied: ${JSON.stringify(d)}`);
  return { state: d.state, secret: d.secret };
}

const advance = (game: Game, now: Date): Game =>
  apply(game, 'a', { action: 'advance', step: game.state.step }, now);

// A game in its guess phase.
function guessing(seats = SEATS): Game {
  const g = started(seats);
  return apply(g, seats[0] as string, { action: 'reveal', step: g.state.step });
}

function guessAll(game: Game, values: Record<string, number>, lock = true): Game {
  let g = game;
  for (const [sid, value] of Object.entries(values)) {
    g = apply(g, sid, { action: 'guess', step: g.state.step, seq: 1, value, lock });
  }
  return g;
}

describe('Turkish numbers', () => {
  it('reads dots as thousands and a comma as the decimal', () => {
    expect(parseTrNumber('8.760')).toBe(8760);
    expect(parseTrNumber('8,7')).toBe(8.7);
    expect(parseTrNumber('99.999,9')).toBe(99999.9);
    expect(parseTrNumber('999.999,9')).toBe(999999.9);
    expect(parseTrNumber('1.234.567')).toBeNull();
    expect(parseTrNumber('0')).toBe(0);
    expect(parseTrNumber('0,5')).toBe(0.5);
  });

  it('keeps "8.760" and "8,76" apart: two decimals are no number', () => {
    expect(parseTrNumber('8,76')).toBeNull();
    expect(parseTrNumber('8.76')).toBeNull();
    expect(parseTrNumber('8.7600')).toBeNull();
  });

  it('allows 6 whole digits and 1 decimal', () => {
    expect(parseTrNumber('999999')).toBe(999999);
    expect(parseTrNumber('1000000')).toBeNull();
    expect(parseTrNumber('12,')).toBeNull();
    expect(parseTrNumber(',5')).toBeNull();
    expect(parseTrNumber('-5')).toBeNull();
    expect(parseTrNumber('')).toBeNull();
  });

  it('drops leading zeros of a plain number, not of a grouped one', () => {
    expect(parseTrNumber('007')).toBe(7);
    expect(parseTrNumber('0000999999')).toBe(999999);
    expect(parseTrNumber('0.500')).toBeNull();
  });

  it('ignores whitespace around, not inside', () => {
    expect(parseTrNumber('  8.760 ')).toBe(8760);
    expect(parseTrNumber('8 760')).toBeNull();
    expect(parseTrNumber('8, 7')).toBeNull();
  });

  it('writes dots between thousands and a comma before the decimal', () => {
    expect(formatTrNumber(8760)).toBe('8.760');
    expect(formatTrNumber(8.7)).toBe('8,7');
    expect(formatTrNumber(99999.9)).toBe('99.999,9');
    expect(formatTrNumber(999999)).toBe('999.999');
    expect(formatTrNumber(0)).toBe('0');
    expect(formatTrNumber(12, 1)).toBe('12,0');
    expect(formatTrNumber(12.6, 0)).toBe('13');
    expect(formatTrNumber(0.1 + 0.2)).toBe('0,3');
  });

  it('reads back what it writes', () => {
    for (const v of [0, 7, 8.7, 999, 1000, 8760, 99999.9, 999999.9]) {
      expect(parseTrNumber(formatTrNumber(v))).toBe(v);
    }
  });
});

describe('the board', () => {
  it('has the C3 odds for 1 to 6 distinct guesses', () => {
    expect(C3_ODDS[3]).toEqual([6, 2, 2, 6]);
    expect(C3_ODDS[4]).toEqual([6, 3, 2, 3, 6]);
    expect(C3_ODDS[5]).toEqual([6, 4, 2, 2, 4, 6]);
    expect(C3_ODDS[6]).toEqual([6, 5, 3, 2, 3, 5, 6]);
    for (let k = 1; k <= 6; k += 1) expect(oddsFor(k)).toHaveLength(k + 1);
    expect(() => oddsFor(7)).toThrow();
  });

  it('sorts from the smallest and merges equal numbers in one slice', () => {
    const board = buildBoard({ a: 50, b: 10, c: 50, d: 30.0 }, SEATS);
    expect(board).toEqual([
      { pos: 0, value: null, authors: [], odds: 6 },
      { pos: 1, value: 10, authors: ['b'], odds: 2 },
      { pos: 2, value: 30, authors: ['d'], odds: 2 },
      { pos: 3, value: 50, authors: ['a', 'c'], odds: 6 },
    ]);
  });

  it('takes its odds from the distinct guesses, not the players', () => {
    expect(buildBoard({ a: 5, b: 5, c: 5 }, ['a', 'b', 'c'])?.map((s) => s.odds)).toEqual(
      C3_ODDS[1],
    );
    expect(buildBoard({ a: 5, b: 7 }, ['a', 'b', 'c'])?.map((s) => s.odds)).toEqual(C3_ODDS[2]);
  });

  it('is null when nobody guessed', () => {
    expect(buildBoard({}, SEATS)).toBeNull();
  });

  it('is won by the largest guess that does not pass the answer', () => {
    const board = buildBoard({ a: 10, b: 30, c: 50 }, SEATS) ?? [];
    expect(winningPos(board, 40)).toBe(2);
    expect(winningPos(board, 30)).toBe(2); // an equal guess wins
    expect(winningPos(board, 1000)).toBe(3);
    expect(winningPos(board, 9.9)).toBe(0); // "Hepsinden küçük"
    expect(winningPos(buildBoard({ a: 0.3 }, SEATS) ?? [], 0.1 + 0.2)).toBe(1); // tenths, not floats
  });

  it('pays the odds per coin and +3 to every author of the winning guess', () => {
    const board = buildBoard({ a: 10, b: 30, c: 30, d: 50 }, SEATS) ?? [];
    // 3 distinct: ×6 ×2 ×2 ×6; 30 wins (pos 2, ×2), written by b and c.
    const { winner, points } = scoreRound(
      board,
      40,
      { a: [2, 2], b: [2, 0], c: [null, null], d: [3, 1] },
      SEATS,
    );
    expect(winner).toBe(2);
    expect(points).toEqual({ a: 4, b: 2 + 3, c: 3, d: 0 });
  });

  it('gives no +3 when "Hepsinden küçük" wins', () => {
    const board = buildBoard({ a: 10, b: 30 }, SEATS) ?? [];
    const { winner, points } = scoreRound(board, 5, { a: [0, null], b: [1, 1] }, SEATS);
    expect(winner).toBe(0);
    expect(points).toEqual({ a: 6, b: 0, c: 0, d: 0 });
  });

  it('pays nobody who left; their slice stays and +3 goes to the other author', () => {
    const board = buildBoard({ a: 30, b: 30, c: 50 }, SEATS) ?? [];
    const { points } = scoreRound(board, 40, { a: [1, 1], b: [1, null] }, ['b', 'c', 'd']);
    expect(points).toEqual({ b: 2 + 3, c: 0, d: 0 }); // 2 distinct: ×6 ×2 ×6
    expect(points.a).toBeUndefined();
  });

  it('shares the win between equal scores', () => {
    expect(winnersOf({ a: 9, b: 12, c: 12, d: 3 }, SEATS)).toEqual(['b', 'c']);
    expect(winnersOf({ a: 20, b: 12, c: 12 }, ['b', 'c'])).toEqual(['b', 'c']);
  });

  it('names no winner when nobody scored (T-2)', () => {
    expect(winnersOf({ a: 0, b: 0, c: 0 }, ['a', 'b', 'c'])).toEqual([]);
    expect(winnersOf({}, SEATS)).toEqual([]);
  });
});

describe('the phases', () => {
  it('starts with 3 to 6 players and a 5th question that is not hard', () => {
    expect(startGame({ seats: ['a', 'b'], questions: QUESTIONS, now: T0 })).toEqual({
      ok: false,
      code: 'bad_players',
    });
    expect(
      startGame({ seats: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], questions: QUESTIONS, now: T0 }).ok,
    ).toBe(false);
    const hardLast = [...QUESTIONS.slice(1), QUESTIONS[0] as KauphollQuestion];
    expect(startGame({ seats: SEATS, questions: hardLast, now: T0 })).toEqual({
      ok: false,
      code: 'bad_questions',
    });
    const g = started();
    expect(g.state.phase).toBe('card');
    expect(g.state.endsAt).toBe(later(T0, 10).toISOString());
    expect(g.state.card).toBeNull();
  });

  it('opens the card on the first press; a second press changes nothing', () => {
    const g = started();
    const opened = apply(g, 'b', { action: 'reveal', step: g.state.step }, later(T0, 3));
    expect(opened.state.phase).toBe('guess');
    expect(opened.state.card).toEqual({ text: 'Örnek soru 0', unit: 'birim', decimals: 0 });
    expect(opened.state.endsAt).toBe(later(T0, 3 + 45).toISOString());
    expect(act(opened, 'c', { action: 'reveal', step: g.state.step })).toEqual({ kind: 'noop' });
  });

  it('opens the card by itself after 10 s', () => {
    const g = started();
    expect(act(g, 'a', { action: 'advance', step: g.state.step }, later(T0, 9.9)).kind).toBe(
      'noop',
    );
    const opened = advance(g, later(T0, 10));
    expect(opened.state.phase).toBe('guess');
  });

  it('moves on early when everyone locked their guess, else at 45 s', () => {
    let g = guessing();
    g = guessAll(g, { a: 10, b: 20, c: 30 });
    expect(g.state.phase).toBe('guess');
    expect(g.state.chips).toEqual({ a: 'locked', b: 'locked', c: 'locked', d: 'none' });
    g = apply(g, 'd', { action: 'guess', step: g.state.step, seq: 1, value: 40, lock: true });
    expect(g.state.phase).toBe('board');
    expect(g.state.board).toHaveLength(5);
    expect(g.state.endsAt).toBe(later(T0, 20).toISOString());
  });

  it('locks every recorded guess when time runs out; a player with none has no slice', () => {
    let g = guessing();
    g = guessAll(g, { a: 30, b: 90 }, false);
    expect(g.state.chips).toMatchObject({ a: 'written', b: 'written', c: 'none' });
    expect(act(g, 'a', { action: 'advance', step: g.state.step }, later(T0, 44)).kind).toBe('noop');
    g = advance(g, later(T0, 45));
    expect(g.state.phase).toBe('board');
    expect(g.state.board?.map((s) => s.authors)).toEqual([[], ['a'], ['b']]);
    expect(g.state.chips).toEqual({ a: 'locked', b: 'locked', c: 'none', d: 'none' });
    expect(viewFor({ sid: 'a' }, g.state, g.secret)).toMatchObject({
      guess: { value: 30, seq: 1, locked: true },
    });
  });

  it('scores an auto-locked guess like one locked by hand (+3 when it wins)', () => {
    const run = (lock: boolean) => {
      let g = guessing();
      g = guessAll(g, { a: 90, b: 150 }, lock);
      if (g.state.phase === 'guess') g = advance(g, later(T0, 45));
      g = advance(g, later(T0, 90)); // board to answer, nobody bet
      return g.state;
    };
    const byHand = run(true);
    const byTime = run(false);
    expect(byTime.points).toEqual(byHand.points);
    expect(byTime.points.a).toBe(3);
    expect(byTime.winner).toBe(1);
  });

  it('skips the board when nobody guessed', () => {
    const g = advance(guessing(), later(T0, 45));
    expect(g.state.phase).toBe('answer');
    expect(g.state.board).toBeNull();
    expect(g.state.noGuesses).toBe(true);
    expect(g.state.answer).toEqual({
      value: 100,
      unit: 'birim',
      decimals: 0,
      note: 'SECRET_NOTE_0',
    });
    expect(g.state.points).toEqual({ a: 0, b: 0, c: 0, d: 0 });
  });

  it('opens the answer early when everyone locked their coins, else at 20 s', () => {
    let g = guessAll(guessing(), { a: 10, b: 50, c: 150, d: 200 });
    const step = g.state.step;
    g = apply(g, 'a', { action: 'bet', step, seq: 1, coins: [2, 2], lock: true });
    g = apply(g, 'b', { action: 'bet', step, seq: 1, coins: [2, null], lock: true });
    g = apply(g, 'c', { action: 'bet', step, seq: 1, coins: [null, null], lock: true });
    expect(g.state.phase).toBe('board');
    g = apply(g, 'd', { action: 'bet', step, seq: 1, coins: [0, 1], lock: false });
    expect(g.state.phase).toBe('board');
    g = advance(g, later(T0, 20));
    expect(g.state.phase).toBe('answer');
    expect(g.state.winner).toBe(2); // 50 ≤ 100 < 150
    expect(g.state.points).toEqual({ a: 4, b: 2 + 3, c: 0, d: 0 });
    expect(g.state.bets.d?.locked).toBe(true);
  });

  it('moves the pauses on when everyone is ready, or after 10 s', () => {
    let g = advance(guessing(), later(T0, 45));
    for (const sid of ['a', 'b', 'c']) g = apply(g, sid, { action: 'ready', step: g.state.step });
    expect(g.state.phase).toBe('answer');
    expect(act(g, 'a', { action: 'ready', step: g.state.step })).toEqual({ kind: 'noop' });
    g = apply(g, 'd', { action: 'ready', step: g.state.step });
    expect(g.state.phase).toBe('summary');
    g = advance(g, later(T0, 55));
    expect(g.state.phase).toBe('card');
    expect(g.state.round).toBe(1);
  });

  it('advances one phase at a time after a long gap, the new clock from now', () => {
    const g = started();
    const back = later(T0, 3600);
    const once = advance(g, back);
    expect(once.state.phase).toBe('guess');
    expect(once.state.endsAt).toBe(later(back, 45).toISOString());
    expect(act(once, 'a', { action: 'advance', step: g.state.step }, back)).toEqual({
      kind: 'noop',
    });
  });

  it('ends after 5 questions with the top scores sharing the win', () => {
    let g = started();
    let now = T0;
    while (g.state.phase !== 'over') {
      now = later(now, 60);
      if (g.state.phase === 'guess') {
        // a and b write the same winning guess every question.
        g = guessAll(g, { a: 90, b: 90 }, false);
      }
      g = advance(g, now);
    }
    expect(g.state.round).toBe(4);
    expect(g.state.scores).toEqual({ a: 15, b: 15, c: 0, d: 0 });
    expect(g.state.winners).toEqual(['a', 'b']);
    expect(act(g, 'a', { action: 'advance', step: g.state.step }, later(now, 99))).toEqual({
      kind: 'noop',
    });
  });
});

describe('decideAction', () => {
  it('lets only players act; an observer may only advance', () => {
    const g = guessing();
    expect(
      act(g, 'x', { action: 'guess', step: g.state.step, seq: 1, value: 1, lock: false }),
    ).toEqual({ kind: 'error', code: 'not_player' });
    expect(act(g, 'x', { action: 'ready', step: g.state.step })).toEqual({
      kind: 'error',
      code: 'not_player',
    });
    expect(act(g, 'x', { action: 'advance', step: g.state.step }, later(T0, 45)).kind).toBe(
      'applied',
    );
  });

  it('rejects a decimal guess on a whole-number question (T-1)', () => {
    const g = guessing();
    const step = g.state.step;
    expect(act(g, 'a', { action: 'guess', step, seq: 1, value: 12.5, lock: false })).toEqual({
      kind: 'error',
      code: 'bad_request',
    });
    expect(act(g, 'a', { action: 'guess', step, seq: 1, value: 12, lock: false }).kind).toBe(
      'applied',
    );
  });

  it('answers a decimal guess before the card opens like any other (rule 3, T-1)', () => {
    const g = started();
    expect(g.state.phase).toBe('card');
    const step = g.state.step;
    expect(act(g, 'a', { action: 'guess', step, seq: 1, value: 12.5, lock: false })).toEqual(
      act(g, 'a', { action: 'guess', step, seq: 1, value: 12, lock: false }),
    );
  });

  it('rejects a seq outside 1–10.000 and a value with more than 6+1 digits', () => {
    const g = guessing();
    const step = g.state.step;
    for (const seq of [0, -1, 10_001, 1.5]) {
      expect(act(g, 'a', { action: 'guess', step, seq, value: 1, lock: false })).toEqual({
        kind: 'error',
        code: 'bad_request',
      });
    }
    expect(act(g, 'a', { action: 'guess', step, seq: 10_000, value: 1, lock: false }).kind).toBe(
      'applied',
    );
    for (const value of [1_000_000, -1, 1.25, Number.NaN]) {
      expect(act(g, 'a', { action: 'guess', step, seq: 1, value, lock: false }).kind).toBe('error');
    }
  });

  it('follows the seq table for guesses', () => {
    let g = guessing();
    const step = g.state.step;
    g = apply(g, 'a', { action: 'guess', step, seq: 2, value: 20, lock: false });
    // equal seq, same content: a repeat
    expect(act(g, 'a', { action: 'guess', step, seq: 2, value: 20, lock: false })).toEqual({
      kind: 'replayed',
      result: { action: 'guess', seq: 2, value: 20, locked: false },
    });
    // equal seq, other content: a conflict, nothing changes
    expect(act(g, 'a', { action: 'guess', step, seq: 2, value: 21, lock: false })).toEqual({
      kind: 'error',
      code: 'seq_conflict',
    });
    // older seq
    expect(act(g, 'a', { action: 'guess', step, seq: 1, value: 5, lock: false })).toEqual({
      kind: 'not_applied',
      reason: 'outdated',
    });
    // a gap is fine
    g = apply(g, 'a', { action: 'guess', step, seq: 7, value: 70, lock: false });
    expect(viewFor({ sid: 'a' }, g.state, g.secret)).toMatchObject({
      guess: { value: 70, seq: 7, locked: false },
    });
  });

  it('changes nothing after a lock, but answers a repeat of the lock', () => {
    let g = guessing();
    const step = g.state.step;
    g = apply(g, 'a', { action: 'guess', step, seq: 3, value: 30, lock: true });
    expect(act(g, 'a', { action: 'guess', step, seq: 3, value: 30, lock: true })).toEqual({
      kind: 'replayed',
      result: { action: 'guess', seq: 3, value: 30, locked: true },
    });
    for (const seq of [4, 3, 1]) {
      expect(act(g, 'a', { action: 'guess', step, seq, value: 31, lock: false })).toEqual({
        kind: 'not_applied',
        reason: 'locked',
      });
    }
  });

  it('applies nothing once the phase closed, from endsAt on', () => {
    const g = guessing();
    const step = g.state.step;
    const ends = Date.parse(g.state.endsAt);
    const req = { action: 'guess', step, seq: 1, value: 5, lock: false } as const;
    expect(act(g, 'a', req, new Date(ends - 50)).kind).toBe('applied');
    expect(act(g, 'a', req, new Date(ends))).toEqual({ kind: 'not_applied', reason: 'phase_over' });
    expect(act(g, 'a', req, new Date(ends + 1))).toEqual({
      kind: 'not_applied',
      reason: 'phase_over',
    });
    const board = advance(guessAll(g, { b: 5 }, false), new Date(ends));
    expect(act(board, 'a', req, new Date(ends))).toEqual({
      kind: 'not_applied',
      reason: 'phase_over',
    });
  });

  it('keeps the auto-locked value against a guess after the move', () => {
    let g = guessAll(guessing(), { a: 30 }, false);
    const step = g.state.step;
    g = advance(g, later(T0, 45));
    expect(act(g, 'a', { action: 'guess', step, seq: 2, value: 99, lock: true })).toEqual({
      kind: 'not_applied',
      reason: 'phase_over',
    });
    // the request whose answer was lost, sent again: the same answer
    expect(act(g, 'a', { action: 'guess', step, seq: 1, value: 30, lock: false })).toEqual({
      kind: 'replayed',
      result: { action: 'guess', seq: 1, value: 30, locked: true },
    });
    expect(g.state.board?.[1]?.value).toBe(30);
  });

  it('follows the seq table for bets, a placement being its two positions', () => {
    let g = guessAll(guessing(), { a: 10, b: 50 });
    g = advance(g, later(T0, 45));
    const step = g.state.step;
    g = apply(g, 'c', { action: 'bet', step, seq: 1, coins: [1, 2], lock: false });
    expect(act(g, 'c', { action: 'bet', step, seq: 1, coins: [2, 1], lock: false }).kind).toBe(
      'replayed',
    );
    expect(act(g, 'c', { action: 'bet', step, seq: 1, coins: [2, 2], lock: false })).toEqual({
      kind: 'error',
      code: 'seq_conflict',
    });
    expect(act(g, 'c', { action: 'bet', step, seq: 1, coins: [1, 2], lock: true })).toEqual({
      kind: 'error',
      code: 'seq_conflict',
    });
    expect(act(g, 'c', { action: 'bet', step, seq: 0, coins: [1, 2], lock: false }).kind).toBe(
      'error',
    );
    expect(act(g, 'c', { action: 'bet', step, seq: 2, coins: [3, null], lock: false })).toEqual({
      kind: 'error',
      code: 'bad_request',
    });
    // a player who did not guess bets too; 0 or 1 coins lock as well
    g = apply(g, 'c', { action: 'bet', step, seq: 4, coins: [0, null], lock: true });
    expect(act(g, 'c', { action: 'bet', step, seq: 5, coins: [1, 1], lock: false })).toEqual({
      kind: 'not_applied',
      reason: 'locked',
    });
    expect(act(g, 'c', { action: 'bet', step, seq: 3, coins: [1, 1], lock: false })).toEqual({
      kind: 'not_applied',
      reason: 'locked',
    });
    // the lock carries the last placement
    expect(g.state.bets.c).toMatchObject({ coins: [0, null], locked: true, seq: 4 });
  });

  it('refuses a bet outside the board phase', () => {
    const g = guessing();
    expect(
      act(g, 'a', { action: 'bet', step: g.state.step, seq: 1, coins: [0, 0], lock: true }),
    ).toEqual({ kind: 'not_applied', reason: 'phase_over' });
  });

  it('moves once when the last lock and an advance meet', () => {
    let g = guessAll(guessing(), { a: 1, b: 2, c: 3 });
    const step = g.state.step;
    g = apply(g, 'd', { action: 'guess', step, seq: 1, value: 4, lock: true }, later(T0, 44.9));
    expect(g.state.phase).toBe('board');
    // the advance that comes after, for the old step, does nothing
    expect(act(g, 'b', { action: 'advance', step }, later(T0, 45))).toEqual({ kind: 'noop' });
  });
});

describe('leaving', () => {
  it('drops the guess of who leaves while guessing', () => {
    const g = guessAll(guessing(), { a: 10, b: 20 }, false);
    const left = leaveGame(g.state, g.secret, 'a', T0);
    if (left.abandoned) throw new Error('abandoned');
    expect(left.secret.guesses.a).toBeUndefined();
    expect(left.state.chips.a).toBeUndefined();
    const board = advance({ state: left.state, secret: left.secret }, later(T0, 45));
    expect(board.state.board?.map((s) => s.value)).toEqual([null, 20]);
  });

  it('keeps the slice and drops the coins of who leaves after the board', () => {
    let g = guessAll(guessing(), { a: 90, b: 90, c: 200 });
    g = advance(g, later(T0, 45));
    const step = g.state.step;
    g = apply(g, 'a', { action: 'bet', step, seq: 1, coins: [1, 1], lock: false });
    const left = leaveGame(g.state, g.secret, 'a', T0);
    if (left.abandoned) throw new Error('abandoned');
    expect(left.state.board?.[1]?.authors).toEqual(['a', 'b']);
    expect(left.state.bets.a).toBeUndefined();
    const answer = advance({ state: left.state, secret: left.secret }, later(T0, 70));
    expect(answer.state.points).toEqual({ b: 3, c: 0, d: 0 });
  });

  it('ends the phase now when the leaver was the last one it waited for', () => {
    const g = guessAll(guessing(), { a: 1, b: 2, c: 3 });
    const now = later(T0, 5);
    const left = leaveGame(g.state, g.secret, 'd', now);
    if (left.abandoned) throw new Error('abandoned');
    expect(left.state.endsAt).toBe(now.toISOString());
    expect(advance({ state: left.state, secret: left.secret }, now).state.phase).toBe('board');
  });

  it('abandons the game below two players: no winner, no result', () => {
    let g: Game = guessing(['a', 'b', 'c']);
    const first = leaveGame(g.state, g.secret, 'a', T0);
    if (first.abandoned) throw new Error('abandoned too early');
    g = { state: first.state, secret: first.secret };
    expect(leaveGame(g.state, g.secret, 'b', T0)).toEqual({ abandoned: true });
  });

  it('leaves the winner to those still in the game', () => {
    expect(winnersOf({ a: 30, b: 12, c: 9 }, ['b', 'c'])).toEqual(['b']);
  });
});

describe('what leaves the server', () => {
  const leaks = (state: KauphollState) => JSON.stringify(publicState(state));

  it('carries no secret field in its type or its copy', () => {
    const g = guessAll(guessing(), { a: 12345, b: 67 }, false);
    const json = leaks(g.state);
    expect(json).not.toContain('12345');
    expect(json).not.toContain('SECRET_NOTE');
    expect(json).not.toContain('"questions"');
    expect(json).not.toContain('"guesses"');
    expect(Object.keys(publicState(g.state)).sort()).toEqual(Object.keys(g.state).sort());
  });

  it('shows the question only from the card’s opening, the answer only from its phase', () => {
    const card = started();
    expect(leaks(card.state)).not.toContain('Örnek soru');
    const guess = guessAll(guessing(), { a: 5 });
    expect(leaks(guess.state)).toContain('Örnek soru 0');
    expect(publicState(guess.state).answer).toBeNull();
    const board = advance(guess, later(T0, 45));
    expect(board.state.phase).toBe('board');
    expect(leaks(board.state)).not.toContain('SECRET_NOTE');
    expect(publicState(board.state).answer).toBeNull();
    const answer = advance(board, later(T0, 70));
    expect(publicState(answer.state).answer?.note).toBe('SECRET_NOTE_0');
  });

  it('cuts nothing from a forged state: the board and the answer wait for their phase', () => {
    const g = guessing();
    const forged: KauphollState = {
      ...g.state,
      board: [{ pos: 0, value: null, authors: [], odds: 6 }],
      answer: { value: 100, unit: 'birim', decimals: 0, note: 'SECRET_NOTE_0' },
      winner: 0,
      points: { a: 6 },
    };
    const out = publicState(forged);
    expect(out.board).toBeNull();
    expect(out.answer).toBeNull();
    expect(out.winner).toBeNull();
    expect(out.points).toEqual({});
  });

  it('gives a phone only its own guess, an observer nothing', () => {
    const g = guessAll(guessing(), { a: 12345, b: 67 }, false);
    const mine = viewFor({ sid: 'a' }, g.state, g.secret);
    expect(mine).toEqual({
      role: 'player',
      guess: { value: 12345, seq: 1, locked: false },
      bet: null,
    });
    expect(JSON.stringify(mine)).not.toContain('67');
    expect(viewFor({ sid: 'c' }, g.state, g.secret)).toEqual({
      role: 'player',
      guess: null,
      bet: null,
    });
    const observer = viewFor({ sid: 'x' }, g.state, g.secret);
    expect(observer).toEqual({ role: 'observer' });
  });

  it('forgets the last question’s guess in the view once a new card comes', () => {
    let g = guessAll(guessing(), { a: 12345 });
    let now = T0;
    while (g.state.round === 0) {
      now = later(now, 60);
      g = advance(g, now);
    }
    expect(viewFor({ sid: 'a' }, g.state, g.secret)).toMatchObject({ guess: null, bet: null });
  });
});

// --- Selecting questions ------------------------------------------------------------------------------

let nextId = 0;
function q(
  difficulty: KauphollDifficulty,
  bias: KauphollCandidate['bias'] = 'neutral',
  category = `c${nextId}`,
  games = 0,
): KauphollCandidate {
  nextId += 1;
  return { id: `id${nextId}`, difficulty, bias, category, active: true, games };
}
const many = (n: number, make: () => KauphollCandidate) => Array.from({ length: n }, make);
const byId = (pool: KauphollCandidate[]) => new Map(pool.map((c) => [c.id, c]));
const picked = (pool: KauphollCandidate[], ids: string[]) =>
  ids.map((id) => byId(pool).get(id) as KauphollCandidate);
const count = <T>(items: T[], f: (t: T) => boolean) => items.filter(f).length;

describe('selecting questions', () => {
  it('uses level 0 when the target can be met: 2 easy, 2 medium, 1 hard', () => {
    const pool = [
      ...many(5, () => q('easy')),
      ...many(5, () => q('medium')),
      ...many(5, () => q('hard')),
    ];
    const s = selectQuestions(pool, [], rng(1));
    if (!s.ok) throw new Error('exhausted');
    expect(s.level).toBe(0);
    const five = picked(pool, s.ids);
    expect(new Set(s.ids).size).toBe(5);
    expect(count(five, (c) => c.difficulty === 'easy')).toBe(2);
    expect(count(five, (c) => c.difficulty === 'medium')).toBe(2);
    expect(count(five, (c) => c.difficulty === 'hard')).toBe(1);
  });

  it('keeps level 0’s limits: 2 per category, 1 over and 1 under', () => {
    const pool = [
      ...many(4, () => q('easy', 'over', 'x')),
      ...many(4, () => q('medium', 'under', 'x')),
      ...many(2, () => q('hard', 'over', 'y')),
      q('easy', 'neutral', 'z'),
      q('easy', 'neutral', 'v'),
      q('medium', 'neutral', 'w'),
    ];
    const s = selectQuestions(pool, [], rng(2));
    if (!s.ok) throw new Error('exhausted');
    expect(s.level).toBe(0);
    const five = picked(pool, s.ids);
    expect(count(five, (c) => c.bias === 'over')).toBeLessThanOrEqual(1);
    expect(count(five, (c) => c.bias === 'under')).toBeLessThanOrEqual(1);
    expect(count(five, (c) => c.category === 'x')).toBeLessThanOrEqual(2);
  });

  it('level 1: a missing difficulty takes its neighbour', () => {
    const avail = (easy: number, medium: number, hard: number) => ({ easy, medium, hard });
    expect(mixFor(1, avail(0, 9, 9))).toEqual({ easy: 0, medium: 4, hard: 1 });
    expect(mixFor(1, avail(9, 9, 0))).toEqual({ easy: 2, medium: 3, hard: 0 });
    expect(mixFor(1, avail(9, 0, 9))).toEqual({ easy: 4, medium: 0, hard: 1 });
    expect(mixFor(1, avail(3, 0, 9))).toEqual({ easy: 3, medium: 0, hard: 2 });
    expect(mixFor(1, avail(2, 0, 9))).toEqual({ easy: 2, medium: 0, hard: 3 });
    expect(mixFor(1, avail(1, 0, 9))).toBeNull(); // 4 hard
    expect(mixFor(1, avail(0, 0, 9))).toBeNull();
    expect(mixFor(0, avail(9, 1, 9))).toBeNull();
    const pool = [...many(4, () => q('easy')), ...many(2, () => q('hard'))];
    const s = selectQuestions(pool, [], rng(3));
    expect(s).toMatchObject({ ok: true, level: 1 });
  });

  it('level 2: up to 3 of a category', () => {
    const pool = [
      ...many(2, () => q('easy', 'neutral', 'x')),
      ...many(2, () => q('medium', 'neutral', 'x')),
      q('hard', 'neutral', 'x'),
      q('easy', 'neutral', 'y'),
      q('medium', 'neutral', 'y'),
    ];
    const s = selectQuestions(pool, [], rng(4));
    if (!s.ok) throw new Error('exhausted');
    expect(s.level).toBe(2);
    expect(count(picked(pool, s.ids), (c) => c.category === 'x')).toBe(3);
    expect(limitsFor(2)).toEqual({ category: 3, bias: 1 });
  });

  it('level 3: up to 2 of a leaning, never 3', () => {
    const pool = [
      q('easy', 'over'),
      q('easy', 'neutral'),
      q('medium', 'over'),
      q('medium', 'neutral'),
      q('hard', 'neutral'),
    ];
    const s = selectQuestions(pool, [], rng(5));
    if (!s.ok) throw new Error('exhausted');
    expect(s.level).toBe(3);
    expect(count(picked(pool, s.ids), (c) => c.bias === 'over')).toBe(2);
    const tooOver = [
      ...many(3, () => q('easy', 'over')),
      ...many(2, () => q('medium', 'over')),
      q('hard', 'over'),
    ];
    expect(selectQuestions(tooOver, [], rng(5))).toEqual({
      ok: false,
      code: 'questions_exhausted',
    });
  });

  it('level 4: no category limit', () => {
    const pool = [
      ...many(2, () => q('easy', 'neutral', 'x')),
      ...many(2, () => q('medium', 'neutral', 'x')),
      q('hard', 'neutral', 'x'),
    ];
    expect(selectQuestions(pool, [], rng(6))).toMatchObject({ ok: true, level: 4 });
    expect(limitsFor(4).category).toBe(Number.POSITIVE_INFINITY);
  });

  it('never picks a question used at this table, on any level', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const pool = [
        ...many(3, () => q('easy', 'neutral', 'x')),
        ...many(3, () => q('medium', 'over', 'x')),
        ...many(2, () => q('hard', 'under', 'x')),
      ];
      const used = [pool[0]?.id, pool[3]?.id, pool[6]?.id] as string[];
      const s = selectQuestions(pool, used, rng(seed));
      if (s.ok) for (const id of s.ids) expect(used).not.toContain(id);
    }
  });

  it('plays through the whole deck at a table without a repeat, then runs out', () => {
    const pool = [
      ...many(8, () => q('easy')),
      ...many(8, () => q('medium')),
      ...many(4, () => q('hard')),
    ];
    const used: string[] = [];
    let games = 0;
    const r = rng(7);
    for (;;) {
      const s = selectQuestions(pool, used, r);
      if (!s.ok) break;
      for (const id of s.ids) expect(used).not.toContain(id);
      used.push(...s.ids);
      games += 1;
    }
    expect(games).toBe(4);
    expect(new Set(used).size).toBe(20);
  });

  it('runs out with 4 unused questions', () => {
    const pool = [q('easy'), q('easy'), q('medium'), q('hard'), q('medium')];
    expect(selectQuestions(pool, [pool[4]?.id as string], rng(8))).toEqual({
      ok: false,
      code: 'questions_exhausted',
    });
    expect(selectQuestions(pool.slice(0, 4), [], rng(8)).ok).toBe(false);
  });

  it('runs out with 5 or more unused but no valid five: all hard, all leaning one way', () => {
    expect(
      selectQuestions(
        many(6, () => q('hard')),
        [],
        rng(9),
      ).ok,
    ).toBe(false);
    expect(
      selectQuestions(
        many(12, () => q('easy', 'under')),
        [],
        rng(9),
      ).ok,
    ).toBe(false);
    const onlyHardLeft = [...many(5, () => q('easy')), ...many(5, () => q('hard'))];
    const used = onlyHardLeft.filter((c) => c.difficulty === 'easy').map((c) => c.id);
    expect(selectQuestions(onlyHardLeft, used, rng(9))).toEqual({
      ok: false,
      code: 'questions_exhausted',
    });
  });

  it('skips inactive questions and counts only active, unused ones for the warning', () => {
    const pool = [...many(5, () => q('easy')), ...many(5, () => q('medium')), q('hard')];
    const off = pool.map((c, i) => (i === 10 ? { ...c, active: false } : c));
    expect(selectQuestions(off, [], rng(10))).toMatchObject({ ok: true, level: 1 });
    expect(unusedCount(off, [pool[0]?.id as string])).toBe(9);
    expect(fewQuestions(9)).toBe(true);
    expect(fewQuestions(10)).toBe(false);
  });

  it('prefers the least played questions', () => {
    const fresh = [
      q('easy', 'neutral', 'a', 0),
      q('easy', 'neutral', 'b', 0),
      q('medium', 'neutral', 'c', 1),
      q('medium', 'neutral', 'd', 1),
      q('hard', 'neutral', 'e', 2),
    ];
    const worn = [
      ...many(5, () => q('easy', 'neutral', undefined, 9)),
      ...many(5, () => q('medium', 'neutral', undefined, 9)),
      ...many(3, () => q('hard', 'neutral', undefined, 9)),
    ];
    for (let seed = 0; seed < 50; seed += 1) {
      const s = selectQuestions([...worn, ...fresh], [], rng(seed));
      if (!s.ok) throw new Error('exhausted');
      expect(new Set(s.ids)).toEqual(new Set(fresh.map((c) => c.id)));
    }
  });

  it('gives the same five in the same order for the same seed', () => {
    const pool = [
      ...many(9, () => q('easy')),
      ...many(9, () => q('medium')),
      ...many(9, () => q('hard')),
    ];
    expect(selectQuestions(pool, [], rng(42))).toEqual(selectQuestions(pool, [], rng(42)));
  });
});

describe('the order of the five', () => {
  const five = (d: KauphollDifficulty[]) => d.map((difficulty, i) => ({ id: `o${i}`, difficulty }));

  it('never puts a hard question 5th, for 1, 2 or 3 hard ones', () => {
    for (const mix of [
      ['easy', 'easy', 'medium', 'medium', 'hard'],
      ['easy', 'medium', 'medium', 'hard', 'hard'],
      ['easy', 'easy', 'hard', 'hard', 'hard'],
    ] as KauphollDifficulty[][]) {
      for (let seed = 0; seed < 2000; seed += 1) {
        const order = orderQuestions(five(mix), rng(seed));
        expect(order[4]?.difficulty).not.toBe('hard');
        expect(new Set(order.map((o) => o.id)).size).toBe(5);
      }
    }
  });

  it('puts the hard question on each of positions 1–4 equally often (25% ± 2)', () => {
    const at = [0, 0, 0, 0, 0];
    const seeds = 10_000;
    for (let seed = 0; seed < seeds; seed += 1) {
      const order = orderQuestions(five(['easy', 'easy', 'medium', 'medium', 'hard']), rng(seed));
      const i = order.findIndex((o) => o.difficulty === 'hard');
      at[i] = (at[i] ?? 0) + 1;
    }
    expect(at[4]).toBe(0);
    for (const n of at.slice(0, 4)) expect(Math.abs(n / seeds - 0.25)).toBeLessThan(0.02);
  });

  it('puts both easy and medium questions 5th', () => {
    const last = new Set<string>();
    for (let seed = 0; seed < 200; seed += 1) {
      last.add(
        orderQuestions(five(['easy', 'easy', 'medium', 'medium', 'hard']), rng(seed))[4]
          ?.difficulty as string,
      );
    }
    expect(last).toEqual(new Set(['easy', 'medium']));
  });

  it('gives the same order for the same seed', () => {
    const list = five(['easy', 'easy', 'medium', 'medium', 'hard']);
    expect(orderQuestions(list, rng(5))).toEqual(orderQuestions(list, rng(5)));
  });

  it('keeps a selected game’s 5th question easy or medium', () => {
    for (let seed = 0; seed < 300; seed += 1) {
      const pool = [
        ...many(2, () => q('easy')),
        ...many(1, () => q('medium')),
        ...many(4, () => q('hard')),
      ];
      const s = selectQuestions(pool, [], rng(seed));
      if (!s.ok) throw new Error('exhausted');
      expect(picked(pool, s.ids)[4]?.difficulty).not.toBe('hard');
    }
  });
});

describe('KAUPHOLL', () => {
  it('holds the approved numbers', () => {
    expect(KAUPHOLL).toMatchObject({
      minPlayers: 3,
      maxPlayers: 6,
      questions: 5,
      coins: 2,
      winnerBonus: 3,
      cardSeconds: 10,
      guessSeconds: 45,
      betSeconds: 20,
      pauseSeconds: 10,
      seqMax: 10_000,
      lowPool: 10,
    });
  });
});

describe('the server step: answers and question statistics', () => {
  it('builds an answer only from the result, the open state and the view', () => {
    const g = guessAll(guessing(), { a: 12345 }, false);
    const view = viewFor({ sid: 'b' }, g.state, g.secret);
    const json = JSON.stringify([
      respond({ kind: 'noop' }, g.state, view),
      respond({ kind: 'busy' }, g.state, view),
      respond({ kind: 'not_applied', reason: 'phase_over' }, g.state, view),
      respond({ kind: 'applied', ...g, result: { action: 'reveal' } }, g.state, view),
    ]);
    expect(json).not.toContain('12345');
    expect(json).not.toContain('SECRET_NOTE');
    expect(json).not.toContain('"questions"');
    expect(respond({ kind: 'noop' }, g.state, view)).toMatchObject({
      applied: false,
      reason: 'unchanged',
    });
  });

  it('places the winning slice: smaller, the two ends, below, middle and above', () => {
    const board = (k: number) =>
      buildBoard(Object.fromEntries(SEATS.slice(0, k).map((s, i) => [s, (i + 1) * 10])), SEATS);
    const four = board(4);
    if (!four) throw new Error('no board');
    expect([0, 1, 2, 3, 4].map((w) => winBucket(four, w))).toEqual([0, 1, 2, 4, 5]);
    const three = board(3);
    if (!three) throw new Error('no board');
    expect([1, 2, 3].map((w) => winBucket(three, w))).toEqual([1, 3, 5]);
    const one = board(1);
    if (!one) throw new Error('no board');
    expect(winBucket(one, 1)).toBe(3);
  });

  it('counts the guesses, the smaller wins and the log error, nobody in it', () => {
    const g = advance(guessAll(guessing(), { a: 99, b: 99, c: 300 }), later(T0, 45));
    const stats = roundStats(g.state, 99);
    expect(stats).toMatchObject({ guesses: 3, noGuess: false, smallerWin: false, bucket: 1 });
    expect(stats.sumAbsLogErr).toBeCloseTo(Math.abs(Math.log(301 / 100)), 9);
    expect(roundStats(g.state, 5)).toMatchObject({ smallerWin: true, bucket: 0 });
    const none = advance(guessing(), later(T0, 45));
    expect(roundStats(none.state, 99)).toEqual({
      guesses: 0,
      noGuess: true,
      smallerWin: false,
      bucket: null,
      sumAbsLogErr: 0,
    });
  });
});
