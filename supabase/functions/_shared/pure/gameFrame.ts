// The frame of the table's games (docs/SPEC_V4.md §4.F "Çerçeve"): which games there are and
// whether a table can play one now, and the picks of the pre-game page. The games are data
// (content/games.json → tableGames.ts, the same list the seed loads into public.games); a new game
// is an entry there and its own function, and nothing here changes.
import { TABLE_GAMES } from './tableGames.ts';

export type TableGameId = string;
export type TableGameEntry = (typeof TABLE_GAMES)[number];

export function tableGame(id: string): TableGameEntry | undefined {
  return TABLE_GAMES.find((g) => g.id === id);
}

export function isTableGame(id: string): boolean {
  return tableGame(id) !== undefined;
}

// A poster's state: "Yakında" (not playable yet, cannot be voted for or opened), dimmed (fewer
// phones at the table than the game needs: it can be voted for, not opened, K-17), or open.
export type GamePosterState =
  { state: 'soon' } | { state: 'needs_players'; minPlayers: number } | { state: 'open' };

export function posterState(game: TableGameEntry | undefined, phones: number): GamePosterState {
  if (!game || !game.available) return { state: 'soon' };
  return phones >= game.minPlayers
    ? { state: 'open' }
    : { state: 'needs_players', minPlayers: game.minPlayers };
}

export function tableGameAvailability(id: string, phones: number): GamePosterState {
  return posterState(tableGame(id), phones);
}

// A pick on the pre-game page: Mor ('a') or Pembe ('b') in a team game, or watching ('obs');
// no pick is "Henüz seçmeyenler" in a team game and a player in any other.
export const PICKS = ['a', 'b', 'obs'] as const;
export type Pick = (typeof PICKS)[number];

export function pickAllowed(id: string, pick: Pick | null): boolean {
  const game = tableGame(id);
  if (!game) return false;
  return pick === null || pick === 'obs' || game.teams;
}

// The pre-game page as rooms.game_state.pregame holds it: the game and each person's pick by
// table session id (rule 4).
export type Pregame = { concept: string; picks: Record<string, Pick> };

export function readPregame(state: unknown): Pregame | null {
  if (typeof state !== 'object' || state === null || !('pregame' in state)) return null;
  const pregame = (state as { pregame: unknown }).pregame;
  if (typeof pregame !== 'object' || pregame === null) return null;
  const { concept, picks } = pregame as { concept?: unknown; picks?: unknown };
  if (typeof concept !== 'string') return null;
  const read: Record<string, Pick> = {};
  if (typeof picks === 'object' && picks !== null) {
    for (const [session, pick] of Object.entries(picks)) {
      if ((PICKS as readonly unknown[]).includes(pick)) read[session] = pick as Pick;
    }
  }
  return { concept, picks: read };
}
