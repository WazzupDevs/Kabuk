import { FunctionsHttpError, isAuthApiError } from '@supabase/supabase-js';

import type { AccountRequest, AccountResponse } from '@shared/api/account.ts';
import type { ChatResponse, ReactResponse, SafetyResponse } from '@shared/api/chat.ts';
import type { Reaction } from '@shared/reactions.ts';
import type {
  GameOkResponse,
  TabuStartResponse,
  TabuTurnCardsResponse,
  SahtekarOptionsResponse,
  SahtekarStartResponse,
  SahtekarViewResponse,
  SayStartResponse,
  IbreStartResponse,
  IbreTargetResponse,
} from '@shared/api/games.ts';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  RequestJoinResponse,
  RequestProfileResponse,
  RerollNameResponse,
  RoomsOkResponse,
  SetIconResponse,
} from '@shared/api/rooms.ts';
import type {
  ChangeSpotResponse,
  CheckInRequest,
  CheckInResponse,
  LeaveResponse,
  LocationModeResponse,
  RerollAliasResponse,
  SetIdentityResponse,
} from '@shared/api/checkin.ts';
import type {
  DmInboxResponse,
  DmOkResponse,
  DmSendResponse,
  FriendsIncomingResponse,
  FriendsListResponse,
  FriendsOkResponse,
  NotificationsResponse,
} from '@shared/api/friends.ts';
import type {
  ChatProfileView,
  ProfileRequest,
  ProfileUploadUrl,
  ProfileView,
  RefreshNickResponse,
} from '@shared/api/profile.ts';
import type {
  VenueChatMuteResponse,
  VenueChatMutesResponse,
  VenueChatPageResponse,
  VenueChatResponse,
} from '@shared/api/venueChat.ts';
import type { VenueChatMode } from '@shared/venueChat.ts';
import type { VampirView } from '@shared/vampir.ts';
import type { Pick } from '@shared/gameFrame.ts';
import type { GameFlowReportReason, ReportReason } from '@shared/chat.ts';
import type { Concept, Intent } from '@shared/rooms.ts';
import type { SayKind } from '@shared/sayChallenge.ts';
import type { Mark } from '@shared/tabu.ts';
import { callName, RETRY_DELAY_MS, retriesAfter } from '@shared/apiRetry.ts';
import { type ErrorCode, isApiErrorBody } from '@shared/errors.ts';

import { isNetworkError } from '@/lib/connection';
import { useUpdateGate } from '@/features/update/updateGate';

import { appBuildHeaders } from './appBuild';
import { reportFunctionFailure } from './errorReporting';
import { supabase } from './supabase';

export class ApiError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// Every Edge Function call goes through here: it carries the native build number, and an
// update_required answer switches the whole app to the "Güncelleme gerekli" screen. A 5xx is
// reported (function and status only) and, for the calls in IDEMPOTENT_CALLS, sent once more after
// a short wait.
async function invoke<T>(fn: string, body: Record<string, unknown>, attempt = 1): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(fn, {
    body,
    headers: appBuildHeaders,
    // A call on a stalled connection ends (audit AUTH-7): its button stops waiting and the
    // connection banner hears of it. Deleting an account removes photos and more: it gets longer.
    timeout: fn === 'account' ? ACCOUNT_TIMEOUT_MS : CALL_TIMEOUT_MS,
  });
  if (error instanceof FunctionsHttpError) {
    const status = (error.context as Response).status;
    if (status >= 500) {
      const call = callName(fn, body);
      reportFunctionFailure(call, status);
      if (retriesAfter(call, status, attempt)) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return invoke<T>(fn, body, attempt + 1);
      }
    }
    const payload: unknown = await error.context.json().catch(() => null);
    if (isApiErrorBody(payload)) {
      if (payload.error.code === 'update_required') useUpdateGate.getState().markRequired();
      if (payload.error.code === 'unauthorized') void signOutIfRejected();
      throw new ApiError(payload.error.code, payload.error.message);
    }
    throw new ApiError('internal', error.message);
  }
  if (error || data === null) throw new ApiError('internal', error?.message ?? 'Empty response');
  return data;
}

