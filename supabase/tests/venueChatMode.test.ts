// Faz 2 step 22.1 (docs/SPEC_V3.md §22.G, §22.M): the venue chat mode is chosen once per check-in
// with the first message and never changes (decision 7); "Profilimle" needs a visible profile photo
// at the moment of the choice, in the venue chat and for rooms (decision 8). Each rule is checked
// from both sides: what is refused, and that nothing is written when it is.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { VenueChatPageResponse } from '../functions/_shared/pure/api/venueChat.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { checkInAt, errorBody, onboarded, PHONES, setTestPhoto } from './helpers.ts';
import { type Client, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

let venue: Record<string, string> = {};
const V = 'at-anchor';
const LOCKED = { status: 409, body: errorBody('venue_chat_mode_locked') };
const NO_PHOTO = { status: 409, body: errorBody('photo_required') };

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

async function atVenue(phone: string, name: string): Promise<Client> {
  const client = (await onboarded(phone, { displayName: name })) as Client;
  await checkInAt(client, venue, V);
  return client;
}

// Sends without waiting out the 3-second limit (venueChat.test.ts checks the limit).
async function send(client: Client, body: string, profiled: boolean) {
  await sql`update public.venue_chat_rate set last_sent_at = '-infinity'`;
  return invoke(client, 'venue-chat', { action: 'send', venueId: venue[V], body, profiled });
}

async function page(client: Client): Promise<VenueChatPageResponse> {
  const res = await invoke(client, 'venue-chat', { action: 'page', venueId: venue[V] });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as VenueChatPageResponse;
}

async function storedMode(client: Client): Promise<boolean | null | undefined> {
  const [row] = await sql`
    select venue_chat_profiled from public.table_sessions
    where user_id = ${await userIdOf(client)} and status = 'active'
  `;
  return row?.venue_chat_profiled as boolean | null | undefined;
}

async function messageCount(client: Client): Promise<number> {
  const [row] = await sql`
    select count(*)::int as n from public.venue_chat_messages
    where sender_user_id = ${await userIdOf(client)}
  `;
  return row?.n as number;
}

const ok = expect.objectContaining({ status: 200 });

describe('venue chat mode: once per check-in (decision 7)', () => {
  it('is unchosen until the first message, then fixed; the other mode is refused, not switched', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    expect((await page(a)).mode).toBeNull();
    expect(await storedMode(a)).toBeNull();

    expect(await send(a, 'anonim', false)).toEqual(ok);
    expect((await page(a)).mode).toBe('anonymous');
    expect(await send(a, 'profilli olmaz', true)).toEqual(LOCKED);
    expect(await send(a, 'yine anonim', false)).toEqual(ok);
    // The refused message is nowhere; the mode is still the first one.
    expect((await page(a)).messages.map((m) => [m.body, m.profiled])).toEqual([
      ['yine anonim', false],
      ['anonim', false],
    ]);
    expect(await storedMode(a)).toBe(false);
  });

  it('fixes a profiled first message just the same', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    expect(await send(a, 'adımla', true)).toEqual(ok);
    expect((await page(a)).mode).toBe('profiled');
    expect(await send(a, 'anonim olmaz', false)).toEqual(LOCKED);
    expect(await messageCount(a)).toBe(1);
  });

  it('starts unchosen again at a new check-in', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    expect(await send(a, 'anonim', false)).toEqual(ok);
    await setTestPhoto(a);
    await checkInAt(a, venue, V);
    expect((await page(a)).mode).toBeNull();
    expect(await send(a, 'şimdi adımla', true)).toEqual(ok);
    expect((await page(a)).mode).toBe('profiled');

    await invoke(a, 'checkin', { action: 'leave' });
    await checkInAt(a, venue, V);
    expect(await send(a, 'şimdi yine anonim', false)).toEqual(ok);
    expect((await page(a)).mode).toBe('anonymous');
  });

  it('does not choose with a refused message', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    // Refused in the function (profanity, length) and in the database (rate limit).
    expect((await send(a, 'amk bu ne', false)).status).toBe(422);
    expect((await send(a, '   ', false)).status).toBe(400);
    expect(await storedMode(a)).toBeNull();
    expect(await send(a, 'ilk', false)).toEqual(ok);
    expect(await storedMode(a)).toBe(false);
    await checkInAt(a, venue, V);
    await sql`
      update public.venue_chat_rate
      set window_started_at = now(), count = 1000, last_sent_at = '-infinity'
    `;
    expect((await send(a, 'sınırda', true)).status).toBe(429);
    expect(await storedMode(a)).toBeNull();
    expect((await page(a)).mode).toBeNull();
  });

  it('gives no mode without a live table at the venue, and only the caller its own', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    expect(await send(a, 'anonim', false)).toEqual(ok);
    expect((await page(b)).mode).toBeNull();
    await invoke(a, 'checkin', { action: 'leave' });
    expect(await page(a)).toEqual({ messages: [], mode: null });
  });
});

describe('"Profilimle" needs a profile photo (decision 8)', () => {
  it('refuses a profiled first venue chat message without a photo and writes nothing', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    expect(await send(a, 'adımla', true)).toEqual(NO_PHOTO);
    expect(await messageCount(a)).toBe(0);
    expect(await storedMode(a)).toBeNull();
    // Anonymous needs nothing.
    expect(await send(a, 'anonim', false)).toEqual(ok);
  });

  it('refuses a hidden photo like none', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    await sql`update public.profiles set photo_hidden_at = now() where id = ${await userIdOf(a)}`;
    expect(await send(a, 'adımla', true)).toEqual(NO_PHOTO);
    expect(await messageCount(a)).toBe(0);
  });

  it('checks only at the choice: a profiled table keeps writing after the photo goes', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    await setTestPhoto(a);
    expect(await send(a, 'adımla', true)).toEqual(ok);
    expect(await invoke(a, 'profile', { action: 'photo-remove' })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect(await send(a, 'hâlâ adımla', true)).toEqual(ok);
  });

  it('refuses a profiled room and a profiled request without a photo; anonymous needs none', async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const roomsOf = async (client: Client) =>
      sql`
        select r.id from public.rooms r
        join public.table_sessions ts on ts.id = r.owner_session_id
        where ts.user_id = ${await userIdOf(client)}
      `;

    expect(await invoke(a, 'rooms', { action: 'create', profiled: true })).toEqual(NO_PHOTO);
    expect(await roomsOf(a)).toHaveLength(0);
    await setTestPhoto(a);
    await sql`update public.profiles set photo_hidden_at = now() where id = ${await userIdOf(a)}`;
    expect(await invoke(a, 'rooms', { action: 'create', profiled: true })).toEqual(NO_PHOTO);
    expect(await roomsOf(a)).toHaveLength(0);
    await setTestPhoto(a);
    const created = await invoke(a, 'rooms', { action: 'create', profiled: true });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;

    const request = (profiled: boolean) =>
      invoke(b, 'rooms', { action: 'request-join', roomId, profiled });
    expect(await request(true)).toEqual(NO_PHOTO);
    expect(await sql`select 1 from public.join_requests where room_id = ${roomId}`).toHaveLength(0);
    expect((await request(false)).status).toBe(200);

    // Anonymous rooms never ask for a photo.
    await invoke(a, 'rooms', { action: 'end' });
    const c = await atVenue(PHONES[2], 'Cem');
    expect((await invoke(c, 'rooms', { action: 'create', profiled: false })).status).toBe(200);
  });
});
