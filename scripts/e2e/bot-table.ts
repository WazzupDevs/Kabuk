// The other people at the venue for end-to-end tests, on the table of people (docs/SPEC_V4.md §4.E,
// step 4.5). It goes through the same Edge Function API the app uses: sign in with a test number,
// check in (no table, no headcount), open a table ("Masa kur") or ask to sit at the device's
// ("Katıl" to a table in the lobby, "Bu masadayım" to a running one), answer requests as a table's
// owner, leave or end the table, press "Arkadaş ekle" at the table's end and exchange DMs. Games are
// not played yet: today's games do not run at the new table, and each comes back with its own step
// (§4.F, 4.6) together with the bot's part in it.
//
// Runs only against the local stack or the hosted dev project; any other URL is refused. Against
// the dev project it uses only the public Edge Function API with the publishable key and a test
// number: it never asks for a database password or a secret key. A few test hooks that move the
// clock (backdate the time together) and the fixture setup write to the database directly; they run
// only on the local stack and are refused anywhere else.
//
//   node --experimental-strip-types scripts/e2e/bot-table.ts serve     # HTTP for Maestro, port 8787
//   BOT_PORT=8788 BOT_PHONE=+905550000004 BOT_NAME='Bot Üç' … serve     # a second bot person
//   node --experimental-strip-types scripts/e2e/bot-table.ts opponent  # another person, for one phone
//   node --experimental-strip-types scripts/e2e/bot-table.ts <action> [json]
import { createServer } from 'node:http';

import {
  createClient,
  FunctionsHttpError,
  type RealtimeChannel,
  type SupabaseClient,
} from '@supabase/supabase-js';
import postgres from 'postgres';

import {
  CURRENT_KVKK_VERSION,
  CURRENT_LOCATION_CONSENT_VERSION,
  CURRENT_TERMS_VERSION,
} from '../../supabase/functions/_shared/pure/consent.ts';
import { isDevProjectUrl, isLocalUrl } from '../../supabase/functions/_shared/pure/devProject.ts';
import { dmTypingChannel, TYPING_EVENT } from '../../supabase/functions/_shared/pure/rooms.ts';
import { ANCHOR, offset, squareRing } from '../../supabase/tests/fixtures/venues.ts';
import { ensureProfilePhoto } from '../shared/profilePhoto.ts';

// The local stack's fixed publishable key (the same in every `supabase start`).
const LOCAL_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
// The local stack or the hosted dev project (pure/devProject.ts). No other remote is accepted.
const isLocal = isLocalUrl(url);
if (!isLocal && !isDevProjectUrl(url)) {
  console.error(
    `bot-table: refusing ${url}; only the local stack and the dev project are allowed.`,
  );
  process.exit(1);
}
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? (isLocal ? LOCAL_PUBLISHABLE_KEY : undefined);
if (!publishableKey) {
  console.error('bot-table: SUPABASE_PUBLISHABLE_KEY is required for the dev project.');
  process.exit(1);
}

const BOT_PHONE = process.env.BOT_PHONE ?? '+905550000002';
const BOT_OTP = process.env.BOT_OTP ?? '123456';
const BOT_NAME = process.env.BOT_NAME ?? 'Bot Masa';
const DEVICE_PHONE = process.env.DEVICE_PHONE ?? '+905550000001';
// Local only: a second bot account for the venue chat flow (the first one is blocked by then).
const SECOND_BOT_PHONE = '+905550000003';
// Local only: a second bot person, a second `serve` on port 8788 with this BOT_PHONE (a table of
// three, "Bu masadayım" from someone else than the device). `setup` deletes it with the others.
const TEAM_BOT_PHONE = '+905550000004';
// A campus-like venue (docs/SPEC_V3.md §4): a 200 m square boundary around the anchor and two
// spots. The device checks in at "Kantin"; the bot opens a table at "Kütüphane" for "Bu noktadayım".
export const E2E_VENUE = {
  name: process.env.E2E_VENUE_NAME ?? 'E2E Kafe',
  sourceRef: 'e2e-kafe',
  at: ANCHOR,
  boundary: squareRing(ANCHOR, 100),
  spots: [
    { ref: 'kantin', name: 'Kantin' },
    { ref: 'kutuphane', name: 'Kütüphane' },
  ],
};
// A second venue so Keşfet starts as the list and the map (two active venues); `single-venue`
// closes every other venue for the pilot's single-venue view.
export const E2E_SECOND_VENUE = {
  name: 'E2E Kafe İki',
  sourceRef: 'e2e-kafe-2',
  at: offset(ANCHOR, 1500, 200),
};
// Where the device stands for the out-of-boundary check: 210 m outside the boundary, far past the
// 50 m tolerance.
export const OUTSIDE = offset(ANCHOR, 310, 90);

