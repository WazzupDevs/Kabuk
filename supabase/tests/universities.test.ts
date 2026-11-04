// Universities with several campuses (docs/SPEC_V4.md §4.Q): a university is a grouping, never a
// place. Each campus is its own venue (venue_id, boundary, lobby, chat); check-in is verified only
// against the chosen campus, with the same 50 m tolerance. Fixture universities and campuses, not
// real ones (İstanbul Gelişim Üniversitesi has no verified campus yet: docs/yerleske/igu-dogrulama.md).
import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { campusSql, universitiesSql } from '../../scripts/seed/sections.ts';
import { BOUNDARY_TOLERANCE_M } from '../functions/_shared/pure/checkin.ts';
import { CURRENT_LOCATION_CONSENT_VERSION } from '../functions/_shared/pure/consent.ts';
import type { VenueChatPageResponse } from '../functions/_shared/pure/api/venueChat.ts';
import { EVENT_WINDOW_DAYS } from '../functions/_shared/pure/explore.ts';
import { VENUE_CHAT_BROADCAST, venueChatChannel } from '../functions/_shared/pure/venueChat.ts';
import {
  CAMPUS_CENTER,
  CAMPUS_HALF_M,
  deleteFixtureCampus,
  deleteFixtureVenues,
  FIXTURE_CAMPUS,
  type FixtureCampus,
  insertFixtureCampus,
  insertFixtureVenues,
  offset,
  squareRing,
} from './fixtures/venues.ts';
import { errorBody, onboarded, PHONES, venueChatIdentity, waitForBroadcast } from './helpers.ts';
import { type Client, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

const UNI = { ref: 'fixture-uni', name: 'Test Üniversitesi', city: 'Sakarya', isActive: true };
const OFF_UNI = {
  ref: 'fixture-uni-off',
  name: 'Kapalı Test Üniversitesi',
  city: 'Sakarya',
  isActive: false,
};

// Two campuses of one university, 80 m apart at their nearest edges: a point between them is within
// the 50 m tolerance of both (adjacent buildings), the case §4.Q keeps apart by venue_id.
const WEST_CENTER = offset(CAMPUS_CENTER, 20_000, 270);
const EAST_CENTER = offset(WEST_CENTER, 2 * CAMPUS_HALF_M + 80, 90);
const FAR_CENTER = offset(WEST_CENTER, 3000, 180);

const WEST = {
  ...FIXTURE_CAMPUS,
  ref: 'fixture-uni-west',
  name: 'Test Üniversitesi Batı Yerleşkesi',
  university: UNI.ref,
  boundary: squareRing(WEST_CENTER, CAMPUS_HALF_M),
  spots: [],
};
const EAST = {
  ...WEST,
  ref: 'fixture-uni-east',
  name: 'Test Üniversitesi Doğu Yerleşkesi',
  boundary: squareRing(EAST_CENTER, CAMPUS_HALF_M),
};
const UNVERIFIED = {
  ...WEST,
  ref: 'fixture-uni-unverified',
  name: 'Test Üniversitesi Doğrulanmamış Yerleşke',
  isActive: false,
  boundary: squareRing(FAR_CENTER, CAMPUS_HALF_M),
};
const OFF_CAMPUS = {
  ...WEST,
  ref: 'fixture-uni-off-campus',
  name: 'Kapalı Üniversite Yerleşkesi',
  university: OFF_UNI.ref,
  boundary: squareRing(offset(FAR_CENTER, 3000, 180), CAMPUS_HALF_M),
};

let west: FixtureCampus;
let east: FixtureCampus;
let unverified: FixtureCampus;
let offCampus: FixtureCampus;
let plain: FixtureCampus;
let cafes: Record<string, string> = {};

beforeAll(async () => {
  await deleteFixtureCampus(sql);
  await deleteFixtureVenues(sql);
  // Through the seed's own SQL, as `pnpm seed` writes it.
  await sql.unsafe(universitiesSql([UNI, OFF_UNI]));
  west = await insertFixtureCampus(sql, WEST);
  east = await insertFixtureCampus(sql, EAST);
  unverified = await insertFixtureCampus(sql, UNVERIFIED);
  offCampus = await insertFixtureCampus(sql, OFF_CAMPUS);
  // A campus on its own, like Sakarya Esentepe before universities existed.
  plain = await insertFixtureCampus(sql);
  cafes = await insertFixtureVenues(sql);
});

afterEach(async () => {
  for (const phone of PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureCampus(sql);
  await deleteFixtureVenues(sql);
  await sql.end();
});

function checkIn(client: Client, venueId: string, at: { lat: number; lng: number }) {
  return invoke(client, 'checkin', {
    action: 'check-in',
    venueId,
    lat: at.lat,
    lng: at.lng,
    accuracyM: 20,
    locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    requestId: randomUUID(),
  });
}

async function explore(client: Client) {
  const { data, error } = await client.rpc('explore_venues', { event_days: EVENT_WINDOW_DAYS });
  expect(error).toBeNull();
  return data ?? [];
}

describe('universities and campuses', () => {
  it('lists each active campus with its university, and nothing for the university itself', async () => {
    const rows = await explore(await onboarded(PHONES[0]));
    const ofUni = rows.filter((r) => r.university_ref === UNI.ref);
    expect(ofUni.map((r) => r.venue_id).sort()).toEqual([west.venueId, east.venueId].sort());
    for (const r of ofUni) {
      expect(r.kind).toBe('campus');
      expect(r.university_name).toBe(UNI.name);
      expect(r.boundary).not.toBeNull();
    }
    // An unverified (inactive) campus and every campus of an inactive university stay out.
    const ids = rows.map((r) => r.venue_id);
    expect(ids).not.toContain(unverified.venueId);
    expect(ids).not.toContain(offCampus.venueId);
    // A campus on its own and the cafes, as before.
    const own = rows.find((r) => r.venue_id === plain.venueId);
    expect(own?.university_id).toBeNull();
    const cafe = rows.find((r) => r.venue_id === cafes['at-anchor']);
    expect(cafe?.kind).toBe('cafe');
    expect(cafe?.university_id).toBeNull();
  });

  it('reads universities but never writes them from the app', async () => {
    const client = await onboarded(PHONES[0]);
    const read = await client.from('universities').select('ref, name, city').eq('ref', UNI.ref);
    expect(read.error).toBeNull();
    expect(read.data).toEqual([{ ref: UNI.ref, name: UNI.name, city: UNI.city }]);
    const insert = await client
      .from('universities')
      .insert({ ref: 'fixture-x', name: 'X', city: 'X' });
    expect(insert.error).not.toBeNull();
    // Update and delete are refused too (no write grant, no write policy): the row stays.
    await client.from('universities').update({ name: 'Değişti' }).eq('ref', UNI.ref);
    await client.from('universities').delete().eq('ref', UNI.ref);
    const [row] = await sql<{ name: string }[]>`
      select name from public.universities where ref = ${UNI.ref}
    `;
    expect(row?.name).toBe(UNI.name);
    const [x] = await sql<{ n: number }[]>`
      select count(*)::int as n from public.universities where ref = 'fixture-x'
    `;
    expect(x?.n).toBe(0);
  });

  it('keeps a university off every cafe (only a campus has one)', async () => {
    const [u] = await sql<
      { id: string }[]
    >`select id from public.universities where ref = ${UNI.ref}`;
    await expect(
      sql`update public.venues set university_id = ${u?.id ?? ''} where id = ${cafes['at-anchor'] ?? ''}`,
    ).rejects.toThrow(/venues_university_campus/);
  });

  it('checks in at the chosen campus inside its boundary and refuses outside it', async () => {
    expect(BOUNDARY_TOLERANCE_M).toBe(50);
    const client = await onboarded(PHONES[0]);
    expect((await checkIn(client, west.venueId, WEST_CENTER)).status).toBe(200);
    const outside = offset(WEST_CENTER, CAMPUS_HALF_M + 60, 0);
    expect(await checkIn(client, west.venueId, outside)).toEqual({
      status: 403,
      body: errorBody('too_far'),
    });
  });

  it('refuses the wrong campus: standing on one campus does not open the other', async () => {
    const client = await onboarded(PHONES[0]);
    // On the east campus, checking in to the west one: 80 m + its whole width away.
    expect(await checkIn(client, west.venueId, EAST_CENTER)).toEqual({
      status: 403,
      body: errorBody('too_far'),
    });
    // The far one: the same university is no shortcut.
    expect(await checkIn(client, east.venueId, FAR_CENTER)).toEqual({
      status: 403,
      body: errorBody('too_far'),
    });
  });

  it('refuses an unverified campus and a campus of an inactive university, even inside', async () => {
    const client = await onboarded(PHONES[0]);
    expect(await checkIn(client, unverified.venueId, FAR_CENTER)).toEqual({
      status: 404,
      body: errorBody('venue_not_found'),
    });
    expect(await checkIn(client, offCampus.venueId, offset(FAR_CENTER, 3000, 180))).toEqual({
      status: 404,
      body: errorBody('venue_not_found'),
    });
  });

  it('keeps adjacent campuses apart: the overlap admits either, each to its own lobby', async () => {
    // 40 m east of the west campus, 40 m west of the east one: within the tolerance of both.
    const between = offset(WEST_CENTER, CAMPUS_HALF_M + 40, 90);
    const a = await onboarded(PHONES[0]);
    const b = await onboarded(PHONES[1]);
    expect((await checkIn(a, west.venueId, between)).status).toBe(200);
    expect((await checkIn(b, east.venueId, between)).status).toBe(200);
    const c = await onboarded(PHONES[2]);
    expect((await checkIn(c, west.venueId, between)).status).toBe(200);
    // Each check-in is to the campus chosen, never to its neighbour.
    const sessions = await sql<{ user_id: string; venue_id: string }[]>`
      select user_id, venue_id from public.table_sessions
      where user_id = any(${[await userIdOf(a), await userIdOf(b)]}) and status = 'active'
    `;
    expect(Object.fromEntries(sessions.map((r) => [r.user_id, r.venue_id]))).toEqual({
      [await userIdOf(a)]: west.venueId,
      [await userIdOf(b)]: east.venueId,
    });
    const created = await invoke(a, 'rooms', { action: 'create' });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;
    // C, at the west campus, sees A's table; B, at the east one, sees it in neither lobby.
    const west_ = await c.rpc('venue_tables', { target_venue_id: west.venueId });
    expect(west_.error).toBeNull();
    expect((west_.data ?? []).map((r) => r.room_id)).toEqual([roomId]);
    const fromEast = await b.rpc('venue_tables', { target_venue_id: west.venueId });
    expect((fromEast.data ?? []).map((r) => r.room_id)).not.toContain(roomId);
    const own = await b.rpc('venue_tables', { target_venue_id: east.venueId });
    expect(own.error).toBeNull();
    expect((own.data ?? []).map((r) => r.room_id)).not.toContain(roomId);
  });

  it('never stores the position: a check-in row has no coordinate column', async () => {
    const columns = await sql<{ column_name: string; data_type: string; udt_name: string }[]>`
      select column_name, data_type, udt_name from information_schema.columns
      where table_schema = 'public' and table_name = 'table_sessions'
    `;
    const names = columns.map((c) => c.column_name);
    for (const banned of ['lat', 'lng', 'latitude', 'longitude', 'location', 'position']) {
      expect(names).not.toContain(banned);
    }
    expect(columns.some((c) => c.udt_name === 'geography' || c.udt_name === 'geometry')).toBe(
      false,
    );
  });

  it('keeps the seed idempotent: running the university and campus SQL again changes no id', async () => {
    await sql.unsafe(universitiesSql([UNI, OFF_UNI]));
    await sql.unsafe(campusSql([WEST]));
    const [row] = await sql<{ id: string }[]>`
      select id from public.venues where source = 'campus' and source_ref = ${WEST.ref}
    `;
    expect(row?.id).toBe(west.venueId);
  });
});

// One venue chat per university (docs/SPEC_V4.md §4.Q, 4 Kasım): every campus of a university reads
// and writes the same chat; nothing a reader gets says which campus a sender is at.
describe('the university venue chat', () => {
  async function sendAt(client: Client, venueId: string, body: string, replyTo?: string) {
    await sql`update public.venue_chat_rate set last_sent_at = '-infinity'`;
    const res = await invoke(client, 'venue-chat', {
      action: 'send',
      venueId,
      body,
      identity: await venueChatIdentity(client, false),
      ...(replyTo ? { replyTo } : {}),
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return (res.body as { messageId: string }).messageId;
  }

  async function pageAt(client: Client, venueId: string) {
    const res = await invoke(client, 'venue-chat', { action: 'page', venueId });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return (res.body as VenueChatPageResponse).messages;
  }

  afterEach(async () => {
    await sql`delete from public.venue_chat_messages where venue_id = any(${[
      west.venueId,
      east.venueId,
      plain.venueId,
    ]})`;
  });

  it('shares one chat between the campuses of a university, and only them', async () => {
    const a = await onboarded(PHONES[0]);
    const b = await onboarded(PHONES[1]);
    const c = await onboarded(PHONES[2]);
    expect((await checkIn(a, west.venueId, WEST_CENTER)).status).toBe(200);
    expect((await checkIn(b, east.venueId, EAST_CENTER)).status).toBe(200);
    // A campus on its own keeps its own chat.
    expect((await checkIn(c, plain.venueId, CAMPUS_CENTER)).status).toBe(200);

    const fromWest = await sendAt(a, west.venueId, 'batıdan merhaba');
    const fromEast = await sendAt(b, east.venueId, 'doğudan selam', fromWest);

    const seenByA = await pageAt(a, west.venueId);
    const seenByB = await pageAt(b, east.venueId);
    expect(seenByA.map((m) => m.id).sort()).toEqual([fromWest, fromEast].sort());
    expect(seenByB.map((m) => m.id).sort()).toEqual([fromWest, fromEast].sort());
    // The reply across campuses keeps its quote.
    expect(seenByA.find((m) => m.id === fromEast)?.replyTo).toMatchObject({ id: fromWest });
    // One sender, one key, whichever campus reads.
    const keyFromA = seenByA.find((m) => m.id === fromWest)?.senderKey;
    expect(seenByB.find((m) => m.id === fromWest)?.senderKey).toBe(keyFromA);
    // No campus in what a reader gets.
    for (const m of seenByB) {
      expect(JSON.stringify(m)).not.toContain(west.venueId);
      expect(JSON.stringify(m)).not.toContain(WEST.name);
    }
    expect(await pageAt(c, plain.venueId)).toEqual([]);
    // The other way round: the campus on its own is not read from the university's campuses.
    await sendAt(c, plain.venueId, 'tek kampüs');
    expect((await pageAt(a, west.venueId)).map((m) => m.body)).not.toContain('tek kampüs');
  });

  it('refuses the chat of a university without a check-in at one of its campuses', async () => {
    const outsider = await onboarded(PHONES[2]);
    expect((await checkIn(outsider, plain.venueId, CAMPUS_CENTER)).status).toBe(200);
    // Asking for a campus of another university shows nothing and cannot write.
    expect(await pageAt(outsider, west.venueId)).toEqual([]);
    await sql`update public.venue_chat_rate set last_sent_at = '-infinity'`;
    const res = await invoke(outsider, 'venue-chat', {
      action: 'send',
      venueId: west.venueId,
      body: 'içeri girmeden',
      identity: 'anonymous',
    });
    expect(res.status).not.toBe(200);
  });

  it('carries the university, never a campus, in a request from the chat', async () => {
    const a = await onboarded(PHONES[0], { displayName: 'Ayşe' });
    const b = await onboarded(PHONES[1], { displayName: 'Burak' });
    expect((await checkIn(a, west.venueId, WEST_CENTER)).status).toBe(200);
    expect((await checkIn(b, east.venueId, EAST_CENTER)).status).toBe(200);
    await sql`update public.venue_chat_rate set last_sent_at = '-infinity'`;
    const sent = await invoke(a, 'venue-chat', {
      action: 'send',
      venueId: west.venueId,
      body: 'profilimle merhaba',
      identity: await venueChatIdentity(a, true),
    });
    expect(sent.status, JSON.stringify(sent.body)).toBe(200);
    const messageId = (sent.body as { messageId: string }).messageId;
    const req = await invoke(b, 'friends', { action: 'request', venueChatMessageId: messageId });
    expect(req.status, JSON.stringify(req.body)).toBe(200);
    const mine = JSON.stringify((await b.rpc('my_sent_venue_chat_requests')).data);
    const incoming = JSON.stringify((await invoke(a, 'friends', { action: 'incoming' })).body);
    for (const seen of [mine, incoming]) {
      expect(seen).not.toContain(WEST.name);
      expect(seen).not.toContain(EAST.name);
    }
    expect(incoming).toContain(UNI.name);
  });

  it("lets a phone listen on its own campus's topic only", async () => {
    const b = await onboarded(PHONES[1]);
    expect((await checkIn(b, east.venueId, EAST_CENTER)).status).toBe(200);
    const other = waitForBroadcast(b, venueChatChannel(west.venueId), VENUE_CHAT_BROADCAST, 3000);
    await expect(other.subscribed).rejects.toThrow(/CHANNEL_ERROR|TIMED_OUT/);
    other.received.catch(() => undefined);
    await other.close();
  });

  it('tells every campus of the university of a new message', async () => {
    const a = await onboarded(PHONES[0]);
    const b = await onboarded(PHONES[1]);
    expect((await checkIn(a, west.venueId, WEST_CENTER)).status).toBe(200);
    expect((await checkIn(b, east.venueId, EAST_CENTER)).status).toBe(200);
    // B listens on its own campus's topic, as the app does.
    const heard = waitForBroadcast(b, venueChatChannel(east.venueId), VENUE_CHAT_BROADCAST);
    await heard.subscribed;
    await sendAt(a, west.venueId, 'duyan var mı');
    await heard.received;
    await heard.close();
  });
});
