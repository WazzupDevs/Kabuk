import { CONCEPTS, type Concept } from './rooms.ts';
import { MAX_TABLE_PHONES } from './tables.ts';

// Mekan's table card (docs/SPEC_V4.md §4.E; v46 "mekan" states): what the person has at the venue.
// - 'none': no table ("Masa kur", "Katıl", "Bu masadayım");
// - 'private': owns a table not in the lobby ("Lobiye aç", "Davet et");
// - 'open': owns a table in the lobby ("Lobiden çek", "Davet et");
// - 'participant': sits at another's table (opens it; "Katıl" waits until it leaves).
export type TableState = 'none' | 'private' | 'open' | 'participant';

export type TableRoom = {
  status: string;
  visibility: string;
};

export function tableState(room: TableRoom | null, owner: boolean): TableState {
  if (!room || (room.status !== 'waiting' && room.status !== 'active')) return 'none';
  if (!owner) return 'participant';
  return room.visibility === 'open' ? 'open' : 'private';
}

// The lobby's buttons for this person (v46 "mekan" states): "Katıl" without a table or as an owner
// (a participant leaves first: not_owner), shown but closed when the owner's table and that one
// together would pass MAX_TABLE_PHONES (table_full; "Masan 12 kişi, Katıl kapalı"); "Bu masadayım"
// only without a table.
export function lobbyActions(
  state: TableState,
  myPhones: number,
  theirPhones: number,
): { join: boolean; full: boolean; member: boolean } {
  const join = state !== 'participant';
  const owner = state === 'private' || state === 'open';
  return {
    join,
    full: join && owner && myPhones + theirPhones > MAX_TABLE_PHONES,
    member: state === 'none',
  };
}

// A lobby row's game tag as read (`venue_tables`); anything else is "fark etmez".
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
