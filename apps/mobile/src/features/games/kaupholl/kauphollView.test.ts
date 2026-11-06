import { describe, expect, it } from 'vitest';

import {
  authorsOf,
  boardRows,
  chipCounts,
  coinsDrawn,
  coinsLeft,
  compactBoard,
  editGuess,
  endWords,
  formatGuess,
  guessValue,
  kauphollAbandoned,
  laneSettle,
  laneStart,
  laneSubmit,
  rawOf,
  readKauphollResult,
  readKauphollState,
  scoreRows,
  stakesOn,
  summaryWords,
  tapSlot,
} from './kauphollView';

// Made-up numbers only (no real Kaupholl question, K-87).
const board = [
  { pos: 0, value: null, authors: [], odds: 6 },
  { pos: 1, value: 5000, authors: ['b'], odds: 4 },
  { pos: 2, value: 8500, authors: ['c', 'd'], odds: 2 },
  { pos: 3, value: 12000, authors: ['me'], odds: 6 },
];

function table(over: Record<string, unknown> = {}) {
  const t = readKauphollState({
    gameNo: 2,
    phase: 'answer',
    step: 9,
    endsAt: '2026-11-06T10:00:00.000Z',
    round: 2,
    rounds: 5,
    seats: ['me', 'b', 'c', 'd'],
    gone: [],
    card: { text: 'Örnek soru', unit: 'birim', decimals: 0 },
    chips: { me: 'locked', b: 'locked', c: 'locked', d: 'locked' },
    board,
    bets: { me: { coins: [2, 2], locked: true, seq: 3, step: 8, sent: true } },
    answer: { value: 9000, unit: 'birim', decimals: 0, note: '' },
    winner: 2,
    noGuesses: false,
    points: { me: 4, b: 0, c: 3, d: 3 },
    scores: { me: 10, b: 2, c: 10, d: 7 },
    ready: [],
    winners: null,
    ...over,
  });
  if (!t) throw new Error('state');
  return t;
}

describe('reading the table', () => {
  it('reads a running game and refuses anything else', () => {
    expect(table().gameNo).toBe(2);
    expect(table().bets.me?.coins).toEqual([2, 2]);
    expect(readKauphollState({ pregame: { concept: 'kaupholl' } })).toBeNull();
    expect(readKauphollState({ phase: 'lit', step: 1 })).toBeNull();
  });

  it('reads the end only of a finished game; a game left half way has no end (E-6)', () => {
    const over = { ...table({ phase: 'over', winners: ['me'] }) };
    expect(
      readKauphollResult({ gameNo: 2, lastGame: { concept: 'kaupholl', kaupholl: over } }),
    ).not.toBeNull();
    const halted = { gameNo: 3, lastGame: { concept: 'kaupholl', abandoned: true } };
    expect(readKauphollResult(halted)).toBeNull();
    expect(kauphollAbandoned(halted)).toBe(3);
    expect(
      kauphollAbandoned({ gameNo: 3, lastGame: { concept: 'kibrit', abandoned: true } }),
    ).toBeNull();
  });
});

describe('the chips (none, written, locked)', () => {
  it('counts the players still in the game; a lock is written too', () => {
    expect(
      chipCounts({
        seats: ['a', 'b', 'c', 'd', 'e'],
        gone: ['e'],
        chips: { a: 'written', b: 'locked', c: 'none', e: 'locked' },
      }),
    ).toEqual({ players: 4, written: 2, locked: 1 });
  });
});

