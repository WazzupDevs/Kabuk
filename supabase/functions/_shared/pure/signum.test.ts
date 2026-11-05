import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { prepareTerms } from './profanity.ts';
import {
  answerOffer,
  approveCaptain,
  dealKey,
  decideAction,
  dropFromPregame,
  emptyPregame,
  expired,
  isBoardWord,
  leaveGame,
  offerCaptain,
  pickWords,
  pregameAgain,
  publicState,
  randomOffer,
  seatsAtStart,
  SIGNUM,
  SIGNUM_IDEMPOTENT_ACTIONS,
  type SignumActor,
  type SignumDecision,
  type SignumKind,
  type SignumPicks,
  type SignumRequest,
  type SignumSeat,
  type SignumSecret,
  type SignumState,
  type SignumTeam,
  startGame,
  tilesLeft,
  tooAlike,
  validateClue,
  viewFor,
  volunteer,
} from './signum.ts';

const profanity = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../../../content/profanity-tr.json'), 'utf8'),
) as { terms: string[]; wholeWords: string[] };
const terms = prepareTerms(profanity.terms, profanity.wholeWords);

// A seeded generator (mulberry32): the same seed, the same game.
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

// 26 letters × 26: words that are never too alike for one board (each a different first four).
const POOL = Array.from({ length: 260 }, (_, i) => {
  const a = String.fromCharCode(97 + (i % 26));
  const b = String.fromCharCode(97 + Math.floor(i / 26));
  return `${a}${b}${a}${b}x`;
});

const SEATS: SignumSeat[] = [
  { sid: 'ada', team: 'a', role: 'captain' },
  { sid: 'bora', team: 'a', role: 'guesser' },
  { sid: 'cem', team: 'a', role: 'guesser' },
  { sid: 'deniz', team: 'b', role: 'captain' },
  { sid: 'ece', team: 'b', role: 'guesser' },
  { sid: 'fuat', team: 'b', role: 'guesser' },
];

const T0 = new Date('2026-11-05T12:00:00.000Z');
const later = (seconds: number) => new Date(T0.getTime() + seconds * 1000);

const actor = (sid: string): SignumActor => ({
  sid,
  seat: SEATS.find((s) => s.sid === sid) ?? null,
});

function newGame(seed = 1) {
  const started = startGame({ gameNo: 1, seats: SEATS, pool: POOL, now: T0 }, rng(seed));
  if ('error' in started) throw new Error(started.error);
  return started;
}

type Game = { state: SignumState; secret: SignumSecret };

function act(game: Game, sid: string, request: SignumRequest, now = T0): SignumDecision {
  return decideAction(game.state, game.secret, actor(sid), request, now, terms);
}

function apply(game: Game, sid: string, request: SignumRequest, now = T0): Game {
  const d = act(game, sid, request, now);
  if (d.kind !== 'applied') throw new Error(`not applied: ${JSON.stringify(d)}`);
  return { state: d.state, secret: d.secret };
}

// A game in its first guess: everyone ready, the starter's captain gave a clue for 2.
function inGuess(seed = 1): Game & { team: 'a' | 'b'; captain: string; guessers: string[] } {
  let g: Game = newGame(seed);
  for (const s of SEATS) {
    const d = act(g, s.sid, { action: 'ready', step: g.state.step });
    if (d.kind === 'applied') g = { state: d.state, secret: d.secret };
  }
  const team = g.state.turn;
  const captain = SEATS.find((s) => s.team === team && s.role === 'captain')?.sid ?? '';
  g = apply(g, captain, { action: 'clue', step: g.state.step, word: 'Yaz', n: 2, actionId: 'c1' });
  const guessers = SEATS.filter((s) => s.team === team && s.role === 'guesser').map((s) => s.sid);
  return { ...g, team, captain, guessers };
}

const tileOf = (secret: SignumSecret, kind: SignumKind, skip: number[] = []) =>
  secret.key.findIndex((k, i) => k === kind && !skip.includes(i));

describe('SIGNUM', () => {
  it('deals 9, 8, 7 and 1 on 25 tiles', () => {
    expect(SIGNUM.starterTiles + SIGNUM.otherTiles + SIGNUM.neutralTiles + SIGNUM.blackTiles).toBe(
      SIGNUM.tiles,
    );
  });

  it('lists only actions decideAction knows as idempotent', () => {
    expect([...SIGNUM_IDEMPOTENT_ACTIONS].sort()).toEqual(
      ['advance', 'clue', 'end-turn', 'point', 'ready', 'reveal'].sort(),
    );
  });
});

