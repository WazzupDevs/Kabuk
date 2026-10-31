import type { Pick } from '../gameFrame.ts';
import type { Concept, Intent, ProposableConcept } from '../rooms.ts';

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
// Opening to the lobby takes the "Masanı lobiye aç" sheet's intent and game tag (step 4.5b); leaving
// it clears them.
export type SetVisibilityRequest = {
  action: 'set-visibility';
  roomId: string;
  open: boolean;
  intent?: Intent;
  gameTag?: Concept;
};
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
// The frame of the table's games (docs/SPEC_V4.md §4.F "Çerçeve"; `concept` is a game of
// pure/tableGames.ts). Everyone at the table votes for one poster, a vote may change or be taken
// back (null); a "Yakında" game is bad_request, a running game or open pre-game page
// game_in_progress. The counts are read with table_vote_counts.
export type VoteRequest = { action: 'vote'; roomId: string; concept: string | null };
// The owner opens a game's pre-game page (rooms.game_state.pregame): not_owner, bad_request for a
// "Yakında" game or one without a page, game_in_progress, not_enough_players below the game's lower
// limit (K-17). `again`: "Yeniden oyna", the game just played with its picks.
export type OpenGameRequest = {
  action: 'open-game';
  roomId: string;
  concept: string;
  again?: boolean;
};
// Anyone at the table, on the open page (no_game otherwise): Mor ('a') or Pembe ('b') in a team
// game, watching ('obs'), or no pick (null: not chosen yet in a team game, a player in any other).
export type PickRequest = { action: 'pick'; roomId: string; pick: Pick | null };
// "Karıştır": the owner, a team game's page; who does not watch goes to a team at random.
export type ShuffleRequest = { action: 'shuffle'; roomId: string };
// "Oyunu bitir": the owner only (not_owner); the game ends for everyone and the table goes back to
// choosing. It closes an open pre-game page the same way.
export type EndGameRequest = { action: 'end-game'; roomId: string };
// "Oyundan çık": a player of the running game leaves it (not_player otherwise); the game goes on for
// the others and the person stays at the table, watching. Not the owner's (bad_request): it ends
// the game with "Oyunu bitir".
export type LeaveGameRequest = { action: 'leave-game'; roomId: string };
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
// docs/SPEC_V4.md §4.G (step 4.7): the owner invites a friend by public_id (not_owner otherwise).
// The answer is { ok: true } whatever happens: only a friend checked in at the same venue gets it,
// and nothing tells the owner who did (K-2).
export type InviteRequest = { action: 'invite'; roomId: string; friendPublicId: string };
// The invitee answers. A decline reaches nobody. Joining leaves the table the person is at by the
// "Masadan ayrıl" rule (K-13) and sits down with the check-in's identity; an invite that ran out, a
// closed or full table are invite_unavailable alike.
export type AnswerInviteRequest = { action: 'answer-invite'; inviteId: string; accept: boolean };
// Test bots (dev project and local stack only, pure/devProject.ts → testBotsAllowed): whether this
// server seats them and how many sit at the table; the owner seats `count` more (not_owner,
// table_full) or takes them all away. Elsewhere available is false and the others bad_request.
export type TestBotsRequest = { action: 'test-bots'; roomId: string };
export type AddBotsRequest = { action: 'add-bots'; roomId: string; count: number };
export type RemoveBotsRequest = { action: 'remove-bots'; roomId: string };
export type TestBotsResponse = { available: boolean; seated: number };
// The table is called by its icon (K-76): the new name comes back with it.
export type SetIconResponse = { icon: string; name: string };
export type RerollNameResponse = { name: string; rerollsLeft: number };

export type RoomsRequest =
  | CreateRoomRequest
  | CreateSoloRoomRequest
  | SetVisibilityRequest
  | RequestJoinRequest
  | RespondRequest
  | ProposeGameRequest
  | AnswerGameRequest
  | VoteRequest
  | OpenGameRequest
  | PickRequest
  | ShuffleRequest
  | EndGameRequest
  | LeaveGameRequest
  | EndRoomRequest
  | LeaveRoomRequest
  | RequestProfileRequest
  | SetIconRequest
  | RerollNameRequest
  | InviteRequest
  | AnswerInviteRequest
  | TestBotsRequest
  | AddBotsRequest
  | RemoveBotsRequest;

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
