import { describe, expect, it } from 'vitest';

import {
  describerFor,
  describingTeam,
  highlight,
  KAPSUL_ANLAT,
  KAPSUL_MARKS,
  type KapsulState,
  markRefusal,
  parseKapsulLastGame,
  parseKapsulState,
  roleOf,
  scoresAfter,
  seesCards,
  winnerOf,
} from './kapsulAnlat.ts';

const state = (over: Partial<KapsulState> = {}): KapsulState => ({
  gameNo: 1,
  turnNo: 1,
  totalTurns: 6,
  turnSeconds: 60,
  maxPasses: 3,
  countdownSeconds: 3,
  teams: { a: ['a1', 'a2', 'a3'], b: ['b1', 'b2'] },
  left: [],
  scores: { a: 0, b: 0 },
  describingTeam: 'a',
  describer: 'a1',
  turnPhase: 'running',
  readyEndsAt: null,
  startsAt: '2026-10-20T10:00:03.000Z',
  endsAt: '2026-10-20T10:01:03.000Z',
  nextAt: null,
  cardIndex: 0,
  passesUsed: 0,
  counts: { correct: 0, pass: 0, taboo: 0 },
  lastTurn: null,
  next: null,
  ...over,
});

describe('Kapsül Anlat rules (docs/SPEC_V4.md §4.6.1)', () => {
  it('plays 6 turns of 60 seconds with 3 passes, a 10 second ready and a 15 second end screen', () => {
    expect(KAPSUL_ANLAT).toMatchObject({
      totalTurns: 6,
      turnSeconds: 60,
      maxPasses: 3,
      readySeconds: 10,
      countdownSeconds: 3,
      nextSeconds: 15,
    });
  });

  it('alternates the teams: Mor, Pembe, Mor…', () => {
    expect([1, 2, 3, 4, 5, 6].map(describingTeam)).toEqual(['a', 'b', 'a', 'b', 'a', 'b']);
  });

  it("gives the team's n-th turn to its n-th person, round again when the team is through", () => {
    const team = ['x', 'y', 'z'];
    // Mor plays turns 1, 3, 5: its 1st, 2nd and 3rd turn.
    expect([1, 3, 5].map((t) => describerFor(team, t))).toEqual(['x', 'y', 'z']);
    // Pembe plays 2, 4, 6 with two people: the first describes again in its third turn.
    expect([2, 4, 6].map((t) => describerFor(['p', 'q'], t))).toEqual(['p', 'q', 'p']);
  });

  it('keeps a team down to one person describing every turn, and nobody for an empty team', () => {
    expect([1, 3, 5].map((t) => describerFor(['solo'], t))).toEqual(['solo', 'solo', 'solo']);
    expect(describerFor([], 1)).toBeNull();
  });
});

describe('roles (§4.F, the role table)', () => {
  it('names the describer, the guessers, the opponents, the watchers and who left', () => {
    const s = state({ left: ['a3'] });
    expect(roleOf(s, 'a1')).toBe('describer');
    expect(roleOf(s, 'a2')).toBe('guesser');
    expect(roleOf(s, 'b1')).toBe('opponent');
    expect(roleOf(s, 'someone-who-watches')).toBe('observer');
    expect(roleOf(s, 'a3')).toBe('left');
  });

  it('lets only the describer press Doğru and Pas, and only the other team Yasak!', () => {
    expect(markRefusal('describer', 'correct')).toBeNull();
    expect(markRefusal('describer', 'pass')).toBeNull();
    expect(markRefusal('describer', 'taboo')).toBe('not_judge');
    expect(markRefusal('guesser', 'correct')).toBe('not_describer');
    expect(markRefusal('guesser', 'taboo')).toBe('not_judge');
    expect(markRefusal('opponent', 'taboo')).toBeNull();
    expect(markRefusal('opponent', 'correct')).toBe('not_describer');
    for (const mark of KAPSUL_MARKS) {
      expect(markRefusal('observer', mark)).toBe('not_player');
      expect(markRefusal('left', mark)).toBe('not_player');
    }
  });

  it('gives the card to the describer, the other team and the watchers only', () => {
    expect(seesCards('describer')).toBe(true);
    expect(seesCards('opponent')).toBe(true);
    expect(seesCards('observer')).toBe(true);
    expect(seesCards('guesser')).toBe(false);
    expect(seesCards('left')).toBe(false);
  });
});