const CALL_TIMEOUT_MS = 20_000;
const ACCOUNT_TIMEOUT_MS = 60_000;

// A function said the token is not valid: a deleted or banned account's token stays usable for up
// to an hour, and the app went round its sign-up screens, each saying "Oturumun sona ermiş" (audit
// AUTH-5). The Auth server decides: only when it rejects the token too is the phone signed out
// (locally; the server session is gone), never on a network failure. One check at a time.
let checking: Promise<void> | null = null;
function signOutIfRejected(): Promise<void> {
  checking ??= supabase.auth
    .getUser()
    .then(async ({ error }) => {
      if (error && isAuthApiError(error) && [401, 403, 404].includes(error.status)) {
        await supabase.auth.signOut({ scope: 'local' });
      }
    })
    .catch(() => undefined)
    .finally(() => {
      checking = null;
    });
  return checking;
}

// Update gate check on launch and foreground (the ping function does nothing else). Failures other
// than update_required are ignored: the next real call will show them.
export function pingUpdateGate(): Promise<void> {
  return invoke<{ ok: true }>('ping', {}).then(
    () => undefined,
    () => undefined,
  );
}

// Whether the server answers at all (the connection banner's check while offline): any answer,
// even an error, is a connection.
export function probeConnection(): Promise<boolean> {
  return invoke<{ ok: true }>('ping', {}).then(
    () => true,
    (err: unknown) => !isNetworkError(err),
  );
}

export function callAccount(body: AccountRequest): Promise<AccountResponse> {
  return invoke<AccountResponse>('account', body);
}

export function callCheckIn(body: CheckInRequest): Promise<CheckInResponse> {
  return invoke<CheckInResponse>('checkin', body);
}

// Whether the server skips the location check (dev project only).
export function callLocationMode(): Promise<LocationModeResponse> {
  return invoke<LocationModeResponse>('checkin', { action: 'location-mode' });
}

// "Bu noktadayım" and changing the spot (docs/SPEC_V3.md §4.3).
export function callChangeSpot(spotId: string): Promise<ChangeSpotResponse> {
  return invoke<ChangeSpotResponse>('checkin', { action: 'change-spot', spotId });
}

// "Masa adını değiştir" (docs/SPEC_V3.md §5.6).
export function callRerollAlias(): Promise<RerollAliasResponse> {
  return invoke<RerollAliasResponse>('checkin', { action: 'reroll-alias' });
}

// Anonymous or profiled, once per check-in (docs/SPEC_V4.md §4.D).
export function callSetIdentity(anonymous: boolean): Promise<SetIdentityResponse> {
  return invoke<SetIdentityResponse>('checkin', { action: 'set-identity', anonymous });
}

export function callLeave(): Promise<LeaveResponse> {
  return invoke<LeaveResponse>('checkin', { action: 'leave' });
}