describe('the board', () => {
  it('gives the starter 9 and the other team 8, for any seed', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const key = dealKey(seed % 2 ? 'a' : 'b', rng(seed));
      const count = (k: SignumKind) => key.filter((x) => x === k).length;
      const starter = seed % 2 ? 'a' : 'b';
      expect(count(starter)).toBe(9);
      expect(count(starter === 'a' ? 'b' : 'a')).toBe(8);
      expect(count('n')).toBe(7);
      expect(count('x')).toBe(1);
    }
  });

  it('starts either team', () => {
    const starters = new Set(Array.from({ length: 50 }, (_, i) => newGame(i + 1).state.starter));
    expect(starters).toEqual(new Set(['a', 'b']));
  });

  it('never puts two too-alike words on one board', () => {
    const pool = [...POOL, 'Balık', 'Balıkçı', 'Kale', 'Kalem', 'Masa', 'Masal'];
    for (let seed = 1; seed <= 300; seed++) {
      const words = pickWords(pool, rng(seed));
      expect(words).toHaveLength(25);
      const w = words ?? [];
      for (let i = 0; i < w.length; i++) {
        for (let j = i + 1; j < w.length; j++) expect(tooAlike(w[i] ?? '', w[j] ?? '')).toBe(false);
      }
    }
  });

  it('says no board when 25 distinct valid words cannot be found, whatever the count (A-15)', () => {
    // 300 words, but only 20 different starts.
    const pool = Array.from({ length: 300 }, (_, i) => `kele${'abcdefghijklmnopqrst'[i % 20]}${i}`);
    expect(pool.length).toBeGreaterThanOrEqual(SIGNUM.minPool);
    expect(pickWords(pool, rng(1))).toBeNull();
    const started = startGame({ gameNo: 1, seats: SEATS, pool, now: T0 }, rng(1));
    expect(started).toEqual({ error: 'content_unavailable' });
  });

  it('keeps words that are not one word of letters off the board', () => {
    expect(isBoardWord('Spor salonu')).toBe(false);
    expect(isBoardWord('AVM2')).toBe(false);
    expect(isBoardWord('Su')).toBe(false);
    expect(isBoardWord('Kaşık')).toBe(true);
  });
});

describe('startGame', () => {
  it('needs the pool, two of each team and one captain each', () => {
    const start = (seats: SignumSeat[], pool = POOL) =>
      startGame({ gameNo: 1, seats, pool, now: T0 }, rng(1));
    expect(start(SEATS, POOL.slice(0, SIGNUM.minPool - 1))).toEqual({
      error: 'content_unavailable',
    });
    expect(start(SEATS.slice(0, 3))).toEqual({ error: 'not_enough_players' });
    const noCaptain = SEATS.map((s) =>
      s.sid === 'deniz' ? { ...s, role: 'guesser' as const } : s,
    );
    expect(start(noCaptain)).toEqual({ error: 'captain_missing' });
    const twoCaptains = SEATS.map((s) =>
      s.sid === 'ece' ? { ...s, role: 'captain' as const } : s,
    );
    expect(start(twoCaptains)).toEqual({ error: 'captain_missing' });
  });

  it('opens with the role cards and a 30 s clock', () => {
    const { state } = newGame();
    expect(state.phase).toBe('role');
    expect(state.step).toBe(1);
    expect(Date.parse(state.endsAt ?? '') - T0.getTime()).toBe(SIGNUM.roleSeconds * 1000);
    expect(state.board.every((t) => t.open === null)).toBe(true);
  });
});

describe('validateClue', () => {
  const board = ['Sınav', 'Balık', 'Kale'];
  it('takes one word of letters and a number from 1 to 4', () => {
    expect(validateClue('Bayram', 2, board, terms)).toBe('ok');
    expect(validateClue(' Bayram ', 4, board, terms)).toBe('ok');
    expect(validateClue('Bayram', 0, board, terms)).toBe('bad_request');
    expect(validateClue('Bayram', 5, board, terms)).toBe('bad_request');
    expect(validateClue('Bayram', 1.5, board, terms)).toBe('bad_request');
  });

  it('refuses more than one word, marks, digits and spaced letters', () => {
    expect(validateClue('okul kapısı', 1, board, terms)).toBe('bad_clue');
    expect(validateClue('o k u l', 1, board, terms)).toBe('bad_clue');
    expect(validateClue('yaz!', 1, board, terms)).toBe('bad_clue');
    expect(validateClue('yaz2', 1, board, terms)).toBe('bad_clue');
    expect(validateClue('a', 1, board, terms)).toBe('bad_clue');
  });

  it('refuses profanity', () => {
    expect(validateClue('siktir', 1, board, terms)).toBe('bad_clue');
  });

  it('refuses a board word: equal, either one the start of the other, in any case (A-4)', () => {
    expect(validateClue('sınav', 1, board, terms)).toBe('clue_on_board');
    expect(validateClue('SINAV', 1, board, terms)).toBe('clue_on_board');
    expect(validateClue('Sinav', 1, board, terms)).toBe('clue_on_board');
    expect(validateClue('Sınavlar', 1, board, terms)).toBe('clue_on_board');
    expect(validateClue('Balıkçı', 1, board, terms)).toBe('clue_on_board');
    expect(validateClue('Kal', 1, board, terms)).toBe('clue_on_board');
    expect(validateClue('Kalp', 1, board, terms)).toBe('ok');
  });
});