describe('the guess field (E-2, T-1)', () => {
  it('draws thousands with dots and keeps them out of what it holds', () => {
    expect(editGuess('', '9', 0)).toEqual({ raw: '9', tooLong: false });
    expect(editGuess('900', '9000', 0).raw).toBe('9000');
    expect(formatGuess('9000')).toBe('9.000');
    expect(editGuess('9000', '9.0001', 0).raw).toBe('90001');
    expect(formatGuess('999999')).toBe('999.999');
  });

  it('takes no decimal on a whole-number question', () => {
    expect(editGuess('12', '12,5', 0).raw).toBe('125');
    expect(editGuess('12', '12.', 0).raw).toBe('12');
  });

  it('takes a comma, or a dot more than drawn, as the decimal; one decimal at most', () => {
    expect(editGuess('8', '8,', 1).raw).toBe('8,');
    expect(editGuess('8', '8.', 1).raw).toBe('8,');
    expect(editGuess('8,', '8,76', 1).raw).toBe('8,7');
    expect(editGuess('9999', '9.9999', 1).raw).toBe('99999');
    expect(editGuess('99999', '99.999.', 1).raw).toBe('99999,');
    expect(formatGuess('99999,9')).toBe('99.999,9');
    expect(editGuess('', ',', 1).raw).toBe('0,');
  });

  it('keeps six whole digits at most', () => {
    expect(editGuess('999999', '9999999', 0)).toEqual({ raw: '999999', tooLong: true });
    expect(editGuess('007', '0070', 0).raw).toBe('70');
  });

  it('is a number only when whole', () => {
    expect(guessValue('')).toBeNull();
    expect(guessValue('9000,')).toBeNull();
    expect(guessValue('9000')).toBe(9000);
    expect(guessValue('99999,9')).toBe(99999.9);
    expect(rawOf(99999.9)).toBe('99999,9');
    expect(rawOf(8760)).toBe('8760');
  });
});

