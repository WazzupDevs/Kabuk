// Faz 4 step 4.5 (docs/SPEC_V4.md §4.E, §4.K, §4.M "Adım 4.5"; the plan:
// docs/decisions/4.5-masa-modeli.md): the table of people. A check-in opens no table; a table is
// its people, at most 12; "Katıl" moves a whole table, "Bu masadayım" brings one person; leaving
// hands the table over (K-13); pairs get their records (K-66). Also the table's name and icon
// (K-45, K-59) and taking back the silent "Arkadaş ekle" (K-67, K-70).
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { deleteAccount } from '../../scripts/admin/account.ts';
import { ROOM_IDLE_MINUTES, venueChannel } from '../functions/_shared/pure/rooms.ts';
import { TABLE_ICONS } from '../functions/_shared/pure/tableIcons.ts';
import { MAX_TABLE_PHONES } from '../functions/_shared/pure/tables.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, setTestPhoto, waitForBroadcast, waitUntilBlocked } from './helpers.ts';
import { admin, dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
  accept,
  ask,
  backdate,
  checkIn,
  leave,
  openTable,
  type Person,
  person,
  roomRow,
  rooms,
  seated,
  sit,
  TABLE_PHONES,
  tableWith,
} from './people.ts';

let venue: Record<string, string> = {};
const ICON_IDS = TABLE_ICONS.map((i) => i.id);
const UPDATE_REQUIRED = { status: 426, body: errorBody('update_required') };

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  await sql`update public.table_icons set is_active = true`;
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const at = (n: number, opts: Parameters<typeof person>[2] = {}) => person(venue, n, opts);
// `count` people, as a tuple of that length.
type People<N extends number, R extends Person[] = []> = R['length'] extends N
  ? R
  : People<N, [...R, Person]>;
const all = <N extends number>(count: N) =>
  Promise.all(Array.from({ length: count }, (_, n) => at(n))) as Promise<People<N>>;

async function myRequests(p: Person) {
  const { data, error } = await p.client.from('my_join_requests').select('*').order('created_at');
  expect(error).toBeNull();
  return data ?? [];
}

async function tables(p: Person) {
  const { data, error } = await p.client.rpc('venue_tables', {
    target_venue_id: venue['at-anchor'] ?? '',
  });
  expect(error).toBeNull();
  return data ?? [];
}

async function nickOf(p: Person): Promise<string> {
  const [row] = await sql`select capsule_nick from public.profiles where id = ${p.userId}`;
  return row?.capsule_nick as string;
}

async function expireRequests(roomId: string) {
  await sql`update public.join_requests set expires_at = now() - interval '1 second' where room_id = ${roomId}`;
}

// The table's phone count is its people's; its owner is one of them.
async function expectConsistent(roomId: string): Promise<void> {
  const r = await roomRow(roomId);
  const here = await seated(roomId);
  if (r.status === 'closed') {
    expect(here).toEqual([]);
    expect(r.phones).toBe(0);
    return;
  }
  expect(r.phones).toBe(here.length);
  expect(here.map((x) => x.session_id)).toContain(r.owner_session_id);
  expect(here.every((x) => x.side === null)).toBe(true);
}

const block = (p: Person, roomId: string, target?: Person) =>
  invoke(p.client, 'safety', {
    action: 'block',
    roomId,
    ...(target ? { sessionId: target.sessionId } : {}),
  });

describe('check-in without a table (§4.E)', () => {
  it('opens no table, writes no alias or headcount, and lets two check-ins at a venue be', async () => {
    const [a, b] = await all(2);
    const rows = await sql`
      select alias, headcount from public.table_sessions
      where id in (${a.sessionId}, ${b.sessionId})
    `;
    expect(rows).toEqual([
      { alias: null, headcount: null },
      { alias: null, headcount: null },
    ]);
    expect(await sql`select 1 from public.room_members where session_id = ${a.sessionId}`).toEqual(
      [],
    );
    // Today's app still sends a headcount and `teams`: both are ignored.
    const again = await invoke(a.client, 'checkin', {
      action: 'check-in',
      venueId: venue['at-anchor'],
      lat: 0,
      lng: 0,
      accuracyM: 10,
      headcount: 3,
      teams: true,
      locationConsentVersion: 'x',
    });
    expect(again.status).not.toBe(400);
  });

  it("answers today's app's alias reroll update_required", async () => {
    const a = await at(0);
    expect(await invoke(a.client, 'checkin', { action: 'reroll-alias' })).toEqual(UPDATE_REQUIRED);
  });

  it('leaves the table at a new check-in: the table goes on with its earliest person (K-13)', async () => {
    const [owner, first, second] = await all(3);
    const roomId = await tableWith(owner, [first, second]);
    await checkIn(owner.client, venue);
    expect(await roomRow(roomId)).toMatchObject({
      status: 'active',
      owner_session_id: first.sessionId,
      phones: 2,
    });
    await expectConsistent(roomId);
  });
});

