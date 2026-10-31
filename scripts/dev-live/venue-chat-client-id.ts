// Live check of Grup 3, P5 on the hosted dev project: a venue chat message sent again with the same
// clientId is the same message (the same messageId, one row, one broadcast), the same clientId with
// another body is client_id_reused, and a send without a clientId (apps before P5) is a new message
// each time. supabase/tests/venueChat.test.ts proves the same on the local stack; this proves the
// deployed migration and function on dev. Run by .github/workflows/dev-live.yml.
//
// Only the dev project's URL is accepted (pure/devProject.ts). It signs in with a dev test number
// through the public API and the publishable key: no secret key, no database password. The number,
// its code and the key come from the environment and are never printed; error texts are cleaned
// of them before they are. It checks in at TEST_VENUE (name or id; else the first active venue),
// deletes its own test messages and leaves the venue at the end.
//
//   SUPABASE_PUBLISHABLE_KEY=… TEST_PHONE=… TEST_OTP=… \
//     node --experimental-strip-types scripts/dev-live/venue-chat-client-id.ts
import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';

import { createClient, FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';

import { CURRENT_LOCATION_CONSENT_VERSION } from '../../supabase/functions/_shared/pure/consent.ts';
import {
  DEV_PROJECT_HOST,
  isDevProjectUrl,
} from '../../supabase/functions/_shared/pure/devProject.ts';
import {
  VENUE_CHAT,
  VENUE_CHAT_BROADCAST,
  venueChatChannel,
} from '../../supabase/functions/_shared/pure/venueChat.ts';

const env = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} is not set.`);
    process.exit(2);
  }
  return value;
};
const url = process.env.SUPABASE_URL?.trim() || `https://${DEV_PROJECT_HOST}`;
if (!isDevProjectUrl(url)) {
  console.error('SUPABASE_URL is not the dev project; refusing.');
  process.exit(2);
}
const key = env('SUPABASE_PUBLISHABLE_KEY');
const phone = env('TEST_PHONE');
const otp = env('TEST_OTP');
const wantedVenue = process.env.TEST_VENUE?.trim();

// Nothing secret leaves in a message: the number (with or without +), the code and the key.
const hidden = [key, otp, phone, phone.replace(/^\+/, '')].filter((s) => s.length >= 4);
const clean = (text: string) => hidden.reduce((t, s) => t.split(s).join('***'), text);

type Json = Record<string, unknown>;
type Answer = { status: number; body: Json };

const client: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function call(fn: string, body: Json): Promise<Answer> {
  const { data, error } = await client.functions.invoke(fn, { body });
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const text = await res.text();
    let parsed: Json = {};
    try {
      parsed = JSON.parse(text) as Json;
    } catch {
      parsed = { raw: text };
    }
    return { status: res.status, body: parsed };
  }
  if (error) throw error;
  return { status: 200, body: (data ?? {}) as Json };
}
const errorCode = (a: Answer) => (a.body.error as { code?: string } | undefined)?.code ?? null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Two new messages are at least VENUE_CHAT.minIntervalMs apart (rate_limited otherwise).
const GAP = VENUE_CHAT.minIntervalMs + 500;

