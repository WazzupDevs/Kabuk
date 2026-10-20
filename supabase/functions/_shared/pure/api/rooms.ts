import type { Concept, Intent, ProposableConcept } from '../rooms.ts';
import type { Side } from '../teams.ts';

// Request and response shapes of the `rooms` Edge Function, shared with the mobile app
// (docs/SPEC_V3.md §5, §11).
// "Oda kur" ("Masanı lobiye aç", docs/SPEC_V3.md §23.C): always open to the venue; an optional
// intent, an optional game tag (none: "fark etmez") and the owner's choice for this room.
export type CreateRoomRequest = {
  action: 'create';
  intent?: Intent;
  gameTag?: Concept;
  profiled: boolean;
  // docs/SPEC_V4.md §4.E (K-45): one of pure/tableIcons.ts; without it the server picks a free one.
  // Another table's icon at the venue is icon_taken.
  icon?: string;
};
// "Masanla oyna": a private one-table room, anonymous.
export type CreateSoloRoomRequest = { action: 'create-solo' };
// Without `side`: "Katıl", the guest's side as its leader. With it: "Bu masadayım", a member of that
// side (docs/SPEC_V3.md §22.C).
export type RequestJoinRequest = {
  action: 'request-join';
  roomId: string;
  profiled: boolean;
  side?: Side;
};
export type RespondRequest = { action: 'respond'; requestId: string; accept: boolean };
// `players` (1-4): Sahtekar only, this table's count; without it the check-in headcount
// (docs/SPEC_V3.md §20.1).
export type ProposeGameRequest = {
  action: 'propose-game';
  roomId: string;
  concept: ProposableConcept;
  players?: number;
};
export type AnswerGameRequest = {
  action: 'answer-game';
  roomId: string;
  accept: boolean;
  players?: number;
};
// "Oyunu bitir": the room returns to chat.
export type EndGameRequest = { action: 'end-game'; roomId: string };
// "Odayı bitir": a leader only (not_leader).
export type EndRoomRequest = { action: 'end' };
// "Odadan çık" (docs/SPEC_V3.md §22.D): this phone leaves; a leader hands its side to the oldest
// member, the side's last phone ends the room as before.
export type LeaveRoomRequest = { action: 'leave'; roomId: string };
// The request card's profile (docs/SPEC_V3.md §23.E): a requester who asked with its profile, read
// by the leader who can answer the request while it waits. Anything else is not_found, alike.
export type RequestProfileRequest = { action: 'request-profile'; requestId: string };
// docs/SPEC_V4.md §4.E (K-45, K-59): the owner changes the table's icon (icon_taken when another
// table at the venue has it) or draws a new name, 3 times per table (reroll_limit); not_owner
// otherwise. The name and the icon never say anything about anyone.
export type SetIconRequest = { action: 'set-icon'; roomId: string; icon: string };
export type RerollNameRequest = { action: 'reroll-name'; roomId: string };
export type SetIconResponse = { icon: string };
export type RerollNameResponse = { name: string; rerollsLeft: number };

export type RoomsRequest =
  | CreateRoomRequest
  | CreateSoloRoomRequest
  | RequestJoinRequest
  | RespondRequest
  | ProposeGameRequest
  | AnswerGameRequest
  | EndGameRequest
  | EndRoomRequest
  | LeaveRoomRequest
  | RequestProfileRequest
  | SetIconRequest
  | RerollNameRequest;

export type CreateRoomResponse = { roomId: string };
// Identical for every request: nothing in it depends on the owner's later answer.
export type RequestJoinResponse = { requestId: string; expiresAt: string };
// The display name, the age and a signed photo URL (null when hidden); no public_id (rule 4).
export type RequestProfileResponse = {
  displayName: string | null;
  age: number | null;
  photoUrl: string | null;
};
export type ProposeGameResponse = { expiresAt: string };
export type RoomsOkResponse = { ok: true };
