// Sprengja's dev check (docs/decisions/4.6.8-sprengja.md → "Dev doğrulaması", D-1–D-6): a bot table
// of 3–8 test accounts plays whole games the way the app does, and measures. Each bot follows the
// table like the app (Postgres Changes on room:{id}), opens the card and lights the fuse when it
// starts the round, throws after a word's time, polls as game_state.poll says and is ready on Tur
// sonu (sprengjaBots.ts).
//
// Runs only against the local stack or the hosted dev project, like `pnpm latency`: the public Edge
// Function API, the publishable key and test numbers. The accounts check in at VENUE, one opens a
// table, the others sit down ("Katıl"), the owner opens Sprengja and starts it; at the end they
// leave. The game must be playable there (games.is_available, docs/decisions/4.6.8-sprengja.md).
//
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=<publishable key> \
//   PHONES=+905550000001,+905550000002,+905550000003 OTPS=<code>,<code>,<code> VENUE="<venue>" \
//     node --experimental-strip-types scripts/latency/sprengja.ts
//
// Optional: GAMES (default 1); HOLD_MIN_MS / HOLD_MAX_MS, how long a holder keeps the bomb (the
// word being said; default 1500–4000); SLEEP=1, the bomb's receiver after the second throw of a
// round goes to the background (no throw, no poll) until the bomb goes off (D-5).
// FUSE_PEEK=1 with SUPABASE_ACCESS_TOKEN (dev project only, never the pilot's): reads each round's
// hidden moment from game_secrets with a read-only query of the Management API, to give how late
// the bomb went off (D-2). The moment is only printed as a lateness, never kept.

import { createClient, FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';

import {
  CURRENT_KVKK_VERSION,
  CURRENT_LOCATION_CONSENT_VERSION,
  CURRENT_TERMS_VERSION,
} from '../../supabase/functions/_shared/pure/consent.ts';
import { APP_BUILD_HEADER } from '../../supabase/functions/_shared/pure/appVersion.ts';
import {
  DEV_PROJECT_HOST,
  isDevProjectUrl,
  isLocalUrl,
} from '../../supabase/functions/_shared/pure/devProject.ts';
import {
  fuseRange,
  readSprengjaResult,
  readSprengjaState,
  type SprengjaState,
} from '../../supabase/functions/_shared/pure/sprengja.ts';
import { botMove, type BotMove } from './sprengjaBots.ts';
import { markdownTable } from './stats.ts';

// The local stack's fixed publishable key (the same in every `supabase start`).
const LOCAL_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const isLocal = isLocalUrl(url);
if (!isLocal && !isDevProjectUrl(url)) {
  console.error(`sprengja: refusing ${url}; only the local stack and the dev project are allowed.`);
  process.exit(1);
}
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? (isLocal ? LOCAL_PUBLISHABLE_KEY : undefined);
if (!publishableKey) {
  console.error('sprengja: SUPABASE_PUBLISHABLE_KEY is required for the dev project.');
  process.exit(1);
}
const wantedVenue = process.env.VENUE;
if (!isLocal && !wantedVenue) {
  console.error('sprengja: VENUE (name or id) is required for the dev project.');
  process.exit(1);
}
const phones = (process.env.PHONES ?? '+905550000001,+905550000002,+905550000003').split(',');
const otps = (process.env.OTPS ?? phones.map(() => '123456').join(',')).split(',');
if (phones.length < 3 || phones.length > 8 || otps.length !== phones.length) {
  console.error('sprengja: PHONES needs 3–8 numbers and OTPS one code for each.');
  process.exit(1);
}
const GAMES = Math.max(1, Number(process.env.GAMES ?? 1));
const HOLD_MIN_MS = Number(process.env.HOLD_MIN_MS ?? 1500);
const HOLD_MAX_MS = Math.max(HOLD_MIN_MS, Number(process.env.HOLD_MAX_MS ?? 4000));
const SLEEP = process.env.SLEEP === '1';
const APP_BUILD = process.env.APP_BUILD ?? '1000000';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const FUSE_PEEK = process.env.FUSE_PEEK === '1';
if (FUSE_PEEK && (isLocal || !accessToken)) {
  console.error('sprengja: FUSE_PEEK needs the dev project and SUPABASE_ACCESS_TOKEN.');
  process.exit(1);
}

type Json = Record<string, unknown>;
type Bot = {
  name: string;
  client: SupabaseClient;
  sessionId: string;
  state: SprengjaState | null;
  holdUntil: number;
  lastPoll: number;
  busy: boolean;
  asleep: boolean;
  // The last step this phone got over Realtime.
  realtimeStep: number;
};

const now = () => performance.now();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Every call by action, and how long it took.
const samples = new Map<string, number[]>();
const add = (step: string, value: number) =>
  samples.set(step, [...(samples.get(step) ?? []), value]);

async function call(bot: Pick<Bot, 'client'>, fn: string, body: Json): Promise<Json> {
  const { data, error } = await bot.client.functions.invoke(fn, { body });
  if (error instanceof FunctionsHttpError) {
    const text = await (error.context as Response).text();
    throw new Error(`${fn}/${String(body.action)} answered ${error.context.status}: ${text}`);
  }
  if (error) throw error;
  return (data ?? {}) as Json;
}

async function signIn(name: string, phone: string, otp: string): Promise<SupabaseClient> {
  const client = createClient(url, publishableKey ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
    // The bots play as today's app: past the forced update gate (MIN_APP_BUILD).
    global: { headers: { [APP_BUILD_HEADER]: APP_BUILD } },
  });
  let sent = await client.auth.signInWithOtp({ phone });
  const wait = /after (\d+) seconds?/.exec(sent.error?.message ?? '')?.[1];
  if (wait) {
    await sleep((Number(wait) + 1) * 1000);
    sent = await client.auth.signInWithOtp({ phone });
  }
  if (sent.error) throw sent.error;
  const verified = await client.auth.verifyOtp({ phone, token: otp, type: 'sms' });
  if (verified.error) throw verified.error;
  await call({ client }, 'account', {
    action: 'complete-onboarding',
    termsVersion: CURRENT_TERMS_VERSION,
    kvkkVersion: CURRENT_KVKK_VERSION,
    displayName: name,
    birthDate: '1995-05-20',
    gender: 'female',
  });
  return client;
}