describe('phases', () => {
  it('starts the clues once everyone is ready, with the starter', () => {
    let g: Game = newGame();
    for (const s of SEATS.slice(0, -1)) g = apply(g, s.sid, { action: 'ready', step: 1 });
    expect(g.state.phase).toBe('role');
    g = apply(g, 'fuat', { action: 'ready', step: 1 });
    expect(g.state.phase).toBe('clue');
    expect(g.state.turn).toBe(g.state.starter);
    expect(Date.parse(g.state.endsAt ?? '') - T0.getTime()).toBe(SIGNUM.clueSeconds * 1000);
  });

  it('a ready sent twice changes nothing', () => {
    const g = apply(newGame(), 'ada', { action: 'ready', step: 1 });
    expect(act(g, 'ada', { action: 'ready', step: 1 })).toEqual({ kind: 'noop' });
  });

  it('a clue gives n + 1 guesses and 60 s for the whole turn', () => {
    const g = inGuess();
    expect(g.state.phase).toBe('guess');
    expect(g.state.guessesLeft).toBe(3);
    const start = Date.parse(g.state.endsAt ?? '');
    const own = tileOf(g.secret, g.team);
    const marked = apply(g, g.guessers[0] ?? '', {
      action: 'point',
      step: g.state.step,
      tile: own,
      seq: 1,
    });
    const opened = apply(
      marked,
      g.guessers[0] ?? '',
      { action: 'reveal', step: marked.state.step, tile: own, actionId: 'r1' },
      later(10),
    );
    expect(opened.state.phase).toBe('guess');
    expect(opened.state.guessesLeft).toBe(2);
    // The clock does not start again on an opened tile.
    expect(Date.parse(opened.state.endsAt ?? '')).toBe(start);
  });

  it('a clue nobody gave in time passes the turn to the other team’s clue', () => {
    let g: Game = newGame();
    for (const s of SEATS) g = apply(g, s.sid, { action: 'ready', step: g.state.step });
    const team = g.state.turn;
    const d = act(g, 'bora', { action: 'advance', step: g.state.step }, later(SIGNUM.clueSeconds));
    expect(d.kind).toBe('applied');
    if (d.kind !== 'applied') return;
    expect(d.state.phase).toBe('clue');
    expect(d.state.turn).not.toBe(team);
  });

  it('an advance before the time, or for an old step, changes nothing', () => {
    const g = newGame();
    expect(act(g, 'bora', { action: 'advance', step: 1 }, later(5))).toEqual({ kind: 'noop' });
    expect(act(g, 'bora', { action: 'advance', step: 0 }, later(60))).toEqual({ kind: 'noop' });
  });

  it('a guess may end with no tile opened', () => {
    const g = inGuess();
    const ended = apply(g, g.guessers[0] ?? '', {
      action: 'end-turn',
      step: g.state.step,
      actionId: 'e1',
    });
    expect(ended.state.phase).toBe('clue');
    expect(ended.state.turn).not.toBe(g.team);
  });
});

describe('reveal', () => {
  function revealKind(kind: SignumKind | 'own' | 'other', seed = 1) {
    const g = inGuess(seed);
    const k: SignumKind =
      kind === 'own' ? g.team : kind === 'other' ? (g.team === 'a' ? 'b' : 'a') : kind;
    const tile = tileOf(g.secret, k);
    const who = g.guessers[0] ?? '';
    const marked = apply(g, who, { action: 'point', step: g.state.step, tile, seq: 1 });
    const d = act(marked, who, { action: 'reveal', step: marked.state.step, tile, actionId: 'r' });
    return { g, d, tile };
  }

  it('a neutral tile ends the turn', () => {
    const { d } = revealKind('n');
    expect(d.kind === 'applied' && d.result).toMatchObject({ outcome: 'neutral' });
    expect(d.kind === 'applied' && d.state.phase).toBe('clue');
  });

  it('the other team’s tile counts for them and ends the turn', () => {
    const { g, d } = revealKind('other');
    if (d.kind !== 'applied') throw new Error();
    expect(d.result).toMatchObject({ outcome: 'opponent' });
    const other = g.team === 'a' ? 'b' : 'a';
    expect(tilesLeft(d.state, d.secret.key, other)).toBe(
      tilesLeft(g.state, g.secret.key, other) - 1,
    );
    expect(d.state.turn).toBe(other);
  });

  it('the black card loses the game for the team that opened it', () => {
    const { g, d } = revealKind('x');
    if (d.kind !== 'applied') throw new Error();
    expect(d.state.phase).toBe('over');
    expect(d.state.winner).toBe(g.team === 'a' ? 'b' : 'a');
    expect(d.state.reason).toBe('black');
  });

  it('a team whose last tile opens wins, even when the other team opened it', () => {
    const g = inGuess();
    const other: SignumTeam = g.team === 'a' ? 'b' : 'a';
    // Every tile of the other team open but one.
    const theirs = g.secret.key.map((k, i) => (k === other ? i : -1)).filter((i) => i >= 0);
    const last = theirs.pop() ?? -1;
    const board = g.state.board.map((t, i) => (theirs.includes(i) ? { ...t, open: other } : t));
    const near: Game = { state: { ...g.state, board }, secret: g.secret };
    const who = g.guessers[0] ?? '';
    const marked = apply(near, who, { action: 'point', step: near.state.step, tile: last, seq: 1 });
    const d = act(marked, who, {
      action: 'reveal',
      step: marked.state.step,
      tile: last,
      actionId: 'r',
    });
    if (d.kind !== 'applied') throw new Error();
    expect(d.state.phase).toBe('over');
    expect(d.state.winner).toBe(other);
    expect(d.state.reason).toBe('cards');
    // A-7: the key opens to the table at the end.
    expect(publicState(d.state).key).toEqual(g.secret.key);
  });

  it('opens only the tile the guesser’s own mark is on', () => {
    const g = inGuess();
    const [first = '', second = ''] = g.guessers;
    const tile = tileOf(g.secret, 'n');
    const marked = apply(g, first, { action: 'point', step: g.state.step, tile, seq: 1 });
    expect(
      act(marked, second, { action: 'reveal', step: marked.state.step, tile, actionId: 'x' }),
    ).toEqual({
      kind: 'error',
      code: 'not_pointed',
    });
  });
});

