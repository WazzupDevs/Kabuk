import type { Concept, Intent, ProposableConcept } from '../rooms.ts';
import type { Side } from '../teams.ts';

// Request and response shapes of the `rooms` Edge Function, shared with the mobile app
// (docs/SPEC_V3.md §5, §11; the table of people from docs/SPEC_V4.md §4.E on). Fields and actions
// marked "today's app" stay in the types until 4.5b moves the app over: the server ignores the
// fields and answers the actions update_required.
// "Masa kur" (§4.E): in the lobby (`open`, the default) or not, with an optional intent and game tag
// (none: "fark etmez"). The owner sits down with the check-in's identity (§4.D); already at a table
// is already_in_table.
export type CreateRoomRequest = {
  action: 'create';
  open?: boolean;
  intent?: Intent;
  gameTag?: Concept;
  // Today's app; ignored.
  profiled?: boolean;
  // docs/SPEC_V4.md §4.E (K-45): one of pure/tableIcons.ts; without it the server picks a free one.
  // Another table's icon at the venue is icon_taken.
  icon?: string;
};
// Today's app ("Masanla oyna"): update_required. A table out of the lobby is `create` with `open:
// false`.
export type CreateSoloRoomRequest = { action: 'create-solo' };
// "Masanı lobiye aç" and "Lobiden çek" (§4.E): the owner only. Requests of the other road end as a
// decline does (rule 5).
export type SetVisibilityRequest = { action: 'set-visibility'; roomId: string; open: boolean };
// Without `asMember`: "Katıl" to a table in the lobby, from a table's owner (its whole table moves at
// the accept) or a person on its own; another table's participant is not_owner. With it: "Bu
// masadayım" to a running table, from a person on its own (already_in_table otherwise). At most 12
// phones together (table_full). The identity is the check-in's.
export type RequestJoinRequest = {
  action: 'request-join';
  roomId: string;
  asMember?: boolean;
  // Today's app; ignored.
  profiled?: boolean;
  side?: Side;
};
export type RespondRequest = { action: 'respond'; requestId: string; accept: boolean };
// Today's app: update_required (the games come back with step 4.6).
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
// "Masayı bitir": the owner only (not_owner); the table closes for everyone.
export type EndRoomRequest = { action: 'end' };
// "Masadan ayrıl" (§4.E, K-13): the person leaves and the table goes on; an owner hands it to the
// earliest person there; the last person's leaving closes it.
export type LeaveRoomRequest = { action: 'leave'; roomId: string };
// The request card's profile (docs/SPEC_V3.md §23.E): the person who asked, when it sat down
// profiled, read by the owner while the request waits. Anything else is not_found, alike.
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
  | SetVisibilityRequest
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
