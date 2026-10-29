import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  aliveSeats,
  nightTargets,
  readVampirResult,
  readVampirState,
  readVampirView,
  roleDeck,
  sideOf,
  VAMPIR,
  vampireCount,
  voteTally,
  votersFor,
  wonGame,
} from './vampir.ts';

const migrations = resolve(import.meta.dirname, '../../../migrations');
const migration = readFileSync(
  resolve(migrations, readdirSync(migrations).find((f) => f.endsWith('_vampir.sql')) ?? ''),
  'utf8',
);

describe('VAMPIR', () => {
  it('is the server’s private.vampir_config()', () => {
    const body = migration.slice(
      migration.indexOf('create function private.vampir_config()'),
      migration.indexOf('create function private.vampir_seconds'),
    );
    const numbers = Object.fromEntries(
      [...body.matchAll(/'(\w+)', (\d+)/g)].map((m) => [m[1], Number(m[2])]),
    );
    expect(numbers).toEqual(VAMPIR);
  });
});

describe('roleDeck', () => {
  it('deals 1, 2 or 3 vampires, a doctor, a seer, a jester from 6 and villagers', () => {
    const counts = (n: number) => {
      const deck = roleDeck(n);
      expect(deck).toHaveLength(n);
      return {
        vampir: deck.filter((r) => r === 'vampir').length,
        doktor: deck.filter((r) => r === 'doktor').length,
        gozcu: deck.filter((r) => r === 'gozcu').length,
        soytari: deck.filter((r) => r === 'soytari').length,
        koylu: deck.filter((r) => r === 'koylu').length,
      };
    };
    expect(counts(5)).toEqual({ vampir: 1, doktor: 1, gozcu: 1, soytari: 0, koylu: 2 });
    expect(counts(6)).toEqual({ vampir: 1, doktor: 1, gozcu: 1, soytari: 1, koylu: 2 });
    expect(counts(7)).toEqual({ vampir: 2, doktor: 1, gozcu: 1, soytari: 1, koylu: 2 });
    expect(counts(9)).toEqual({ vampir: 2, doktor: 1, gozcu: 1, soytari: 1, koylu: 4 });
    expect(counts(10)).toEqual({ vampir: 3, doktor: 1, gozcu: 1, soytari: 1, koylu: 4 });
    expect(counts(12)).toEqual({ vampir: 3, doktor: 1, gozcu: 1, soytari: 1, koylu: 6 });
    for (let n = VAMPIR.minPlayers; n <= VAMPIR.maxPlayers; n++) {
      expect(counts(n).vampir).toBe(vampireCount(n));
    }
  });

  it('is the server’s private.vampir_deck', () => {
    expect(migration).toContain(
      'case when players <= 6 then 1 when players <= 9 then 2 else 3 end',
    );
    expect(migration).toContain('if players >= 6 then');
  });
});

describe('sides', () => {
  it('puts the doctor and the seer with the villagers and the jester alone', () => {
    expect(sideOf('vampir')).toBe('v');
    expect(sideOf('doktor')).toBe('k');
    expect(sideOf('gozcu')).toBe('k');
    expect(sideOf('koylu')).toBe('k');
    expect(sideOf('soytari')).toBe('j');
    expect(wonGame('doktor', 'k')).toBe(true);
    expect(wonGame('soytari', 'k')).toBe(false);
    expect(wonGame('vampir', 'j')).toBe(false);
  });
});

const BASE = {
  gameNo: 2,
  phase: 'night',
  step: 4,
  endsAt: '2026-10-29T08:30:00.000+00:00',
  round: 2,
  seats: ['a', 'b', 'c', 'd', 'e', 'f'],
  dead: [{ sid: 'f', role: 'koylu', when: 'night', round: 1 }],
  gone: ['e'],
  ready: [],
  acted: 3,
};

describe('readVampirState', () => {
  it('reads a running game and refuses anything else', () => {
    const state = readVampirState(BASE);
    expect(state).toMatchObject({
      phase: 'night',
      step: 4,
      seats: BASE.seats,
      gone: ['e'],
      acted: 3,
      votes: {},
      victim: null,
      out: null,
      winner: null,
    });
    expect(readVampirState({ gameNo: 1 })).toBeNull();
    expect(readVampirState({ ...BASE, phase: 'lunch' })).toBeNull();
    expect(readVampirState(null)).toBeNull();
  });

  it('reads a death without its role while the game runs (K-80)', () => {
    const state = readVampirState({ ...BASE, dead: [{ sid: 'f', when: 'vote', round: 2 }] });
    expect(state?.dead).toEqual([{ sid: 'f', when: 'vote', round: 2 }]);
  });

  it('drops a death it cannot read', () => {
    const state = readVampirState({ ...BASE, dead: [{ sid: 'f', role: 'king', when: 'night' }] });
    expect(state?.dead).toEqual([]);
  });
});

describe('readVampirResult', () => {
  it('reads the end of a finished game, not an abandoned one', () => {
    const last = {
      concept: 'vampir',
      abandoned: false,
      vampir: {
        winner: 'k',
        roles: { a: 'vampir', b: 'koylu' },
        seats: ['a', 'b'],
        dead: [],
        gone: [],
      },
    };
    expect(readVampirResult({ gameNo: 1, lastGame: last })).toMatchObject({
      winner: 'k',
      roles: { a: 'vampir', b: 'koylu' },
    });
    expect(readVampirResult({ lastGame: { ...last, abandoned: true } })).toBeNull();
    expect(readVampirResult({ lastGame: { ...last, concept: 'tabu' } })).toBeNull();
    expect(readVampirResult({})).toBeNull();
  });
});

describe('the living and their choices', () => {
  const state = readVampirState(BASE);
  if (!state) throw new Error('unreadable');

  it('leaves out the dead and the gone', () => {
    expect(aliveSeats(state)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('gives each role its night targets', () => {
    expect(nightTargets(state, 'a', 'vampir', ['b'], null)).toEqual(['c', 'd']);
    expect(nightTargets(state, 'c', 'doktor', [], 'd')).toEqual(['a', 'b', 'c']);
    expect(nightTargets(state, 'c', 'doktor', [], null)).toEqual(['a', 'b', 'c', 'd']);
    expect(nightTargets(state, 'd', 'gozcu', [], null)).toEqual(['a', 'b', 'c']);
    expect(nightTargets(state, 'b', 'koylu', [], null)).toEqual(['a', 'c', 'd']);
  });

  it('counts the open votes of the living for the living', () => {
    const voting = { ...state, votes: { a: 'c', b: 'c', c: 'a', d: 'e', e: 'a' } };
    expect(voteTally(voting)).toEqual({ c: 2, a: 1 });
    expect(votersFor(voting, 'c')).toEqual(['a', 'b']);
  });
});

describe('readVampirView', () => {
  it('reads the caller’s own view and treats anything else as watching', () => {
    expect(
      readVampirView({
        role: 'gozcu',
        mates: [],
        pick: 'b',
        matePicks: {},
        seen: [{ sid: 'b', vampire: true, round: 1 }, { sid: 3 }],
        lastSave: null,
      }),
    ).toEqual({
      role: 'gozcu',
      mates: [],
      pick: 'b',
      matePicks: {},
      seen: [{ sid: 'b', vampire: true, round: 1 }],
      lastSave: null,
    });
    expect(readVampirView({ role: null })).toEqual({ role: null });
    expect(readVampirView('x')).toEqual({ role: null });
  });
});
