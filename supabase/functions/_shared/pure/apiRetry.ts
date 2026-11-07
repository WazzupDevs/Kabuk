// Which Edge Function calls the app sends once more after a 5xx (the server or the platform failed,
// often before the function ran). The measure is idempotence: a call is listed only when sending it
// twice leaves the same state and answer as sending it once, and an integration test sends it twice
// to show that (named next to each entry). Anything else may already have taken effect (a message
// sent, a request created), so its 5xx is shown to the user instead.
import type { AccountRequest } from './api/account.ts';
import type { ChatRequest } from './api/chat.ts';
import type { CheckinRequest } from './api/checkin.ts';
import type { DmRequest, FriendsRequest } from './api/friends.ts';
import type { GiftsRequest } from './api/gifts.ts';
import type {
  KauphollRequest,
  KibritRequest,
  SahtekarRequest,
  SignumRequest,
  SprengjaRequest,
  TabuRequest,
  VampirRequest,
} from './api/games.ts';
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
  | `account/${AccountRequest['action']}`
  | `vampir/${VampirRequest['action']}`
  | `kibrit/${KibritRequest['action']}`
  | `kaupholl/${KauphollRequest['action']}`
  | `tabu/${TabuRequest['action']}`
  | `sahtekar/${SahtekarRequest['action']}`
  | `signum/${SignumRequest['action']}`
  | `sprengja/${SprengjaRequest['action']}`
  | `gifts/${GiftsRequest['action']}`;

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
  // vampir.test "the clock (§4.F, IDEMPOTENT_CALLS)": "changes nothing with an early advance, and
  // the same with one sent twice"
  'vampir/advance',
  // vampir.test "the clock (§4.F, IDEMPOTENT_CALLS)": "changes nothing with an early advance, and
  // the same with one sent twice"
  'vampir/view',
  // kibrit.test "the clock (§4.6.9, IDEMPOTENT_CALLS)": "changes nothing with an early advance, and
  // the same with one sent twice"
  'kibrit/advance',
  // kibrit.test "the clock (§4.6.9, IDEMPOTENT_CALLS)": "changes nothing with an early advance, and
  // the same with one sent twice"
  'kibrit/view',
  // kibrit.test "revisions (rule 3's exception)": "keeps the greatest rev: the same write or vote
  // sent twice, or an older one after it, changes nothing"
  'kibrit/write',
  // kibrit.test "revisions (rule 3's exception)": "keeps the greatest rev: the same write or vote
  // sent twice, or an older one after it, changes nothing"
  'kibrit/vote',
  // kaupholl.test "kaupholl: the clock (§2, IDEMPOTENT_CALLS)": "changes nothing with an early
  // advance, and the same call twice gives the same state"
  'kaupholl/advance',
  // kaupholl.test "kaupholl: the clock (§2, IDEMPOTENT_CALLS)": "changes nothing with an early
  // advance, and the same call twice gives the same state"
  'kaupholl/view',
  // kaupholl.test "kaupholl: the clock (§2, IDEMPOTENT_CALLS)": "changes nothing with an early
  // advance, and the same call twice gives the same state"
  'kaupholl/reveal',
  // kaupholl.test "kaupholl: the clock (§2, IDEMPOTENT_CALLS)": "changes nothing with an early
  // advance, and the same call twice gives the same state"
  'kaupholl/guess',
  // kaupholl.test "kaupholl: the clock (§2, IDEMPOTENT_CALLS)": "changes nothing with an early
  // advance, and the same call twice gives the same state"
  'kaupholl/bet',
  // kaupholl.test "kaupholl: the clock (§2, IDEMPOTENT_CALLS)": "changes nothing with an early
  // advance, and the same call twice gives the same state"
  'kaupholl/ready',
  // kaupholl.test "kaupholl: few questions": "never gives a table a question twice; the pool says
  // how many are left, to the owner only"
  'kaupholl/pool',
  // tabu.test "the turns (§4.F)": "moves through Tur sonu by the owner or the clock, and changes
  // nothing with an early advance"
  'tabu/advance',
  // tabu.test "the card (rule 3)": "goes to the describer, the other team and the watchers, never
  // to the describer’s team"
  'tabu/turn-cards',
  // sahtekar.test "the clock (§4.F, IDEMPOTENT_CALLS)": "changes nothing with an early advance, and
  // the same view twice"
  'sahtekar/advance',
  // sahtekar.test "the clock (§4.F, IDEMPOTENT_CALLS)": "changes nothing with an early advance, and
  // the same view twice"
  'sahtekar/view',
  // signum.test "signum: races and repeats (IDEMPOTENT_CALLS)":
  // "answers the same clue, reveal or end-turn again with the first result and writes nothing"
  'signum/clue',
  // signum.test "signum: races and repeats (IDEMPOTENT_CALLS)":
  // "answers the same clue, reveal or end-turn again with the first result and writes nothing"
  'signum/reveal',
  // signum.test "signum: races and repeats (IDEMPOTENT_CALLS)":
  // "answers the same clue, reveal or end-turn again with the first result and writes nothing"
  'signum/end-turn',
  // signum.test "signum: races and repeats (IDEMPOTENT_CALLS)":
  // "keeps a mark from going back: the same seq again changes nothing, an older one is outdated"
  'signum/point',
  // signum.test "signum: races and repeats (IDEMPOTENT_CALLS)":
  // "changes nothing with an early advance, a ready, an advance or a view sent twice"
  'signum/ready',
  // signum.test "signum: races and repeats (IDEMPOTENT_CALLS)":
  // "changes nothing with an early advance, a ready, an advance or a view sent twice"
  'signum/advance',
  // signum.test "signum: races and repeats (IDEMPOTENT_CALLS)":
  // "changes nothing with an early advance, a ready, an advance or a view sent twice"
  'signum/view',
  // sprengja.test "the fuse (rule 3, K-85 O-4)": "changes nothing with an early poll, and the same
  // with one sent twice"
  'sprengja/poll',
  // sprengja.test "Tur sonu and the end (§4.6.8)": "moves on when everyone is ready or its time is
  // up, and changes nothing with an early advance"
  'sprengja/advance',
  // sprengja.test "Tur sonu and the end (§4.6.8)": "moves on when everyone is ready or its time is
  // up, and changes nothing with an early advance"
  'sprengja/ready',
  // sprengja.test "the round (§4.6.8)": "opens the card and lights the fuse by the starter only;
  // the same twice changes nothing"
  'sprengja/reveal',
  // sprengja.test "the round (§4.6.8)": "opens the card and lights the fuse by the starter only;
  // the same twice changes nothing"
  'sprengja/light',
  // gifts.test "gifts/state": "answers a new account: no pack yet, Bronz open, the others locked,
  // the odds of §4.U"
  'gifts/state',
  // gifts.test "gifts/login": "counts one login a day; the same day twice changes nothing"
  'gifts/login',
  // gifts.test "gifts/equip": "wears only an owned accessory, keeps it through set-look, and takes
  // it off"
  'gifts/equip',
  // gifts.test "gifts/wear": "wears a whole set, one in each slot; the same set twice changes
  // nothing"
  'gifts/wear',
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