describe('"Masa kur" (§4.E)', () => {
  it('opens a table in the lobby or out of it, its owner seated with the check-in identity', async () => {
    const [a, b] = await all(2);
    const lobbyTable = await openTable(a);
    const privateTable = await openTable(b, { open: false });
    expect(await roomRow(lobbyTable)).toMatchObject({
      visibility: 'open',
      status: 'active',
      phones: 1,
    });
    expect((await roomRow(privateTable)).visibility).toBe('private');
    // An anonymous woman sits with her capsule nick; the table name is the old owner_alias.
    const [seat] = await seated(lobbyTable);
    expect(seat).toMatchObject({
      session_id: a.sessionId,
      alias: await nickOf(a),
      profiled: false,
    });
    const r = await roomRow(lobbyTable);
    expect(r.owner_alias).toBe(r.name);
    await expectConsistent(lobbyTable);

    expect(await rooms(a, { action: 'create' })).toEqual({
      status: 409,
      body: errorBody('already_in_table'),
    });
  });

  it('needs a check-in, a gender, and a photo for a profiled seat (rule 12, K-3, K-4)', async () => {
    const noCheckin = await at(0);
    await invoke(noCheckin.client, 'checkin', { action: 'leave' });
    expect(await rooms(noCheckin, { action: 'create' })).toEqual({
      status: 409,
      body: errorBody('no_active_table'),
    });

    // A man always sits profiled: with no photo he cannot sit down.
    const man = await at(1, { gender: 'male' });
    expect(await rooms(man, { action: 'create' })).toEqual({
      status: 409,
      body: errorBody('photo_required'),
    });
    await setTestPhoto(man.client);
    const roomId = await openTable(man);
    expect((await seated(roomId))[0]).toMatchObject({ alias: man.name, profiled: true });

    const unknown = await at(2);
    await sql`update public.profiles set gender = null where id = ${unknown.userId}`;
    expect(await rooms(unknown, { action: 'create' })).toEqual({
      status: 409,
      body: errorBody('gender_required'),
    });
  });

  it('takes a hidden photo for none at a profiled seat', async () => {
    const man = await at(0, { gender: 'male' });
    await setTestPhoto(man.client);
    await sql`update public.profiles set photo_hidden_at = now() where id = ${man.userId}`;
    expect(await rooms(man, { action: 'create' })).toEqual({
      status: 409,
      body: errorBody('photo_required'),
    });
  });

  it('answers today\'s app\'s "Masanla oyna" update_required', async () => {
    const a = await at(0);
    expect(await rooms(a, { action: 'create-solo' })).toEqual(UPDATE_REQUIRED);
  });

  it('opens and closes the lobby by the owner only; requests of the other road end', async () => {
    const [owner, member, lone] = await all(3);
    const roomId = await tableWith(owner, [member], { open: false });
    expect(await rooms(member, { action: 'set-visibility', roomId, open: true })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    const before = (await roomRow(roomId)).waiting_since;
    expect(await rooms(owner, { action: 'set-visibility', roomId, open: true })).toEqual({
      status: 200,
      body: { ok: true },
    });
    const opened = await roomRow(roomId);
    expect(opened.visibility).toBe('open');
    expect(new Date(opened.waiting_since).getTime()).toBeGreaterThan(new Date(before).getTime());

    const requestId = await ask(lone, roomId);
    expect((await rooms(owner, { action: 'set-visibility', roomId, open: false })).status).toBe(
      200,
    );
    const [request] = await sql`select status from public.join_requests where id = ${requestId}`;
    expect(request?.status).toBe('declined');
    // The same choice again changes nothing.
    expect((await rooms(owner, { action: 'set-visibility', roomId, open: false })).status).toBe(
      200,
    );
  });
});

describe('"Katıl" (§4.E)', () => {
  it('seats a person on its own with its nick; the owner sees the request, the requester its state', async () => {
    const [owner, lone, outsider] = await all(3);
    const roomId = await openTable(owner);
    const requestId = await ask(lone, roomId);
    const { data: incoming } = await owner.client
      .from('join_requests')
      .select('requester_alias, requester_phones, requester_room_id, status');
    expect(incoming).toEqual([
      {
        requester_alias: await nickOf(lone),
        requester_phones: 1,
        requester_room_id: null,
        status: 'pending',
      },
    ]);
    expect((await lone.client.from('join_requests').select('id')).data).toEqual([]);
    expect((await outsider.client.from('join_requests').select('id')).data).toEqual([]);
    expect((await myRequests(lone)).map((r) => r.status)).toEqual(['pending']);

    expect(await rooms(outsider, { action: 'respond', requestId, accept: true })).toEqual({
      status: 404,
      body: errorBody('request_not_found'),
    });
    await accept(owner, requestId);
    expect((await myRequests(lone)).map((r) => r.status)).toEqual(['accepted']);
    expect((await seated(roomId)).map((s) => s.session_id)).toEqual([
      owner.sessionId,
      lone.sessionId,
    ]);
    expect((await roomRow(roomId)).phones).toBe(2);
    await expectConsistent(roomId);
  });

  it("moves an owner's whole table with its identities and closes it; its requests end", async () => {
    const [host, owner, friend, profiled, waiting] = await all(5);
    await setTestPhoto(profiled.client);
    const switched = await invoke(profiled.client, 'checkin', {
      action: 'set-identity',
      anonymous: false,
    });
    expect(switched.status, JSON.stringify(switched.body)).toBe(200);
    const hostTable = await openTable(host);
    const ownTable = await tableWith(owner, [friend, profiled]);
    const before = await seated(ownTable);
    // K-10: a moved seat keeps the look it sat down with, whatever the profile's is by then.
    const lookOf = async (roomId: string, p: Person) => {
      const [row] = await sql`
        select look from public.room_members
        where room_id = ${roomId} and session_id = ${p.sessionId} and left_at is null
      `;
      return row?.look as string | null;
    };
    const satWith = await lookOf(ownTable, friend);
    expect(satWith).toEqual(expect.any(String));
    const changed =
      satWith === 'c:nane e:koyu h:anten' ? 'c:gul e:acik h:yok' : 'c:nane e:koyu h:anten';
    await sql`update public.profiles set capsule_look = ${changed} where id = ${friend.userId}`;
    const toOwnTable = await ask(waiting, ownTable);

    const requestId = await ask(owner, hostTable);
    const [request] =
      await sql`select requester_alias, requester_phones, requester_room_id from public.join_requests where id = ${requestId}`;
    expect(request).toEqual({
      requester_alias: (await roomRow(ownTable)).name,
      requester_phones: 3,
      requester_room_id: ownTable,
    });
    await accept(host, requestId);

    expect((await roomRow(ownTable)).status).toBe('closed');
    const now = await seated(hostTable);
    expect(now[0]?.session_id).toBe(host.sessionId);
    // The moved keep the names and identities they sat down with (they sat down at one moment,
    // so in no particular order).
    const seat = ({ session_id, alias, profiled: p }: Record<string, unknown>) =>
      JSON.stringify({ session_id, alias, profiled: p });
    expect(now.slice(1).map(seat).sort()).toEqual(before.map(seat).sort());
    expect(now.find((s) => s.session_id === profiled.sessionId)).toMatchObject({
      alias: profiled.name,
      profiled: true,
    });
    expect(await lookOf(hostTable, friend)).toBe(satWith);
    expect((await roomRow(hostTable)).phones).toBe(4);
    const [ended] = await sql`select status from public.join_requests where id = ${toOwnTable}`;
    expect(ended?.status).toBe('declined');
    await expectConsistent(hostTable);
  });

  it('refuses a participant (not_owner), a table not in the lobby, and "Bu masadayım" to the lobby', async () => {
    const [host, owner, member, lone, other] = await all(5);
    const hostTable = await openTable(host);
    await tableWith(owner, [member]);
    expect(await rooms(member, { action: 'request-join', roomId: hostTable })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    const running = await openTable(other, { open: false });
    expect(await rooms(lone, { action: 'request-join', roomId: running })).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
    expect(
      await rooms(lone, { action: 'request-join', roomId: hostTable, asMember: true }),
    ).toEqual({ status: 409, body: errorBody('room_not_available') });
  });

  it('makes a decline and a timeout look exactly the same to the requester (rule 5)', async () => {
    const [ownerA, ownerB, requester] = await all(3);
    const roomA = await openTable(ownerA);
    const roomB = await openTable(ownerB);

    const resA = await rooms(requester, { action: 'request-join', roomId: roomA });
    const [idA] = await sql`select id from public.join_requests where room_id = ${roomA}`;
    expect(
      (await rooms(ownerA, { action: 'respond', requestId: idA?.id, accept: false })).status,
    ).toBe(200);
    const pendingA = await myRequests(requester);
    const listedWhilePending = (await tables(requester)).map((t) => t.room_id).sort();
    await expireRequests(roomA);
    const unavailableA = await myRequests(requester);

    const resB = await rooms(requester, { action: 'request-join', roomId: roomB });
    const pendingB = (await myRequests(requester)).filter((r) => r.room_id === roomB);
    await expireRequests(roomB);
    const unavailableB = (await myRequests(requester)).filter((r) => r.room_id === roomB);

    const varying = new Set(['id', 'room_id', 'created_at', 'expires_at']);
    const shape = (rows: Record<string, unknown>[]) =>
      rows.map((row) => ({
        keys: Object.keys(row).sort(),
        ...Object.fromEntries(Object.entries(row).filter(([k]) => !varying.has(k))),
      }));
    expect(Object.keys(resA.body as object).sort()).toEqual(
      Object.keys(resB.body as object).sort(),
    );
    expect(resA.status).toBe(resB.status);
    expect(shape(pendingA)).toEqual(shape(pendingB));
    expect(shape(unavailableA.filter((r) => r.room_id === roomA))).toEqual(shape(unavailableB));
    expect(shape(unavailableB)).toEqual([{ keys: expect.any(Array), status: 'unavailable' }]);
    expect(listedWhilePending).toEqual([roomA, roomB].sort());

    // Afterwards both lobby tables are gone for this check-in, and asking again fails alike.
    expect(await tables(requester)).toEqual([]);
    const againA = await rooms(requester, { action: 'request-join', roomId: roomA });
    expect(againA).toEqual({ status: 409, body: errorBody('room_not_available') });
    expect(await rooms(requester, { action: 'request-join', roomId: roomB })).toEqual(againA);
  });

  it('shows a request ended by a lobby close or by a moved table like a timeout (rule 5)', async () => {
    const [owner, moving, host, lone, other] = await all(5);
    const lobbyTable = await openTable(owner);
    const movingTable = await openTable(moving);
    const hostTable = await openTable(host);
    const fromLone = await ask(lone, lobbyTable);
    const fromOther = await ask(other, movingTable);
    const status = async (p: Person) => (await myRequests(p)).map((r) => r.status);

    // The owner takes the table out of the lobby; the moving table goes to the host's.
    expect(
      await rooms(owner, { action: 'set-visibility', roomId: lobbyTable, open: false }),
    ).toEqual({ status: 200, body: { ok: true } });
    await accept(host, await ask(moving, hostTable));
    expect(fromLone).toEqual(expect.any(String));
    expect(fromOther).toEqual(expect.any(String));
    expect([await status(lone), await status(other)]).toEqual([['pending'], ['pending']]);
    await expireRequests(lobbyTable);
    await expireRequests(movingTable);
    expect([await status(lone), await status(other)]).toEqual([['unavailable'], ['unavailable']]);
  });

  it('allows one open request, 10 an hour, and answers expired requests request_expired', async () => {
    const [ownerA, ownerB, requester] = await all(3);
    const roomA = await openTable(ownerA);
    const roomB = await openTable(ownerB);
    const idA = await ask(requester, roomA);
    expect(await rooms(requester, { action: 'request-join', roomId: roomB })).toEqual({
      status: 409,
      body: errorBody('request_pending'),
    });
    await expireRequests(roomA);
    expect(await rooms(ownerA, { action: 'respond', requestId: idA, accept: true })).toEqual({
      status: 409,
      body: errorBody('request_expired'),
    });
    for (let i = 0; i < 9; i++) {
      await sql`
        insert into public.join_requests (room_id, requester_session_id, requester_alias, status, created_at, expires_at)
        values (${roomA}, ${requester.sessionId}, 'x', 'accepted', now() - interval '10 minutes', now() - interval '9 minutes')
      `;
    }
    expect(await rooms(requester, { action: 'request-join', roomId: roomB })).toEqual({
      status: 429,
      body: errorBody('rate_limited'),
    });
  });

  it(`stops at ${MAX_TABLE_PHONES} phones, at the request and again at the accept`, async () => {
    expect(MAX_TABLE_PHONES).toBe(12);
    const [row] = await sql`select private.max_table_phones() as n`;
    expect(row?.n).toBe(MAX_TABLE_PHONES);

    const everyone = await all(MAX_TABLE_PHONES);
    const [host, ...rest] = everyone;
    if (!host) throw new Error('no host');
    const hostTable = await tableWith(host, rest.slice(0, 8));
    const [a, a2, x] = rest.slice(8);
    if (!a || !a2 || !x) throw new Error('not enough phones');
    await tableWith(a, [a2], { open: false });
    // The test numbers make 12 people in all: the host's table counts one person more than sit
    // there (10), so a table of two fits alone (12) and not after a lone person (13).
    await sql`update public.rooms set phones = phones + 1 where id = ${hostTable}`;
    const fromA = await ask(a, hostTable);
    const fromX = await ask(x, hostTable);
    await accept(host, fromX);
    expect(await rooms(host, { action: 'respond', requestId: fromA, accept: true })).toEqual({
      status: 409,
      body: errorBody('table_full'),
    });
    expect((await roomRow(hostTable)).phones).toBe(11);
    // The table of two cannot ask any more.
    expect(await rooms(a, { action: 'request-join', roomId: hostTable })).toEqual({
      status: 409,
      body: errorBody('request_pending'),
    });
    await expireRequests(hostTable);
    await sql`delete from public.join_requests where room_id = ${hostTable} and status <> 'accepted'`;
    expect(await rooms(a, { action: 'request-join', roomId: hostTable })).toEqual({
      status: 409,
      body: errorBody('table_full'),
    });
    await sql`update public.rooms set phones = phones - 1 where id = ${hostTable}`;
    await expectConsistent(hostTable);
  });
});

describe('the seat of a person alone (rule 4)', () => {
  // WazzupDevs/Kabuk#183: the identity of the accept, not of the request.
  it('seats a person alone with the identity it has when the owner accepts', async () => {
    const [owner, w0] = await all(2);
    await setTestPhoto(w0.client);
    await sql`update public.profiles set default_participation = 'profile' where id = ${w0.userId}`;
    const w = { ...w0, sessionId: await checkIn(w0.client, venue) };
    const roomId = await openTable(owner);
    const requestId = await ask(w, roomId);
    const [asked] =
      await sql`select requester_profiled from public.join_requests where id = ${requestId}`;
    expect(asked?.requester_profiled).toBe(true);
    // checkin/set-identity refuses while the request is open (next test); the check-in's identity
    // changes here straight in the database, as no road the app has can change it now.
    await sql`update public.table_sessions set identity_mode = 'anonymous'
              where id = ${w.sessionId}`;
    await accept(owner, requestId);
    const seat = (await seated(roomId)).find((x) => x.session_id === w.sessionId);
    expect(seat).toMatchObject({ profiled: false, alias: await nickOf(w) });
  });

  // WazzupDevs/Kabuk#183: the owner sees the identity the request came with; changing it while the
  // request is open would let the owner link the two. A declined request is open until it expires,
  // as the requester sees it (rule 5).
  it('refuses a new identity while a request is open, and takes it after the accept or the end', async () => {
    const [owner, w0, v0] = await all(3);
    for (const p of [w0, v0]) {
      await setTestPhoto(p.client);
      await sql`update public.profiles set default_participation = 'profile' where id = ${p.userId}`;
    }
    const w = { ...w0, sessionId: await checkIn(w0.client, venue) };
    const v = { ...v0, sessionId: await checkIn(v0.client, venue) };
    const roomId = await openTable(owner);
    const setIdentity = (p: Person) =>
      invoke(p.client, 'checkin', { action: 'set-identity', anonymous: true });
    const pending = { status: 409, body: errorBody('request_pending') };

    const declined = await ask(w, roomId);
    expect(await setIdentity(w)).toEqual(pending);
    expect(await rooms(owner, { action: 'respond', requestId: declined, accept: false })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect(await setIdentity(w)).toEqual(pending);
    await sql`update public.join_requests set expires_at = now() - interval '1 second'
              where id = ${declined}`;
    expect((await setIdentity(w)).status).toBe(200);

    const accepted = await ask(v, roomId);
    expect(await setIdentity(v)).toEqual(pending);
    await accept(owner, accepted);
    expect((await setIdentity(v)).status).toBe(200);
    // The seat keeps the identity it sat down with (§4.D).
    const seat = (await seated(roomId)).find((x) => x.session_id === v.sessionId);
    expect(seat?.profiled).toBe(true);
  });

  it('finds the request gone for a person who cannot sit any more', async () => {
    const [owner, man] = await all(2);
    await sql`update public.profiles set gender = 'male' where id = ${man.userId}`;
    await setTestPhoto(man.client);
    const roomId = await openTable(owner);
    const requestId = await ask(man, roomId);
    await sql`update public.profiles set photo_hidden_at = now() where id = ${man.userId}`;
    expect(await rooms(owner, { action: 'respond', requestId, accept: true })).toEqual({
      status: 409,
      body: errorBody('request_expired'),
    });
    expect((await seated(roomId)).map((x) => x.session_id)).toEqual([owner.sessionId]);
  });

  // A seat whose check-in ended without leaving (never on a path of the app; a guard) is nobody's:
  // not among the table's people, and its person reads nothing of the table.
  it('keeps a seat whose check-in ended out of the table', async () => {
    const [owner, member] = await all(2);
    const roomId = await tableWith(owner, [member]);
    await sql`update public.table_sessions set status = 'ended', ended_at = now() where id = ${member.sessionId}`;
    const people = await owner.client.rpc('table_people', { target_room_id: roomId });
    expect((people.data ?? []).map((x) => x.session_id)).toEqual([owner.sessionId]);
    const theirs = await member.client.rpc('table_people', { target_room_id: roomId });
    expect(theirs.data ?? []).toEqual([]);
  });
});

describe('"Bu masadayım" (§4.E)', () => {
  it('seats a person without a table at a running table; one at a table cannot ask', async () => {
    const [owner, lone, seatedElsewhere, other] = await all(4);
    const roomId = await openTable(owner, { open: false });
    await accept(owner, await ask(lone, roomId, true));
    expect((await seated(roomId)).map((s) => s.session_id)).toContain(lone.sessionId);
    await openTable(seatedElsewhere);
    expect(
      await rooms(seatedElsewhere, { action: 'request-join', roomId, asMember: true }),
    ).toEqual({ status: 409, body: errorBody('already_in_table') });
    expect(await rooms(other, { action: 'request-join', roomId, asMember: true })).toMatchObject({
      status: 200,
    });
    await expectConsistent(roomId);
  });

  it('makes a decline and a timeout look exactly the same to the requester (rule 5)', async () => {
    const [ownerA, ownerB, requester] = await all(3);
    const roomA = await openTable(ownerA, { open: false });
    const roomB = await openTable(ownerB, { open: false });
    const varying = new Set(['id', 'room_id', 'created_at', 'expires_at']);
    const shape = (rows: Record<string, unknown>[]) =>
      rows.map((row) => ({
        keys: Object.keys(row).sort(),
        ...Object.fromEntries(Object.entries(row).filter(([k]) => !varying.has(k))),
      }));

    const idA = await ask(requester, roomA, true);
    expect((await rooms(ownerA, { action: 'respond', requestId: idA, accept: false })).status).toBe(
      200,
    );
    const pendingA = shape(await myRequests(requester));
    await expireRequests(roomA);
    const unavailableA = shape(await myRequests(requester));

    await ask(requester, roomB, true);
    const pendingB = shape((await myRequests(requester)).filter((r) => r.room_id === roomB));
    await expireRequests(roomB);
    const unavailableB = shape((await myRequests(requester)).filter((r) => r.room_id === roomB));

    expect(pendingA).toEqual(pendingB);
    expect(pendingB).toEqual([{ keys: expect.any(Array), status: 'pending' }]);
    expect(unavailableA).toEqual(unavailableB);
    expect(unavailableB).toEqual([{ keys: expect.any(Array), status: 'unavailable' }]);
  });
});

describe('leaving and owning (K-13)', () => {
  it('lets a person leave while the table goes on; twice is not_in_room', async () => {
    const [owner, member] = await all(2);
    const roomId = await tableWith(owner, [member]);
    expect(await leave(member, roomId)).toEqual({ status: 200, body: { ok: true } });
    expect(await roomRow(roomId)).toMatchObject({ status: 'active', phones: 1 });
    expect(await leave(member, roomId)).toEqual({ status: 403, body: errorBody('not_in_room') });
    await expectConsistent(roomId);
  });

  it("hands a leaving owner's table to the earliest person, and closes it with the last", async () => {
    const [owner, early, late] = await all(3);
    const roomId = await tableWith(owner, [early, late]);
    await leave(owner, roomId);
    expect(await roomRow(roomId)).toMatchObject({ owner_session_id: early.sessionId, phones: 2 });
    await leave(early, roomId);
    expect(await roomRow(roomId)).toMatchObject({ owner_session_id: late.sessionId, phones: 1 });
    await leave(late, roomId);
    expect((await roomRow(roomId)).status).toBe('closed');
    await expectConsistent(roomId);
  });

  it('takes the same road when the owner leaves the venue or its account goes', async () => {
    const [owner, early, late] = await all(3);
    const roomId = await tableWith(owner, [early, late]);
    await invoke(owner.client, 'checkin', { action: 'leave' });
    expect((await roomRow(roomId)).owner_session_id).toBe(early.sessionId);
    await deleteAccount(admin, early.userId);
    expect(await roomRow(roomId)).toMatchObject({
      status: 'active',
      owner_session_id: late.sessionId,
      phones: 1,
    });
    await expectConsistent(roomId);
  });

  it('lets only the owner end the table, for everyone at once', async () => {
    const [owner, member] = await all(2);
    const roomId = await tableWith(owner, [member]);
    expect(await rooms(member, { action: 'end' })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    expect(await rooms(owner, { action: 'end' })).toEqual({ status: 200, body: { ok: true } });
    expect((await roomRow(roomId)).status).toBe('closed');
    expect(await rooms(owner, { action: 'end' })).toEqual({ status: 200, body: { ok: true } });
    await expectConsistent(roomId);
  });

  it('announces every change of a table on the venue channel', async () => {
    const [owner, watcher] = await all(2);
    const listener = waitForBroadcast(
      watcher.client,
      venueChannel(venue['at-anchor'] ?? ''),
      'lobby_changed',
    );
    await listener.subscribed;
    await openTable(owner, { open: false });
    await expect(listener.received).resolves.toBeUndefined();
    await listener.close();
  });
});

describe('blocking and reporting at the table (K-13)', () => {
  // Rule 5: a person blocked out of a table hears what a person leaving it hears, in the lobby or
  // out of it (WazzupDevs/Kabuk#183).
  it('announces a block on the venue channel as a leave is announced', async () => {
    const [owner, member, watcher] = await all(3);
    const roomId = await tableWith(owner, [member], { open: false });
    const listener = waitForBroadcast(
      watcher.client,
      venueChannel(venue['at-anchor'] ?? ''),
      'lobby_changed',
    );
    await listener.subscribed;
    expect((await block(owner, roomId, member)).status).toBe(200);
    await expect(listener.received).resolves.toBeUndefined();
    await listener.close();
  });

  it('takes out whom the owner blocks; anyone else who blocks goes', async () => {
    const [owner, member, other] = await all(3);
    const roomId = await tableWith(owner, [member, other]);
    expect((await block(owner, roomId, member)).status).toBe(200);
    expect((await seated(roomId)).map((s) => s.session_id)).toEqual([
      owner.sessionId,
      other.sessionId,
    ]);
    const [entry] =
      await sql`select blocked_alias from public.blocks where blocker_id = ${owner.userId}`;
    expect(entry?.blocked_alias).toBe(await nickOf(member));
    expect((await block(other, roomId, owner)).status).toBe(200);
    expect((await seated(roomId)).map((s) => s.session_id)).toEqual([owner.sessionId]);
    expect(await block(owner, roomId)).toEqual({
      status: 409,
      body: errorBody('nothing_to_block'),
    });
    await expectConsistent(roomId);
  });

  it('keeps blocked people apart: no listing, no request, no move', async () => {
    const [owner, blocked, third, friendOfBlocked] = await all(4);
    const roomId = await openTable(owner);
    await sql`insert into public.blocks (blocker_id, blocked_id, blocked_alias) values (${owner.userId}, ${blocked.userId}, 'x')`;
    expect((await tables(blocked)).map((t) => t.room_id)).not.toContain(roomId);
    expect(await rooms(blocked, { action: 'request-join', roomId })).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
    // A table with the blocked person in it cannot move in either.
    await tableWith(third, [blocked, friendOfBlocked], { open: false });
    const requestId = await ask(third, roomId);
    expect(await rooms(owner, { action: 'respond', requestId, accept: true })).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
  });

  it('reports the person it names, with the chat from the reporter’s own seat on', async () => {
    const [owner, member, late] = await all(3);
    const roomId = await tableWith(owner, [member]);
    await invoke(member.client, 'chat', { action: 'send', roomId, body: 'önce' });
    await sql`update public.messages set created_at = created_at - interval '5 seconds' where room_id = ${roomId}`;
    await sit(late, owner, roomId);
    await invoke(member.client, 'chat', { action: 'send', roomId, body: 'sonra' });
    const report = (target?: Person) =>
      invoke(late.client, 'safety', {
        action: 'report',
        target: 'room',
        roomId,
        reason: 'harassment',
        ...(target ? { sessionId: target.sessionId } : {}),
      });
    expect((await report(member)).status).toBe(200);
    const [row] =
      await sql`select reported_user_id, messages_snapshot from public.reports where reporter_id = ${late.userId}`;
    expect(row?.reported_user_id).toBe(member.userId);
    expect((row?.messages_snapshot as { body: string }[]).map((m) => m.body)).toEqual(['sonra']);
    expect(await report()).toEqual({ status: 404, body: errorBody('not_found') });
    expect(await report(late)).toEqual({ status: 404, body: errorBody('not_found') });
  });
});

describe('the table and its chat (§4.E, §4.I)', () => {
  it('reads the chat from the moment a person sat down, with its seat name', async () => {
    const [owner, late] = await all(2);
    const roomId = await openTable(owner);
    await invoke(owner.client, 'chat', { action: 'send', roomId, body: 'önce' });
    await sql`update public.messages set created_at = created_at - interval '5 seconds' where room_id = ${roomId}`;
    await sit(late, owner, roomId);
    await invoke(owner.client, 'chat', { action: 'send', roomId, body: 'sonra' });
    const { data } = await late.client.from('messages').select('body').eq('room_id', roomId);
    expect((data ?? []).map((m) => m.body)).toEqual(['sonra']);
    expect(
      (await invoke(late.client, 'chat', { action: 'send', roomId, body: 'ben' })).status,
    ).toBe(200);
    const [mine] = await sql`select sender_alias from public.messages where body = 'ben'`;
    expect(mine?.sender_alias).toBe(await nickOf(late));

    await leave(late, roomId);
    expect((await late.client.from('rooms').select('id').eq('id', roomId)).data).toEqual([]);
    expect((await late.client.from('messages').select('id').eq('room_id', roomId)).data).toEqual(
      [],
    );
  });

  it('lists the table’s people to its people only; a look for the anonymous only', async () => {
    const [owner, member, outsider] = await all(3);
    await setTestPhoto(member.client);
    await invoke(member.client, 'checkin', { action: 'set-identity', anonymous: false });
    const roomId = await tableWith(owner, [member]);
    const { data } = await owner.client.rpc('table_people', { target_room_id: roomId });
    expect(data?.map((p) => ({ ...p, joined_at: undefined }))).toEqual([
      {
        session_id: owner.sessionId,
        alias: await nickOf(owner),
        profiled: false,
        look: expect.any(String),
        is_owner: true,
        joined_at: undefined,
      },
      {
        session_id: member.sessionId,
        alias: member.name,
        profiled: true,
        look: null,
        is_owner: false,
        joined_at: undefined,
      },
    ]);
    expect((await outsider.client.rpc('table_people', { target_room_id: roomId })).data).toEqual(
      [],
    );
  });
});

describe('venue_tables: the lobby and the running tables (§4.E, rule 4)', () => {
  it('lists every table but the own one: name, icon, phones; intent and tag in the lobby only', async () => {
    const [a, b, c, viewer] = await all(4);
    const lobbyTable = await openTable(a, { intent: 'game', gameTag: 'sahtekar' });
    const running = await tableWith(b, [c], { open: false, intent: 'chat' });
    const rows = await tables(viewer);
    expect(rows.map((r) => r.room_id)).toEqual([lobbyTable, running]);
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(
      [
        'game_tag',
        'icon',
        'intent',
        'name',
        'open',
        'phones',
        'room_id',
        'spot_id',
        'spot_name',
        'waiting_since',
      ].sort(),
    );
    expect(rows[0]).toMatchObject({ open: true, intent: 'game', game_tag: 'sahtekar', phones: 1 });
    expect(rows[1]).toMatchObject({ open: false, intent: null, game_tag: null, phones: 2 });
    // Nobody's name or id.
    const text = JSON.stringify(rows);
    for (const p of [a, b, c]) {
      expect(text).not.toContain(p.userId);
      expect(text).not.toContain(p.name);
      expect(text).not.toContain(await nickOf(p));
    }
    expect((await tables(a)).map((r) => r.room_id)).toEqual([running]);
  });
});

describe('inactivity (§4.E)', () => {
  it(`closes a one-person table after ${ROOM_IDLE_MINUTES} quiet minutes, not before; never a larger one`, async () => {
    const [alone, owner, member] = await all(3);
    const lone = await openTable(alone, { open: false });
    const pair = await tableWith(owner, [member]);
    const idle = (minutes: number) => sql`
      update public.rooms set last_activity_at = now() - ${`${minutes} minutes`}::interval
      where id in (${lone}, ${pair})
    `;
    await idle(ROOM_IDLE_MINUTES - 1);
    await sql`select private.close_idle_rooms(${ROOM_IDLE_MINUTES})`;
    expect((await roomRow(lone)).status).toBe('active');
    await idle(ROOM_IDLE_MINUTES + 1);
    await sql`select private.close_idle_rooms(${ROOM_IDLE_MINUTES})`;
    expect((await roomRow(lone)).status).toBe('closed');
    expect((await roomRow(pair)).status).toBe('active');
  });
});

describe('inactivity after leaving (§4.E)', () => {
  it('starts the quiet clock again when a table drops to one person', async () => {
    const [owner, a, b] = await all(3);
    const roomId = await tableWith(owner, [a, b]);
    await sql`
      update public.rooms set last_activity_at = now() - interval '60 minutes' where id = ${roomId}
    `;
    expect((await leave(owner, roomId)).status).toBe(200);
    expect((await leave(a, roomId)).status).toBe(200);
    await sql`select private.close_idle_rooms(${ROOM_IDLE_MINUTES})`;
    expect(await roomRow(roomId)).toMatchObject({ status: 'active', phones: 1 });
  });
});

describe('pair records (K-66)', () => {
  const recordsOf = (roomId: string) => sql`
    select user_id, other_user_id, own_alias, other_alias, other_headcount, friend_open
    from public.play_history where room_id = ${roomId}
  `;

  it('writes every pair together for 3 minutes once, with the names they sat down with', async () => {
    const [owner, a, b] = await all(3);
    const roomId = await tableWith(owner, [a, b]);
    await backdate(roomId, 10);
    await rooms(owner, { action: 'end' });
    const rows = await recordsOf(roomId);
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.friend_open && r.other_headcount === 1)).toBe(true);
    const [ownerRow] = rows.filter(
      (r) => r.user_id === owner.userId && r.other_user_id === a.userId,
    );
    expect(ownerRow).toMatchObject({
      own_alias: await nickOf(owner),
      other_alias: await nickOf(a),
    });
  });

  it('writes the two who came together a record too, and each with the table they joined', async () => {
    const [owner, a, a2] = await all(3);
    const ownTable = await tableWith(a, [a2]);
    const hostTable = await openTable(owner);
    await accept(owner, await ask(a, hostTable));
    expect((await roomRow(ownTable)).status).toBe('closed');
    await backdate(hostTable, 5);
    await rooms(owner, { action: 'end' });
    const pairs = (await recordsOf(hostTable)).map((r) =>
      [r.user_id, r.other_user_id].sort().join(),
    );
    expect(new Set(pairs)).toEqual(
      new Set([
        [owner.userId, a.userId].sort().join(),
        [owner.userId, a2.userId].sort().join(),
        [a.userId, a2.userId].sort().join(),
      ]),
    );
    expect(pairs).toHaveLength(6);
  });

  it("writes a leaver's pairs as it leaves, and none for less than 3 minutes", async () => {
    const [owner, a, b] = await all(3);
    const roomId = await tableWith(owner, [a]);
    await backdate(roomId, 5);
    await sit(b, owner, roomId);
    await leave(a, roomId);
    // a with owner (5 min) only; b came a moment ago.
    expect((await recordsOf(roomId)).map((r) => [r.user_id, r.other_user_id].sort())).toEqual([
      [a.userId, owner.userId].sort(),
      [a.userId, owner.userId].sort(),
    ]);
    await rooms(owner, { action: 'end' });
    expect(await recordsOf(roomId)).toHaveLength(2);
  });
});

describe("today's app's games (§4.E)", () => {
  it('answers every game start and proposal update_required', async () => {
    const [owner] = await all(1);
    const roomId = await openTable(owner);
    for (const fn of ['tabu', 'sahtekar', 'ibre', 'harf', 'sarki']) {
      expect(await invoke(owner.client, fn, { action: 'start', roomId }), fn).toEqual(
        UPDATE_REQUIRED,
      );
    }
    expect(await invoke(owner.client, 'sohbet', { action: 'next-card', roomId })).toEqual(
      UPDATE_REQUIRED,
    );
    expect(await rooms(owner, { action: 'propose-game', roomId, concept: 'tabu' })).toEqual(
      UPDATE_REQUIRED,
    );
    expect(await rooms(owner, { action: 'answer-game', roomId, accept: true })).toEqual(
      UPDATE_REQUIRED,
    );
  });
});

describe('locks (§4.K)', () => {
  // The accept holds the requester's check-in before the tables: the requester's own action never
  // waits on it.
  it('lets the requester take its table while the owner accepts and waits for its check-in', async () => {
    const [host, owner, friend] = await all(3);
    const hostTable = await openTable(host);
    const ownTable = await tableWith(owner, [friend], { open: false });
    const requestId = await ask(owner, hostTable);
    const holding = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const accepting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let accepted: Promise<unknown> = Promise.resolve();
      await holding.begin(async (tx) => {
        await tx`select id from private.active_session_for_update(${owner.userId})`;
        accepted =
          accepting`select (public.rooms_respond(${host.userId}, ${requestId}, true)).status`
            .execute()
            .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_respond');
        await tx`set local lock_timeout = '2s'`;
        expect(
          await tx`select id from public.rooms where id = ${ownTable} for update`,
        ).toHaveLength(1);
        expect(
          await tx`select id from public.rooms where id = ${hostTable} for update`,
        ).toHaveLength(1);
      });
      expect(await accepted).toEqual([{ status: 'accepted' }]);
    } finally {
      await Promise.all([holding.end(), accepting.end()]);
    }
    expect((await roomRow(ownTable)).status).toBe('closed');
    await expectConsistent(hostTable);
  });

  // Two tables ask each other and both accept: both lock the two tables in id order, the second
  // waits and hears room_not_available; nothing deadlocks.
  it('takes one of two tables accepting each other at once; the other is room_not_available', async () => {
    const [a, b, c, d] = await all(4);
    const roomA = await openTable(a);
    const roomB = await openTable(b);
    const aAsks = await ask(a, roomB);
    const bAsks = await ask(b, roomA);
    const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let later: Promise<unknown> = Promise.resolve();
      await first.begin(async (tx) => {
        expect(await tx`select (public.rooms_respond(${a.userId}, ${bAsks}, true)).status`).toEqual(
          [{ status: 'accepted' }],
        );
        later = second`select (public.rooms_respond(${b.userId}, ${aAsks}, true)).status`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_respond');
      });
      expect(await later).toMatchObject({ message: 'room_not_available' });
    } finally {
      await Promise.all([first.end(), second.end()]);
    }
    expect((await roomRow(roomB)).status).toBe('closed');
    expect((await seated(roomA)).map((s) => s.session_id)).toEqual([a.sessionId, b.sessionId]);
    await expectConsistent(roomA);

    // Through the API at once: one 200, one 409 room_not_available.
    const roomC = await openTable(c);
    const roomD = await openTable(d);
    const cAsks = await ask(c, roomD);
    const dAsks = await ask(d, roomC);
    const both = await Promise.all([
      rooms(c, { action: 'respond', requestId: dAsks, accept: true }),
      rooms(d, { action: 'respond', requestId: cAsks, accept: true }),
    ]);
    expect(both.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(both.find((r) => r.status === 409)).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
    await expectConsistent(roomC);
    await expectConsistent(roomD);
  });

  // Two lobby tables pressing "Katıl" to each other at once (WazzupDevs/Kabuk#183): each request
  // holds the other table no key update and its own table key share; neither waits on the other.
  it('lets two lobby tables ask each other at once', async () => {
    const [a, b] = await all(2);
    const roomA = await openTable(a);
    const roomB = await openTable(b);
    const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await first.begin(async (tx) => {
        await tx`select id from public.rooms_request_join(${a.userId}, ${roomB}, 60, 10)`;
        await second.begin(async (tx2) => {
          await tx2`set local lock_timeout = '2s'`;
          expect(
            await tx2`select room_id from public.rooms_request_join(${b.userId}, ${roomA}, 60, 10)`,
          ).toEqual([{ room_id: roomA }]);
        });
      });
    } finally {
      await Promise.all([first.end(), second.end()]);
    }
    expect(
      await sql`select count(*)::int as n from public.join_requests where status = 'pending'
                and room_id in (${roomA}, ${roomB})`,
    ).toEqual([{ n: 2 }]);
  });

  // rooms_request_join takes the two tables in id order, as rooms_respond does
  // (WazzupDevs/Kabuk#183): an owner asking another table while it accepts that table's request
  // into its own waits for one or the other, whichever came first; nothing deadlocks.
  it('lets an owner\'s "Katıl" and its accept of the same table wait for each other', async () => {
    for (const askFirst of [true, false]) {
      const [a, b] = await all(2);
      const roomA = await openTable(a);
      const roomB = await openTable(b);
      const requestId = await ask(b, roomA);
      const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const asking = (c: postgres.TransactionSql | postgres.Sql) =>
        c`select status from public.rooms_request_join(${a.userId}, ${roomB}, 60, 10)`;
      const accepting = (c: postgres.TransactionSql | postgres.Sql) =>
        c`select (public.rooms_respond(${a.userId}, ${requestId}, true)).status`;
      try {
        let later: Promise<unknown> = Promise.resolve();
        await first.begin(async (tx) => {
          await (askFirst ? asking(tx) : accepting(tx));
          later = (askFirst ? accepting(second) : asking(second))
            .execute()
            .catch((err: unknown) => err);
          await waitUntilBlocked(askFirst ? 'rooms_respond' : 'rooms_request_join');
        });
        if (askFirst) {
          expect(await later).toEqual([{ status: 'accepted' }]);
        } else {
          // b's table moved into a's: nothing to ask any more.
          expect(await later).toMatchObject({ message: 'room_not_available' });
        }
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
      expect((await seated(roomA)).map((x) => x.session_id).sort()).toEqual(
        [a.sessionId, b.sessionId].sort(),
      );
      expect((await roomRow(roomB)).status).toBe('closed');
      await expectConsistent(roomA);
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });

  // A "Katıl" with a table locks its people's check-ins first: one of them leaving the venue at
  // the same moment goes first and leaves no seat behind (WazzupDevs/Kabuk#183).
  it("waits for a moved person's check-in, and moves only those still there", async () => {
    const [host, mover, friend] = await all(3);
    const ownTable = await tableWith(mover, [friend]);
    const hostTable = await openTable(host);
    const requestId = await ask(mover, hostTable);
    const leaving = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const accepting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let accepted: Promise<unknown> = Promise.resolve();
      await leaving.begin(async (tx) => {
        await tx`select public.end_table_session(${friend.userId})`;
        accepted =
          accepting`select (public.rooms_respond(${host.userId}, ${requestId}, true)).status`
            .execute()
            .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_respond');
      });
      expect(await accepted).toEqual([{ status: 'accepted' }]);
    } finally {
      await Promise.all([leaving.end(), accepting.end()]);
    }
    expect((await seated(hostTable)).map((x) => x.session_id).sort()).toEqual(
      [host.sessionId, mover.sessionId].sort(),
    );
    expect((await roomRow(ownTable)).status).toBe('closed');
    await expectConsistent(hostTable);
  });

  // The expiry job takes a check-in's tables with skip locked (WazzupDevs/Kabuk#183): a table a
  // user action holds waits for the next run.
  it('skips a check-in whose table a user action holds, and ends it on the next run', async () => {
    const [owner, member] = await all(2);
    const roomId = await tableWith(owner, [member]);
    await sql`update public.table_sessions set expires_at = now() - interval '1 minute' where id = ${member.sessionId}`;
    const job = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await sql.begin(async (tx) => {
        await tx`select id from public.rooms where id = ${roomId} for update`;
        const [ran] = await job.begin(async (jtx) => {
          await jtx`set local lock_timeout = '2s'`;
          return jtx`select private.end_expired_table_sessions() as n`;
        });
        expect(ran).toEqual({ n: 0 });
      });
    } finally {
      await job.end();
    }
    const [next] = await sql`select private.end_expired_table_sessions() as n`;
    expect(next).toEqual({ n: 1 });
    expect((await seated(roomId)).map((x) => x.session_id)).toEqual([owner.sessionId]);
  });

  // The 12th phone asked for twice at once: both accepts lock the host's table, the second waits,
  // counts again and hears table_full.
  it('lets one of two requests take the last seat; the other is table_full', async () => {
    const everyone = await all(MAX_TABLE_PHONES);
    const [host, ...rest] = everyone;
    if (!host) throw new Error('no host');
    const hostTable = await tableWith(host, rest.slice(0, 9));
    const [x, y] = rest.slice(9);
    if (!x || !y) throw new Error('not enough phones');
    const fromX = await ask(x, hostTable);
    const fromY = await ask(y, hostTable);
    await sql`update public.rooms set phones = phones + 1 where id = ${hostTable}`;
    const both = await Promise.all([
      rooms(host, { action: 'respond', requestId: fromX, accept: true }),
      rooms(host, { action: 'respond', requestId: fromY, accept: true }),
    ]);
    await sql`update public.rooms set phones = phones - 1 where id = ${hostTable}`;
    expect(both.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(both.find((r) => r.status === 409)).toEqual({
      status: 409,
      body: errorBody('table_full'),
    });
    await expectConsistent(hostTable);
  });

  // An owner leaving hands over without the heir's check-in: the heir's own action holding it does
  // not stop the hand-over.
  it("hands over while the heir's check-in is held", async () => {
    const [owner, heir] = await all(2);
    const roomId = await tableWith(owner, [heir]);
    const leaving = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await sql.begin(async (tx) => {
        await tx`select id from private.active_session_for_update(${heir.userId})`;
        const left = await leaving.begin(async (ltx) => {
          await ltx`set local lock_timeout = '2s'`;
          return ltx`select (public.rooms_leave(${owner.userId}, ${roomId})).owner_session_id as owner`;
        });
        expect(left).toEqual([{ owner: heir.sessionId }]);
      });
    } finally {
      await leaving.end();
    }
    await expectConsistent(roomId);
  });

  it('lets an owner and its only companion leave at once: one hands over, the other closes', async () => {
    const [owner, member] = await all(2);
    const roomId = await tableWith(owner, [member]);
    const both = await Promise.all([leave(owner, roomId), leave(member, roomId)]);
    expect(both.map((r) => r.status)).toEqual([200, 200]);
    expect((await roomRow(roomId)).status).toBe('closed');
    await expectConsistent(roomId);
  });

  // The owner removing a person locks both check-ins in id order, then the table; the person leaving
  // at the same moment holds its check-in, then the table. Both finish, the person is out once.
  it('lets an owner remove a person while that person leaves', async () => {
    const [owner, member] = await all(2);
    for (let i = 0; i < 3; i++) {
      const roomId = await tableWith(owner, [member]);
      const [blocked, left] = await Promise.all([
        block(owner, roomId, member),
        leave(member, roomId),
      ]);
      expect([200, 409]).toContain(blocked.status);
      expect([200, 403]).toContain(left.status);
      expect([blocked.status, left.status]).toContain(200);
      expect(await roomRow(roomId)).toMatchObject({ phones: 1, owner_session_id: owner.sessionId });
      await expectConsistent(roomId);
      await rooms(owner, { action: 'end' });
      await sql`delete from public.blocks where blocker_id = ${owner.userId}`;
    }
  });
});

