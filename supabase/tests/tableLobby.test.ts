// Faz 3 step 23.1, server (docs/SPEC_V3.md §23.C, §23.K, §23.M): the table's lobby. The game tag of
// "Masanı lobiye aç"; a lobby without the 'profilli' flag; "Katıl" from a table waiting in the lobby,
// whose own room closes when the request is accepted and whose members move to the guest side.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CONCEPTS, sessionChannel } from '../functions/_shared/pure/rooms.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitForBroadcast, waitUntilBlocked, withPhotoForChoice } from './helpers.ts';
import { dbUrl, deleteUserByPhone, sql } from './local.ts';
import {
  createRoom,
  FIXTURE_VENUE,
  join,
  type Phone,
  roomRow,
  rooms,
  table,
  TEAM_PHONES,
} from './teamRoom.ts';

let venue: Record<string, string> = {};
const OK = { status: 200, body: { ok: true } };

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  for (const phone of TEAM_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const at = (n: number, opts: { teams?: boolean } = {}) => table(venue, n, opts);

type TupleOf<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;

async function tables<N extends number>(count: N): Promise<TupleOf<Phone, N>> {
  return (await Promise.all(Array.from({ length: count }, (_, i) => at(i)))) as TupleOf<Phone, N>;
}

// "Katıl" (side omitted) or "Bu masadayım" (side given).
function ask(p: Phone, roomId: string, side?: 'owner' | 'guest') {
  return rooms(p, { action: 'request-join', roomId, profiled: false, ...(side ? { side } : {}) });
}

async function requestIdOf(p: Phone, roomId: string): Promise<string> {
  const [row] = await sql`
    select id from public.join_requests
    where room_id = ${roomId} and requester_session_id = ${p.sessionId}
    order by created_at desc limit 1
  `;
  if (!row) throw new Error('no request');
  return row.id as string;
}

const respond = (leader: Phone, requestId: string, accept: boolean) =>
  rooms(leader, { action: 'respond', requestId, accept });

const lobbyOf = async (p: Phone) =>
  (await p.client.rpc('venue_lobby', { target_venue_id: venue[FIXTURE_VENUE] ?? '' })).data ?? [];
const lobbyIds = async (p: Phone) => (await lobbyOf(p)).map((r) => r.room_id).sort();
const tagsOf = async (p: Phone) =>
  (await p.client.rpc('venue_lobby_tags', { target_venue_id: venue[FIXTURE_VENUE] ?? '' })).data ??
  [];

const readsRoom = async (p: Phone, roomId: string) =>
  ((await p.client.from('rooms').select('id').eq('id', roomId)).data ?? []).length === 1;

async function myStatus(p: Phone, requestId: string): Promise<string | null> {
  const { data } = await p.client.from('my_join_requests').select('status').eq('id', requestId);
  return (data?.[0]?.status as string | undefined) ?? null;
}

async function expire(requestId: string) {
  await sql`update public.join_requests set expires_at = now() - interval '1 second' where id = ${requestId}`;
}

// The room's open phone rows agree with its counts and leaders (teams.test.ts → expectConsistent).
async function expectConsistent(roomId: string): Promise<void> {
  const r = await roomRow(roomId);
  const rows = await sql`
    select session_id, side from public.room_members where room_id = ${roomId} and left_at is null
  `;
  if (r.status === 'closed') {
    expect(rows).toEqual([]);
    return;
  }
  const on = (side: string) => rows.filter((x) => x.side === side).map((x) => x.session_id);
  expect(on('owner')).toContain(r.owner_session_id);
  expect(r.owner_phones).toBe(on('owner').length);
  if (r.guest_session_id) {
    expect(on('guest')).toContain(r.guest_session_id);
    expect(r.guest_phones).toBe(on('guest').length);
  } else {
    expect(r.guest_phones).toBeNull();
  }
}

// Joins a private channel; resolves with the final status (teams.test.ts → joinChannel).
function joinChannel(p: Phone, topic: string): Promise<string> {
  const channel = p.client.channel(topic, { config: { private: true } });
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      void p.client.removeChannel(channel);
      resolve('TIMED_OUT');
    }, 8000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        void p.client.removeChannel(channel);
        resolve(status);
      }
    });
  });
}