describe('races and repeats', () => {
  it('of two valid reveals on different tiles for one step, only the first applies', () => {
    const g = inGuess();
    const [ece = '', fuat = ''] = g.guessers;
    const t8 = tileOf(g.secret, g.team);
    const t14 = tileOf(g.secret, g.team, [t8]);
    let m = apply(g, ece, { action: 'point', step: g.state.step, tile: t8, seq: 1 });
    m = apply(m, fuat, { action: 'point', step: m.state.step, tile: t14, seq: 1 });
    const step = m.state.step;
    // Both sent for the same step; the room's lock lets one through first.
    const first = act(m, ece, { action: 'reveal', step, tile: t8, actionId: 'e1' });
    if (first.kind !== 'applied') throw new Error();
    const afterFirst: Game = { state: first.state, secret: first.secret };
    const second = act(afterFirst, fuat, { action: 'reveal', step, tile: t14, actionId: 'f1' });
    expect(second).toMatchObject({ kind: 'not_applied', reason: 'stale_step', changed: false });
    expect(afterFirst.state.board[t14]?.open).toBeNull();
    // Fuat's mark stays; with the new step his reveal goes through.
    expect(afterFirst.secret.marks[g.team][fuat]?.tile).toBe(t14);
    expect(
      act(afterFirst, fuat, {
        action: 'reveal',
        step: afterFirst.state.step,
        tile: t14,
        actionId: 'f2',
      }).kind,
    ).toBe('applied');
  });

  it('of two reveals on the same tile, the second does not apply', () => {
    const g = inGuess();
    const [ece = '', fuat = ''] = g.guessers;
    const t = tileOf(g.secret, g.team);
    let m = apply(g, ece, { action: 'point', step: g.state.step, tile: t, seq: 1 });
    m = apply(m, fuat, { action: 'point', step: m.state.step, tile: t, seq: 1 });
    const step = m.state.step;
    const first = act(m, ece, { action: 'reveal', step, tile: t, actionId: 'e1' });
    if (first.kind !== 'applied') throw new Error();
    const second = act({ state: first.state, secret: first.secret }, fuat, {
      action: 'reveal',
      step,
      tile: t,
      actionId: 'f1',
    });
    expect(second).toMatchObject({ kind: 'not_applied', reason: 'stale_step' });
  });

  it('the same actionId with the same request answers the first result, even after the turn', () => {
    const g = inGuess();
    const who = g.guessers[0] ?? '';
    const t = tileOf(g.secret, 'n');
    const m = apply(g, who, { action: 'point', step: g.state.step, tile: t, seq: 1 });
    const request: SignumRequest = {
      action: 'reveal',
      step: m.state.step,
      tile: t,
      actionId: 'r1',
    };
    const first = act(m, who, request);
    if (first.kind !== 'applied') throw new Error();
    // The neutral tile ended the turn; the record stays.
    expect(first.state.phase).toBe('clue');
    const again = act({ state: first.state, secret: first.secret }, who, request, later(500));
    expect(again).toEqual({ kind: 'replayed', result: first.result });
  });

  it('the same actionId with other parameters, or from someone else, is a conflict', () => {
    const g = inGuess();
    const [ece = '', fuat = ''] = g.guessers;
    const t = tileOf(g.secret, g.team);
    const m = apply(g, ece, { action: 'point', step: g.state.step, tile: t, seq: 1 });
    const done = apply(m, ece, { action: 'reveal', step: m.state.step, tile: t, actionId: 'r1' });
    const other = tileOf(done.secret, g.team, [t]);
    expect(
      act(done, ece, { action: 'reveal', step: m.state.step, tile: other, actionId: 'r1' }),
    ).toEqual({
      kind: 'error',
      code: 'action_id_conflict',
    });
    expect(
      act(done, fuat, { action: 'reveal', step: m.state.step, tile: t, actionId: 'r1' }),
    ).toEqual({
      kind: 'error',
      code: 'action_id_conflict',
    });
    expect(act(done, ece, { action: 'end-turn', step: m.state.step, actionId: 'r1' })).toEqual({
      kind: 'error',
      code: 'action_id_conflict',
    });
  });

  it('a clue sent again answers the first result; with another number it is a conflict', () => {
    let g: Game = newGame();
    for (const s of SEATS) g = apply(g, s.sid, { action: 'ready', step: g.state.step });
    const captain = SEATS.find((s) => s.team === g.state.turn && s.role === 'captain')?.sid ?? '';
    const request: SignumRequest = {
      action: 'clue',
      step: g.state.step,
      word: 'Yaz',
      n: 2,
      actionId: 'c',
    };
    const first = act(g, captain, request);
    if (first.kind !== 'applied') throw new Error();
    const after: Game = { state: first.state, secret: first.secret };
    expect(act(after, captain, request)).toEqual({ kind: 'replayed', result: first.result });
    expect(act(after, captain, { ...request, n: 3 })).toEqual({
      kind: 'error',
      code: 'action_id_conflict',
    });
  });

  it('every action meant for IDEMPOTENT_CALLS changes nothing the second time', () => {
    const g = inGuess();
    const who = g.guessers[0] ?? '';
    const t = tileOf(g.secret, g.team);
    const cases: { sid: string; game: Game; request: SignumRequest; now?: Date }[] = [];
    const point: SignumRequest = { action: 'point', step: g.state.step, tile: t, seq: 5 };
    cases.push({ sid: who, game: g, request: point });
    const marked = apply(g, who, point);
    cases.push({
      sid: who,
      game: marked,
      request: { action: 'reveal', step: marked.state.step, tile: t, actionId: 'i1' },
    });
    cases.push({
      sid: who,
      game: marked,
      request: { action: 'end-turn', step: marked.state.step, actionId: 'i2' },
    });
    cases.push({ sid: 'bora', game: newGame(), request: { action: 'ready', step: 1 } });
    cases.push({
      sid: 'bora',
      game: newGame(),
      request: { action: 'advance', step: 1 },
      now: later(30),
    });
    let ready: Game = newGame();
    for (const s of SEATS) ready = apply(ready, s.sid, { action: 'ready', step: ready.state.step });
    const captain =
      SEATS.find((s) => s.team === ready.state.turn && s.role === 'captain')?.sid ?? '';
    cases.push({
      sid: captain,
      game: ready,
      request: { action: 'clue', step: ready.state.step, word: 'Kış', n: 1, actionId: 'i3' },
    });

    const seen = new Set<string>();
    for (const c of cases) {
      seen.add(c.request.action);
      const first = act(c.game, c.sid, c.request, c.now);
      expect(first.kind).toBe('applied');
      if (first.kind !== 'applied') continue;
      const after: Game = { state: first.state, secret: first.secret };
      const second = act(after, c.sid, c.request, c.now);
      // Nothing to write the second time: a replay of the first answer, or nothing at all.
      expect(['replayed', 'noop']).toContain(second.kind);
      if (second.kind === 'replayed') expect(second.result).toEqual(first.result);
    }
    expect([...seen].sort()).toEqual([...SIGNUM_IDEMPOTENT_ACTIONS].sort());
  });
});

