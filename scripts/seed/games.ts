// content/games.json (docs/SPEC_V4.md §4.F, K-17): the games of the table, as data. Each game's
// name, player limits, whether it plays in teams, whether it opens a pre-game page, its categories,
// its poster and whether it can be played yet. Seeded into public.games (the frame's checks read it:
// rooms/vote, rooms/open-game, the start of a game) and written as the pure module the app and the
// functions read: supabase/functions/_shared/pure/tableGames.ts. A new game is a JSON entry and its
// own function; the frame does not change. games.test.ts checks the committed module is the one
// built from the content as it is now.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { format, resolveConfig } from 'prettier';

import { sqlLiteral } from './sql.ts';

export const TABLE_GAMES_MODULE = 'supabase/functions/_shared/pure/tableGames.ts';

// The most phones at a table (pure/tables.ts → MAX_TABLE_PHONES); no game asks for more.
const MAX_PLAYERS = 12;

export type GameCategory = { id: string; name: string };

export type TableGame = {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  teams: boolean;
  pregame: boolean;
  categories: string[];
  poster: string;
  available: boolean;
};

export type GamesContent = { categories: GameCategory[]; games: TableGame[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function flag(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${field} must be true or false`);
  return value;
}

function count(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_PLAYERS) {
    throw new Error(`${field} must be a whole number from 1 to ${MAX_PLAYERS}`);
  }
  return value;
}

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function parseGames(json: unknown): GamesContent {
  if (!isRecord(json) || !Array.isArray(json.categories) || !Array.isArray(json.games)) {
    throw new Error('games.json must have categories and games');
  }
  const categories = json.categories.map((c, i) => {
    if (!isRecord(c)) throw new Error(`categories[${i}] must be an object`);
    const id = text(c.id, `categories[${i}].id`);
    if (!ID.test(id)) throw new Error(`categories[${i}]: ${id} is not an id`);
    return { id, name: text(c.name, `categories[${i}].name`) };
  });
  const categoryIds = new Set(categories.map((c) => c.id));
  const seen = new Set<string>();
  const games = json.games.map((g, i) => {
    if (!isRecord(g)) throw new Error(`games[${i}] must be an object`);
    // The game's stored id (rooms.concept, table_votes.concept) and its function's name.
    const id = text(g.id, `games[${i}].id`);
    if (!ID.test(id)) throw new Error(`games[${i}]: ${id} is not an id`);
    if (seen.has(id)) throw new Error(`games: ${id} appears twice`);
    seen.add(id);
    const minPlayers = count(g.minPlayers, `games[${i}].minPlayers`);
    const maxPlayers = count(g.maxPlayers, `games[${i}].maxPlayers`);
    if (maxPlayers < minPlayers) throw new Error(`games[${i}]: maxPlayers below minPlayers`);
    const teams = flag(g.teams, `games[${i}].teams`);
    // Two teams of at least two (§4.F).
    if (teams && minPlayers < 4) throw new Error(`games[${i}]: a team game needs at least 4`);
    if (!Array.isArray(g.categories) || g.categories.length === 0) {
      throw new Error(`games[${i}].categories must list at least one category`);
    }
    const gameCategories = g.categories.map((c, j) => {
      const category = text(c, `games[${i}].categories[${j}]`);
      if (!categoryIds.has(category)) throw new Error(`games[${i}]: no category ${category}`);
      return category;
    });
    return {
      id,
      name: text(g.name, `games[${i}].name`),
      minPlayers,
      maxPlayers,
      teams,
      pregame: flag(g.pregame, `games[${i}].pregame`),
      categories: gameCategories,
      poster: text(g.poster, `games[${i}].poster`),
      available: flag(g.available, `games[${i}].available`),
    };
  });
  if (games.length === 0) throw new Error('games.json has no games');
  return { categories, games };
}

// Upserted by id; a game left out of the JSON stays for the tables that played it but can no
// longer be voted for, opened or started (is_available = false).
export function gamesSql({ games }: GamesContent): string {
  const rows = games.map(
    (g, i) =>
      `(${[g.id, g.name, g.minPlayers, g.maxPlayers, g.teams, g.pregame, g.available, i].map(sqlLiteral).join(', ')})`,
  );
  return [
    '-- content/games.json',
    'insert into public.games (id, name, min_players, max_players, teams, pregame, is_available, sort_order) values',
    `  ${rows.join(',\n  ')}`,
    'on conflict (id) do update set',
    '  name = excluded.name, min_players = excluded.min_players, max_players = excluded.max_players,',
    '  teams = excluded.teams, pregame = excluded.pregame, is_available = excluded.is_available,',
    '  sort_order = excluded.sort_order;',
    `update public.games set is_available = false where is_available and id <> all (${sqlLiteral(games.map((g) => g.id))});`,
    '',
  ].join('\n');
}

export async function buildTableGamesModule(root: string): Promise<string> {
  const content = parseGames(JSON.parse(readFileSync(resolve(root, 'content/games.json'), 'utf8')));
  const source = [
    '// Generated by `pnpm seed` (scripts/seed/games.ts) from content/games.json. Do not edit by',
    '// hand.',
    '',
    `export const GAME_CATEGORIES = ${JSON.stringify(content.categories)};`,
    '',
    `export const TABLE_GAMES = ${JSON.stringify(content.games)};`,
    '',
  ].join('\n');
  const options = await resolveConfig(resolve(root, TABLE_GAMES_MODULE));
  return format(source, { ...options, filepath: resolve(root, TABLE_GAMES_MODULE) });
}
