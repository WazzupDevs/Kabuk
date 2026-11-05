import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  accusedOf,
  guessMatches,
  impostorCount,
  mayVote,
  readSahtekarResult,
  readSahtekarState,
  readSahtekarView,
  SAHTEKAR_GAME,
  tallyOf,
  winnerOf,
} from './sahtekarGame.ts';

const migrations = resolve(import.meta.dirname, '../../../migrations');
// The latest definition of private.sahtekar_config().
const CONFIG = 'function private.sahtekar_config()';
const migration =
  readdirSync(migrations)
    .sort()
    .map((f) => readFileSync(resolve(migrations, f), 'utf8'))
    .filter((text) => text.includes(CONFIG))
    .at(-1) ?? '';

describe('SAHTEKAR_GAME', () => {
  it('is the server’s private.sahtekar_config()', () => {
    const from = migration.indexOf(CONFIG);
    const body = migration.slice(from, migration.indexOf('$$;', from));
    const numbers = Object.fromEntries(
      [...body.matchAll(/'(\w+)', (\d+)/g)].map((m) => [m[1], Number(m[2])]),
    );
    expect(numbers).toEqual(SAHTEKAR_GAME);
  });

  it('has 30 s clues, 90 s votes and a 15 s last chance (§4.F, K-71)', () => {
    expect(SAHTEKAR_GAME).toMatchObject({
      clueSeconds: 30,
      clueRounds: 2,
      voteSeconds: 90,
      guessSeconds: 15,
      minPlayers: 3,
    });
  });
});

describe('impostorCount (K-71)', () => {
  it('is one up to 6 players and two from 7', () => {
    expect([3, 4, 5, 6, 7, 8, 12].map(impostorCount)).toEqual([1, 1, 1, 1, 2, 2, 2]);
  });
});

describe('accusedOf (§4.F)', () => {
  it('takes the most voted', () => {
    expect(accusedOf({ a: 3, b: 1 }, 1)).toEqual(['a']);
    expect(accusedOf({ a: 3, b: 2, c: 1 }, 2).sort()).toEqual(['a', 'b']);
  });

  it('leaves a place empty on a tie across it', () => {
    expect(accusedOf({ a: 2, b: 2 }, 1)).toEqual([]);
    expect(accusedOf({ a: 3, b: 2, c: 2 }, 2)).toEqual(['a']);
    expect(accusedOf({ a: 2, b: 2, c: 1 }, 2).sort()).toEqual(['a', 'b']);
  });

  it('accuses nobody without votes', () => {
    expect(accusedOf({}, 1)).toEqual([]);
    expect(accusedOf({ a: 0 }, 1)).toEqual([]);
  });
});

describe('tallyOf', () => {
  it('counts every target of every ballot', () => {
    expect(tallyOf({ x: ['a'], y: ['a'], z: ['b'] })).toEqual({ a: 2, b: 1 });
    expect(tallyOf({ x: ['a', 'b'], y: ['b', 'c'] })).toEqual({ a: 1, b: 2, c: 1 });
  });
});

describe('mayVote', () => {
  const state = { seats: ['a', 'b', 'c', 'd'], gone: ['d'], impostors: 1 };

  it('takes as many others still in the game as there are impostors', () => {
    expect(mayVote(state, 'a', ['b'])).toBe(true);
    expect(mayVote(state, 'a', ['a'])).toBe(false);
    expect(mayVote(state, 'a', ['d'])).toBe(false);
    expect(mayVote(state, 'a', ['b', 'c'])).toBe(false);
    expect(mayVote(state, 'd', ['a'])).toBe(false);
    expect(mayVote({ ...state, impostors: 2 }, 'a', ['b', 'b'])).toBe(false);
    expect(mayVote({ ...state, impostors: 2 }, 'a', ['b', 'c'])).toBe(true);
  });
});

describe('winnerOf (§4.F)', () => {
  it('gives the table the game only when all are caught and the guess misses', () => {
    expect(winnerOf(1, 1, false)).toBe('table');
    expect(winnerOf(1, 1, null)).toBe('table');
    expect(winnerOf(1, 1, true)).toBe('impostors');
    expect(winnerOf(1, 0, null)).toBe('impostors');
    expect(winnerOf(2, 1, false)).toBe('impostors');
  });
});

describe('guessMatches (rule 7)', () => {
  it('ignores case, spaces and punctuation', () => {
    expect(guessMatches('çay', 'Çay')).toBe(true);
    expect(guessMatches(' ÇAY! ', 'Çay')).toBe(true);
    expect(guessMatches('spor salonu', 'Spor salonu')).toBe(true);
    expect(guessMatches('sporsalonu.', 'Spor salonu')).toBe(true);
    expect(guessMatches('kahve', 'Çay')).toBe(false);
    expect(guessMatches('...', '...')).toBe(false);
  });
});

describe('readSahtekarState', () => {
  it('reads the open state and refuses anything else', () => {
    expect(readSahtekarState(null)).toBeNull();
    expect(readSahtekarState({ phase: 'night', step: 1, endsAt: 'x' })).toBeNull();
    expect(
      readSahtekarState({
        gameNo: 2,
        phase: 'clue',
        step: 3,
        endsAt: '2026-11-05T10:00:00Z',
        seats: ['a', 'b', 'c'],
        gone: [],
        impostors: 1,
        category: 'Kampüs',
        round: 1,
        speaker: 'b',
        next: 'c',
      }),
    ).toMatchObject({
      phase: 'clue',
      round: 1,
      speaker: 'b',
      next: 'c',
      voted: [],
      tally: {},
      category: 'Kampüs',
    });
  });
});

describe('readSahtekarResult', () => {
  it('reads lastGame.sahtekar', () => {
    const result = readSahtekarResult({
      lastGame: {
        concept: 'sahtekar',
        sahtekar: {
          winner: 'table',
          word: 'Çay',
          category: 'İçecek',
          seats: ['a', 'b', 'c'],
          gone: [],
          impostorSeats: ['a'],
          tally: { a: 2, b: 1 },
          accused: ['a'],
          caught: ['a'],
          guessedRight: false,
          rightVoters: ['b', 'c'],
        },
      },
    });
    expect(result).toMatchObject({ winner: 'table', caught: ['a'], guessedRight: false });
    expect(readSahtekarResult({ lastGame: { concept: 'tabu', sahtekar: {} } })).toBeNull();
  });
});

describe('readSahtekarView', () => {
  it('keeps only what the role may know', () => {
    expect(readSahtekarView({ role: 'impostor', category: 'İçecek', word: 'Çay' })).toEqual({
      role: 'impostor',
      category: 'İçecek',
    });
    expect(readSahtekarView({ role: 'player', category: 'İçecek', word: 'Çay' })).toEqual({
      role: 'player',
      category: 'İçecek',
      word: 'Çay',
    });
    expect(readSahtekarView({ role: null })).toEqual({ role: null });
  });
});