describe('point and its seq', () => {
  it('the same seq and tile is a repeat; the same seq with another tile is a conflict', () => {
    const g = inGuess();
    const who = g.guessers[0] ?? '';
    const [t1, t2] = [tileOf(g.secret, 'n'), tileOf(g.secret, 'n', [tileOf(g.secret, 'n')])];
    const m = apply(g, who, { action: 'point', step: g.state.step, tile: t1, seq: 7 });
    expect(act(m, who, { action: 'point', step: m.state.step, tile: t1, seq: 7 })).toEqual({
      kind: 'replayed',
      result: { action: 'point', tile: t1, seq: 7 },
    });
    expect(act(m, who, { action: 'point', step: m.state.step, tile: t2, seq: 7 })).toEqual({
      kind: 'error',
      code: 'seq_conflict',
    });
    expect(act(m, who, { action: 'point', step: m.state.step, tile: null, seq: 7 })).toEqual({
      kind: 'error',
      code: 'seq_conflict',
    });
  });

  it('an older seq never comes back over a newer mark', () => {
    const g = inGuess();
    const who = g.guessers[0] ?? '';
    const t9 = tileOf(g.secret, 'n');
    const t8 = tileOf(g.secret, 'n', [t9]);
    const m = apply(g, who, { action: 'point', step: g.state.step, tile: t9, seq: 10 });
    expect(act(m, who, { action: 'point', step: m.state.step, tile: t8, seq: 9 })).toMatchObject({
      kind: 'not_applied',
      reason: 'outdated',
      changed: false,
    });
    expect(m.secret.marks[g.team][who]?.tile).toBe(t9);
  });

  it('keeps the last seq when the turn clears the marks', () => {
    const g = inGuess();
    const who = g.guessers[0] ?? '';
    const t = tileOf(g.secret, 'n');
    const m = apply(g, who, { action: 'point', step: g.state.step, tile: t, seq: 42 });
    const ended = apply(m, who, { action: 'end-turn', step: m.state.step, actionId: 'e' });
    expect(ended.secret.marks[g.team][who]).toEqual({ tile: null, seq: 42, sent: t });
    // The view gives the phone its seq back after a restart.
    expect(viewFor(actor(who), ended.secret)).toMatchObject({ mySeq: 42, marks: {} });
    // An old point from before the turn ended is still outdated, never a fresh mark.
    expect(
      act(ended, who, { action: 'point', step: ended.state.step, tile: t, seq: 41 }),
    ).toMatchObject({
      kind: 'not_applied',
      reason: 'outdated',
    });
  });

  it('a point does not change the open state and notifies only the team', () => {
    const g = inGuess();
    const d = act(g, g.guessers[0] ?? '', { action: 'point', step: g.state.step, tile: 0, seq: 1 });
    if (d.kind !== 'applied') throw new Error();
    expect(d.state).toBe(g.state);
    expect(d.notifyTeam).toBe(g.team);
  });
});

