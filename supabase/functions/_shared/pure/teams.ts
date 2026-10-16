// Teams (docs/SPEC_V3.md §22.B): a room has two sides, each its leader and up to 3 members. The SQL
// functions have their own copies of these numbers (private.max_side_phones,
// private.side_headcount); supabase/tests/teams.test.ts checks that they agree.
export const SIDES = ['owner', 'guest'] as const;
export type Side = (typeof SIDES)[number];

export const MAX_SIDE_PHONES = 4;

// This phone's place in a room: its side and whether it leads it. A leader is the room row's
// owner_session_id or guest_session_id; a member is found in room_phones. Null: not in the room
// (or room_phones not read yet).
export type RoomSeat = { side: Side; leader: boolean };

export function roomSeat(
  room: { owner_session_id: string; guest_session_id: string | null },
  phones: readonly { sessionId: string; side: string }[] | undefined,
  sessionId: string,
): RoomSeat | null {
  if (room.owner_session_id === sessionId) return { side: 'owner', leader: true };
  if (room.guest_session_id === sessionId) return { side: 'guest', leader: true };
  const phone = phones?.find((p) => p.sessionId === sessionId);
  if (!phone || (phone.side !== 'owner' && phone.side !== 'guest')) return null;
  return { side: phone.side, leader: false };
}

export function otherSide(side: Side): Side {
  return side === 'owner' ? 'guest' : 'owner';
}

// A side's headcount: what the side declared at check-in (its first leader's table; a new leader
// keeps it) or its phones, whichever is larger. Tabu's mode and Sahtekar's seats come from it
// (step 22.3).
export function sideHeadcount(declared: number, phones: number): number {
  return Math.max(declared, phones);
}
