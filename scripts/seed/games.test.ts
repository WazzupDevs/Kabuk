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
  it('holds the games of §4.F, Vampir Köylü (§4.6.6), Signum (§4.6.7), Sprengja (§4.6.8), Kibrit (§4.6.9) and Kaupholl (§4.6.10) with their lower limits (K-17)', () => {
    const limits = Object.fromEntries(
      parseGames(content).games.map((g) => [g.id, [g.minPlayers, g.teams]]),
    );
    expect(limits).toEqual({
      vampir: [5, false],
      kibrit: [3, false],
      tabu: [4, true],
      signum: [4, true],
      ibre: [4, true],
      sahtekar: [3, false],
      harf: [2, false],
      sarki: [2, false],
      sprengja: [3, false],
      kaupholl: [3, false],
      sohbet: [1, false],
    });
  });

  // §4.E: after step 4.5 today's games are "Yakında"; each comes with its step of 4.6 (Vampir Köylü:
  // 4.6.6; Kapsül Anlat, Kinshi on the table: 4.6.1; Krot: 4.6.3; Signum: 4.6.7; Sprengja: 4.6.8;
  // Kibrit: 4.6.9; Kaupholl: 4.6.10).
  it('opens only the games whose step of 4.6 has come', () => {
    expect(
      parseGames(content)
        .games.filter((g) => g.available)
        .map((g) => g.id),
    ).toEqual(['vampir', 'kibrit', 'tabu', 'signum', 'sahtekar', 'sprengja', 'kaupholl']);
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