describe('a phase whose time ran out', () => {
  it('applies no action, and moves on in the same go even before any advance', () => {
    const g = inGuess();
    const who = g.guessers[0] ?? '';
    const t = tileOf(g.secret, g.team);
    const m = apply(g, who, { action: 'point', step: g.state.step, tile: t, seq: 1 });
    const late = later(SIGNUM.clueSeconds + SIGNUM.guessSeconds + 1);
    expect(expired(m.state, late)).toBe(true);
    for (const request of [
      { action: 'reveal', step: m.state.step, tile: t, actionId: 'late' },
      { action: 'end-turn', step: m.state.step, actionId: 'late2' },
      { action: 'point', step: m.state.step, tile: t, seq: 2 },
    ] satisfies SignumRequest[]) {
      const d = act(m, who, request, late);
      expect(d).toMatchObject({ kind: 'not_applied', reason: 'phase_expired', changed: true });
      if (d.kind !== 'not_applied') continue;
      expect(d.state.board[t]?.open).toBeNull();
      expect(d.state.phase).toBe('clue');
      expect(d.state.turn).not.toBe(g.team);
      // An advance after it, for the old step, changes nothing.
      expect(
        act(
          { state: d.state, secret: d.secret },
          'bora',
          { action: 'advance', step: m.state.step },
          late,
        ),
      ).toEqual({
        kind: 'noop',
      });
    }
  });

  it('a late clue is not applied and the turn has passed', () => {
    let g: Game = newGame();
    for (const s of SEATS) g = apply(g, s.sid, { action: 'ready', step: g.state.step });
    const captain = SEATS.find((s) => s.team === g.state.turn && s.role === 'captain')?.sid ?? '';
    const d = act(
      g,
      captain,
      { action: 'clue', step: g.state.step, word: 'Yaz', n: 1, actionId: 'late' },
      later(SIGNUM.roleSeconds + SIGNUM.clueSeconds + 1),
    );
    expect(d).toMatchObject({ kind: 'not_applied', reason: 'phase_expired' });
    if (d.kind === 'not_applied') expect(d.secret.actions.late).toBeUndefined();
  });
});

describe('who may act', () => {
  it('turns away the wrong role, the other team and observers', () => {
    const g = inGuess();
    const other = g.team === 'a' ? 'b' : 'a';
    const otherGuesser = SEATS.find((s) => s.team === other && s.role === 'guesser')?.sid ?? '';
    const step = g.state.step;
    expect(act(g, otherGuesser, { action: 'point', step, tile: 0, seq: 1 })).toEqual({
      kind: 'error',
      code: 'not_your_turn',
    });
    expect(act(g, g.captain, { action: 'reveal', step, tile: 0, actionId: 'a' })).toEqual({
      kind: 'error',
      code: 'not_guesser',
    });
    expect(act(g, g.captain, { action: 'point', step, tile: 0, seq: 1 })).toEqual({
      kind: 'error',
      code: 'not_guesser',
    });
    expect(
      act(g, g.guessers[0] ?? '', { action: 'clue', step, word: 'Yaz', n: 1, actionId: 'b' }),
    ).toEqual({
      kind: 'error',
      code: 'not_captain',
    });
    expect(
      decideAction(
        g.state,
        g.secret,
        { sid: 'gul', seat: null },
        { action: 'end-turn', step, actionId: 'c' },
        T0,
        terms,
      ),
    ).toEqual({ kind: 'error', code: 'not_player' });
  });
});

