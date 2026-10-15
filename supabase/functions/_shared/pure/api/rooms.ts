import type { Intent, ProposableConcept } from '../rooms.ts';
import type { Side } from '../teams.ts';

// Request and response shapes of the `rooms` Edge Function, shared with the mobile app
// (docs/SPEC_V3.md §5, §11).
// "Oda kur": always open to the venue; an optional intent and the owner's choice for this room.
export type CreateRoomRequest = { action: 'create'; intent?: Intent; profiled: boolean };
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

export type RoomsRequest =
  | CreateRoomRequest
  | CreateSoloRoomRequest
  | RequestJoinRequest
  | RespondRequest
  | ProposeGameRequest
  | AnswerGameRequest
  | EndGameRequest
  | EndRoomRequest
  | LeaveRoomRequest;

export type CreateRoomResponse = { roomId: string };
// Identical for every request: nothing in it depends on the owner's later answer.
export type RequestJoinResponse = { requestId: string; expiresAt: string };
export type ProposeGameResponse = { expiresAt: string };
export type RoomsOkResponse = { ok: true };
