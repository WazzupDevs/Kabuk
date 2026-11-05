import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  activeSeats,
  checkKibritQuestion,
  KIBRIT,
  readKibritResult,
  readKibritState,
  readKibritView,
  roundCount,
  roundLimit,
  showsCounts,
  tally,
} from './kibrit.ts';
import { prepareTerms } from './profanity.ts';

const profanity = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../../../content/profanity-tr.json'), 'utf8'),
) as { terms: string[]; wholeWords: string[] };

const migrations = resolve(import.meta.dirname, '../../../migrations');
const migration = readFileSync(
  resolve(migrations, readdirSync(migrations).find((f) => f.endsWith('_kibrit.sql')) ?? ''),
  'utf8',
);

describe('KIBRIT', () => {
  it('is the server’s private.kibrit_config()', () => {
    const body = migration.slice(
      migration.indexOf('create function private.kibrit_config()'),
      migration.indexOf('create function private.kibrit_n'),
    );
    const numbers = Object.fromEntries(
      [...body.matchAll(/'(\w+)', (\d+)/g)].map((m) => [m[1], Number(m[2])]),
    );
    expect(numbers).toEqual(KIBRIT);
  });
});

describe('rounds (K-86)', () => {
  it('limits to the players, min(5, players) by default', () => {
    expect(roundLimit(3)).toBe(3);
    expect(roundLimit(8)).toBe(5);
    expect(roundLimit(4, 9)).toBe(4);
    expect(roundLimit(8, 7)).toBe(7);
    expect(roundLimit(6, 0)).toBe(1);
  });

  it('plays the limit or the valid papers, the smaller', () => {
    expect(roundCount(5, 3)).toBe(3);
    expect(roundCount(2, 6)).toBe(2);
  });

  it('shows every count from five players', () => {
    expect(showsCounts(4)).toBe(false);
    expect(showsCounts(5)).toBe(true);
  });
});

describe('checkKibritQuestion (rule 7)', () => {
  const terms = prepareTerms(profanity.terms, profanity.wholeWords);

  it('takes 1 to 80 characters, inner whitespace collapsed', () => {
    expect(checkKibritQuestion('  Kim   en geç  uyanır? ', terms)).toEqual({
      ok: true,
      value: 'Kim en geç uyanır?',
    });
    expect(checkKibritQuestion('   ', terms)).toEqual({ ok: false, reason: 'length' });
    expect(checkKibritQuestion('ğ'.repeat(80), terms).ok).toBe(true);
    expect(checkKibritQuestion('ğ'.repeat(81), terms)).toEqual({ ok: false, reason: 'length' });
  });

  it('refuses a phone, an e-mail, a username and a link', () => {
    for (const text of [
      'Kim beni 0532 123 45 67 numaradan arar?',
      'Kime elif@example.com yazarsın?',
      'insta: elif_k kimin?',
      'kim skall.app sitesine girer?',
    ]) {
      expect(checkKibritQuestion(text, terms), text).toEqual({ ok: false, reason: 'contact' });
    }
  });

  it('refuses profanity', () => {
    const word = profanity.terms[0] ?? '';
    expect(checkKibritQuestion(`Kim en çok ${word} der?`, terms)).toEqual({
      ok: false,
      reason: 'profanity',
    });
  });
});

describe('tally', () => {
  const four = ['a', 'b', 'c', 'd'];
  const five = ['a', 'b', 'c', 'd', 'e'];

  it('shows only who got the most below five players, every count from five', () => {
    expect(tally({ a: 'b', b: 'b', c: 'a', d: 'b' }, four)).toEqual({
      players: 4,
      voters: 4,
      top: ['b'],
    });
    expect(tally({ a: 'b', b: 'b', c: 'a', d: 'b' }, five)).toEqual({
      players: 5,
      voters: 4,
      top: ['b'],
      counts: { a: 1, b: 3, c: 0, d: 0, e: 0 },
    });
  });

  it('puts every tied one first, none when nobody voted', () => {
    expect(tally({ a: 'b', b: 'a' }, four).top).toEqual(['a', 'b']);
    expect(tally({}, four).top).toEqual([]);
  });

  it('counts a vote for oneself, never one by or for someone gone', () => {
    expect(tally({ a: 'a', b: 'x', x: 'a' }, four)).toEqual({ players: 4, voters: 1, top: ['a'] });
  });
});

describe('readKibritState', () => {
  it('reads the open state and nothing of an author', () => {
    const s = readKibritState({
      phase: 'result',
      step: 7,
      endsAt: '2026-11-05T00:00:00Z',
      seats: ['a', 'b', 'c'],
      gone: ['c'],
      limit: 3,
      rounds: 3,
      done: 1,
      papers: 3,
      drawer: 'a',
      paper: { id: 'p1', text: 'Kim?' },
      result: { paperId: 'p1', text: 'Kim?', players: 3, voters: 2, top: ['b'] },
      ready: ['a'],
      past: [{ paperId: 'p1', text: 'Kim?', top: ['b'], votes: null }],
    });
    expect(s?.phase).toBe('result');
    expect(s?.result?.counts).toBeUndefined();
    expect(activeSeats(s ?? { seats: [], gone: [] })).toEqual(['a', 'b']);
    expect(readKibritState({ phase: 'night', endsAt: 'x' })).toBeNull();
  });

  it('reads the end and the caller’s own view', () => {
    expect(
      readKibritResult({
        lastGame: {
          concept: 'kibrit',
          abandoned: false,
          kibrit: { notEnough: true, rounds: 0, players: 3, past: [] },
        },
      }),
    ).toEqual({ notEnough: true, rounds: 0, players: 3, past: [] });
    expect(readKibritResult({ lastGame: { concept: 'vampir' } })).toBeNull();
    expect(readKibritView({ paper: 'Kim?', paperRev: 2, vote: null, voteRev: 0 })).toEqual({
      paper: 'Kim?',
      paperRev: 2,
      vote: null,
      voteRev: 0,
    });
  });
});