describe('leaving', () => {
  it('a captain leaving ends the game with no winner, and says so', () => {
    const g = inGuess();
    const out = leaveGame(g.state, g.secret, g.captain, true, T0);
    expect(out.state.phase).toBe('over');
    expect(out.state.winner).toBeNull();
    expect(out.state.reason).toBe('captain_left');
    expect(out.event).toEqual({ type: 'captain_left', team: g.team, voluntary: true });
  });

  it('a team left without a guesser ends the game; one guesser fewer does not', () => {
    const g = inGuess();
    const [first = '', second = ''] = g.guessers;
    const one = leaveGame(g.state, g.secret, first, false, T0);
    expect(one.state.phase).toBe('guess');
    expect(one.event).toBeNull();
    expect(
      Object.keys(one.secret.marks[g.team]).every(
        (sid) => one.secret.marks[g.team][sid]?.tile === null || sid !== first,
      ),
    ).toBe(true);
    const two = leaveGame(one.state, one.secret, second, false, T0);
    expect(two.state.reason).toBe('team_empty');
    expect(two.event).toEqual({ type: 'team_empty', team: g.team, voluntary: false });
  });

  it('the last one not ready leaving starts the clues', () => {
    let g: Game = newGame();
    for (const s of SEATS.filter((s) => s.sid !== 'fuat'))
      g = apply(g, s.sid, { action: 'ready', step: 1 });
    const out = leaveGame(g.state, g.secret, 'fuat', true, T0);
    expect(out.state.phase).toBe('clue');
  });
});

describe('what leaves the server', () => {
  const keyFields = (v: object) => Object.keys(v).sort();

  it('gives the key to captains only; a guesser’s and an observer’s view has no key field', () => {
    const g = inGuess();
    const captain = viewFor(actor(g.captain), g.secret);
    expect(keyFields(captain)).toEqual(['key', 'marks', 'role', 'team']);
    expect(keyFields(viewFor(actor(g.guessers[0] ?? ''), g.secret))).toEqual([
      'marks',
      'mySeq',
      'role',
      'team',
    ]);
    expect(viewFor({ sid: 'gul', seat: null }, g.secret)).toEqual({ role: 'observer' });
  });

  it('a team sees its own marks only', () => {
    const g = inGuess();
    const who = g.guessers[0] ?? '';
    const m = apply(g, who, { action: 'point', step: g.state.step, tile: 3, seq: 1 });
    const other = SEATS.find((s) => s.team !== g.team && s.role === 'guesser')?.sid ?? '';
    const otherCaptain = SEATS.find((s) => s.team !== g.team && s.role === 'captain')?.sid ?? '';
    expect(viewFor(actor(other), m.secret)).toMatchObject({ marks: {} });
    expect(viewFor(actor(otherCaptain), m.secret)).toMatchObject({ marks: {} });
    expect(viewFor(actor(g.captain), m.secret)).toMatchObject({ marks: { [who]: 3 } });
  });

  it('never puts a closed tile’s kind in the open state, over many random games', () => {
    let opened = 0;
    let over = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const r = rng(seed * 7919);
      let g: Game = newGame(seed);
      let now = T0;
      for (let move = 0; move < 200 && g.state.phase !== 'over'; move++) {
        // Mostly a few seconds; now and then long enough for the phase's time to run out.
        now = new Date(now.getTime() + (r() < 0.05 ? 95_000 : Math.floor(r() * 4_000)));
        const step = g.state.step;
        const turn = g.state.turn;
        const turnSeats = SEATS.filter((s) => s.team === turn);
        // Mostly the one whose move it is; sometimes anyone (they are turned away).
        const seat: SignumSeat =
          r() < 0.15
            ? (SEATS[Math.floor(r() * SEATS.length)] as SignumSeat)
            : g.state.phase === 'clue'
              ? (turnSeats.find((s) => s.role === 'captain') as SignumSeat)
              : g.state.phase === 'guess'
                ? (turnSeats.filter((s) => s.role === 'guesser')[Math.floor(r() * 2)] as SignumSeat)
                : (SEATS[Math.floor(r() * SEATS.length)] as SignumSeat);
        const closed = g.state.board
          .map((t, i) => (t.open === null ? i : -1))
          .filter((i) => i >= 0);
        const tile = closed[Math.floor(r() * closed.length)] ?? 0;
        const mark = g.secret.marks[seat.team][seat.sid];
        const pick = r();
        const request: SignumRequest =
          g.state.phase === 'role'
            ? { action: 'ready', step }
            : g.state.phase === 'clue'
              ? {
                  action: 'clue',
                  step,
                  word: `ipucu${'abcdefgh'[move % 8]}`,
                  n: 1 + (move % 4),
                  actionId: `c${seed}-${move}`,
                }
              : pick < 0.03
                ? { action: 'advance', step }
                : pick < 0.08
                  ? { action: 'end-turn', step, actionId: `e${seed}-${move}` }
                  : mark?.tile != null && pick < 0.7
                    ? { action: 'reveal', step, tile: mark.tile, actionId: `r${seed}-${move}` }
                    : { action: 'point', step, tile, seq: (mark?.seq ?? 0) + 1 };
        const d = decideAction(g.state, g.secret, actor(seat.sid), request, now, terms);
        if (d.kind === 'applied' || (d.kind === 'not_applied' && d.changed)) {
          g = { state: d.state, secret: d.secret };
        }
        const open = publicState(g.state);
        const text = JSON.stringify(open);
        open.board.forEach((t, i) => {
          if (t.open !== null) expect(t.open).toBe(g.secret.key[i]);
        });
        if (open.phase !== 'over') {
          expect(open.key).toBeNull();
          expect(text).not.toContain('"marks"');
          expect(text).not.toContain('"actions"');
          expect(text).not.toContain('"seq"');
        }
        expect(keyFieldsOf(open)).toEqual(PUBLIC_FIELDS);
      }
      opened += g.state.board.filter((t) => t.open !== null).length;
      if (g.state.phase === 'over') over++;
    }
    // The walk really plays: tiles open and games end.
    expect(opened).toBeGreaterThan(500);
    expect(over).toBeGreaterThanOrEqual(50);
  });

  it('keeps only its own fields even when the state carries more', () => {
    const g = inGuess();
    const dirty = { ...g.state, secret: g.secret, key: g.secret.key } as SignumState;
    const open = publicState(dirty);
    expect(keyFieldsOf(open)).toEqual(PUBLIC_FIELDS);
    expect(open.key).toBeNull();
  });
});