// At VENUE (name or id; locally the first active venue), on the venue's own point and first spot.
async function checkIn(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('explore_venues', {});
  if (error) throw error;
  const venues = (data ?? []) as { venue_id: string; name: string; lat: number; lng: number }[];
  const venue = wantedVenue
    ? venues.find((v) => v.venue_id === wantedVenue || v.name === wantedVenue)
    : venues[0];
  if (!venue) throw new Error(`venue "${wantedVenue ?? ''}" not found among the active venues`);
  const { data: spots } = await client
    .from('venue_spots')
    .select('id')
    .eq('venue_id', venue.venue_id)
    .eq('is_active', true)
    .order('sort')
    .limit(1);
  const res = await call({ client }, 'checkin', {
    action: 'check-in',
    venueId: venue.venue_id,
    lat: venue.lat,
    lng: venue.lng,
    accuracyM: 10,
    locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    ...(spots?.[0] ? { spotId: spots[0].id } : {}),
  });
  return String(res.sessionId);
}

// The round's hidden moment, read-only through the Management API (FUSE_PEEK); null when none.
async function peekFuse(roomId: string): Promise<number | null> {
  const ref = DEV_PROJECT_HOST.split('.')[0];
  const query = `select (gs.secret ->> 'explodesAt') as at from public.game_secrets gs
    join public.rooms r on r.id = gs.room_id
    where gs.room_id = '${roomId}' and gs.game_no = (r.game_state ->> 'gameNo')::integer`;
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken ?? ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, read_only: true }),
  });
  const rows = (await res.json()) as { at: string | null }[];
  const at = rows[0]?.at;
  return at ? Date.parse(at) : null;
}