describe('the game tag (§23.C)', () => {
  it('keeps the tag by room for the lobby, none as "fark etmez", and refuses an unknown one', async () => {
    const [tagged, plain, viewer] = await tables(3);
    const created = await rooms(tagged, { action: 'create', profiled: false, gameTag: 'tabu' });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const taggedRoom = (created.body as { roomId: string }).roomId;
    const plainRoom = await createRoom(plain);

    const tags = await tagsOf(viewer);
    expect([...tags].sort((a, b) => a.room_id.localeCompare(b.room_id))).toEqual(
      [
        { room_id: taggedRoom, game_tag: 'tabu' },
        { room_id: plainRoom, game_tag: null },
      ].sort((a, b) => a.room_id.localeCompare(b.room_id)),
    );
    // Exactly venue_lobby's rooms: not the caller's own.
    expect(await tagsOf(tagged)).toEqual([{ room_id: plainRoom, game_tag: null }]);
    expect((await roomRow(taggedRoom)).game_tag).toBe('tabu');

    expect(
      await rooms(viewer, { action: 'create', profiled: false, gameTag: 'poker' }),
    ).toMatchObject({ status: 400, body: errorBody('bad_request') });
  });

  it('allows the values of pure/rooms.ts → CONCEPTS and nothing else', async () => {
    const [row] = await sql`
      select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'rooms_game_tag_check'
    `;
    const values = [...String(row?.def).matchAll(/'([a-z]+)'::text/g)].map((m) => m[1]);
    expect(values.sort()).toEqual([...CONCEPTS].sort());
  });
});

describe('the lobby without the "profilli" flag (rule 4, §23.C)', () => {
  it("keeps venue_lobby's columns and answers profiled false, with no account or profile id", async () => {
    const [owner, viewer] = await tables(2);
    const created = await withPhotoForChoice(owner.client, () =>
      rooms(owner, { action: 'create', profiled: true, intent: 'chat', gameTag: 'harf' }),
    );
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;
    expect((await roomRow(roomId)).owner_profiled).toBe(true);

    const lobby = await lobbyOf(viewer);
    expect(Object.keys(lobby[0] ?? {}).sort()).toEqual(
      [
        'alias',
        'headcount',
        'intent',
        'profiled',
        'room_id',
        'spot_id',
        'spot_name',
        'waiting_since',
      ].sort(),
    );
    expect(lobby).toEqual([expect.objectContaining({ room_id: roomId, profiled: false })]);

    const [ids] = await sql`
      select p.public_id from public.profiles p where p.id = ${owner.userId}
    `;
    const seen = JSON.stringify({ lobby, tags: await tagsOf(viewer) });
    expect(seen).not.toContain(owner.userId);
    expect(seen).not.toContain(String(ids?.public_id));
    expect(seen).not.toContain(owner.sessionId);
  });
});