describe('a table’s name and icon (K-45)', () => {
  it('gives every new table a name and a free icon, in the lobby or out of it', async () => {
    const [a, b] = await all(2);
    const r1 = await roomRow(await openTable(a));
    const r2 = await roomRow(await openTable(b, { open: false }));
    for (const r of [r1, r2]) {
      expect(r.name).toMatch(/^\S+ \S+$/);
      expect(ICON_IDS).toContain(r.icon);
      expect(r.name_rerolls).toBe(0);
    }
    expect(r1.icon).not.toBe(r2.icon);
    expect(r1.name).not.toBe(r2.name);
  });

  it('takes the owner’s icon at creation, and refuses one another table has', async () => {
    const [a, b] = await all(2);
    const roomId = await openTable(a, { icon: 'kis-kardanadam' });
    expect((await roomRow(roomId)).icon).toBe('kis-kardanadam');
    expect(await rooms(b, { action: 'create', icon: 'kis-kardanadam' })).toEqual({
      status: 409,
      body: errorBody('icon_taken'),
    });
    // Not an icon of the list: refused before the database.
    expect((await rooms(b, { action: 'create', icon: 'kis-yok' })).status).toBe(400);
  });

  it('lets only the owner change the icon (K-59) and draw a new name three times', async () => {
    const [a, b] = await all(2);
    const roomId = await openTable(a);
    const other = await openTable(b);
    const before = await roomRow(roomId);
    const taken = (await roomRow(other)).icon;
    const free = ICON_IDS.find((id) => id !== before.icon && id !== taken) ?? '';

    expect(await rooms(b, { action: 'set-icon', roomId, icon: free })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    expect(await rooms(a, { action: 'set-icon', roomId, icon: taken })).toEqual({
      status: 409,
      body: errorBody('icon_taken'),
    });
    expect(await rooms(a, { action: 'set-icon', roomId, icon: free })).toEqual({
      status: 200,
      body: { icon: free },
    });
    // Its own icon again is no clash.
    expect((await rooms(a, { action: 'set-icon', roomId, icon: free })).status).toBe(200);
    // An icon not in the list, or taken out of it: refused, nothing changes.
    expect(await rooms(a, { action: 'set-icon', roomId, icon: 'boyle-bir-simge-yok' })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    const retired = ICON_IDS.find((id) => id !== free && id !== taken) ?? '';
    await sql`update public.table_icons set is_active = false where id = ${retired}`;
    expect(await rooms(a, { action: 'set-icon', roomId, icon: retired })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect((await roomRow(roomId)).icon).toBe(free);

    const names = [before.name];
    for (let left = 2; left >= 0; left--) {
      const res = await rooms(a, { action: 'reroll-name', roomId });
      expect(res).toEqual({
        status: 200,
        body: { name: expect.stringMatching(/^\S+ \S+$/), rerollsLeft: left },
      });
      names.push((res.body as { name: string }).name);
    }
    expect(new Set(names).size).toBe(4);
    // The old owner_alias copy follows the name until 4.8 (§4.H).
    const renamed = await roomRow(roomId);
    expect(renamed.owner_alias).toBe(renamed.name);
    expect(await rooms(a, { action: 'reroll-name', roomId })).toEqual({
      status: 429,
      body: errorBody('reroll_limit'),
    });
    expect(await rooms(b, { action: 'reroll-name', roomId })).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    // The name changes, the icon stays.
    expect((await roomRow(roomId)).icon).toBe(free);
  });

  it('frees a closed table’s icon', async () => {
    const [a, b] = await all(2);
    const roomId = await openTable(a);
    const icon = (await roomRow(roomId)).icon as string;
    expect((await rooms(a, { action: 'end' })).status).toBe(200);
    expect((await roomRow(roomId)).status).toBe('closed');
    const again = await rooms(b, { action: 'create', icon });
    expect(again.status, JSON.stringify(again.body)).toBe(200);
  });

  it('keeps an icon unique when the last free ones go to tables created at once (locks)', async () => {
    const [a, b] = await all(2);
    await sql`
      update public.table_icons set is_active = false
      where id not in ('kis-kardanadam', 'kis-karkuresi')
    `;
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let created: Promise<unknown[]> = Promise.resolve([]);
      await holder.begin(async (tx) => {
        // Another pick at the venue holds the venue's lock; both creations wait behind it.
        await tx`select private.lock_venue_names(${venue['at-anchor'] ?? ''})`;
        created = Promise.all([
          first`select icon from public.rooms_create(${a.userId}, false)`.execute(),
          second`select icon from public.rooms_create(${b.userId}, false)`.execute(),
        ]);
        await waitUntilBlocked('rooms_create', 2);
      });
      const icons = ((await created) as { icon: string }[][]).map((rows) => rows[0]?.icon).sort();
      expect(icons).toEqual(['kis-kardanadam', 'kis-karkuresi']);
    } finally {
      await Promise.all([holder.end(), first.end(), second.end()]);
    }
  });
});

describe('"Arkadaş ekle" taken back (K-67) and the match (K-70)', () => {
  // A friend_open pair of records, as a table's end writes them.
  async function pair(): Promise<{ a: Person; b: Person; historyA: string; historyB: string }> {
    const [a, b] = await all(2);
    const encounter = randomUUID();
    const rows = await sql`
      insert into public.play_history
        (encounter_id, user_id, other_user_id, concept, mode, own_alias, other_alias,
         other_headcount, available_at, friend_open)
      values
        (${encounter}, ${a.userId}, ${b.userId}, 'tabu', 'voice', 'A', 'B', 1,
         now() - interval '1 minute', true),
        (${encounter}, ${b.userId}, ${a.userId}, 'tabu', 'voice', 'B', 'A', 1,
         now() - interval '1 minute', true)
      returning id, user_id
    `;
    const idOf = (userId: string) => rows.find((r) => r.user_id === userId)?.id as string;
    return { a, b, historyA: idOf(a.userId), historyB: idOf(b.userId) };
  }
  const friendsOp = (p: Person, action: string, historyId: string) =>
    invoke(p.client, 'friends', { action, historyId });
  const pressed = async (historyId: string) => {
    const [row] =
      await sql`select friend_action_at from public.play_history where id = ${historyId}`;
    return row?.friend_action_at !== null;
  };
  const areFriends = async (a: Person, b: Person) =>
    (
      await sql`
        select 1 from public.friendships
        where (user_a = ${a.userId} and user_b = ${b.userId})
           or (user_a = ${b.userId} and user_b = ${a.userId})
      `
    ).length === 1;
  const intents = async (userId: string) =>
    (await sql`select 1 from public.mutual_friend_intents where user_id = ${userId}`).length;

  it('takes the press back: no intent, the record unpressed, and the other’s press makes nothing', async () => {
    const { a, b, historyA, historyB } = await pair();
    expect(await friendsOp(a, 'add-from-room', historyA)).toEqual({
      status: 200,
      body: { ok: true, friends: false },
    });
    expect(await pressed(historyA)).toBe(true);
    expect(await friendsOp(a, 'withdraw-add', historyA)).toEqual({
      status: 200,
      body: { ok: true, friends: false },
    });
    expect(await pressed(historyA)).toBe(false);
    expect(await intents(a.userId)).toBe(0);

    expect(await friendsOp(b, 'add-from-room', historyB)).toEqual({
      status: 200,
      body: { ok: true, friends: false },
    });
    expect(await areFriends(a, b)).toBe(false);
    // Pressing again after taking it back counts again: now the pair match.
    expect(await friendsOp(a, 'add-from-room', historyA)).toEqual({
      status: 200,
      body: { ok: true, friends: true },
    });
    expect(await areFriends(a, b)).toBe(true);
  });

  it('ignores a take-back after the match and says the pair are friends', async () => {
    const { a, b, historyA, historyB } = await pair();
    expect((await friendsOp(a, 'add-from-room', historyA)).status).toBe(200);
    expect(await friendsOp(b, 'add-from-room', historyB)).toEqual({
      status: 200,
      body: { ok: true, friends: true },
    });
    expect(await friendsOp(a, 'withdraw-add', historyA)).toEqual({
      status: 200,
      body: { ok: true, friends: true },
    });
    expect(await pressed(historyA)).toBe(true);
    expect(await areFriends(a, b)).toBe(true);
    // A press of an unpressed or another's record does nothing, alike.
    expect(await friendsOp(b, 'withdraw-add', historyA)).toEqual({
      status: 200,
      body: { ok: true, friends: false },
    });
  });

  // Rule 4: a friend who sat anonymously is not named by "Arkadaş ekle" or by taking it back; a
  // friendship from before answers like a press that matched nothing.
  it('tells a friendship from before through neither the press nor the take-back (rule 4)', async () => {
    const { a, b, historyA, historyB } = await pair();
    await sql`select private.make_friends(${a.userId}::uuid, ${b.userId}::uuid, 'request')`;
    const nothing = { status: 200, body: { ok: true, friends: false } };
    expect(await friendsOp(a, 'add-from-room', historyA)).toEqual(nothing);
    expect(await friendsOp(a, 'withdraw-add', historyA)).toEqual(nothing);
    expect(await pressed(historyA)).toBe(false);
    expect(await friendsOp(b, 'add-from-room', historyB)).toEqual(nothing);
    expect(await friendsOp(a, 'add-from-room', historyA)).toEqual(nothing);
    expect(await intents(a.userId)).toBe(0);
  });

  it('takes back only a silent press: an "İstek gönder" record keeps its request', async () => {
    const { a, b, historyA } = await pair();
    await sql`update public.play_history set friend_open = false where id = ${historyA}`;
    expect(await friendsOp(a, 'request', historyA)).toEqual({ status: 200, body: { ok: true } });
    expect(await pressed(historyA)).toBe(true);
    expect(await friendsOp(a, 'withdraw-add', historyA)).toEqual({
      status: 200,
      body: { ok: true, friends: false },
    });
    expect(await pressed(historyA)).toBe(true);
    const sent = await a.client.rpc('my_sent_requests');
    expect(sent.data).toHaveLength(1);
    const incoming = await b.client.rpc('my_incoming_requests');
    expect(incoming.data).toHaveLength(1);
  });

  it('leaves the other’s record and requests as they were when one takes back', async () => {
    const { a, b, historyA, historyB } = await pair();
    const snapshot = async () => ({
      record: await sql`select * from public.play_history where id = ${historyB}`,
      incoming: (await b.client.rpc('my_incoming_requests')).data,
      sent: (await b.client.rpc('my_sent_requests')).data,
    });
    const before = await snapshot();
    expect((await friendsOp(a, 'add-from-room', historyA)).status).toBe(200);
    expect((await friendsOp(a, 'withdraw-add', historyA)).status).toBe(200);
    expect(await snapshot()).toEqual(before);
  });

  // §4.K: the take-back and the other's press at once end either way, and friend_action_at tells
  // which: friends and pressed, or no friendship and unpressed.
  it('settles a take-back and the other’s press at once to one outcome (locks)', async () => {
    for (const order of ['take-back first', 'press first'] as const) {
      const { a, b, historyA, historyB } = await pair();
      expect((await friendsOp(a, 'add-from-room', historyA)).status).toBe(200);

      const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const taking = postgres(dbUrl, { max: 1, onnotice: () => {} });
      const pressing = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        let done: Promise<unknown> = Promise.resolve();
        await holder.begin(async (tx) => {
          await tx`select private.lock_pair(${a.userId}, ${b.userId})`;
          const take = () =>
            taking`select public.friends_withdraw_add(${a.userId}, ${historyA}) as outcome`.execute();
          const press = () =>
            pressing`select outcome from public.friends_add_from_room(${b.userId}, ${historyB})`.execute();
          if (order === 'take-back first') {
            const t = take();
            await waitUntilBlocked('friends_withdraw_add');
            const p = press();
            await waitUntilBlocked('friends_add_from_room');
            done = Promise.all([t, p]);
          } else {
            const p = press();
            await waitUntilBlocked('friends_add_from_room');
            const t = take();
            await waitUntilBlocked('friends_withdraw_add');
            done = Promise.all([p, t]);
          }
        });
        await done;
      } finally {
        await Promise.all([holder.end(), taking.end(), pressing.end()]);
      }
      const friends = await areFriends(a, b);
      expect(await pressed(historyA), order).toBe(friends);
      expect(friends, order).toBe(order === 'press first');
      for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
    }
  });
});