// The round's lit and blast moments on the server's clock (game_events, open to the table).
async function roundEvents(
  bot: Bot,
  roomId: string,
  round: number,
): Promise<{ lit: number | null; blast: number | null }> {
  const { data } = await bot.client
    .from('game_events')
    .select('type, payload, created_at')
    .eq('room_id', roomId)
    .in('type', ['sp_lit', 'sp_explode'])
    .order('created_at', { ascending: false })
    .limit(10);
  const rows = (data ?? []) as { type: string; payload: { round?: number }; created_at: string }[];
  const at = (type: string) => {
    const row = rows.find((r) => r.type === type && r.payload.round === round);
    return row ? Date.parse(row.created_at) : null;
  };
  return { lit: at('sp_lit'), blast: at('sp_explode') };
}

async function playGame(bots: Bot[], roomId: string, gameNo: number): Promise<void> {
  const owner = bots[0] as Bot;
  // Pass → the receiver's phone has the new row over Realtime; light → everyone's.
  const sentAt = new Map<number, { at: number; action: string }>();
  const stamp = (step: number, action: string) => sentAt.set(step + 1, { at: now(), action });
  let lastStep = -1;
  let fuseAt: number | null = null;
  let litRound = 0;
  let throwsInRound = 0;

  const channels = bots.map((bot) =>
    bot.client
      .channel(`room:${roomId}`, { config: { private: true } })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: { new?: { game_state?: unknown } }) => {
          const st = readSprengjaState(payload.new?.game_state);
          const arrived = now();
          // Each step once per phone, whether or not the status check saw it first.
          if (st && st.step > bot.realtimeStep) {
            const sent = sentAt.get(st.step);
            if (sent && bot.realtimeStep >= 0) {
              add(`Realtime: ${sent.action} → telefonlar`, arrived - sent.at);
            }
            bot.realtimeStep = st.step;
          }
          bot.state = st ?? bot.state;
          if (!st) bot.state = null;
        },
      )
      .subscribe(),
  );
  await sleep(1500);
  const read = async () => {
    const { data } = await owner.client
      .from('rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();
    return data?.game_state;
  };
  const opening = readSprengjaState(await read());
  for (const bot of bots) {
    bot.state = opening;
    bot.realtimeStep = opening?.step ?? -1;
  }

  const started = Date.now();
  let ended = false;
  while (!ended && Date.now() - started < 20 * 60_000) {
    // A missed change (Realtime never replays one) is caught by the app's status check; here too.
    const fresh = await read();
    const st = readSprengjaState(fresh);
    if (!st) {
      const result = readSprengjaResult(fresh);
      console.log(
        `Oyun ${gameNo}: bitti${result?.abandoned ? ' (yarıda)' : ''}, tur ${result?.round ?? '?'}/${
          result?.rounds ?? '?'
        }, kazanan ${result?.winners.length ?? 0}.`,
      );
      ended = true;
      break;
    }
    for (const bot of bots) if (!bot.state || bot.state.step < st.step) bot.state = st;

    if (st.step !== lastStep) {
      if (st.phase === 'lit' && litRound !== st.round) {
        litRound = st.round;
        throwsInRound = 0;
        fuseAt = FUSE_PEEK ? await peekFuse(roomId) : null;
      }
      if (st.phase === 'lit') {
        throwsInRound = st.passes;
        const holder = bots.find((b) => b.sessionId === st.holder);
        if (holder) {
          holder.holdUntil = Date.now() + HOLD_MIN_MS + Math.random() * (HOLD_MAX_MS - HOLD_MIN_MS);
          if (SLEEP && throwsInRound === 2) holder.asleep = true;
        }
      }
      if (st.phase === 'summary' && st.lastBlast?.round === litRound) {
        const { lit, blast } = await roundEvents(owner, roomId, litRound);
        const { lowMs, highMs } = fuseRange(st.players);
        const burn = lit !== null && blast !== null ? blast - lit : null;
        const late = fuseAt !== null && blast !== null ? blast - fuseAt : null;
        if (burn !== null) add('Tur: yanma süresi (sp_lit → sp_explode)', burn);
        if (late !== null) add('Patlama gecikmesi (sp_explode − gizli an)', late);
        console.log(
          `  tur ${litRound} ${st.letters ?? '?'}: ${throwsInRound} atış, yanma ${burn === null ? '?' : (burn / 1000).toFixed(1)} sn (aralık ${
            lowMs / 1000
          }–${highMs / 1000})${late === null ? '' : `, gecikme ${Math.round(late)} ms`}`,
        );
        for (const bot of bots) bot.asleep = false;
        fuseAt = null;
      }
      lastStep = st.step;
    }

    await Promise.all(
      bots.map(async (bot) => {
        const state = bot.state;
        if (bot.busy || !state) return;
        const move: BotMove | null = botMove(state, bot.sessionId, Date.now(), {
          holdUntilMs: bot.holdUntil,
          lastPollMs: bot.lastPoll,
          asleep: bot.asleep,
        });
        if (!move) return;
        bot.busy = true;
        if (move.action === 'poll') bot.lastPoll = Date.now();
        if (move.action === 'pass' || move.action === 'light') stamp(state.step, move.action);
        const t0 = now();
        try {
          await call(bot, 'sprengja', { ...move, roomId });
          add(`sprengja/${move.action}`, now() - t0);
        } catch (err) {
          const text = String(err);
          // A throw after the fuse ran out: the blast is written, the answer says so.
          const late = /turn_over/.test(text);
          if (!late) console.log(`  ${bot.name}: ${text}`);
          add(`sprengja/${move.action} (${late ? 'geç atış, patlattı' : 'hata'})`, now() - t0);
        } finally {
          bot.busy = false;
        }
      }),
    );
    await sleep(100);
  }
  for (const channel of channels) await channel.unsubscribe();
}

