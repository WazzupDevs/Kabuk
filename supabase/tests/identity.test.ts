// Faz 4 step 4.4, server (docs/SPEC_V4.md §4.D, §4.M "Adım 4.4"): the capsule nick and look, the
// check-in's one identity change, and the venue chat's identity: nick and look on an anonymous
// message, the senderKey, deleting one's own message, muting one identity of another. Today's app
// (`profiled` with every message, the mode picked by the first one) keeps working: the last block.
// Step 4.4b (K-47): the look from the decoration screen (profile/set-look).
import { CURRENT_KVKK_VERSION, CURRENT_TERMS_VERSION } from '../functions/_shared/pure/consent.ts';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type {
  VenueChatMutesResponse,
  VenueChatPageResponse,
} from '../functions/_shared/pure/api/venueChat.ts';
import type { ProfileView } from '../functions/_shared/pure/api/profile.ts';
import { isGeneratedNick } from '../functions/_shared/pure/capsule.ts';
import { CAPSULE_CATALOG } from '../functions/_shared/pure/capsuleCatalog.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { checkInAt, errorBody, onboarded, PHONES, setTestPhoto } from './helpers.ts';
import { type Client, deleteUserByPhone, invoke, signIn, sql, userIdOf } from './local.ts';

let venue: Record<string, string> = {};
const V = 'at-anchor';
const READY_LOOKS = CAPSULE_CATALOG.readyLooks.map((l) => l.code);
const ok = expect.objectContaining({ status: 200 });

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  for (const phone of PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

async function capsuleOf(client: Client) {
  const [row] = await sql`
    select capsule_nick, capsule_look, capsule_nick_changed_at from public.profiles
    where id = ${await userIdOf(client)}
  `;
  return row as {
    capsule_nick: string | null;
    capsule_look: string | null;
    capsule_nick_changed_at: Date | null;
  };
}

// A look other than `look`: the same parts in another colour than its own. A test that changes the
// look takes this one, so that the ready look the account started with is never the new one too.
function anotherLook(look: string | null): string {
  const color = look?.match(/(?:^| )c:(\S+)/)?.[1];
  return `c:${CAPSULE_CATALOG.colors.find((c) => c.id !== color)?.id} e:koyu h:anten`;
}

async function retired(nick: string): Promise<boolean> {
  const [row] =
    await sql`select count(*)::int as n from public.retired_capsule_nicks where nick = ${nick}`;
  return row?.n === 1;
}

async function atVenue(phone: string, name: string): Promise<Client> {
  const client = await onboarded(phone, { displayName: name });
  await checkInAt(client, venue, V);
  return client;
}

// Without waiting out the 3-second limit (venueChat.test.ts checks the limit). The new app's way:
// the identity it shows, anonymous unless the test says otherwise; today's app sends `profiled`
// instead (exactly one of the two).
async function send(client: Client, body: string, extra: Record<string, unknown> = {}) {
  await sql`update public.venue_chat_rate set last_sent_at = '-infinity'`;
  const identity = 'profiled' in extra ? {} : { identity: 'anonymous' };
  return invoke(client, 'venue-chat', {
    action: 'send',
    venueId: venue[V],
    body,
    ...identity,
    ...extra,
  });
}

async function page(client: Client): Promise<VenueChatPageResponse> {
  const res = await invoke(client, 'venue-chat', { action: 'page', venueId: venue[V] });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as VenueChatPageResponse;
}

const setIdentity = (client: Client, anonymous: boolean) =>
  invoke(client, 'checkin', { action: 'set-identity', anonymous });

describe('nick and look (§4.D, K-9, K-46, K-50, K-61)', () => {
  it('gives each account its own nick and one of the ready looks at sign-up', async () => {
    const [a, b] = await Promise.all([
      onboarded(PHONES[0], { gender: 'female' }),
      onboarded(PHONES[1], { gender: 'male' }),
    ]);
    const [ca, cb] = [await capsuleOf(a), await capsuleOf(b)];
    for (const c of [ca, cb]) {
      expect(isGeneratedNick(c.capsule_nick ?? ''), c.capsule_nick ?? 'null').toBe(true);
      expect(READY_LOOKS).toContain(c.capsule_look);
      expect(c.capsule_nick_changed_at).toBeNull();
    }
    expect(ca.capsule_nick).not.toBe(cb.capsule_nick);

    // A re-consent keeps them.
    const again = await invoke(a, 'account', {
      action: 'complete-onboarding',
      termsVersion: CURRENT_TERMS_VERSION,
      kvkkVersion: CURRENT_KVKK_VERSION,
    });
    expect(again).toEqual(ok);
    expect(await capsuleOf(a)).toEqual(ca);
  });

  it('assigns nothing under 18: no profile, no nick, nothing retired (rule 11)', async () => {
    const [before] = await sql`select count(*)::int as n from public.retired_capsule_nicks`;
    const client = await signIn(PHONES[0]);
    const uid = await userIdOf(client);
    const res = await invoke(client, 'account', {
      action: 'complete-onboarding',
      termsVersion: CURRENT_TERMS_VERSION,
      kvkkVersion: CURRENT_KVKK_VERSION,
      displayName: 'Genç',
      birthDate: `${new Date().getFullYear() - 16}-01-01`,
      gender: 'female',
    });
    expect(res).toEqual({ status: 403, body: errorBody('under_age') });
    expect(await sql`select 1 from public.profiles where id = ${uid}`).toHaveLength(0);
    const [after] = await sql`select count(*)::int as n from public.retired_capsule_nicks`;
    expect(after?.n).toBe(before?.n);
  });

  it('keeps the nick and the look closed to the account itself (the gender pattern)', async () => {
    const a = await onboarded(PHONES[0]);
    for (const column of ['capsule_nick', 'capsule_look', 'capsule_nick_changed_at']) {
      const res = await a.from('profiles').select(column);
      expect(res.error?.code, column).toBe('42501');
    }
    const closed = await a.from('retired_capsule_nicks').select('nick');
    expect(closed.data ?? []).toEqual([]);
    const mutes = await a.from('venue_chat_mutes').select('id');
    expect(mutes.data ?? []).toEqual([]);
  });

  it('shows them on one’s own profile only, never to another, a friend included (K-49)', async () => {
    const [a, b] = await Promise.all([onboarded(PHONES[0]), onboarded(PHONES[1])]);
    await sql`select private.make_friends(${await userIdOf(a)}, ${await userIdOf(b)}, 'request')`;
    const { data: ownA } = await a.from('profiles').select('public_id').single();
    const capsule = await capsuleOf(a);

    const mine = await invoke(a, 'profile', { action: 'get', publicId: ownA?.public_id });
    expect(mine.body).toMatchObject({
      capsuleNick: capsule.capsule_nick,
      capsuleLook: capsule.capsule_look,
      nickRefreshAt: null,
    });
    const asFriend = await invoke(b, 'profile', { action: 'get', publicId: ownA?.public_id });
    expect(asFriend.status).toBe(200);
    const seen = JSON.stringify(asFriend.body);
    expect(seen).not.toContain(capsule.capsule_nick ?? 'missing');
    expect(seen).not.toContain(capsule.capsule_look ?? 'missing');
    expect(Object.keys(asFriend.body as ProfileView)).not.toContain('capsuleNick');
  });

  it('retires a deleted account’s nick, the text only', async () => {
    const a = await onboarded(PHONES[0]);
    const { capsule_nick: nick } = await capsuleOf(a);
    expect(await invoke(a, 'account', { action: 'delete' })).toEqual(ok);
    expect(await retired(nick ?? '')).toBe(true);
    const columns = await sql`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'retired_capsule_nicks'
    `;
    expect(columns.map((c) => c.column_name)).toEqual(['nick']);
  });

  it('refreshes the nick once in 30 days; the old one retires, the look stays (K-9)', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const before = await capsuleOf(a);
    expect(await send(a, 'eski adla')).toEqual(ok);

    const res = await invoke(a, 'profile', { action: 'refresh-nick' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const after = await capsuleOf(a);
    expect(res.body).toEqual({
      capsuleNick: after.capsule_nick,
      nickRefreshAt: expect.any(String),
    });
    expect(after.capsule_nick).not.toBe(before.capsule_nick);
    expect(isGeneratedNick(after.capsule_nick ?? '')).toBe(true);
    expect(after.capsule_look).toBe(before.capsule_look);
    expect(await retired(before.capsule_nick ?? '')).toBe(true);

    expect(await invoke(a, 'profile', { action: 'refresh-nick' })).toEqual({
      status: 409,
      body: errorBody('nick_refresh_too_soon'),
    });
    // The old message keeps the old nick; a new one has the new nick, and another senderKey: the
    // new nick is not tied to the old one, even on the same day (K-68).
    expect(await send(a, 'yeni adla')).toEqual(ok);
    const messages = (await page(b)).messages;
    expect(messages.map((m) => [m.body, m.senderAlias])).toEqual([
      ['yeni adla', after.capsule_nick],
      ['eski adla', before.capsule_nick],
    ]);
    expect(messages[0]?.senderKey).not.toBe(messages[1]?.senderKey);

    // 30 days later it can be refreshed again.
    await sql`
      update public.profiles set capsule_nick_changed_at = now() - interval '30 days 1 minute'
      where id = ${await userIdOf(a)}
    `;
    expect((await invoke(a, 'profile', { action: 'refresh-nick' })).status).toBe(200);
  });

  // An account can be left without a nick: signed up through an older function between the
  // migration and the functions' deploy, or after a failed assignment. Check-in and the own profile
  // give it one; the venue chat never writes the table alias instead (rule 4).
  it('gives a missing nick at check-in and on the own profile; never writes another name', async () => {
    const a = await onboarded(PHONES[0], { displayName: 'Ayşe' });
    const id = await userIdOf(a);
    await sql`update public.profiles set capsule_nick = null where id = ${id}`;
    await checkInAt(a, venue, V);
    const atCheckIn = (await capsuleOf(a)).capsule_nick;
    expect(isGeneratedNick(atCheckIn ?? '')).toBe(true);

    await sql`update public.profiles set capsule_nick = null where id = ${id}`;
    const { data } = await a.from('profiles').select('public_id').single();
    const own = await invoke(a, 'profile', { action: 'get', publicId: data?.public_id });
    const fromProfile = (await capsuleOf(a)).capsule_nick;
    expect(isGeneratedNick(fromProfile ?? '')).toBe(true);
    expect((own.body as ProfileView).capsuleNick).toBe(fromProfile);

    // Still without one at the moment of writing: nothing is written.
    await sql`update public.profiles set capsule_nick = null where id = ${id}`;
    await expect(
      sql`select id from public.venue_chat_send(${id}, ${venue[V] ?? ''}, 'adsız', 3000, 600, 20)`,
    ).rejects.toMatchObject({ message: 'onboarding_required' });
    expect(
      await sql`select 1 from public.venue_chat_messages where sender_user_id = ${id}`,
    ).toHaveLength(0);
  });

  it('never gives a nick that is taken or retired', async () => {
    const a = await onboarded(PHONES[0]);
    const uid = await userIdOf(a);
    const { capsule_nick: nick } = await capsuleOf(a);
    // Straight at the database function: another account's nick, then a retired one.
    const b = await onboarded(PHONES[1]);
    const { capsule_nick: other } = await capsuleOf(b);
    await sql`update public.profiles set capsule_nick = null where id = ${uid}`;
    await expect(
      sql`select public.assign_capsule_identity(${uid}, ${other}, 'c:mor e:klasik')`,
    ).rejects.toMatchObject({ code: '23505' });
    await sql`insert into public.retired_capsule_nicks (nick) values ('kapsul-zz99')
              on conflict do nothing`;
    await expect(
      sql`select public.assign_capsule_identity(${uid}, 'kapsul-zz99', 'c:mor e:klasik')`,
    ).rejects.toMatchObject({ message: 'nick_taken' });
    await sql`delete from public.retired_capsule_nicks where nick = 'kapsul-zz99'`;
    await sql`select public.assign_capsule_identity(${uid}, ${nick}, 'c:mor e:klasik')`;
    expect((await capsuleOf(a)).capsule_nick).toBe(nick);
  });
});

// Step 4.4b (docs/SPEC_V4.md §4.D "Kapsül süsleme", §4.M "Adım 4.4b"; K-47, K-52): the decoration
// screen's Kaydet writes the account's own look through profile/set-look, checked against the
// catalog. What was written before keeps its look: a message, and the seat of a running table.
describe('capsule decoration (profile/set-look, K-47)', () => {
  const setLook = (client: Client, look: string) =>
    invoke(client, 'profile', { action: 'set-look', look });

  it('writes the look the catalog knows, dropping unknown parts, and answers it', async () => {
    const a = await onboarded(PHONES[0]);
    const res = await setLook(a, 'c:nane e:koyu h:anten f:yok q:fiyonk h:fiyonk m:');
    expect(res).toEqual({ status: 200, body: { capsuleLook: 'c:nane e:koyu h:anten' } });
    expect((await capsuleOf(a)).capsule_look).toBe('c:nane e:koyu h:anten');
    // "Hepsini çıkar": the colour and the eyes stay.
    expect(await setLook(a, 'c:nane e:koyu')).toEqual({
      status: 200,
      body: { capsuleLook: 'c:nane e:koyu' },
    });
    // Nothing known at all: the drawing's defaults, spelled out.
    const first = CAPSULE_CATALOG.colors[0]?.id;
    expect(await setLook(a, 'zzz')).toEqual({
      status: 200,
      body: { capsuleLook: `c:${first} e:klasik` },
    });
    const { data: own } = await a.from('profiles').select('public_id').single();
    const mine = await invoke(a, 'profile', { action: 'get', publicId: own?.public_id });
    expect(mine.body).toMatchObject({ capsuleLook: `c:${first} e:klasik` });
  });

  it('writes only the caller’s own look and takes no emotion (K-52)', async () => {
    const [a, b] = await Promise.all([onboarded(PHONES[0]), onboarded(PHONES[1])]);
    const before = (await capsuleOf(b)).capsule_look;
    const { data: other } = await b.from('profiles').select('public_id').single();
    // No field names another account; an emotion is not a field either.
    for (const extra of [{ publicId: other?.public_id }, { emotion: 'mutlu' }]) {
      expect(
        await invoke(a, 'profile', { action: 'set-look', look: 'c:nane e:koyu', ...extra }),
      ).toEqual({ status: 400, body: errorBody('bad_request') });
    }
    // An emotion inside the code is not a part: dropped.
    const emotion = CAPSULE_CATALOG.emotions[0]?.id ?? 'mutlu';
    expect(await setLook(a, `c:nane e:koyu d:${emotion} ${emotion}`)).toEqual({
      status: 200,
      body: { capsuleLook: 'c:nane e:koyu' },
    });
    expect((await capsuleOf(b)).capsule_look).toBe(before);
    expect(await setLook(a, 'c:nane '.repeat(40))).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
  });

  it('keeps an old message’s look and a running table’s seat as they were written (K-10)', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const { capsule_look: look } = await capsuleOf(a);
    expect(await send(a, 'önce')).toEqual(ok);
    // A running table: a's seat, anonymous, with the look of now.
    const created = await invoke(a, 'rooms', { action: 'create', profiled: false });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const { roomId } = created.body as { roomId: string };
    expect(await invoke(a, 'chat', { action: 'send', roomId, body: 'masada önce' })).toEqual(ok);

    const target = anotherLook(look);
    expect(await setLook(a, target)).toEqual(ok);
    await sql`update public.messages set created_at = created_at - interval '2 seconds'
              where room_id = ${roomId}`;
    expect(await send(a, 'sonra')).toEqual(ok);
    expect(await invoke(a, 'chat', { action: 'send', roomId, body: 'masada sonra' })).toEqual(ok);
    expect((await page(b)).messages.map((m) => [m.body, m.senderLook])).toEqual([
      ['sonra', target],
      ['önce', look],
    ]);
    const [seat] = await sql`
      select look from public.room_members where room_id = ${roomId} and left_at is null
    `;
    expect(seat?.look).toBe(look);
    const roomMessages = await sql`
      select body, sender_look from public.messages where room_id = ${roomId} order by created_at
    `;
    expect(roomMessages.map((m) => [m.body, m.sender_look])).toEqual([
      ['masada önce', look],
      ['masada sonra', look],
    ]);
  });
});

describe('the check-in identity: one change (§4.D, K-3, K-4, K-48)', () => {
  it('starts anonymous by default, and with the profile only with a visible photo', async () => {
    const a = await onboarded(PHONES[0]);
    await sql`update public.profiles set default_participation = 'profile'
              where id = ${await userIdOf(a)}`;
    const noPhoto = await checkInAt(a, venue, V);
    expect((noPhoto as { identity?: unknown }).identity).toEqual({
      mode: 'anonymous',
      switchUsed: false,
    });
    await setTestPhoto(a);
    const withPhoto = await checkInAt(a, venue, V);
    expect((withPhoto as { identity?: unknown }).identity).toEqual({
      mode: 'profiled',
      switchUsed: false,
    });
  });

  it('changes once; the second change is identity_switch_used, the same one changes nothing', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    expect(await setIdentity(a, true)).toEqual({
      status: 200,
      body: { identity: { mode: 'anonymous', switchUsed: false } },
    });
    expect(await setIdentity(a, false)).toEqual({
      status: 200,
      body: { identity: { mode: 'profiled', switchUsed: true } },
    });
    expect(await setIdentity(a, false)).toEqual({
      status: 200,
      body: { identity: { mode: 'profiled', switchUsed: true } },
    });
    expect(await setIdentity(a, true)).toEqual({
      status: 409,
      body: errorBody('identity_switch_used'),
    });
    expect((await page(a)).identity).toEqual({ mode: 'profiled', switchUsed: true });
  });

  it('needs a visible photo for the profiled identity and uses no change when refused', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    expect(await setIdentity(a, false)).toEqual({ status: 409, body: errorBody('photo_required') });
    expect((await page(a)).identity).toEqual({ mode: 'anonymous', switchUsed: false });
    expect(
      await invoke(await onboarded(PHONES[1]), 'checkin', {
        action: 'set-identity',
        anonymous: true,
      }),
    ).toEqual({ status: 409, body: errorBody('no_active_table') });
  });

  it('lets a man and an unspecified account write anonymously in the venue chat, with one change', async () => {
    const m = await onboarded(PHONES[0], { displayName: 'Mert', gender: 'male' });
    const u = await onboarded(PHONES[1], { displayName: 'Umut', gender: 'unspecified' });
    for (const client of [m, u]) {
      await checkInAt(client, venue, V);
      await setTestPhoto(client);
      expect(await send(client, 'anonim', { identity: 'anonymous' })).toEqual(ok);
      expect((await setIdentity(client, false)).status).toBe(200);
      expect(await setIdentity(client, true)).toEqual({
        status: 409,
        body: errorBody('identity_switch_used'),
      });
    }
  });

  it('settles two changes sent at once to one (only the check-in is locked)', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    const results = await Promise.all([setIdentity(a, false), setIdentity(a, false)]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    const [row] = await sql`
      select identity_mode, identity_switches from public.table_sessions
      where user_id = ${await userIdOf(a)} and status = 'active'
    `;
    expect(row).toEqual({ identity_mode: 'profiled', identity_switches: 1 });
  });
});