type Json = Record<string, unknown>;

let client: SupabaseClient | null = null;
let venueId: string | null = null;

// The local stack's database, with its fixed default credentials. There is no way to point it
// anywhere else.
function db() {
  if (!isLocal)
    throw new Error('this hook writes to the database and runs only on the local stack');
  return postgres('postgresql://postgres:postgres@127.0.0.1:54322/postgres', {
    max: 1,
    onnotice: () => {},
  });
}

// The device's own profile, by its test number (`{"phone":"+905550000001"}`), for the two hooks
// above. Writes to the database: local only (db()).
async function setOwnProfile(args: Json, what: 'consents' | 'gender'): Promise<Json> {
  const phone = String((args as { phone?: unknown }).phone ?? '').replace(/^\+/, '');
  if (!/^90\d{10}$/.test(phone)) throw new Error('phone must be a test number like +905550000001');
  const sql = db();
  try {
    const owner = sql`(select id from auth.users where phone = ${phone})`;
    const rows =
      what === 'consents'
        ? await sql`
            update public.profiles set terms_version = '0', kvkk_version = '0'
            where id = ${owner} returning 1
          `
        : await sql`update public.profiles set gender = null where id = ${owner} returning 1`;
    if (rows.length !== 1) throw new Error(`no profile for ${phone}`);
  } finally {
    await sql.end();
  }
  return { ok: true };
}

function me(): SupabaseClient {
  if (!client) throw new Error('not signed in; call login first');
  return client;
}

async function call(fn: string, body: Json): Promise<Json> {
  const { data, error } = await me().functions.invoke(fn, { body });
  if (error instanceof FunctionsHttpError) {
    const text = await (error.context as Response).text();
    throw new Error(`${fn}/${String(body.action)} answered ${error.context.status}: ${text}`);
  }
  if (error) throw error;
  return (data ?? {}) as Json;
}