describe('the board', () => {
  it('names one or two authors and counts three or more (§5)', () => {
    expect(authorsOf({ authors: [] })).toEqual({ kind: 'none' });
    expect(authorsOf({ authors: ['a'] })).toEqual({ kind: 'one', sid: 'a' });
    expect(authorsOf({ authors: ['a', 'b'] }).kind).toBe('two');
    expect(authorsOf({ authors: ['a', 'b', 'c', 'd'] })).toEqual({
      kind: 'many',
      sids: ['a', 'b', 'c', 'd'],
    });
  });

  it('puts the answer’s line after the winner and dims those past it', () => {
    const rows = boardRows(board, 2, true);
    expect(rows.map((r) => (r.kind === 'line' ? 'line' : r.mark))).toEqual([
      'plain',
      'plain',
      'win',
      'line',
      'over',
    ]);
    expect(boardRows(board, 0, true).map((r) => (r.kind === 'line' ? 'line' : r.mark))).toEqual([
      'win',
      'line',
      'over',
      'over',
      'over',
    ]);
    expect(boardRows(board, null, false).every((r) => r.kind === 'slice')).toBe(true);
  });

  it('counts each person’s coins on a slice, the phone’s own placement first', () => {
    const bets = {
      b: { coins: [2, 1] as [number, number] },
      c: { coins: [2, 2] as [number, number] },
    };
    expect(stakesOn(2, bets, ['me', 'b', 'c'])).toEqual([
      { sid: 'b', n: 1 },
      { sid: 'c', n: 2 },
    ]);
    expect(stakesOn(2, bets, ['me', 'b', 'c'], { sid: 'me', coins: [2, null] })[0]).toEqual({
      sid: 'me',
      n: 1,
    });
  });

  it('stacks twelve coins on one slice (§5) and draws three people each', () => {
    const six = ['a', 'b', 'c', 'd', 'e', 'f'].map((sid) => ({ sid, n: 2 }));
    expect(coinsDrawn(six, 140, 32, 4)).toEqual({
      kind: 'stack',
      total: 12,
      sids: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(coinsDrawn(six.slice(0, 3), 132, 34, 4).kind).toBe('each');
    expect(coinsDrawn(six.slice(0, 3), 92, 34, 4).kind).toBe('stack');
  });

  it('is compact with seven slices or larger text', () => {
    expect(compactBoard(6, 1)).toBe(false);
    expect(compactBoard(7, 1)).toBe(true);
    expect(compactBoard(4, 1.3)).toBe(true);
  });

  it('places, takes back and moves the two coins', () => {
    expect(tapSlot([null, null], 3)).toEqual([3, null]);
    expect(tapSlot([3, null], 3)).toEqual([3, 3]);
    expect(tapSlot([3, 3], 3)).toEqual([3, null]);
    expect(tapSlot([3, 1], 1)).toEqual([3, null]);
    expect(tapSlot([3, 1], 4)).toEqual([1, 4]);
    expect(coinsLeft([3, null])).toBe(1);
  });
});

describe('the scores and the words', () => {
  it('orders by points, marks the +3 and the leaders', () => {
    expect(scoreRows(table())).toEqual([
      { sid: 'me', gain: 4, total: 10, bonus: false, lead: true },
      { sid: 'c', gain: 3, total: 10, bonus: true, lead: true },
      { sid: 'd', gain: 3, total: 7, bonus: true, lead: false },
      { sid: 'b', gain: 0, total: 2, bonus: false, lead: false },
    ]);
  });

  it('gives "Hepsinden küçük" no +3 and nobody a lead at 0', () => {
    const rows = scoreRows(table({ winner: 0, scores: {}, points: {} }));
    expect(rows.every((r) => !r.bonus && !r.lead)).toBe(true);
  });

  it('says who wrote the winning guess, or that nobody guessed', () => {
    expect(summaryWords(table())).toEqual({
      kind: 'guess',
      authors: { kind: 'two', sids: ['c', 'd'] },
      value: 8500,
    });
    expect(summaryWords(table({ winner: 0 }))).toEqual({ kind: 'smaller' });
    expect(summaryWords(table({ noGuesses: true, board: null, winner: null }))).toEqual({
      kind: 'none',
    });
  });

  it('has no winner when nobody scored (T-2), and shared winners in seat order', () => {
    expect(endWords({ seats: ['me', 'b'], winners: [], scores: {} }, 'me')).toEqual({
      kind: 'nobody',
    });
    expect(
      endWords({ seats: ['me', 'b', 'c'], winners: ['c', 'me'], scores: { me: 8, c: 8 } }, 'me'),
    ).toEqual({ kind: 'two', sids: ['me', 'c'], you: true, points: 8 });
    expect(
      endWords({ seats: ['a', 'b', 'c'], winners: ['a', 'b', 'c'], scores: { a: 3 } }, 'w').kind,
    ).toBe('many');
  });
});

describe('the order of sending (seq, rule 3)', () => {
  it('keeps one request on its way and sends the last change after it', () => {
    let lane = laneStart<number>(0);
    const a = laneSubmit(lane, 100, false);
    expect(a.send).toEqual({ seq: 1, payload: 100, lock: false });
    lane = a.lane;
    lane = laneSubmit(lane, 200, false).lane;
    const c = laneSubmit(lane, 300, false);
    expect(c.send).toBeNull();
    const d = laneSettle(c.lane, 1);
    expect(d.send).toEqual({ seq: 2, payload: 300, lock: false });
    const e = laneSettle(d.lane, 2);
    expect(e.send).toBeNull();
    expect(e.lane).toEqual({ seq: 2, busy: false, waiting: null });
  });

  it('keeps a waiting lock a lock, and continues after the server’s seq', () => {
    const lane = laneSubmit(laneStart<number>(4), 1, false).lane;
    const waiting = laneSubmit(laneSubmit(lane, 2, true).lane, 3, false).lane;
    expect(waiting.waiting).toEqual({ payload: 3, lock: true });
    expect(laneSettle(waiting, 9).send).toEqual({ seq: 10, payload: 3, lock: true });
  });

  it('sends nothing past 10.000', () => {
    expect(laneSubmit(laneStart<number>(10_000), 1, false).send).toBeNull();
  });
});