// The people's table (docs/SPEC_V4.md §4.E): "Masa kur" seats its owner, "Katıl" and "Bu masadayım"
// ask the owner, the owner ends the table and a participant leaves it.
export const roomsApi = {
  create: (body: Omit<CreateRoomRequest, 'action'>) =>
    invoke<CreateRoomResponse>('rooms', { action: 'create', ...body }),
  // "Lobiye aç" with the sheet's intent and game tag, "Lobiden çek" without.
  setVisibility: (
    roomId: string,
    open: boolean,
    tags: { intent?: Intent; gameTag?: Concept } = {},
  ) => invoke<RoomsOkResponse>('rooms', { action: 'set-visibility', roomId, open, ...tags }),
  // The owner's icon picker (K-45, K-59).
  setIcon: (roomId: string, icon: string) =>
    invoke<SetIconResponse>('rooms', { action: 'set-icon', roomId, icon }),
  rerollName: (roomId: string) =>
    invoke<RerollNameResponse>('rooms', { action: 'reroll-name', roomId }),
  // "Katıl" (an open table) or, with `asMember`, "Bu masadayım" (a running one). The person sits
  // with the check-in's identity (docs/SPEC_V4.md §4.D).
  requestJoin: (roomId: string, asMember = false) =>
    invoke<RequestJoinResponse>('rooms', {
      action: 'request-join',
      roomId,
      ...(asMember ? { asMember } : {}),
    }),
  respond: (requestId: string, accept: boolean) =>
    invoke<RoomsOkResponse>('rooms', { action: 'respond', requestId, accept }),
  // The request card's profile (docs/SPEC_V3.md §23.E): only the owner, while the request waits;
  // not_found otherwise.
  requestProfile: (requestId: string) =>
    invoke<RequestProfileResponse>('rooms', { action: 'request-profile', requestId }),
  // Oyun Seç: one vote a person; null takes it back (docs/SPEC_V4.md §4.F).
  vote: (roomId: string, concept: string | null) =>
    invoke<RoomsOkResponse>('rooms', { action: 'vote', roomId, concept }),
  // The owner opens a game's pre-game page; `again`: "Yeniden oyna", the last game's picks.
  openGame: (roomId: string, concept: string, again = false) =>
    invoke<RoomsOkResponse>('rooms', {
      action: 'open-game',
      roomId,
      concept,
      ...(again ? { again } : {}),
    }),
  // On the pre-game page: watch ('obs') or play (null).
  pick: (roomId: string, pick: Pick | null) =>
    invoke<RoomsOkResponse>('rooms', { action: 'pick', roomId, pick }),
  endGame: (roomId: string) => invoke<RoomsOkResponse>('rooms', { action: 'end-game', roomId }),
  leaveGame: (roomId: string) => invoke<RoomsOkResponse>('rooms', { action: 'leave-game', roomId }),
  // "Masayı bitir": the owner's, for everyone.
  end: () => invoke<RoomsOkResponse>('rooms', { action: 'end' }),
  // "Masadan ayrıl": the table goes on for the others; an owner hands it to the earliest (K-13).
  leave: (roomId: string) => invoke<RoomsOkResponse>('rooms', { action: 'leave', roomId }),
  // Table invites (docs/SPEC_V4.md §4.G).
  invite: (roomId: string, friendPublicId: string) =>
    invoke<RoomsOkResponse>('rooms', { action: 'invite', roomId, friendPublicId }),
  answerInvite: (inviteId: string, accept: boolean) =>
    invoke<RoomsOkResponse>('rooms', { action: 'answer-invite', inviteId, accept }),
};

export const chatApi = {
  send: (roomId: string, body: string, replyTo?: string) =>
    invoke<ChatResponse>('chat', { action: 'send', roomId, body, ...(replyTo ? { replyTo } : {}) }),
  // docs/SPEC_V3.md §21.2: the table's one reaction; null takes it back.
  react: (messageId: string, emoji: Reaction | null) =>
    invoke<ReactResponse>('chat', { action: 'react', messageId, emoji }),
};

