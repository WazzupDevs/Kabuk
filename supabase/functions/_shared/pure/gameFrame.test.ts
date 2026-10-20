import { describe, expect, it } from 'vitest';

import {
  isTableGame,
  pickAllowed,
  posterState,
  readPregame,
  tableGame,
  tableGameAvailability,
} from './gameFrame.ts';
import { MAX_TABLE_PHONES } from './tables.ts';
import { GAME_CATEGORIES, TABLE_GAMES } from './tableGames.ts';

describe('the table’s games (docs/SPEC_V4.md §4.F)', () => {
  it('knows its games by id and nothing else', () => {
    expect(isTableGame('tabu')).toBe(true);
    expect(isTableGame('satranc')).toBe(false);
  });

  it('keeps every game within a table and in a listed category', () => {
    const categories = new Set(GAME_CATEGORIES.map((c) => c.id));
    for (const game of TABLE_GAMES) {
      expect(game.maxPlayers).toBeLessThanOrEqual(MAX_TABLE_PHONES);
      expect(game.categories.every((c) => categories.has(c))).toBe(true);
    }
  });

  // §4.E: after step 4.5 today's games are "Yakında" until their step of 4.6.
  it('shows a game not yet playable as soon, whatever the table', () => {
    const game = tableGame('sahtekar');
    expect(posterState(game ? { ...game, available: false } : undefined, 12)).toEqual({
      state: 'soon',
    });
    expect(tableGameAvailability('satranc', 12)).toEqual({ state: 'soon' });
  });
});

describe('posterState (K-17)', () => {
  // A playable game's limits, as its step of 4.6 opens it.
  it('dims a playable game below its lower limit and opens it from there', () => {
    const game = tableGame('sahtekar');
    expect(game?.minPlayers).toBe(3);
    const open = game ? { ...game, available: true } : undefined;
    expect(posterState(open, 2)).toEqual({ state: 'needs_players', minPlayers: 3 });
    expect(posterState(open, 3)).toEqual({ state: 'open' });
    expect(posterState(game, 3)).toEqual({ state: 'soon' });
  });
});

describe('pickAllowed', () => {
  it('lets a team game take Mor, Pembe, watching or nothing; another game only watching', () => {
    for (const pick of ['a', 'b', 'obs', null] as const)
      expect(pickAllowed('tabu', pick)).toBe(true);
    expect(pickAllowed('sahtekar', 'obs')).toBe(true);
    expect(pickAllowed('sahtekar', null)).toBe(true);
    expect(pickAllowed('sahtekar', 'a')).toBe(false);
    expect(pickAllowed('satranc', null)).toBe(false);
  });
});

describe('readPregame', () => {
  it('reads the page and drops what is not a pick', () => {
    expect(
      readPregame({
        gameNo: 2,
        pregame: { concept: 'tabu', picks: { s1: 'a', s2: 'x', s3: 'obs' } },
      }),
    ).toEqual({ concept: 'tabu', picks: { s1: 'a', s3: 'obs' } });
    expect(readPregame({ gameNo: 2 })).toBeNull();
    expect(readPregame(null)).toBeNull();
  });
});