async function retryUntil<T>(what: string, attempt: () => Promise<T | null>, ms = 20_000) {
  const until = Date.now() + ms;
  for (;;) {
    const found = await attempt();
    if (found !== null) return found;
    if (Date.now() > until) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// The table the bot sits at: rooms reads only a table the caller is at (private.can_read_room).
type Table = { id: string; status: string; owner_session_id: string | null };

async function currentTable(): Promise<Table | null> {
  const { data, error } = await me()
    .from('rooms')
    .select('id, status, owner_session_id')
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as Table | undefined) ?? null;
}

async function myTable(): Promise<Table> {
  const table = await currentTable();
  if (!table) throw new Error('the bot is at no table');
  return table;
}

async function mySessionId(): Promise<string | undefined> {
  const { data } = await me().from('table_sessions').select('id').eq('status', 'active').limit(1);
  return data?.[0]?.id as string | undefined;
}

// The venue's tables (venue_tables, §4.E): the lobby (`open`) and the running tables, every one
// but the caller's own and a blocked one; a table's name, icon and phone count, no person's name.
type VenueTable = { room_id: string; name: string | null; phones: number; open: boolean };

async function venueTables(): Promise<VenueTable[]> {
  const { data, error } = await me().rpc('venue_tables', { target_venue_id: venueId ?? '' });
  if (error) throw error;
  return (data ?? []) as VenueTable[];
}

// The owner's request now waiting at the bot's table: "Katıl" or "Bu masadayım" (the
// join_requests policy shows the table's owner its requests).
async function waitingRequest(): Promise<{ id: string; as_member: boolean } | null> {
  const table = await myTable();
  const { data, error } = await me()
    .from('join_requests')
    .select('id, as_member')
    .eq('room_id', table.id)
    .eq('status', 'pending')
    .order('created_at')
    .limit(1);
  if (error) throw error;
  return (data?.[0] as { id: string; as_member: boolean } | undefined) ?? null;
}

// The bot's play history, newest first: the records with `alias` as the other person when given;
// `open` only those that still offer "Arkadaş ekle".
async function history(
  args: Json,
  open: boolean,
  limit: number,
): Promise<{ id: string; other_alias: string }[]> {
  let query = me().from('play_history').select('id, other_alias');
  if (open) query = query.eq('friend_open', true);
  if (typeof args.alias === 'string') query = query.eq('other_alias', args.alias);
  const { data, error } = await query.order('played_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as { id: string; other_alias: string }[];
}

export const actions: Record<string, (args: Json) => Promise<Json>> = {
  // Local only: the E2E venues, and both test accounts deleted so each run starts from zero.
  async setup() {
    const sql = db();
    try {
      await sql`
        delete from auth.users
        where phone in (
          ${BOT_PHONE.slice(1)}, ${DEVICE_PHONE.slice(1)}, ${SECOND_BOT_PHONE.slice(1)},
          ${TEAM_BOT_PHONE.slice(1)}
        )
      `;
      const wkt = `POLYGON((${E2E_VENUE.boundary.map(([lng, lat]) => `${lng} ${lat}`).join(', ')}))`;
      const [venue] = await sql<{ id: string }[]>`
        insert into public.venues (name, city, district, location, boundary, source, source_ref, kind, is_active)
        values (
          ${E2E_VENUE.name}, 'İstanbul', 'Test',
          extensions.st_setsrid(extensions.st_makepoint(${E2E_VENUE.at.lng}, ${E2E_VENUE.at.lat}), 4326)::extensions.geography,
          extensions.st_geomfromtext(${wkt}, 4326)::extensions.geography,
          'e2e', ${E2E_VENUE.sourceRef}, 'campus', true
        )
        on conflict (source, source_ref) do update
          set name = excluded.name, location = excluded.location, boundary = excluded.boundary,
              kind = excluded.kind, is_active = true
        returning id
      `;
      const venueId = venue?.id ?? null;
      for (const [i, spot] of E2E_VENUE.spots.entries()) {
        await sql`
          insert into public.venue_spots (venue_id, ref, name, sort)
          values (${venueId}, ${spot.ref}, ${spot.name}, ${i})
          on conflict (venue_id, ref) do update
            set name = excluded.name, sort = excluded.sort, is_active = true
        `;
      }
      const second = E2E_SECOND_VENUE.at;
      await sql`
        insert into public.venues (name, city, district, location, source, source_ref, kind, is_active)
        values (
          ${E2E_SECOND_VENUE.name}, 'İstanbul', 'Test',
          extensions.st_setsrid(extensions.st_makepoint(${second.lng}, ${second.lat}), 4326)::extensions.geography,
          'e2e', ${E2E_SECOND_VENUE.sourceRef}, 'cafe', true
        )
        on conflict (source, source_ref) do update set name = excluded.name, kind = excluded.kind, is_active = true
      `;
      return { venueId, inside: E2E_VENUE.at, outside: OUTSIDE };
    } finally {
      await sql.end();
    }
  },

  // Local only: the pilot's Keşfet (docs/SPEC_V3.md §4.4). Every venue but the E2E venue is closed,
  // so Keşfet shows the single venue card. `setup` opens the second E2E venue again; the seed's
  // venues come back with `pnpm db:reset`.
  async 'single-venue'() {
    const sql = db();
    try {
      await sql`
        update public.venues set is_active = false
        where is_active and not (source = 'e2e' and source_ref = ${E2E_VENUE.sourceRef})
      `;
      return { ok: true };
    } finally {
      await sql.end();
    }
  },

  // Signs in as BOT_PHONE, or locally as the second bot (`{"second":true}`, name "Bot İki").
  async login(args) {
    const second = args.second === true;
    if (second && !isLocal) throw new Error('the second bot is local only');
    const phone = second ? SECOND_BOT_PHONE : BOT_PHONE;
    const name = second ? 'Bot İki' : BOT_NAME;
    client = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const sent = await client.auth.signInWithOtp({ phone });
    if (sent.error) throw sent.error;
    const verified = await client.auth.verifyOtp({ phone, token: BOT_OTP, type: 'sms' });
    if (verified.error) throw verified.error;
    // Sign-up = profile (docs/SPEC_V3.md §3): an adult birth date, the bot's name and "Kadın", since
    // the bot's requests and rooms are anonymous (§23.D); an account from before the gender step
    // gets it here once.
    await call('account', {
      action: 'complete-onboarding',
      termsVersion: CURRENT_TERMS_VERSION,
      kvkkVersion: CURRENT_KVKK_VERSION,
      displayName: name,
      birthDate: '1995-05-20',
      gender: 'female',
    });
    // "Profilimle" (a profiled request, a profiled venue chat message) needs a profile photo
    // (docs/SPEC_V3.md §22.G); the bot's account gets one once and keeps it.
    await ensureProfilePhoto(me(), call);
    return { ok: true };
  },

  // At BOT_VENUE (name or id; the E2E venue by default), standing on the venue's own point. At a
  // venue with spots, at `spot` or BOT_SPOT (ref or name), else the first spot. A check-in opens no
  // table and asks no headcount (§4.E).
  async checkin(args) {
    const wanted = String(args.venue ?? process.env.BOT_VENUE ?? E2E_VENUE.name);
    const { data, error } = await me().rpc('explore_venues', {});
    if (error) throw error;
    const venue = (
      (data ?? []) as { venue_id: string; name: string; lat: number; lng: number }[]
    ).find((v) => v.venue_id === wanted || v.name === wanted);
    if (!venue) throw new Error(`venue "${wanted}" not found among the active venues`);
    venueId = venue.venue_id;
    const { data: spots, error: spotsError } = await me()
      .from('venue_spots')
      .select('id, ref, name')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('sort');
    if (spotsError) throw spotsError;
    const wantedSpot = args.spot ?? process.env.BOT_SPOT;
    const spot =
      wantedSpot === undefined
        ? spots?.[0]
        : spots?.find((s) => s.ref === wantedSpot || s.name === wantedSpot);
    if (wantedSpot !== undefined && !spot)
      throw new Error(`spot "${String(wantedSpot)}" not found`);
    return call('checkin', {
      action: 'check-in',
      venueId,
      lat: venue.lat,
      lng: venue.lng,
      accuracyM: 10,
      locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
      ...(spot ? { spotId: spot.id } : {}),
    });
  },

  // "Masa kur" (§4.E): in the lobby unless `open` is false, with an optional `intent` and
  // `gameTag`. The bot sits down with its check-in's identity (anonymous, §4.D).
  async 'create-room'(args) {
    return call('rooms', {
      action: 'create',
      open: args.open !== false,
      ...(typeof args.intent === 'string' ? { intent: args.intent } : {}),
      ...(typeof args.gameTag === 'string' ? { gameTag: args.gameTag } : {}),
    });
  },

  // "Masanı lobiye aç" (`open`, default) or "Lobiden çek" for the bot's own table.
  async 'set-visibility'(args) {
    const table = await myTable();
    return call('rooms', { action: 'set-visibility', roomId: table.id, open: args.open !== false });
  },

  // "Katıl" to a table in the lobby (the device's): the one named `name`, else the first. The bot
  // asks on its own, or with its whole table when it owns one (the table moves at the accept).
  async 'request-join'(args) {
    const name = typeof args.name === 'string' ? args.name : undefined;
    const table = await retryUntil(
      `a table in the lobby${name ? ` named ${name}` : ''}`,
      async () =>
        (await venueTables()).find((t) => t.open && (name === undefined || t.name === name)) ??
        null,
    );
    return call('rooms', { action: 'request-join', roomId: table.room_id });
  },

  // "Bu masadayım" to a running table, one out of the lobby (the device's): the one named `name`,
  // else the first. Only a person without a table may ask (already_in_table otherwise).
  async 'request-member'(args) {
    const name = typeof args.name === 'string' ? args.name : undefined;
    const table = await retryUntil(
      `a running table${name ? ` named ${name}` : ''}`,
      async () =>
        (await venueTables()).find((t) => !t.open && (name === undefined || t.name === name)) ??
        null,
    );
    return call('rooms', { action: 'request-join', roomId: table.room_id, asMember: true });
  },

  // As the table's owner, accepts the request now waiting for it ("Katıl" or "Bu masadayım").
  async 'accept-request'() {
    const request = await retryUntil('a request to accept', waitingRequest);
    return call('rooms', { action: 'respond', requestId: request.id, accept: true });
  },

  // As the table's owner, declines the request now waiting for it (the requester sees "Masa şu an
  // müsait değil.", as on a timeout; rule 5).
  async 'decline-request'() {
    const request = await retryUntil('a request to decline', waitingRequest);
    return call('rooms', { action: 'respond', requestId: request.id, accept: false });
  },

  // "Masadan ayrıl" (§4.E, K-13): the table goes on; an owner hands it to the earliest person
  // there; the last person's leaving closes it.
  async 'leave-room'() {
    const table = await myTable();
    return call('rooms', { action: 'leave', roomId: table.id });
  },

  // "Masayı bitir": the owner only; the table closes for everyone.
  async 'end-room'() {
    return call('rooms', { action: 'end' });
  },

  // Local only: everyone at the bot's table sat down 4 minutes earlier, so every pair there has
  // the 3 minutes together the play history needs (K-66).
  async 'backdate-encounter'() {
    const table = await myTable();
    const sql = db();
    try {
      await sql`
        update public.room_members set joined_at = joined_at - interval '4 minutes'
        where room_id = ${table.id} and left_at is null
      `;
    } finally {
      await sql.end();
    }
    return { ok: true };
  },
  // Local only: the account behind `phone` (the device's test number) accepted an older version of
  // the texts; its next launch asks "Başlamadan önce" again (K-33).
  async 'outdate-consents'(args) {
    return setOwnProfile(args, 'consents');
  },

  // Local only: the account behind `phone` has no gender, like one from before the gender step; its
  // next launch asks the one-time question (docs/SPEC_V3.md §23.D).
  async 'clear-gender'(args) {
    return setOwnProfile(args, 'gender');
  },

  // "Arkadaş ekle" at the table's end (K-66: a record per pair of people together for 3 minutes):
  // for the person who sat as `alias` (the name it sat down with), else for everyone the bot sat
  // with. `matched`: the people it is now friends with.
  async 'add-friend'(args) {
    const records = await history(args, true, 12);
    if (records.length === 0) throw new Error('the bot has no play history to add from');
    const matched: string[] = [];
    for (const r of records) {
      const res = (await call('friends', { action: 'add-from-room', historyId: r.id })) as {
        friends?: boolean;
      };
      if (res.friends) matched.push(r.other_alias);
    }
    return { pressed: records.length, matched };
  },

  // "Eklendi" pressed again (K-67): takes back the "Arkadaş ekle" for `alias`, else the latest.
  async 'withdraw-add'(args) {
    const [record] = await history(args, false, 1);
    if (!record) throw new Error('the bot has no play history');
    return call('friends', { action: 'withdraw-add', historyId: record.id });
  },

  async 'dm-send'(args) {
    const thread = await retryUntil('a friend with a conversation', async () => {
      const list = (await call('friends', { action: 'list' })) as {
        friends: { threadId: string | null }[];
      };
      return list.friends[0]?.threadId ?? null;
    });
    // A person stops typing when they send: a running `dm-typing` ends first, so no dots follow.
    await stopTyping();
    return call('dm', { action: 'send', threadId: thread, body: String(args.body ?? 'Merhaba!') });
  },

  // The device's messages so far count as read (its ticks turn to "Okundu", docs/SPEC_V3.md §18.2).
  async 'dm-read'() {
    const threadId = await firstThread();
    return call('dm', { action: 'read', threadId });
  },

  // "yazıyor" on the device: `typing` on dm_typing:{thread} every 1.5 s for `seconds` (default 8),
  // in the background so the flow can look for the dots meanwhile.
  async 'dm-typing'(args) {
    const threadId = await firstThread();
    const until = Date.now() + Number(args.seconds ?? 8) * 1000;
    await stopTyping();
    typing = typeFor(threadId, until);
    return { ok: true };
  },

  // The newest message of the conversation, so a flow can check what the device sent.
  async 'dm-last'() {
    const list = (await call('friends', { action: 'list' })) as {
      friends: { threadId: string | null }[];
    };
    const threadId = list.friends[0]?.threadId;
    if (!threadId) return { body: null };
    const { data, error } = await me().rpc('dm_messages_page', { target_thread_id: threadId });
    if (error) throw error;
    const rows = (data ?? []) as {
      body: string;
      created_at: string;
      reply_to: { body?: string } | null;
      reactions: { emoji: string }[];
    }[];
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const newest = rows[0];
    // docs/SPEC_V3.md §21: the quote and the reactions of the newest message, too.
    return {
      body: newest?.body ?? null,
      replyTo: newest?.reply_to?.body ?? null,
      reactions: (newest?.reactions ?? []).map((r) => r.emoji),
    };
  },

  // The table chat (docs/SPEC_V3.md §21): a message from the bot.
  async 'chat-send'(args) {
    const table = await myTable();
    return call('chat', { action: 'send', roomId: table.id, body: String(args.body ?? 'Selam') });
  },

  // The reactions on the bot's newest table chat message (as `reactions`, emojis).
  async 'chat-reactions'() {
    const room = await myTable();
    const sessionId = await mySessionId();
    const { data: own, error } = await me()
      .from('messages')
      .select('id')
      .eq('room_id', room.id)
      .eq('session_id', sessionId ?? '')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    const { data: extras, error: extrasError } = await me().rpc('room_chat_extras', {
      target_room_id: room.id,
    });
    if (extrasError) throw extrasError;
    const row = ((extras ?? []) as { message_id: string; reactions: { emoji: string }[] }[]).find(
      (x) => x.message_id === own?.[0]?.id,
    );
    return { reactions: (row?.reactions ?? []).map((r) => r.emoji) };
  },

  async leave() {
    return call('checkin', { action: 'leave' });
  },

  // Venue chat (docs/SPEC_V3.md §7): a message, anonymous unless `profiled`.
  async 'venue-chat-send'(args) {
    if (!venueId) throw new Error('check in first');
    return call('venue-chat', {
      action: 'send',
      venueId,
      body: String(args.body ?? 'Merhaba mekan!'),
      profiled: args.profiled === true,
    });
  },

  // Accepts the newest friend request from the venue chat.
  async 'accept-friend'() {
    const request = await retryUntil('a friend request from the venue chat', async () => {
      const { requests } = (await call('friends', { action: 'incoming' })) as {
        requests: { requestId: string }[];
      };
      return requests[0] ?? null;
    });
    return call('friends', { action: 'respond', requestId: request.requestId, accept: true });
  },
};

// "Bu masadayım" from the member bot: to the running table named BOT_TABLE (its name on the
// device's screen), else to the only running table. One the owner does not answer in 60 seconds is
// unavailable and may be sent again (the hour's 10 requests are shared with "Katıl").
async function askToSit(
  asked: Map<string, number>,
  say: (text: string) => void,
  tellOnce: (text: string) => void,
): Promise<void> {
  const wanted = process.env.BOT_TABLE?.trim();
  const running = (await venueTables()).filter((t) => !t.open);
  const found = wanted ? running.filter((t) => t.name === wanted) : running;
  const target = found.length === 1 ? found[0] : undefined;
  if (!target) {
    tellOnce(
      wanted
        ? `waiting for a running table named ${wanted}`
        : 'waiting for a single running table (or set BOT_TABLE)',
    );
    return;
  }
  if (Date.now() - (asked.get(target.room_id) ?? 0) < 65_000) return;
  asked.set(target.room_id, Date.now());
  await call('rooms', { action: 'request-join', roomId: target.room_id, asMember: true });
  say(`"Bu masadayım" to ${target.name ?? 'a table'}`);
}

// Another person at the venue, for a one-phone P0 test on the dev project. Checks in at BOT_VENUE
// (at a venue with spots: BOT_SPOT, else the first spot; only tables at the same spot meet) and
// then, every two seconds, does what that person would:
// - BOT_ROLE=host: keeps a table in the lobby and accepts every request, "Katıl" and "Bu
//   masadayım";
// - BOT_ROLE=guest (default): without a table, sends "Katıl" to each new table in the lobby, on its
//   own;
// - BOT_ROLE=member: without a table, sends "Bu masadayım" to the running table named BOT_TABLE
//   (else the only one), again after 60 s without an answer.
// At a table it owns (a host, or an owner by handover) it accepts every request. It presses
// "Arkadaş ekle" on each record that offers it (a table's end), accepts requests from the venue chat
// and answers every new DM. No games yet (§4.F, 4.6). Only the public API: the calls the app makes.
async function opponent() {
  const role =
    process.env.BOT_ROLE === 'host'
      ? 'host'
      : process.env.BOT_ROLE === 'member'
        ? 'member'
        : 'guest';
  const say = (text: string) => console.log(`${new Date().toLocaleTimeString('tr-TR')} ${text}`);
  const quiet = async (what: string, step: () => Promise<unknown>) => {
    try {
      await step();
    } catch (err) {
      say(`${what}: ${String(err)}`);
    }
  };

  await actions.login?.({});
  startPresence();
  await actions.checkin?.({});
  say(`checked in as ${BOT_NAME} (${role})`);

  const asked = new Set<string>();
  const sitAsked = new Map<string, number>();
  const befriended = new Set<string>();
  const answered = new Set<string>();
  const told = new Set<string>();
  const tellOnce = (text: string) => {
    if (told.has(text)) return;
    told.add(text);
    say(text);
  };

  for (;;) {
    await quiet('tick', async () => {
      const table = await currentTable();
      if (!table) {
        if (role === 'member') {
          await askToSit(sitAsked, say, tellOnce);
        } else if (role === 'guest') {
          for (const t of await venueTables()) {
            if (!t.open || asked.has(t.room_id)) continue;
            asked.add(t.room_id);
            await quiet('request-join', () =>
              call('rooms', { action: 'request-join', roomId: t.room_id }),
            );
            say(`"Katıl" to ${t.name ?? 'a table'}`);
          }
        } else {
          await call('rooms', { action: 'create', open: true });
          say('opened a table in the lobby');
        }
        return;
      }
      // The owner answers its table's requests (the join_requests policy shows it only those).
      if (table.owner_session_id && table.owner_session_id === (await mySessionId())) {
        const request = await waitingRequest();
        if (request) {
          await quiet('respond', () =>
            call('rooms', { action: 'respond', requestId: request.id, accept: true }),
          );
          say(request.as_member ? 'accepted "Bu masadayım"' : 'accepted "Katıl"');
        }
      }
    });

    await quiet('friends', async () => {
      // "Arkadaş ekle" on each record that offers it (one per pair of people, K-66): a table's end.
      const { data: history } = await me()
        .from('play_history')
        .select('id')
        .eq('friend_open', true)
        .order('played_at', { ascending: false })
        .limit(12);
      for (const { id: historyId } of (history ?? []) as { id: string }[]) {
        if (befriended.has(historyId)) continue;
        befriended.add(historyId);
        await quiet('add-friend', () => call('friends', { action: 'add-from-room', historyId }));
      }
      // Requests from the venue chat: accepted.
      const { requests } = (await call('friends', { action: 'incoming' })) as {
        requests: { requestId: string }[];
      };
      for (const { requestId } of requests) {
        await quiet('accept-friend', () =>
          call('friends', { action: 'respond', requestId, accept: true }),
        );
        say('accepted a friend request from the venue chat');
      }
    });
    await quiet('dm', async () => {
      const list = (await call('friends', { action: 'list' })) as {
        friends: { threadId: string | null }[];
      };
      for (const { threadId } of list.friends) {
        if (!threadId) continue;
        const { data } = await me().rpc('dm_messages_page', { target_thread_id: threadId });
        const rows = (data ?? []) as {
          id: string;
          body: string;
          from_me: boolean;
          created_at: string;
        }[];
        rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
        const last = rows[0];
        if (!last || last.from_me || answered.has(last.id)) continue;
        answered.add(last.id);
        // Read (the device's ticks turn to read), type a moment, then answer (§18.3).
        await call('dm', { action: 'read', threadId });
        await typeFor(threadId, Date.now() + 3000);
        await call('dm', { action: 'send', threadId, body: `Aldım: ${last.body}` });
        say('answered a DM');
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

async function firstThread(): Promise<string> {
  return retryUntil('a friend with a conversation', async () => {
    const list = (await call('friends', { action: 'list' })) as {
      friends: { threadId: string | null }[];
    };
    return list.friends[0]?.threadId ?? null;
  });
}

// The background `dm-typing` loop, so `dm-send` can end it before the message goes.
let typing: Promise<void> | null = null;
let typingStopped = false;

async function stopTyping(): Promise<void> {
  if (!typing) return;
  typingStopped = true;
  await typing;
  typing = null;
  typingStopped = false;
}

// The typing channel is the one channel where a client sends (rule 9); only the two members join.
async function typeFor(threadId: string, until: number): Promise<void> {
  const channel = me().channel(dmTypingChannel(threadId), { config: { private: true } });
  const status = await new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve('TIMED_OUT'), 8000);
    channel.subscribe((s) => {
      if (s === 'SUBSCRIBED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
        clearTimeout(timer);
        resolve(s);
      }
    });
  });
  if (status !== 'SUBSCRIBED') {
    console.log(`bot-table: typing channel ${status}`);
    await me().removeChannel(channel);
    return;
  }
  while (Date.now() < until && !typingStopped) {
    await channel.send({ type: 'broadcast', event: TYPING_EVENT, payload: {} });
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  await me().removeChannel(channel);
}

async function run(action: string, args: Json): Promise<Json> {
  const fn = actions[action];
  if (!fn) throw new Error(`unknown action ${action}; one of ${Object.keys(actions).join(', ')}`);
  // Each CLI call is its own process: sign in first unless the action does not need it.
  if (!client && !['setup', 'single-venue', 'login'].includes(action)) await actions.login?.({});
  return fn(args);
}

// Presence: the bot tracks itself on its table's presence:{room_id} channel under its check-in's
// id, so the device sees another phone at the table connected as it would with a real one. Checked
// every few seconds; a new table (or a new sign-in) rejoins.
let presence: { client: SupabaseClient; roomId: string; channel: RealtimeChannel } | null = null;

async function keepPresence(): Promise<void> {
  if (!client) return;
  const table = await currentTable();
  if (presence && (presence.client !== client || presence.roomId !== table?.id)) {
    await presence.client.removeChannel(presence.channel);
    presence = null;
  }
  if (!table || presence) return;
  const key = (await mySessionId()) ?? 'bot';
  const channel = client.channel(`presence:${table.id}`, {
    config: { private: true, presence: { key } },
  });
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') void channel.track({});
  });
  presence = { client, roomId: table.id, channel };
}

function startPresence(): void {
  let busy = false;
  setInterval(() => {
    if (busy) return;
    busy = true;
    keepPresence()
      .catch((err: unknown) => console.error(`bot-table presence: ${String(err)}`))
      .finally(() => (busy = false));
  }, 2000);
}

function serve(port: number) {
  startPresence();
  // One action at a time, in the order the flow sends them.
  let queue: Promise<unknown> = Promise.resolve();
  createServer((req, res) => {
    const action = (req.url ?? '/').replace(/^\/+/, '').split('?')[0] ?? '';
    let raw = '';
    req.on('data', (chunk: Buffer) => (raw += chunk.toString()));
    req.on('end', () => {
      queue = queue.then(async () => {
        try {
          const args = raw ? (JSON.parse(raw) as Json) : {};
          const result = await run(action, args);
          console.log(`bot-table ${action} ok`);
          res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result));
        } catch (err) {
          console.error(`bot-table ${action} failed: ${String(err)}`);
          res
            .writeHead(500, { 'content-type': 'application/json' })
            .end(JSON.stringify({ error: String(err) }));
        }
      });
    });
  }).listen(port, '127.0.0.1', () => console.log(`bot-table listening on ${port} (${url})`));
}

const [command = 'serve', rawArgs] = process.argv.slice(2);
if (command === 'serve') {
  serve(Number(process.env.BOT_PORT ?? 8787));
} else if (command === 'opponent') {
  opponent().catch((err: unknown) => {
    console.error(String(err));
    process.exit(1);
  });
} else {
  run(command, rawArgs ? (JSON.parse(rawArgs) as Json) : {}).then(
    (result) => console.log(JSON.stringify(result)),
    (err: unknown) => {
      console.error(String(err));
      process.exit(1);
    },
  );
}