describe('venue chat identity (§4.D)', () => {
  it('writes the nick and the look with an anonymous message, the name and no look with a profiled one', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    await setTestPhoto(a);
    const capsule = await capsuleOf(a);
    expect(await send(a, 'anonim', { identity: 'anonymous' })).toEqual(ok);
    expect((await setIdentity(a, false)).status).toBe(200);
    expect(await send(a, 'adımla', { identity: 'profiled' })).toEqual(ok);

    const { messages } = await page(b);
    expect(
      messages.map((m) => [m.body, m.profiled, m.senderAlias, m.displayName, m.senderLook]),
    ).toEqual([
      ['adımla', true, null, 'Ayşe', null],
      // Before the change: still the anonymous identity (§4.D).
      ['anonim', false, capsule.capsule_nick, null, capsule.capsule_look],
    ]);
    expect(messages[1]?.photoUrl).toBeNull();
    // Stored the same way: no look on the profiled row, no table alias anywhere.
    const rows = await sql`
      select body, sender_alias, sender_look from public.venue_chat_messages
      where sender_user_id = ${await userIdOf(a)} order by created_at
    `;
    expect(rows).toEqual([
      { body: 'anonim', sender_alias: capsule.capsule_nick, sender_look: capsule.capsule_look },
      { body: 'adımla', sender_alias: 'Ayşe', sender_look: null },
    ]);
  });

  it('keeps an old message’s look when the look changes', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const { capsule_look: look } = await capsuleOf(a);
    expect(await send(a, 'önce')).toEqual(ok);
    const target = anotherLook(look);
    await sql`update public.profiles set capsule_look = ${target} where id = ${await userIdOf(a)}`;
    expect(await send(a, 'sonra')).toEqual(ok);
    expect((await page(b)).messages.map((m) => [m.body, m.senderLook])).toEqual([
      ['sonra', target],
      ['önce', look],
    ]);
  });

  it('needs exactly one of `profiled` and `identity` with a message', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const bad = { status: 400, body: errorBody('bad_request') };
    expect(
      await invoke(a, 'venue-chat', { action: 'send', venueId: venue[V], body: 'kimliksiz' }),
    ).toEqual(bad);
    expect(
      await invoke(a, 'venue-chat', {
        action: 'send',
        venueId: venue[V],
        body: 'ikisi',
        profiled: false,
        identity: 'anonymous',
      }),
    ).toEqual(bad);
    expect((await page(a)).messages).toEqual([]);
  });

  it('refuses a message sent with a stale identity and writes nothing (identity_mismatch)', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    expect(await send(a, 'profilli sandım', { identity: 'profiled' })).toEqual({
      status: 409,
      body: errorBody('identity_mismatch'),
    });
    expect((await setIdentity(a, false)).status).toBe(200);
    expect(await send(a, 'anonim sandım', { identity: 'anonymous' })).toEqual({
      status: 409,
      body: errorBody('identity_mismatch'),
    });
    expect((await page(a)).messages).toEqual([]);
  });

  it('gives one person’s identities different senderKeys, the same for one identity, no ids', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const c = await atVenue(PHONES[2], 'Cem');
    await setTestPhoto(a);
    expect(await send(a, 'bir')).toEqual(ok);
    expect(await send(a, 'iki')).toEqual(ok);
    expect(await send(c, 'cem')).toEqual(ok);
    expect((await setIdentity(a, false)).status).toBe(200);
    expect(await send(a, 'üç', { identity: 'profiled' })).toEqual(ok);

    const keys = Object.fromEntries((await page(b)).messages.map((m) => [m.body, m.senderKey]));
    expect(keys.bir).toEqual(expect.stringMatching(/^[0-9a-f]{24}$/));
    expect(keys.iki).toBe(keys.bir);
    expect(keys['üç']).not.toBe(keys.bir);
    expect(keys.cem).not.toBe(keys.bir);
    // The sender sees the same keys as the others.
    const own = Object.fromEntries((await page(a)).messages.map((m) => [m.body, m.senderKey]));
    expect(own).toEqual(keys);

    const { data: profile } = await a.from('profiles').select('public_id').single();
    const seen = JSON.stringify(await page(b));
    expect(seen).not.toContain(await userIdOf(a));
    expect(seen).not.toContain(profile?.public_id ?? 'missing');
  });

  it('deletes one’s own message for everyone, and only one’s own', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const mine = (await send(a, 'sileceğim')).body as { messageId: string };
    const theirs = (await send(b, 'kalır')).body as { messageId: string };

    expect(await invoke(b, 'venue-chat', { action: 'delete', messageId: mine.messageId })).toEqual({
      status: 404,
      body: errorBody('not_found'),
    });
    expect(await invoke(a, 'venue-chat', { action: 'delete', messageId: mine.messageId })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect(await invoke(a, 'venue-chat', { action: 'delete', messageId: mine.messageId })).toEqual({
      status: 404,
      body: errorBody('not_found'),
    });
    for (const client of [a, b]) {
      expect((await page(client)).messages.map((m) => m.body)).toEqual(['kalır']);
      const direct = await client.rpc('venue_chat_page', { target_venue_id: venue[V] ?? '' });
      expect((direct.data ?? []).map((m) => m.body)).toEqual(['kalır']);
    }
    // A deleted message cannot be replied to, reacted to or muted.
    expect((await send(b, 'yanıt', { replyTo: mine.messageId })).body).toEqual(
      errorBody('reply_unavailable'),
    );
    expect(
      (await invoke(b, 'venue-chat', { action: 'mute', messageId: mine.messageId })).status,
    ).toBe(404);
    expect(theirs.messageId).toEqual(expect.any(String));
  });

  it('keeps a report copy made before the delete; a later report copies nothing deleted', async () => {
    await sql`delete from public.reports where target_type = 'venue_chat'`;
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const c = await atVenue(PHONES[2], 'Cem');
    const mine = (await send(a, 'sileceğim')).body as { messageId: string };
    const theirs = (await send(c, 'kalır')).body as { messageId: string };
    const report = (client: Client, messageId: string) =>
      invoke(client, 'safety', {
        action: 'report',
        target: 'venue_chat',
        messageId,
        reason: 'spam',
      });
    expect((await report(b, mine.messageId)).status).toBe(200);
    expect(
      (await invoke(a, 'venue-chat', { action: 'delete', messageId: mine.messageId })).status,
    ).toBe(200);
    expect((await report(b, theirs.messageId)).status).toBe(200);
    const copies = await sql`
      select venue_chat_message_id, messages_snapshot from public.reports
      where target_type = 'venue_chat' order by created_at
    `;
    const bodies = copies.map((r) =>
      (r.messages_snapshot as { body: string }[]).map((m) => m.body),
    );
    expect(copies.map((r) => r.venue_chat_message_id)).toEqual([mine.messageId, theirs.messageId]);
    expect(bodies).toEqual([['sileceğim', 'kalır'], ['kalır']]);
  });

  it('mutes one identity: the muter stops seeing it, the other identity and everyone else go on', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const c = await atVenue(PHONES[2], 'Cem');
    await setTestPhoto(a);
    const { capsule_nick: nick } = await capsuleOf(a);
    const anon = (await send(a, 'anonim bir')).body as { messageId: string };

    const muted = await invoke(b, 'venue-chat', { action: 'mute', messageId: anon.messageId });
    expect(muted).toEqual({ status: 200, body: { muteId: expect.any(String) } });
    // Twice is one mute.
    expect(await invoke(b, 'venue-chat', { action: 'mute', messageId: anon.messageId })).toEqual(
      muted,
    );
    expect(await send(a, 'anonim iki')).toEqual(ok);
    expect((await setIdentity(a, false)).status).toBe(200);
    expect(await send(a, 'adımla', { identity: 'profiled' })).toEqual(ok);

    // The profiled identity is not muted (rule 4: muting one would tie the two).
    expect((await page(b)).messages.map((m) => m.body)).toEqual(['adımla']);
    expect((await page(c)).messages.map((m) => m.body)).toEqual([
      'adımla',
      'anonim iki',
      'anonim bir',
    ]);
    // The muted person sees nothing of it.
    const asSender = JSON.stringify(await page(a));
    expect(asSender).not.toContain((muted.body as { muteId: string }).muteId);
    expect((await page(a)).messages).toHaveLength(3);

    const list = await invoke(b, 'venue-chat', { action: 'mutes' });
    expect(list.body).toEqual({
      mutes: [
        {
          id: (muted.body as { muteId: string }).muteId,
          label: nick,
          profiled: false,
          createdAt: expect.any(String),
        },
      ],
    });
    const listed = JSON.stringify(list.body);
    expect(listed).not.toContain(await userIdOf(a));

    // Muting oneself is refused; unmuting brings the messages back; another's mute id does nothing.
    const own = (await send(b, 'kendim')).body as { messageId: string };
    expect(
      (await invoke(b, 'venue-chat', { action: 'mute', messageId: own.messageId })).status,
    ).toBe(400);
    const muteId = (muted.body as { muteId: string }).muteId;
    expect(await invoke(c, 'venue-chat', { action: 'unmute', muteId })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect(
      ((await invoke(b, 'venue-chat', { action: 'mutes' })).body as VenueChatMutesResponse).mutes,
    ).toHaveLength(1);
    expect(await invoke(b, 'venue-chat', { action: 'unmute', muteId })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect((await page(b)).messages.map((m) => m.body)).toEqual([
      'kendim',
      'adımla',
      'anonim iki',
      'anonim bir',
    ]);
  });
});