export const safetyApi = {
  // `sessionId`: the phone reported, any phone of the room (docs/SPEC_V3.md §22.J).
  report: (roomId: string, reason: GameFlowReportReason, sessionId?: string) =>
    invoke<SafetyResponse>('safety', {
      action: 'report',
      roomId,
      reason,
      ...(sessionId ? { sessionId } : {}),
    }),
  reportProfile: (publicId: string, reason: ReportReason) =>
    invoke<SafetyResponse>('safety', { action: 'report', target: 'profile', publicId, reason }),
  reportHistory: (historyId: string, reason: GameFlowReportReason) =>
    invoke<SafetyResponse>('safety', { action: 'report', target: 'history', historyId, reason }),
  reportDm: (threadId: string, reason: ReportReason) =>
    invoke<SafetyResponse>('safety', { action: 'report', target: 'dm', threadId, reason }),
  blockFriend: (publicId: string, report?: ReportReason) =>
    invoke<SafetyResponse>('safety', { action: 'block', publicId, ...(report ? { report } : {}) }),
  blockHistory: (historyId: string, report?: GameFlowReportReason) =>
    invoke<SafetyResponse>('safety', { action: 'block', historyId, ...(report ? { report } : {}) }),
  // `sessionId`: the phone blocked; who leaves depends on both (docs/SPEC_V3.md §22.D).
  block: (roomId: string, sessionId?: string) =>
    invoke<SafetyResponse>('safety', {
      action: 'block',
      roomId,
      ...(sessionId ? { sessionId } : {}),
    }),
  // Venue chat (docs/SPEC_V3.md §7.4, §7.5).
  reportVenueChat: (messageId: string, reason: ReportReason) =>
    invoke<SafetyResponse>('safety', {
      action: 'report',
      target: 'venue_chat',
      messageId,
      reason,
    }),
  blockVenueChat: (venueChatMessageId: string, report?: ReportReason) =>
    invoke<SafetyResponse>('safety', {
      action: 'block',
      venueChatMessageId,
      ...(report ? { report } : {}),
    }),
  reportFriendRequest: (requestId: string, reason: ReportReason) =>
    invoke<SafetyResponse>('safety', {
      action: 'report',
      target: 'friend_request',
      requestId,
      reason,
    }),
  blockFriendRequest: (friendRequestId: string, report?: ReportReason) =>
    invoke<SafetyResponse>('safety', {
      action: 'block',
      friendRequestId,
      ...(report ? { report } : {}),
    }),
  unblock: (blockId: string) => invoke<SafetyResponse>('safety', { action: 'unblock', blockId }),
};

export const gamesApi = {
  // One-table rooms only: the deck, and the room's activity becomes Tabu. A two-table game starts
  // from an accepted proposal (roomsApi.answerGame).
  tabuStart: (roomId: string) => invoke<TabuStartResponse>('tabu', { action: 'start', roomId }),
  tabuTurnCards: (roomId: string) =>
    invoke<TabuTurnCardsResponse>('tabu', { action: 'turn-cards', roomId }),
  tabuMark: (roomId: string, mark: Mark) =>
    invoke<GameOkResponse>('tabu', { action: 'mark', roomId, ...mark }),
  tabuEndTurn: (roomId: string) => invoke<GameOkResponse>('tabu', { action: 'end-turn', roomId }),
  tabuBeginTurn: (roomId: string) =>
    invoke<GameOkResponse>('tabu', { action: 'begin-turn', roomId }),
  sohbetNext: (roomId: string) => invoke<GameOkResponse>('sohbet', { action: 'next-card', roomId }),
  // Sahtekar (docs/SPEC_V3.md §20.2): the one-table deck, then the two-table game's actions.
  sahtekarStart: (roomId: string) =>
    invoke<SahtekarStartResponse>('sahtekar', { action: 'start', roomId }),
  sahtekarView: (roomId: string, seat: string) =>
    invoke<SahtekarViewResponse>('sahtekar', { action: 'view', roomId, seat }),
  sahtekarSaid: (roomId: string, step: number) =>
    invoke<GameOkResponse>('sahtekar', { action: 'said', roomId, step }),
  sahtekarVote: (roomId: string, voter: string, target: string) =>
    invoke<GameOkResponse>('sahtekar', { action: 'vote', roomId, voter, target }),
  sahtekarOptions: (roomId: string) =>
    invoke<SahtekarOptionsResponse>('sahtekar', { action: 'options', roomId }),
  sahtekarGuess: (roomId: string, option: string) =>
    invoke<GameOkResponse>('sahtekar', { action: 'guess', roomId, option }),
  sahtekarAdvance: (roomId: string) =>
    invoke<GameOkResponse>('sahtekar', { action: 'advance', roomId }),
  // Harf Kapmaca and Şarkıda Geçsin (docs/SPEC_V3.md §20.3–20.4): the same actions; Harf claims
  // a letter, Şarkı sings a line.
  sayStart: (kind: SayKind, roomId: string) =>
    invoke<SayStartResponse>(kind, { action: 'start', roomId }),
  sayBegin: (kind: SayKind, roomId: string) =>
    invoke<GameOkResponse>(kind, { action: 'begin', roomId }),
  sayClaim: (kind: SayKind, roomId: string, round: number, step: number, letter: string | null) =>
    invoke<GameOkResponse>(
      kind,
      kind === 'harf'
        ? { action: 'claim', roomId, round, step, letter }
        : { action: 'said', roomId, round, step },
    ),
  sayObject: (kind: SayKind, roomId: string, round: number, step: number) =>
    invoke<GameOkResponse>(kind, { action: 'object', roomId, round, step }),
  sayAdvance: (kind: SayKind, roomId: string) =>
    invoke<GameOkResponse>(kind, { action: 'advance', roomId }),
  // İbre (docs/SPEC_V3.md §20.5).
  ibreStart: (roomId: string) => invoke<IbreStartResponse>('ibre', { action: 'start', roomId }),
  ibreBegin: (roomId: string) => invoke<GameOkResponse>('ibre', { action: 'begin', roomId }),
  ibreTarget: (roomId: string, round: number) =>
    invoke<IbreTargetResponse>('ibre', { action: 'target', roomId, round }),
  ibreLock: (roomId: string, round: number, value: number) =>
    invoke<GameOkResponse>('ibre', { action: 'lock', roomId, round, value }),
  ibreSide: (roomId: string, round: number, side: 'left' | 'right') =>
    invoke<GameOkResponse>('ibre', { action: 'side', roomId, round, side }),
  ibreAdvance: (roomId: string) => invoke<GameOkResponse>('ibre', { action: 'advance', roomId }),
};