const results: { name: string; ok: boolean; detail: string }[] = [];
const check = (name: string, ok: boolean, detail: string) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'GEÇTİ ' : 'KALDI '} ${name}: ${detail}`);
};

const sent: string[] = [];
let venueId = '';

async function main() {
  const otpSent = await client.auth.signInWithOtp({ phone });
  if (otpSent.error) throw new Error(`giriş kodu istenemedi: ${otpSent.error.message}`);
  const verified = await client.auth.verifyOtp({ phone, token: otp, type: 'sms' });
  if (verified.error) throw new Error(`giriş yapılamadı: ${verified.error.message}`);
  await client.realtime.setAuth();

  // Start from no check-in (a check-in left from an earlier run), then check in at the venue.
  await call('checkin', { action: 'leave' });
  const { data, error } = await client.rpc('explore_venues', {});
  if (error) throw new Error(`mekanlar okunamadı: ${error.message}`);
  const venues = (data ?? []) as { venue_id: string; name: string; lat: number; lng: number }[];
  const venue = wantedVenue
    ? venues.find((v) => v.venue_id === wantedVenue || v.name === wantedVenue)
    : venues[0];
  if (!venue) throw new Error('etkin mekan bulunamadı');
  venueId = venue.venue_id;
  const { data: spots } = await client
    .from('venue_spots')
    .select('id')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('sort')
    .limit(1);
  const checkin = await call('checkin', {
    action: 'check-in',
    venueId,
    lat: venue.lat,
    lng: venue.lng,
    accuracyM: 10,
    locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    ...(spots?.[0] ? { spotId: spots[0].id } : {}),
  });
  if (checkin.status !== 200) throw new Error(`check-in olmadı: ${errorCode(checkin)}`);

  const page = await call('venue-chat', { action: 'page', venueId });
  const identity = (page.body.identity as { mode?: string } | null | undefined)?.mode;
  if (identity !== 'anonymous' && identity !== 'profiled') {
    throw new Error('check-in kimliği okunamadı');
  }
  const send = (body: string, clientId?: string) =>
    call('venue-chat', {
      action: 'send',
      venueId,
      body,
      identity,
      ...(clientId ? { clientId } : {}),
    });
  const countOf = async (body: string) => {
    const p = await call('venue-chat', { action: 'page', venueId });
    const messages = (p.body.messages ?? []) as { body: string }[];
    return messages.filter((m) => m.body === body).length;
  };

  // Every broadcast of a new message at the venue while the check runs.
  let heard = 0;
  const channel = client.channel(venueChatChannel(venueId), { config: { private: true } });
  await new Promise<void>((resolve, reject) => {
    channel
      .on('broadcast', { event: VENUE_CHAT_BROADCAST }, () => {
        heard += 1;
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(status));
      });
  });
  const waitHeard = async (n: number, ms = 6000) => {
    for (let t = 0; t < ms && heard < n; t += 100) await sleep(100);
    // A second broadcast would come about as fast as the first.
    await sleep(1500);
    return heard;
  };

  const tag = randomUUID().slice(0, 8);
  try {
    // 1. The same clientId twice: one messageId, one row, one broadcast.
    const clientId = randomUUID();
    const one = `P5 canlı test ${tag} tekrar`;
    const first = await send(one, clientId);
    const firstId = String(first.body.messageId ?? '');
    if (firstId) sent.push(firstId);
    check('İlk gönderim', first.status === 200 && !!firstId, `HTTP ${first.status}`);
    const h1 = await waitHeard(1);
    const again = await send(one, clientId);
    check(
      'Aynı clientId aynı messageId',
      again.status === 200 && again.body.messageId === firstId,
      again.body.messageId === firstId ? 'aynı' : `HTTP ${again.status}, farklı ya da yok`,
    );
    const h2 = await waitHeard(h1 + 1, 2500);
    check('Tek broadcast', h1 === 1 && h2 === 1, `ilk gönderimde ${h1}, tekrarda +${h2 - h1}`);
    const rows = await countOf(one);
    check('Tek mesaj', rows === 1, `sayfada ${rows}`);

    // 2. Three at the same time with one new clientId: one message.
    await sleep(GAP);
    const together = `P5 canlı test ${tag} aynı anda`;
    const sameTime = randomUUID();
    const three = await Promise.all([1, 2, 3].map(() => send(together, sameTime)));
    const ids = new Set(three.map((a) => String(a.body.messageId ?? '')));
    for (const id of ids) if (id) sent.push(id);
    const togetherRows = await countOf(together);
    check(
      'Aynı anda üç gönderim tek mesaj',
      three.every((a) => a.status === 200) && ids.size === 1 && togetherRows === 1,
      `durumlar ${three.map((a) => a.status).join('/')}, ${ids.size} messageId, sayfada ${togetherRows}`,
    );

    // 3. The same clientId with another body: client_id_reused, nothing written.
    const reused = await send(`P5 canlı test ${tag} başka`, clientId);
    check(
      'Başka metinle aynı clientId reddedilir',
      reused.status === 409 && errorCode(reused) === 'client_id_reused',
      `HTTP ${reused.status} ${errorCode(reused) ?? ''}`.trim(),
    );

    // 4. Apps before P5: no clientId, every send is a new message.
    await sleep(GAP);
    const old = `P5 canlı test ${tag} eski istemci`;
    const o1 = await send(old);
    await sleep(GAP);
    const o2 = await send(old);
    for (const a of [o1, o2]) if (a.body.messageId) sent.push(String(a.body.messageId));
    const oldRows = await countOf(old);
    check(
      'Eski istemci (clientId yok) çalışır',
      o1.status === 200 &&
        o2.status === 200 &&
        !!o1.body.messageId &&
        o1.body.messageId !== o2.body.messageId &&
        oldRows === 2,
      `durumlar ${o1.status}/${o2.status}, sayfada ${oldRows}`,
    );
  } finally {
    await client.removeChannel(channel);
  }
}

async function cleanUp() {
  for (const messageId of new Set(sent)) await call('venue-chat', { action: 'delete', messageId });
  if (venueId) await call('checkin', { action: 'leave' });
  await client.auth.signOut();
}

let failed = false;
let stopped = '';
try {
  await main();
} catch (err) {
  failed = true;
  stopped = clean(err instanceof Error ? err.message : String(err));
  console.error(`Test durdu: ${stopped}`);
} finally {
  try {
    await cleanUp();
  } catch (err) {
    console.error(`Temizlik bitmedi: ${clean(err instanceof Error ? err.message : String(err))}`);
  }
}
failed ||= results.length === 0 || results.some((r) => !r.ok);

const summary = [
  '## Mekân sohbeti, aynı clientId (Grup 3, P5), dev projesi',
  '',
  '| Sonuç | Kontrol | Ayrıntı |',
  '| --- | --- | --- |',
  ...results.map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${clean(r.detail)} |`),
  '',
  ...(stopped ? [`Test durdu: ${stopped}`, ''] : []),
  failed ? '**Kaldı.**' : '**Hepsi geçti.** Test mesajları silindi, check-in kapatıldı.',
].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.exit(failed ? 1 : 0);
