export type ErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'consent_outdated'
  | 'onboarding_required'
  | 'profile_required'
  | 'under_age'
  | 'birth_date_invalid'
  | 'venue_not_found'
  | 'too_far'
  | 'alias_exhausted'
  | 'spot_required'
  | 'spot_invalid'
  | 'different_spot'
  | 'in_room'
  | 'reroll_limit'
  | 'proposal_pending'
  | 'no_proposal'
  | 'no_active_table'
  | 'already_in_room'
  | 'room_not_available'
  | 'request_pending'
  | 'rate_limited'
  | 'request_expired'
  | 'request_not_found'
  | 'not_in_room'
  | 'nothing_to_block'
  | 'message_invalid'
  | 'profanity_rejected'
  | 'wrong_concept'
  | 'two_tables'
  | 'not_owner'
  | 'needs_two_tables'
  | 'game_in_progress'
  | 'no_game'
  | 'not_describer'
  | 'turn_over'
  | 'turn_not_started'
  | 'not_your_seat'
  | 'not_player'
  | 'not_enough_players'
  | 'too_many_players'
  | 'no_objections_left'
  | 'no_passes_left'
  | 'too_soon'
  | 'no_cards'
  | 'not_found'
  | 'reply_unavailable'
  | 'photo_required'
  | 'anonymous_not_allowed'
  | 'gender_required'
  | 'venue_chat_mode_locked'
  | 'identity_mismatch'
  | 'identity_switch_used'
  | 'nick_refresh_too_soon'
  | 'icon_taken'
  | 'already_in_table'
  | 'table_full'
  | 'invite_unavailable'
  | 'wrong_side'
  | 'not_leader'
  | 'display_name_required'
  | 'display_name_invalid'
  | 'bio_invalid'
  | 'contact_not_allowed'
  | 'photo_invalid'
  | 'already_friends'
  | 'not_friends'
  | 'not_judge'
  | 'method_not_allowed'
  | 'update_required'
  | 'internal';

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export function toErrorBody(code: ErrorCode, message: string): ApiErrorBody {
  return { error: { code, message } };
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = (value as { error: unknown }).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

// Codes the database functions raise (errcode P0001, message = code). Anything else is internal.
export const DOMAIN_ERROR_CODES: readonly ErrorCode[] = [
  // A value zod cannot check alone (a Sahtekar vote for the voter's own seat, a guess outside the
  // options).
  'bad_request',
  'no_active_table',
  'already_in_room',
  'spot_required',
  'spot_invalid',
  'different_spot',
  'in_room',
  'reroll_limit',
  // No free table name at the venue (rooms/reroll-name, rooms/create; docs/SPEC_V4.md §4.E).
  'alias_exhausted',
  'proposal_pending',
  'no_proposal',
  'room_not_available',
  'request_pending',
  'rate_limited',
  'request_expired',
  'request_not_found',
  'not_in_room',
  'nothing_to_block',
  'wrong_concept',
  'two_tables',
  'not_owner',
  'needs_two_tables',
  'game_in_progress',
  'no_game',
  'not_describer',
  'turn_over',
  'turn_not_started',
  'not_your_seat',
  'not_player',
  'not_enough_players',
  'too_many_players',
  'no_objections_left',
  'no_passes_left',
  'too_soon',
  'no_cards',
  'not_friends',
  'not_judge',
  // Replies and reactions (docs/SPEC_V3.md §21): a quoted message out of reach, a reacted one gone.
  'reply_unavailable',
  'not_found',
  // "Profilimle" needs a visible profile photo; the venue chat mode is chosen once per check-in
  // (docs/SPEC_V3.md §22.G).
  'photo_required',
  'venue_chat_mode_locked',
  // The check-in's identity (docs/SPEC_V4.md §4.D): one change per check-in; a message sent with a
  // stale identity is not written. The nick is refreshed once in 30 days (K-9).
  'identity_mismatch',
  'identity_switch_used',
  'nick_refresh_too_soon',
  // An account without a nick cannot write an anonymous venue chat message (venue_chat_send).
  'onboarding_required',
  // A table's icon (docs/SPEC_V4.md §4.E, K-45): another open or running table at the venue has it.
  'icon_taken',
  // The table of people (§4.E): one table at a time; at most MAX_TABLE_PHONES phones together. The
  // seat's identity: no gender yet answers the one-time question first (rule 12).
  'already_in_table',
  'table_full',
  'gender_required',
  // A table invite that ran out, a closed or full table, an owner who is not the inviter any more:
  // one answer for all (docs/SPEC_V4.md §4.G).
  'invite_unavailable',
  // Teams (§22.B, §22.D): an account goes back only to its side; only a leader ends the room.
  'wrong_side',
  'not_leader',
];

export function isDomainErrorCode(value: string): value is ErrorCode {
  return (DOMAIN_ERROR_CODES as readonly string[]).includes(value);
}