type ProfileUpdate = Omit<Extract<ProfileRequest, { action: 'update' }>, 'action'>;

export const profileApi = {
  get: (publicId: string) => invoke<ProfileView>('profile', { action: 'get', publicId }),
  getFromVenueChat: (venueChatMessageId: string) =>
    invoke<ChatProfileView>('profile', { action: 'get', venueChatMessageId }),
  update: (changes: ProfileUpdate) =>
    invoke<{ ok: true }>('profile', { action: 'update', ...changes }),
  photoUploadUrl: () => invoke<ProfileUploadUrl>('profile', { action: 'photo-upload-url' }),
  photoCommit: (path: string) => invoke<{ ok: true }>('profile', { action: 'photo-commit', path }),
  photoRemove: () => invoke<{ ok: true }>('profile', { action: 'photo-remove' }),
  // K-9: a new anonymous nick once in 30 days.
  refreshNick: () => invoke<RefreshNickResponse>('profile', { action: 'refresh-nick' }),
  // K-46: the capsule's look; unknown parts are dropped on the server.
  setLook: (look: string) => invoke<{ ok: true }>('profile', { action: 'set-look', look }),
};

export const friendsApi = {
  list: () => invoke<FriendsListResponse>('friends', { action: 'list' }),
  // The bell's list (docs/SPEC_V4.md §4.G): requests, accepted requests, matches and invites.
  notifications: () => invoke<NotificationsResponse>('friends', { action: 'notifications' }),
  request: (historyId: string) =>
    invoke<FriendsOkResponse>('friends', { action: 'request', historyId }),
  requestFromVenueChat: (venueChatMessageId: string) =>
    invoke<FriendsOkResponse>('friends', { action: 'request', venueChatMessageId }),
  incoming: () => invoke<FriendsIncomingResponse>('friends', { action: 'incoming' }),
  respond: (requestId: string, accept: boolean) =>
    invoke<FriendsOkResponse>('friends', { action: 'respond', requestId, accept }),
  addFromRoom: (historyId: string) =>
    invoke<FriendsOkResponse>('friends', { action: 'add-from-room', historyId }),
  // "Eklendi" pressed again (K-67): the quiet add is taken back; after a match it stays.
  withdrawAdd: (historyId: string) =>
    invoke<FriendsOkResponse>('friends', { action: 'withdraw-add', historyId }),
  remove: (publicId: string, report?: ReportReason) =>
    invoke<FriendsOkResponse>('friends', {
      action: 'remove',
      publicId,
      ...(report ? { report } : {}),
    }),
};