describe('"Katıl" from a table waiting in the lobby (§23.C)', () => {
  it('sends the request; the accept closes the waiting room and seats the table as the guest', async () => {
    const [host, waiting, viewer] = await tables(3);
    const hostRoom = await createRoom(host);
    const ownRoom = await createRoom(waiting);
    expect(await lobbyIds(viewer)).toEqual([hostRoom, ownRoom].sort());

    expect((await ask(waiting, hostRoom)).status).toBe(200);
    expect(await respond(host, await requestIdOf(waiting, hostRoom), true)).toEqual(OK);

    expect(await roomRow(ownRoom)).toMatchObject({ status: 'closed' });
    expect(await roomRow(hostRoom)).toMatchObject({
      status: 'active',
      guest_session_id: waiting.sessionId,
      guest_alias: waiting.alias,
      guest_phones: 1,
    });
    expect(await lobbyIds(viewer)).toEqual([]);
    // The guest's current room (apps/mobile → useCurrentRoom): the host's, the only one open.
    const { data: current } = await waiting.client
      .from('rooms')
      .select('id')
      .in('status', ['waiting', 'active']);
    expect(current).toEqual([{ id: hostRoom }]);
    await expectConsistent(hostRoom);
    await expectConsistent(ownRoom);
  });

  it('leaves the requests on the closed room to end as unavailable, as a decline does (rule 5)', async () => {
    const [host, waiting, asker] = await tables(3);
    const hostRoom = await createRoom(host);
    const ownRoom = await createRoom(waiting);
    expect((await ask(asker, ownRoom)).status).toBe(200);
    const askerRequest = await requestIdOf(asker, ownRoom);

    expect((await ask(waiting, hostRoom)).status).toBe(200);
    expect(await respond(host, await requestIdOf(waiting, hostRoom), true)).toEqual(OK);

    expect(await myStatus(asker, askerRequest)).toBe('pending');
    expect(await respond(waiting, askerRequest, true)).toEqual({
      status: 409,
      body: errorBody('request_expired'),
    });
    await expire(askerRequest);
    expect(await myStatus(asker, askerRequest)).toBe('unavailable');
  });

  it('keeps the waiting room in the lobby after a decline and after a timeout', async () => {
    const [host, waiting, viewer, host2] = await tables(4);
    const hostRoom = await createRoom(host);
    const ownRoom = await createRoom(waiting);
    const hostRoom2 = await createRoom(host2);

    expect((await ask(waiting, hostRoom)).status).toBe(200);
    const declined = await requestIdOf(waiting, hostRoom);
    expect(await respond(host, declined, false)).toEqual(OK);
    expect((await roomRow(ownRoom)).status).toBe('waiting');
    expect(await lobbyIds(viewer)).toContain(ownRoom);
    await expire(declined);

    expect((await ask(waiting, hostRoom2)).status).toBe(200);
    await expire(await requestIdOf(waiting, hostRoom2));
    expect((await roomRow(ownRoom)).status).toBe('waiting');
    expect(await lobbyIds(viewer)).toContain(ownRoom);
    await expectConsistent(ownRoom);
  });

  it('is room_not_available when the waiting room took a guest meanwhile; the request stays pending', async () => {
    const [host, waiting, guest] = await tables(3);
    const hostRoom = await createRoom(host);
    const ownRoom = await createRoom(waiting);
    expect((await ask(waiting, hostRoom)).status).toBe(200);
    const request = await requestIdOf(waiting, hostRoom);
    await join(guest, waiting, ownRoom);

    expect(await respond(host, request, true)).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
    const [row] = await sql`select status from public.join_requests where id = ${request}`;
    expect(row?.status).toBe('pending');
    expect((await roomRow(hostRoom)).status).toBe('waiting');
    expect((await roomRow(ownRoom)).guest_session_id).toBe(guest.sessionId);
  });

  it("moves the waiting room's members to the guest side with their choices (§23.P, decision 3)", async () => {
    const [host, waiting, anonymous, profiled] = await tables(4);
    const hostRoom = await createRoom(host);
    const ownRoom = await createRoom(waiting);
    await join(anonymous, waiting, ownRoom, 'owner');
    const asked = await withPhotoForChoice(profiled.client, () =>
      rooms(profiled, { action: 'request-join', roomId: ownRoom, profiled: true, side: 'owner' }),
    );
    expect(asked.status).toBe(200);
    expect(await respond(waiting, await requestIdOf(profiled, ownRoom), true)).toEqual(OK);

    // The moved phones hear of the accept as their leader does.
    const heard = [anonymous, profiled].map((p) =>
      waitForBroadcast(p.client, sessionChannel(p.sessionId), 'join_accepted'),
    );
    await Promise.all(heard.map((h) => h.subscribed));
    // A moved seat keeps the look it sat down with, whatever the profile's is by then (K-10).
    const seatLook = async (roomId: string) => {
      const [seat] = await sql`
        select look from public.room_members
        where room_id = ${roomId} and session_id = ${anonymous.sessionId} and left_at is null
      `;
      return seat?.look as string | null;
    };
    const satWith = await seatLook(ownRoom);
    expect(satWith).toEqual(expect.any(String));
    const changed =
      satWith === 'c:nane e:koyu h:anten' ? 'c:gul e:acik h:yok' : 'c:nane e:koyu h:anten';
    await sql`
      update public.profiles set capsule_look = ${changed}
      where id = (select user_id from public.table_sessions where id = ${anonymous.sessionId})
    `;
    expect((await ask(waiting, hostRoom)).status).toBe(200);
    expect(await respond(host, await requestIdOf(waiting, hostRoom), true)).toEqual(OK);
    await Promise.all(heard.map((h) => h.received));
    await Promise.all(heard.map((h) => h.close()));

    expect((await roomRow(ownRoom)).status).toBe('closed');
    expect(await seatLook(hostRoom)).toBe(satWith);
    expect(await roomRow(hostRoom)).toMatchObject({
      status: 'active',
      guest_session_id: waiting.sessionId,
      guest_phones: 3,
      owner_phones: 1,
    });
    const seated = await sql`
      select session_id, side, alias, profiled from public.room_members
      where room_id = ${hostRoom} and side = 'guest' and left_at is null
      order by alias
    `;
    expect(seated.map((m) => ({ ...m }))).toEqual(
      [
        { session_id: waiting.sessionId, side: 'guest', alias: waiting.alias, profiled: false },
        { session_id: anonymous.sessionId, side: 'guest', alias: anonymous.alias, profiled: false },
        { session_id: profiled.sessionId, side: 'guest', alias: profiled.alias, profiled: true },
      ].sort((a, b) => a.alias.localeCompare(b.alias)),
    );

    for (const p of [anonymous, profiled]) {
      expect(await readsRoom(p, hostRoom)).toBe(true);
      expect(await readsRoom(p, ownRoom)).toBe(false);
      expect(await joinChannel(p, `room:${hostRoom}`)).toBe('SUBSCRIBED');
      expect(await joinChannel(p, `room:${ownRoom}`)).toBe('CHANNEL_ERROR');
    }
    const { data: phones } = await host.client.rpc('room_phones', { target_room_id: hostRoom });
    expect(
      (phones ?? [])
        .filter((x) => x.side === 'guest')
        .map((x) => x.session_id)
        .sort(),
    ).toEqual([waiting.sessionId, anonymous.sessionId, profiled.sessionId].sort());
    await expectConsistent(hostRoom);
    await expectConsistent(ownRoom);
  });

  it('refuses what it refused before, and the own room', async () => {
    const [host, waiting, member, solo] = await tables(4);
    const hostRoom = await createRoom(host);
    const ownRoom = await createRoom(waiting);

    // "Bu masadayım" from a table in a room, the own room, a private room's table, a member.
    expect(await ask(waiting, hostRoom, 'owner')).toEqual({
      status: 409,
      body: errorBody('already_in_room'),
    });
    expect(await ask(waiting, ownRoom)).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
    expect((await rooms(solo, { action: 'create-solo' })).status).toBe(200);
    expect(await ask(solo, hostRoom)).toEqual({ status: 409, body: errorBody('already_in_room') });
    await join(member, waiting, ownRoom, 'owner');
    expect(await ask(member, hostRoom)).toEqual({
      status: 409,
      body: errorBody('already_in_room'),
    });
    // Still one room per table.
    expect(await rooms(waiting, { action: 'create', profiled: false })).toEqual({
      status: 409,
      body: errorBody('already_in_room'),
    });
  });

  it('keeps a side with members away from a table without `teams` (§22.B)', async () => {
    const [old, waiting, member, waiting2, member2] = await Promise.all([
      at(0, { teams: false }),
      at(1),
      at(2),
      at(3),
      at(4),
    ]);
    const oldRoom = await createRoom(old);
    const ownRoom = await createRoom(waiting);
    await join(member, waiting, ownRoom, 'owner');
    expect(await ask(waiting, oldRoom)).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });

    // A member who comes while the request waits: the accept is room_not_available.
    const ownRoom2 = await createRoom(waiting2);
    expect((await ask(waiting2, oldRoom)).status).toBe(200);
    const request = await requestIdOf(waiting2, oldRoom);
    await join(member2, waiting2, ownRoom2, 'owner');
    expect(await respond(old, request, true)).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
    expect((await roomRow(oldRoom)).status).toBe('waiting');
  });
});

