import { CONCEPTS, type Concept } from './rooms.ts';

// The table card at the top of the venue screen, the home screen (docs/SPEC_V3.md §23.C; canvas:
// Aşama 2 · Ekranlar → Faz 3 · 23.1 Masa ve lobi). The server's rooms stay; the user only sees the
// table:
// - 'off': not in the lobby ("Masanı lobiye aç", "Masanla oyna");
// - 'open': in the lobby as the leader of its waiting room ("Lobiden çek", "Masaya git");
// - 'member': a phone on that waiting room's side ("Masaya git", "Masadan çık");
// - 'merged': two sides, or the reveal window that ends them ("Masaya git");
// - 'solo': "Masanla oyna" ("Masaya git").
export type TableState = 'off' | 'open' | 'member' | 'merged' | 'solo';

export type TableRoom = {
  status: string;
  visibility: string;
  reveal_ends_at: string | null;
};

// `leader`: this phone leads a side of the room (its session is the room's owner or guest).
// `saidNo`: this phone answered "Hayır" in the room's reveal window.
export function tableState(
  room: TableRoom | null,
  leader: boolean,
  now: number,
  saidNo = false,
): TableState {
  if (!room || room.status === 'closed') return 'off';
  // Until 23.3 a two-sided room still ends with "Tanışalım mı?" on the room screen: the card keeps
  // leading there while the window is open, now that nothing sends the phone back to the room. A
  // phone that said "Hayır" already has its result ("Güzel oyundu") and is let go at once.
  if (room.status === 'ending') {
    const open = room.reveal_ends_at !== null && Date.parse(room.reveal_ends_at) > now;
    return open && !saidNo && room.visibility === 'open' ? 'merged' : 'off';
  }
  if (room.visibility === 'private') return 'solo';
  if (room.status === 'waiting') return leader ? 'open' : 'member';
  return 'merged';
}

// What the lobby offers the table in each state (docs/SPEC_V3.md §23.C, the 23.1 PR's limits):
// "Katıl" also from its own waiting room, as its leader; "Bu masadayım" and opening to the lobby
// only without a room. A merged table, a "Masanla oyna" table and a member see the lobby without
// its buttons.
export function lobbyActions(state: TableState): { join: boolean; member: boolean } {
  return { join: state === 'off' || state === 'open', member: state === 'off' };
}

// A lobby row's game tag as read (`venue_lobby_tags`); anything else is "fark etmez".
export function gameTag(value: unknown): Concept | null {
  return (CONCEPTS as readonly unknown[]).includes(value) ? (value as Concept) : null;
}

// A "Kabul" the server can no longer carry out (docs/SPEC_V3.md §23.C): the requester's table
// merged with another table while its request waited (room_not_available), or the request ended.
// The leader's card then says the table is no longer available instead of an error, and closes.
export function requestGone(code: string): boolean {
  return (
    code === 'room_not_available' || code === 'request_expired' || code === 'request_not_found'
  );
}