async function main() {
  console.log(`${url}: ${phones.length} oyuncu, ${GAMES} oyun.`);
  const bots: Bot[] = [];
  for (const [i, phone] of phones.entries()) {
    const name = `Bot ${i + 1}`;
    const client = await signIn(name, phone, otps[i] as string);
    const sessionId = await checkIn(client);
    bots.push({
      name,
      client,
      sessionId,
      state: null,
      holdUntil: 0,
      lastPoll: 0,
      busy: false,
      asleep: false,
      realtimeStep: -1,
    });
  }
  const [owner, ...others] = bots as [Bot, ...Bot[]];
  const { roomId } = (await call(owner, 'rooms', { action: 'create', open: true })) as {
    roomId: string;
  };
  for (const bot of others) {
    const { requestId } = (await call(bot, 'rooms', { action: 'request-join', roomId })) as {
      requestId: string;
    };
    await call(owner, 'rooms', { action: 'respond', requestId, accept: true });
  }
  try {
    for (let g = 1; g <= GAMES; g += 1) {
      await call(owner, 'rooms', {
        action: 'open-game',
        roomId,
        concept: 'sprengja',
        ...(g > 1 ? { again: true } : {}),
      });
      const t0 = now();
      await call(owner, 'sprengja', { action: 'start', roomId });
      add('sprengja/start', now() - t0);
      await playGame(bots, roomId, g);
    }
  } finally {
    for (const bot of bots) await call(bot, 'checkin', { action: 'leave' }).catch(() => undefined);
  }

  const counts = [...samples].filter(([step]) => step.startsWith('sprengja/'));
  const total = counts.reduce((sum, [, v]) => sum + v.length, 0);
  console.log(`\nms, ${url}, ${new Date().toISOString()}\n`);
  console.log(markdownTable([...samples].map(([step, values]) => ({ step, samples: values }))));
  console.log(
    `\nFonksiyon çağrısı: ${total} (${counts.map(([s, v]) => `${s} ${v.length}`).join(', ')})`,
  );
}

main().then(
  () => process.exit(0),
  (err: unknown) => {
    console.error(String(err));
    process.exit(1);
  },
);