describe('locks (§23.K)', () => {
  // The accept holds the requester's session before the rooms: the requester's own action, holding
  // its session and then its waiting room, never waits on the accept.
  it('lets the requester take its waiting room while the host accepts and waits for its session', async () => {
    const [host, waiting] = await tables(2);
    const hostRoom = await createRoom(host);
    const ownRoom = await createRoom(waiting);
    expect((await ask(waiting, hostRoom)).status).toBe(200);
    const request = await requestIdOf(waiting, hostRoom);
    const holding = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const accepting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let accepted: Promise<unknown> = Promise.resolve();
      await holding.begin(async (tx) => {
        await tx`select id from private.active_session_for_update(${waiting.userId})`;
        accepted = accepting`select (public.rooms_respond(${host.userId}, ${request}, true)).status`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_respond');
        await tx`set local lock_timeout = '2s'`;
        expect(await tx`select id from public.rooms where id = ${ownRoom} for update`).toHaveLength(
          1,
        );
        expect(
          await tx`select id from public.rooms where id = ${hostRoom} for update`,
        ).toHaveLength(1);
      });
      expect(await accepted).toEqual([{ status: 'accepted' }]);
    } finally {
      await Promise.all([holding.end(), accepting.end()]);
    }
    expect((await roomRow(ownRoom)).status).toBe('closed');
    await expectConsistent(hostRoom);
  });

  // Two waiting tables ask each other and both accept: both accepts lock the two rooms in id order,
  // so the second waits for the first and then hears room_not_available; nothing deadlocks.
  it('takes one of two tables accepting each other at once; the other is room_not_available', async () => {
    const [a, b] = await tables(2);
    const roomA = await createRoom(a);
    const roomB = await createRoom(b);
    expect((await ask(a, roomB)).status).toBe(200);
    expect((await ask(b, roomA)).status).toBe(200);
    const aAsks = await requestIdOf(a, roomB);
    const bAsks = await requestIdOf(b, roomA);

    const first = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const second = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let later: Promise<unknown> = Promise.resolve();
      await first.begin(async (tx) => {
        const accepted = await tx`
          select (public.rooms_respond(${a.userId}, ${bAsks}, true)).status
        `;
        expect(accepted).toEqual([{ status: 'accepted' }]);
        later = second`select (public.rooms_respond(${b.userId}, ${aAsks}, true)).status`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_respond');
      });
      expect(await later).toMatchObject({ message: 'room_not_available' });
    } finally {
      await Promise.all([first.end(), second.end()]);
    }
    expect(await roomRow(roomA)).toMatchObject({ status: 'active', guest_session_id: b.sessionId });
    expect((await roomRow(roomB)).status).toBe('closed');
    await expectConsistent(roomA);
    await expectConsistent(roomB);

    // Through the API at once: one 200, one 409 room_not_available.
    const [c, d] = await Promise.all([at(2), at(3)]);
    const roomC = await createRoom(c);
    const roomD = await createRoom(d);
    expect((await ask(c, roomD)).status).toBe(200);
    expect((await ask(d, roomC)).status).toBe(200);
    const both = await Promise.all([
      respond(c, await requestIdOf(d, roomC), true),
      respond(d, await requestIdOf(c, roomD), true),
    ]);
    expect(both.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(both.find((r) => r.status === 409)).toEqual({
      status: 409,
      body: errorBody('room_not_available'),
    });
    await expectConsistent(roomC);
    await expectConsistent(roomD);
  });
});
