// Which Edge Function calls the app sends once more after a 5xx (the server or the platform failed,
// often before the function ran). The measure is idempotence: a call is listed only when sending it
// twice leaves the same state and answer as sending it once, and an integration test sends it twice
// to show that (named next to each entry). Anything else may already have taken effect (a message
// sent, a request created), so its 5xx is shown to the user instead.
import type { AccountRequest } from './api/account.ts';
import type { ChatRequest } from './api/chat.ts';
import type { CheckinRequest } from './api/checkin.ts';
import type { DmRequest, FriendsRequest } from './api/friends.ts';
import type { ProfileRequest } from './api/profile.ts';
import type { VenueChatRequest } from './api/venueChat.ts';

// Every call the list below may name; a misspelled entry does not compile.
type CallName =
  | 'ping'
  | `checkin/${CheckinRequest['action']}`
  | `chat/${ChatRequest['action']}`
  | `profile/${ProfileRequest['action']}`
  | `friends/${FriendsRequest['action']}`
  | `dm/${DmRequest['action']}`
  | `venue-chat/${VenueChatRequest['action']}`
  | `account/${AccountRequest['action']}`;

export const IDEMPOTENT_CALLS = [
  // updateGate.test "update gate, open": "answers the launch and foreground ping without a user"
  'ping',
  // profile.test "profile/get": "answers a stranger, an ex-member, a blocked and a blocking account
  // like an unknown id"
  'profile/get',
  // friends.test "no profile id before a friendship": "lists friends with name, photo, date and
  // thread only"
  'friends/list',
  // friends.test "DMs": "sends between friends only, filters profanity and limits the rate"
  'dm/read',
  // friends.test "Mesajlar (dm/inbox)": "lists every friend, newest conversation first, with an
  // 80-character preview and unread count"
  'dm/inbox',
  // friends.test "DM ticks": "moves sent → delivered → read, announces each step once, and never
  // sends the times"
  'dm/delivered',
  // checkin.test "checkin/leave and expiry": "ends the active check-in and is idempotent"
  'checkin/leave',
  // checkin.test "checkin/check-in": "opens one table when the same check-in comes twice"
  'checkin/check-in',
  // friends.test "DM replies and reactions (docs/SPEC_V3.md §21)": "keeps one reaction per
  // account: set, change, take back, and the same twice"
  'dm/react',
  // chat.test "room chat replies and reactions (docs/SPEC_V3.md §21)": "keeps one reaction per
  // person, named by the seat names, the same when sent twice"
  'chat/react',
  // venueChat.test "venue chat: photos (venue-chat/page)": "signs the photo of a profiled message
  // and never gives an anonymous one a photo path"
  'venue-chat/page',
  // invites.test "the bell (§4.G, K-70)": "lists requests, accepted requests, matches and invites,
  // new until the list is opened"
  'friends/notifications',
  // invites.test "the bell (§4.G, K-70)": "lists requests, accepted requests, matches and invites,
  // new until the list is opened"
  'account/notifications-seen',
] as const satisfies readonly CallName[];

export const RETRY_DELAY_MS = 500;

// "chat/react" for { action: 'react' } sent to chat; "ping" for a call without an action.
export function callName(fn: string, body: Record<string, unknown>): string {
  return typeof body.action === 'string' ? `${fn}/${body.action}` : fn;
}

// attempt: 1 for the first send.
export function retriesAfter(call: string, status: number, attempt: number): boolean {
  return attempt === 1 && status >= 500 && (IDEMPOTENT_CALLS as readonly string[]).includes(call);
}
