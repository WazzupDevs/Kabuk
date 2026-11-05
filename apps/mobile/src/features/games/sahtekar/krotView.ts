import type { SahtekarGameState, SahtekarView } from '@shared/sahtekarGame.ts';

// What of its role this phone may draw now (rule 3). The phone's own sahtekar/view answer is kept
// for the game, keyed by its table session (`krotViewKey`); this checks it again against the open
// state each time it is drawn: whoever left the game sees nothing any more, and a player's or an
// impostor's answer never shows to a session that is not in the game's seats (one who came back
// with a new check-in). A watcher keeps the word and the impostors (§4.F).
export function krotVisibleView(
  view: SahtekarView | undefined,
  state: Pick<SahtekarGameState, 'seats' | 'gone'>,
  me: string,
): SahtekarView | undefined {
  if (state.gone.includes(me)) return { role: null };
  if (!view) return undefined;
  if ((view.role === 'player' || view.role === 'impostor') && !state.seats.includes(me)) {
    return { role: null };
  }
  if (view.role === 'watcher' && state.seats.includes(me)) return { role: null };
  return view;
}

// Whether the card's face holds a role (not still loading, not failed, not empty): Hazırım opens
// only once such a face was shown while held.
export function krotRoleShown(view: SahtekarView | undefined): boolean {
  return view !== undefined && view.role !== null;
}

// The cache key of the phone's own role: per table, game and table session, so another check-in
// (one who left and came back) never reads an answer given to the old one.
export function krotViewKey(roomId: string, gameNo: number, me: string) {
  return ['sahtekarView', roomId, gameNo, me] as const;
}
// Every game's and session's answers of one table (dropped when the person leaves the game).
export function krotViewsOf(roomId: string) {
  return ['sahtekarView', roomId] as const;
}
