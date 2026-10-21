import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildSeed } from './build.ts';
import { buildTableGamesModule, parseGames, TABLE_GAMES_MODULE } from './games.ts';

const root = resolve(import.meta.dirname, '../..');
const content = JSON.parse(readFileSync(resolve(root, 'content/games.json'), 'utf8'));

describe(TABLE_GAMES_MODULE, () => {
  // §4.F: the app and the server read the same list; it is the one built from content/.
  it('is the module built from the current content (run `pnpm seed`)', async () => {
    expect(readFileSync(resolve(root, TABLE_GAMES_MODULE), 'utf8')).toBe(
      await buildTableGamesModule(root),
    );
  });

  it('is the list the seed loads into public.games', () => {
    const sql = buildSeed(root).sql;
    for (const game of parseGames(content).games) expect(sql).toContain(`('${game.id}', `);
  });
});

describe('content/games.json', () => {
  it('holds the six games of §4.F with their lower limits (K-17)', () => {
    const limits = Object.fromEntries(
      parseGames(content).games.map((g) => [g.id, [g.minPlayers, g.teams]]),
    );
    expect(limits).toEqual({
      tabu: [4, true],
      ibre: [4, true],
      sahtekar: [3, false],
      harf: [2, false],
      sarki: [2, false],
      sohbet: [1, false],
    });
  });

  // §4.E: after step 4.5 today's games are "Yakında"; each comes back with its step of 4.6.
  it('has no game open to play before its step of 4.6', () => {
    expect(parseGames(content).games.filter((g) => g.available)).toEqual([]);
  });

  it('refuses a game twice, an unknown category, and a team game under four', () => {
    const [first] = content.games;
    expect(() => parseGames({ ...content, games: [first, first] })).toThrow(/twice/);
    expect(() => parseGames({ ...content, games: [{ ...first, categories: ['yok'] }] })).toThrow(
      /no category/,
    );
    expect(() =>
      parseGames({ ...content, games: [{ ...first, teams: true, minPlayers: 3 }] }),
    ).toThrow(/at least 4/);
    expect(() => parseGames({ ...content, games: [{ ...first, maxPlayers: 13 }] })).toThrow(
      /1 to 12/,
    );
  });
});