const PUBLIC_FIELDS = [
  'board',
  'clue',
  'endsAt',
  'gameNo',
  'guessesLeft',
  'key',
  'phase',
  'ready',
  'reason',
  'seats',
  'starter',
  'step',
  'turn',
  'winner',
];
const keyFieldsOf = (v: object) => Object.keys(v).sort();

describe('choosing captains', () => {
  const picks: SignumPicks = { ada: 'a', bora: 'a', cem: 'a', deniz: 'b', ece: 'b', gul: 'obs' };

  it('accepting an offer makes a candidate, never a captain; only the owner approves', () => {
    let p = emptyPregame();
    const offered = offerCaptain(p, picks, true, 'deniz');
    if ('error' in offered) throw new Error();
    p = offered;
    expect(p.offers.b).toBe('deniz');
    const accepted = answerOffer(p, picks, 'deniz', true);
    if ('error' in accepted) throw new Error();
    p = accepted;
    expect(p.captains.b).toBeNull();
    expect(p.candidates.b).toEqual(['deniz']);
    expect(p.offers.b).toBeNull();
    expect(approveCaptain(p, picks, false, 'b', 'deniz')).toEqual({ error: 'not_owner' });
    const approved = approveCaptain(p, picks, true, 'b', 'deniz');
    if ('error' in approved) throw new Error();
    expect(approved.captains.b).toBe('deniz');
  });

  it('a no clears the offer and makes no candidate', () => {
    const offered = offerCaptain(emptyPregame(), picks, true, 'ece');
    if ('error' in offered) throw new Error();
    const declined = answerOffer(offered, picks, 'ece', false);
    if ('error' in declined) throw new Error();
    expect(declined.offers.b).toBeNull();
    expect(declined.candidates.b).toEqual([]);
    expect(answerOffer(declined, picks, 'ece', true)).toEqual({ error: 'no_offer' });
  });

  it('the owner approves only a candidate of that team', () => {
    const p = volunteer(emptyPregame(), picks, 'ada', true);
    if ('error' in p) throw new Error();
    expect(approveCaptain(p, picks, true, 'a', 'bora')).toEqual({ error: 'not_candidate' });
    expect(approveCaptain(p, picks, true, 'b', 'ada')).toEqual({ error: 'not_candidate' });
    expect(volunteer(p, picks, 'gul', true)).toEqual({ error: 'not_in_team' });
    expect(offerCaptain(p, picks, false, 'bora')).toEqual({ error: 'not_owner' });
  });

  it('a random choice is an offer the person can still turn down', () => {
    const p = randomOffer(emptyPregame(), picks, true, 'a', rng(3));
    if ('error' in p) throw new Error();
    expect(['ada', 'bora', 'cem']).toContain(p.offers.a);
    expect(p.captains.a).toBeNull();
  });

  it('seats come only from approved captains still on their team', () => {
    let p = emptyPregame();
    for (const sid of ['ada', 'deniz']) {
      const v = volunteer(p, picks, sid, true);
      if ('error' in v) throw new Error();
      p = v;
    }
    expect(seatsAtStart(p, picks)).toBeNull();
    for (const [team, sid] of [
      ['a', 'ada'],
      ['b', 'deniz'],
    ] as const) {
      const v = approveCaptain(p, picks, true, team, sid);
      if ('error' in v) throw new Error();
      p = v;
    }
    const seats = seatsAtStart(p, picks) ?? [];
    expect(
      seats
        .filter((s) => s.role === 'captain')
        .map((s) => s.sid)
        .sort(),
    ).toEqual(['ada', 'deniz']);
    expect(seats.some((s) => s.sid === 'gul')).toBe(false);
    // Deniz moved to Mor: Pembe has no captain any more.
    expect(seatsAtStart(p, { ...picks, deniz: 'a' })).toBeNull();
    const dropped = dropFromPregame(p, 'deniz');
    expect(dropped.captains.b).toBeNull();
    expect(dropped.candidates.b).toEqual([]);
  });

  it('a replay brings the last captains back as candidates, not captains', () => {
    const p = pregameAgain({ a: 'ada', b: 'deniz' });
    expect(p.captains).toEqual({ a: null, b: null });
    expect(p.candidates).toEqual({ a: ['ada'], b: ['deniz'] });
  });
});