export const venueChatApi = {
  send: (venueId: string, body: string, profiled: boolean) =>
    invoke<VenueChatResponse>('venue-chat', { action: 'send', venueId, body, profiled }),
  reply: (venueId: string, body: string, profiled: boolean, replyTo: string) =>
    invoke<VenueChatResponse>('venue-chat', { action: 'send', venueId, body, profiled, replyTo }),
  // At most 10 per 10 seconds; over it rate_limited, which the app ignores (§21.2).
  react: (messageId: string, emoji: Reaction | null) =>
    invoke<ReactResponse>('venue-chat', { action: 'react', messageId, emoji }),
  page: (venueId: string) =>
    invoke<VenueChatPageResponse>('venue-chat', { action: 'page', venueId }),
  // docs/SPEC_V4.md §4.D: a message goes with the check-in's identity; another one here is
  // identity_mismatch and nothing is written.
  sendAs: (venueId: string, body: string, identity: VenueChatMode, replyTo?: string) =>
    invoke<VenueChatResponse>('venue-chat', {
      action: 'send',
      venueId,
      body,
      identity,
      ...(replyTo ? { replyTo } : {}),
    }),
  remove: (messageId: string) =>
    invoke<{ ok: true }>('venue-chat', { action: 'delete', messageId }),
  mute: (messageId: string) =>
    invoke<VenueChatMuteResponse>('venue-chat', { action: 'mute', messageId }),
  unmute: (muteId: string) => invoke<{ ok: true }>('venue-chat', { action: 'unmute', muteId }),
  mutes: () => invoke<VenueChatMutesResponse>('venue-chat', { action: 'mutes' }),
};

export const dmApi = {
  send: (threadId: string, body: string, replyTo?: string) =>
    invoke<DmSendResponse>('dm', {
      action: 'send',
      threadId,
      body,
      ...(replyTo ? { replyTo } : {}),
    }),
  react: (messageId: string, emoji: Reaction | null) =>
    invoke<ReactResponse>('dm', { action: 'react', messageId, emoji }),
  read: (threadId: string) => invoke<DmOkResponse>('dm', { action: 'read', threadId }),
  // Mesajlar (docs/SPEC_V3.md §18.2): one row per friend, photos signed by the function.
  inbox: () => invoke<DmInboxResponse>('dm', { action: 'inbox' }),
  // The app is open: messages so far count as delivered, in every conversation.
  delivered: () => invoke<DmOkResponse>('dm', { action: 'delivered' }),
};

// Vampir Köylü (docs/SPEC_V4.md §4.F "Adım 4.6.6"): targets are table session ids; `step` is the
// phase's number, so a press from a phase already over changes nothing.
export const vampirApi = {
  start: (roomId: string) => invoke<GameOkResponse>('vampir', { action: 'start', roomId }),
  view: (roomId: string) => invoke<VampirView>('vampir', { action: 'view', roomId }),
  ready: (roomId: string, step: number) =>
    invoke<GameOkResponse>('vampir', { action: 'ready', roomId, step }),
  begin: (roomId: string, step: number) =>
    invoke<GameOkResponse>('vampir', { action: 'begin', roomId, step }),
  pick: (roomId: string, step: number, target: string) =>
    invoke<VampirView>('vampir', { action: 'pick', roomId, step, target }),
  toVote: (roomId: string, step: number) =>
    invoke<GameOkResponse>('vampir', { action: 'to-vote', roomId, step }),
  vote: (roomId: string, step: number, target: string) =>
    invoke<GameOkResponse>('vampir', { action: 'vote', roomId, step, target }),
  advance: (roomId: string) => invoke<GameOkResponse>('vampir', { action: 'advance', roomId }),
};