describe('a table seat and a room message keep the identity they were written with (K-10)', () => {
  it('writes the anonymous seat’s look and the message’s identity, nothing for a profiled one', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const { capsule_look: look } = await capsuleOf(a);
    // "Masa kur" seats the owner with the check-in's identity (anonymous by default, step 4.5).
    const created = await invoke(a, 'rooms', { action: 'create' });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;
    const sent = await invoke(a, 'chat', { action: 'send', roomId, body: 'merhaba' });
    expect(sent.status, JSON.stringify(sent.body)).toBe(200);
    await sql`update public.profiles set capsule_look = ${anotherLook(look)}
              where id = ${await userIdOf(a)}`;
    const [seat] = await sql`select look from public.room_members where room_id = ${roomId}`;
    const [message] = await sql`
      select profiled, sender_look from public.messages where room_id = ${roomId}
    `;
    expect(seat?.look).toBe(look);
    expect(message).toEqual({ profiled: false, sender_look: look });

    // A man sits profiled (rule 12): his seat and message carry no look.
    const b = await onboarded(PHONES[1], { displayName: 'Burak', gender: 'male' });
    await setTestPhoto(b);
    await checkInAt(b, venue, V);
    const own = await invoke(b, 'rooms', { action: 'create' });
    expect(own.status, JSON.stringify(own.body)).toBe(200);
    const ownId = (own.body as { roomId: string }).roomId;
    expect(
      (await invoke(b, 'chat', { action: 'send', roomId: ownId, body: 'adımla' })).status,
    ).toBe(200);
    const [profiledSeat] = await sql`select look from public.room_members where room_id = ${ownId}`;
    const [profiledMessage] = await sql`
      select profiled, sender_look from public.messages where room_id = ${ownId}
    `;
    expect(profiledSeat?.look).toBeNull();
    expect(profiledMessage).toEqual({ profiled: true, sender_look: null });
  });
  // §4.M: what the other table gets of a message and a seat (the Postgres Changes payload, the rows
  // and room_phones) carries the identity it was written with, never an account or profile id.
  it('gives the other table the identity, never an account or profile id', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const created = await invoke(a, 'rooms', { action: 'create', profiled: false });
    const roomId = (created.body as { roomId: string }).roomId;
    expect(
      (await invoke(b, 'rooms', { action: 'request-join', roomId, profiled: false })).status,
    ).toBe(200);
    const [request] =
      await sql`select id from public.join_requests where room_id = ${roomId} and status = 'pending'`;
    expect(
      (await invoke(a, 'rooms', { action: 'respond', requestId: request?.id, accept: true }))
        .status,
    ).toBe(200);

    const payloads: unknown[] = [];
    const channel = b.channel(`messages:${roomId}`, { config: { private: true } });
    const live = new Promise<void>((resolve) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
          (payload) => payloads.push(payload.new),
        )
        // Postgres Changes are live once the server confirms the database subscription.
        .on('system', {}, (payload: { extension?: string; status?: string }) => {
          if (payload.extension === 'postgres_changes' && payload.status === 'ok') resolve();
        })
        .subscribe();
    });
    await live;
    expect((await invoke(a, 'chat', { action: 'send', roomId, body: 'merhaba' })).status).toBe(200);
    await expect.poll(() => payloads.length, { timeout: 10_000 }).toBeGreaterThan(0);
    await b.removeChannel(channel);

    const rows = await b
      .from('messages')
      .select('id, session_id, sender_alias, body, profiled, sender_look, created_at')
      .eq('room_id', roomId);
    expect(rows.error).toBeNull();
    const phones = await b.rpc('room_phones', { target_room_id: roomId });
    expect(phones.error).toBeNull();
    const seen = JSON.stringify({ payloads, rows: rows.data, phones: phones.data });
    expect(seen).toContain((await capsuleOf(a)).capsule_look ?? 'missing');
    const { data: own } = await a.from('profiles').select('public_id').single();
    for (const value of [await userIdOf(a), own?.public_id ?? 'missing']) {
      expect(seen).not.toContain(value);
    }
  });
});

describe('today’s app (`profiled` with every message, §22.G)', () => {
  it('picks the mode with the first message as the one change, then locks it', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    expect((await page(a)).mode).toBeNull();
    expect(await send(a, 'adımla', { profiled: true })).toEqual(ok);
    expect(await page(a)).toMatchObject({
      mode: 'profiled',
      identity: { mode: 'profiled', switchUsed: true },
    });
    expect(await send(a, 'anonim olmaz', { profiled: false })).toEqual({
      status: 409,
      body: errorBody('venue_chat_mode_locked'),
    });
    // The same mode as the check-in's identity uses no change.
    const b = await atVenue(PHONES[1], 'Burak');
    expect(await send(b, 'anonim', { profiled: false })).toEqual(ok);
    expect(await page(b)).toMatchObject({
      mode: 'anonymous',
      identity: { mode: 'anonymous', switchUsed: false },
    });
  });
});
