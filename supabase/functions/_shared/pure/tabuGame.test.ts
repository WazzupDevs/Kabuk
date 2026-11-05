import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  describerOf,
  mayPress,
  readTabuResult,
  readTabuState,
  TABU_GAME,
  TABU_POINTS,
  teamOfTurn,
  winnerOf,
} from './tabuGame.ts';

const migrations = resolve(import.meta.dirname, '../../../migrations');
const migration = readFileSync(
  resolve(migrations, readdirSync(migrations).find((f) => f.endsWith('_kapsul_anlat.sql')) ?? ''),
  'utf8',
);

describe('TABU_GAME', () => {
  it('is the server’s private.tabu_config()', () => {
    const body = migration.slice(
      migration.indexOf('create function private.tabu_config()'),
      migration.indexOf('create function private.tabu_seconds'),
    );
    const numbers = Object.fromEntries(
      [...body.matchAll(/'(\w+)', (\d+)/g)].map((m) => [m[1], Number(m[2])]),
    );
    expect(numbers).toEqual(TABU_GAME);
  });

  it('scores Doğru +1, Yasak! −1, Pas 0 (§4.F)', () => {
    expect(TABU_POINTS).toEqual({ correct: 1, taboo: -1, pass: 0 });
  });
});

const teams = { a: ['a1', 'a2', 'a3'], b: ['b1', 'b2'] };

describe('turns and describers', () => {
  it('goes Mor, Pembe, Mor…', () => {
    expect([1, 2, 3, 4, 5, 6].map(teamOfTurn)).toEqual(['a', 'b', 'a', 'b', 'a', 'b']);
  });

  it('gives the team’s k-th turn to its k-th player, round again when shorter', () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => describerOf(teams, [], n))).toEqual([
      'a1',
      'b1',
      'a2',
      'b2',
      'a3',
      'b1',
    ]);
  });

  it('skips who left; a team of one describes every turn, an empty one nobody', () => {
    expect(describerOf(teams, ['a2'], 3)).toBe('a3');
    expect([2, 4, 6].map((n) => describerOf(teams, ['b1'], n))).toEqual(['b2', 'b2', 'b2']);
    expect(describerOf(teams, ['b1', 'b2'], 2)).toBeNull();
  });

  it('lets the describer press Doğru and Pas and the other team Yasak!', () => {
    const state = { teams, gone: [], describer: 'a1', turnNo: 1 };
    expect(mayPress(state, 'a1', 'correct')).toBe(true);
    expect(mayPress(state, 'a1', 'pass')).toBe(true);
    expect(mayPress(state, 'a1', 'taboo')).toBe(false);
    expect(mayPress(state, 'a2', 'correct')).toBe(false);
    expect(mayPress(state, 'a2', 'taboo')).toBe(false);
    expect(mayPress(state, 'b2', 'taboo')).toBe(true);
    expect(mayPress(state, 'b2', 'correct')).toBe(false);
    expect(mayPress(state, 'watcher', 'taboo')).toBe(false);
    expect(mayPress({ ...state, gone: ['b2'] }, 'b2', 'taboo')).toBe(false);
  });

  it('names the winner, or a draw', () => {
    expect(winnerOf({ a: 3, b: 1 })).toBe('a');
    expect(winnerOf({ a: -1, b: 0 })).toBe('b');
    expect(winnerOf({ a: 2, b: 2 })).toBeNull();
  });
});

describe('readTabuState', () => {
  it('reads a running turn', () => {
    expect(
      readTabuState({
        gameNo: 2,
        phase: 'turn',
        step: 4,
        endsAt: '2026-11-05T10:01:03Z',
        startsAt: '2026-11-05T10:00:03Z',
        turnNo: 2,
        totalTurns: 6,
        maxPasses: 3,
        seats: ['a1', 'b1', 'a2', 'b2'],
        teams: { a: ['a1', 'a2'], b: ['b1', 'b2'] },
        gone: [],
        describer: 'b1',
        scores: { a: 2, b: 1 },
        cardIndex: 2,
        passesUsed: 1,
        counts: { correct: 1, pass: 1, taboo: 0 },
        words: [
          { word: 'Elma', result: 'correct' },
          { word: 'Kalem', result: 'pass' },
          { word: 3, result: 'pass' },
        ],
        stats: { correct: { a1: 2 }, taboo: {} },
      }),
    ).toEqual({
      gameNo: 2,
      phase: 'turn',
      step: 4,
      endsAt: '2026-11-05T10:01:03Z',
      startsAt: '2026-11-05T10:00:03Z',
      turnNo: 2,
      totalTurns: 6,
      maxPasses: 3,
      seats: ['a1', 'b1', 'a2', 'b2'],
      teams: { a: ['a1', 'a2'], b: ['b1', 'b2'] },
      gone: [],
      describer: 'b1',
      scores: { a: 2, b: 1 },
      cardIndex: 2,
      passesUsed: 1,
      counts: { correct: 1, pass: 1, taboo: 0 },
      words: [
        { word: 'Elma', result: 'correct' },
        { word: 'Kalem', result: 'pass' },
      ],
      lastTurn: null,
    });
  });

  it('is null between games and for another game’s state', () => {
    expect(readTabuState({ gameNo: 1 })).toBeNull();
    expect(readTabuState({ phase: 'night', step: 1, endsAt: 'x' })).toBeNull();
    expect(readTabuState(null)).toBeNull();
  });
});

describe('readTabuResult', () => {
  it('reads the end screen’s facts', () => {
    expect(
      readTabuResult({
        concept: 'tabu',
        tabu: {
          scores: { a: 4, b: 4 },
          winner: null,
          seats: ['a1', 'b1'],
          teams: { a: ['a1'], b: ['b1'] },
          gone: [],
          lastTurn: {
            turnNo: 6,
            team: 'b',
            describer: 'b1',
            score: 1,
            counts: { correct: 2, pass: 0, taboo: 1 },
            words: [],
          },
          topDescriber: { sid: 'a1', count: 3 },
          tabooHunter: null,
        },
      }),
    ).toEqual({
      scores: { a: 4, b: 4 },
      winner: null,
      seats: ['a1', 'b1'],
      teams: { a: ['a1'], b: ['b1'] },
      gone: [],
      lastTurn: {
        turnNo: 6,
        team: 'b',
        describer: 'b1',
        score: 1,
        counts: { correct: 2, pass: 0, taboo: 1 },
        words: [],
      },
      topDescriber: { sid: 'a1', count: 3 },
      tabooHunter: null,
    });
    expect(readTabuResult({ concept: 'vampir', vampir: {} })).toBeNull();
  });
});