describe('points and the end', () => {
  it('scores Doğru +1 and Yasak! −1 for the describing team, Pas 0', () => {
    let scores = { a: 0, b: 0 };
    scores = scoresAfter(scores, 'a', 'correct');
    scores = scoresAfter(scores, 'a', 'pass');
    scores = scoresAfter(scores, 'b', 'taboo');
    expect(scores).toEqual({ a: 1, b: -1 });
    expect(winnerOf(scores)).toBe('a');
    expect(winnerOf({ a: 2, b: 2 })).toBeNull();
  });

  it('picks the highlights by count, the earlier seat on a tie, never the same person twice', () => {
    const order = ['p1', 'p2', 'p3'];
    const correct = new Map([
      ['p2', 4],
      ['p3', 4],
    ]);
    expect(highlight(correct, order)).toEqual({ sessionId: 'p2', count: 4 });
    const taboo = new Map([
      ['p2', 3],
      ['p1', 1],
    ]);
    expect(highlight(taboo, order, 'p2')).toEqual({ sessionId: 'p1', count: 1 });
    expect(highlight(new Map(), order)).toBeNull();
    // Someone no longer at the end is not shown.
    expect(highlight(new Map([['gone', 9]]), order)).toBeNull();
  });
});

describe('parseKapsulState', () => {
  it('reads the running game and nothing else', () => {
    const s = state({ lastTurn: null });
    const raw = JSON.parse(JSON.stringify({ ...s, phase: 'playing' })) as unknown;
    expect(parseKapsulState(raw)).toEqual(s);
    expect(parseKapsulState({ gameNo: 3 })).toBeNull();
    expect(parseKapsulState({ ...s, phase: 'playing', turnPhase: 'later' })).toBeNull();
  });

  it("reads the end screen's summary and the next turn", () => {
    const raw = {
      ...state(),
      phase: 'playing',
      turnPhase: 'over',
      nextAt: '2026-10-20T10:01:18.000Z',
      lastTurn: {
        turnNo: 1,
        team: 'a',
        describer: 'a1',
        score: 1,
        counts: { correct: 2, pass: 1, taboo: 1 },
        cards: [
          { word: 'Kahve', result: 'correct' },
          { word: 'Vize', result: 'taboo' },
          { word: 7, result: 'correct' },
        ],
      },
      next: { team: 'b', describer: 'b1' },
    };
    const parsed = parseKapsulState(raw);
    expect(parsed?.lastTurn?.cards).toEqual([
      { word: 'Kahve', result: 'correct' },
      { word: 'Vize', result: 'taboo' },
    ]);
    expect(parsed?.next).toEqual({ team: 'b', describer: 'b1' });
  });

  it('reads the last game between games', () => {
    expect(
      parseKapsulLastGame({
        gameNo: 1,
        lastGame: {
          concept: 'tabu',
          abandoned: false,
          scores: { a: 5, b: 3 },
          winner: 'a',
          teams: { a: ['a1'], b: ['b1'] },
          bestDescriber: { sessionId: 'a1', count: 5 },
          tabooHunter: null,
        },
      }),
    ).toEqual({
      concept: 'tabu',
      abandoned: false,
      scores: { a: 5, b: 3 },
      winner: 'a',
      teams: { a: ['a1'], b: ['b1'] },
      bestDescriber: { sessionId: 'a1', count: 5 },
      tabooHunter: null,
    });
    expect(parseKapsulLastGame({ lastGame: { concept: 'harf' } })).toBeNull();
    expect(parseKapsulLastGame({ lastGame: { concept: 'tabu', abandoned: true } })).toMatchObject({
      abandoned: true,
      scores: null,
    });
  });
});
