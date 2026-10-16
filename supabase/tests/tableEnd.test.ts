// Faz 3 step 23.3, server (docs/SPEC_V3.md §23.G, §23.M): the table's end without the "Tanışalım
// mı?" window. Every road that opened the window closes a two-sided room at once and writes its pairs
// (available at once, friend_open); inactivity leaves a two-sided room alone and closes a one-sided
// room after 30 minutes; "Arkadaş ekle" works on a friend_open record from the table's end and from
// the play history alike.
//
// Staged (§23.N): private.table_end_on() is false until step 23.3's client PR, and today's app keeps
// its window (the rest of the suite runs with it off, unchanged). This file turns it on for its own
// run and puts back what it found; files run one at a time (vitest.integration.config.ts). A run
// killed here leaves it on until `pnpm db:reset`.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { REVEAL } from '../functions/_shared/pure/reveal.ts';
import { BROADCAST, sessionChannel } from '../functions/_shared/pure/rooms.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { deleteUserByPhone, invoke, sql } from './local.ts';
import {
  createRoom,
  leave,
  type Phone,
  roomRow,
  rooms,
  table as checkIn,
  TEAM_PHONES,
  teamRoom,
} from './teamRoom.ts';

// Step 23.3's idle minutes for a one-sided room (§23.G; the cron's argument from step 23.3's
// client PR on).
const TABLE_IDLE_MINUTES = 30;
const OK = { status: 200, body: { ok: true } };

let venue: Record<string, string> = {};
let wasOn = false;

async function setTableEnd(on: boolean) {
  await sql.unsafe(`
    create or replace function private.table_end_on()
    returns boolean
    language sql
    stable
    set search_path = ''
    as $$ select ${on ? 'true' : 'false'}; $$
  `);
}

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
  const [row] = await sql`select private.table_end_on() as on`;
  wasOn = row?.on === true;
  await setTableEnd(true);
});

afterEach(async () => {
  for (const phone of TEAM_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await setTableEnd(wasOn);
  await deleteFixtureVenues(sql);
  await sql.end();
});

const table = (n: number) => checkIn(venue, n);

type TupleOf<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;

async function tables<N extends number>(count: N): Promise<TupleOf<Phone, N>> {
  return (await Promise.all(Array.from({ length: count }, (_, i) => table(i)))) as TupleOf<
    Phone,
    N
  >;
}

// Every phone now in the room has been in it for `minutes` (the 3-minute rule of play history).
async function backdate(roomId: string, minutes = 10) {
  await sql`
    update public.room_members
    set joined_at = joined_at - make_interval(mins => ${minutes})
    where room_id = ${roomId} and left_at is null
  `;
  await sql`
    update public.rooms set guest_joined_at = guest_joined_at - make_interval(mins => ${minutes})
    where id = ${roomId} and guest_joined_at is not null
  `;
}

async function idleFor(roomId: string, minutes: number) {
  await sql`
    update public.rooms set last_activity_at = now() - make_interval(mins => ${minutes})
    where id = ${roomId}
  `;
}

const closeIdle = () =>
  sql`select private.close_idle_rooms(${TABLE_IDLE_MINUTES}, ${REVEAL.decisionSeconds})`;

type HistoryRow = {
  id: string;
  user_id: string;
  other_user_id: string;
  friend_open: boolean;
  reveal_mutual: boolean;
  available: boolean;
};

async function historyOf(roomId: string): Promise<HistoryRow[]> {
  return (await sql`
    select id, user_id, other_user_id, friend_open, reveal_mutual, available_at <= now() as available
    from public.play_history where room_id = ${roomId}
    order by user_id, other_user_id
  `) as unknown as HistoryRow[];
}

const pairsOf = (rows: HistoryRow[]) => rows.map((r) => `${r.user_id}>${r.other_user_id}`).sort();

const pair = (a: Phone, b: Phone) => [`${a.userId}>${b.userId}`, `${b.userId}>${a.userId}`];

async function expectClosedWithoutWindow(roomId: string) {
  const row = await roomRow(roomId);
  expect(row.status).toBe('closed');
  expect(row.closed_at).not.toBeNull();
  expect(row.reveal_ends_at).toBeNull();
  expect(row.reveal_result).toBeNull();
  expect(await sql`select 1 from public.reveal_signals where room_id = ${roomId}`).toHaveLength(0);
  expect(await sql`select 1 from public.reveal_decisions where room_id = ${roomId}`).toHaveLength(
    0,
  );
  expect(
    await sql`select 1 from public.room_members where room_id = ${roomId} and left_at is null`,
  ).toHaveLength(0);
}

// The broadcasts a phone's session: channel receives, by event.
async function sessionEvents(p: Phone) {
  const events: string[] = [];
  const channel = p.client.channel(sessionChannel(p.sessionId), { config: { private: true } });
  await new Promise<void>((resolve, reject) => {
    channel
      .on('broadcast', { event: '*' }, (msg: { event: string }) => events.push(msg.event))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(status));
      });
  });
  return { events, close: async () => void (await p.client.removeChannel(channel)) };
}

describe('every road closes a two-sided room at once (§23.G)', { timeout: 90_000 }, () => {
  type Road = 'end' | 'leave' | 'block' | 'venue' | 'expiry';
  const roads: Road[] = ['end', 'leave', 'block', 'venue', 'expiry'];

  // The guest's side is one phone: its leaving is the side's last phone leaving.
  async function take(road: Road, owner: Phone, guest: Phone, roomId: string) {
    if (road === 'end') return rooms(owner, { action: 'end' });
    if (road === 'leave') return leave(guest, roomId);
    if (road === 'block') {
      return invoke(guest.client, 'safety', {
        action: 'block',
        roomId,
        sessionId: owner.sessionId,
      });
    }
    if (road === 'venue') return invoke(guest.client, 'checkin', { action: 'leave' });
    await sql`
      update public.table_sessions set expires_at = now() - interval '1 minute'
      where id = ${guest.sessionId}
    `;
    await sql`select private.end_expired_table_sessions()`;
    return OK;
  }

  for (const road of roads) {
    it(`closes on ${road}, writing the pair's records open to "Arkadaş ekle"`, async () => {
      const [owner, guest] = await tables(2);
      const roomId = await teamRoom(owner, guest);
      await backdate(roomId);

      expect((await take(road, owner, guest, roomId)).status).toBe(200);
      await expectClosedWithoutWindow(roomId);

      const history = await historyOf(roomId);
      expect(pairsOf(history)).toEqual(pair(owner, guest).sort());
      for (const row of history) {
        expect(row).toMatchObject({ friend_open: true, reveal_mutual: false, available: true });
      }
      // The owner reads its record at once (RLS: available_at <= now()).
      const { data } = await owner.client
        .from('play_history')
        .select('friend_open')
        .eq('room_id', roomId);
      expect(data).toEqual([{ friend_open: true }]);
    });
  }

  it('writes every pair across the sides once and none within a side', async () => {
    const [owner, guest, ownerMember, guestMember] = await tables(4);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember], guest: [guestMember] });
    await backdate(roomId);

    // A member who leaves first writes its own pairs then; the close does not write them again.
    expect(await leave(guestMember, roomId)).toEqual(OK);
    const early = await historyOf(roomId);
    expect(pairsOf(early)).toEqual(
      [...pair(owner, guestMember), ...pair(ownerMember, guestMember)].sort(),
    );
    expect(early.every((r) => r.friend_open && r.available)).toBe(true);

    expect(await rooms(owner, { action: 'end' })).toEqual(OK);
    await expectClosedWithoutWindow(roomId);
    const history = await historyOf(roomId);
    expect(pairsOf(history)).toEqual(
      [
        ...pair(owner, guest),
        ...pair(owner, guestMember),
        ...pair(ownerMember, guest),
        ...pair(ownerMember, guestMember),
      ].sort(),
    );
    expect(history.every((r) => r.friend_open && r.available)).toBe(true);
    expect(new Set(history.map((r) => r.id)).size).toBe(8);
  });

  it("writes the side's last phone's pairs when its leaving closes the room", async () => {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    await backdate(roomId);

    expect(await leave(guest, roomId)).toEqual(OK);
    await expectClosedWithoutWindow(roomId);
    expect(pairsOf(await historyOf(roomId))).toEqual(
      [...pair(owner, guest), ...pair(ownerMember, guest)].sort(),
    );
  });

  it('writes nothing for a pair together for less than 3 minutes', async () => {
    const [owner, guest] = await tables(2);
    const roomId = await teamRoom(owner, guest);

    expect(await rooms(owner, { action: 'end' })).toEqual(OK);
    await expectClosedWithoutWindow(roomId);
    expect(await historyOf(roomId)).toEqual([]);
  });

  it('opens no window afterwards: no answer is taken and no reveal_match is sent', async () => {
    const [owner, guest] = await tables(2);
    const roomId = await teamRoom(owner, guest);
    await backdate(roomId);
    const heard = await sessionEvents(owner);

    expect(await rooms(owner, { action: 'end' })).toEqual(OK);
    for (const p of [owner, guest]) {
      const res = await invoke(p.client, 'reveal', { action: 'decide', roomId, wantsMeet: true });
      expect(res.status).not.toBe(200);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    expect(heard.events).not.toContain(BROADCAST.revealMatch);
    await heard.close();
    await expectClosedWithoutWindow(roomId);
  });
});

describe('inactivity (§23.G, §23.P-1)', { timeout: 60_000 }, () => {
  it('leaves a two-sided room alone however long it is quiet', async () => {
    const [owner, guest] = await tables(2);
    const roomId = await teamRoom(owner, guest);
    await idleFor(roomId, 240);

    await closeIdle();
    expect((await roomRow(roomId)).status).toBe('active');
  });

  it('closes a table waiting in the lobby after 30 minutes, not before; its requests end unavailable', async () => {
    const [waiting, asker] = await tables(2);
    const roomId = await createRoom(waiting);
    expect((await rooms(asker, { action: 'request-join', roomId, profiled: false })).status).toBe(
      200,
    );
    const [request] = await sql`
      select id from public.join_requests where room_id = ${roomId} and status = 'pending'
    `;

    await idleFor(roomId, TABLE_IDLE_MINUTES - 1);
    await closeIdle();
    expect((await roomRow(roomId)).status).toBe('waiting');

    await idleFor(roomId, TABLE_IDLE_MINUTES + 1);
    await closeIdle();
    expect((await roomRow(roomId)).status).toBe('closed');

    await sql`
      update public.join_requests set expires_at = now() - interval '1 second'
      where id = ${request?.id}
    `;
    const { data } = await asker.client
      .from('my_join_requests')
      .select('status')
      .eq('id', request?.id ?? '');
    expect(data).toEqual([{ status: 'unavailable' }]);
  });

  it('closes a "Masanla oyna" room after 30 minutes, not before', async () => {
    const [solo] = await tables(1);
    const created = await rooms(solo, { action: 'create-solo' });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;

    await idleFor(roomId, TABLE_IDLE_MINUTES - 1);
    await closeIdle();
    expect((await roomRow(roomId)).status).not.toBe('closed');

    await idleFor(roomId, TABLE_IDLE_MINUTES + 1);
    await closeIdle();
    expect((await roomRow(roomId)).status).toBe('closed');
  });
});

describe('"Arkadaş ekle" on a friend_open record (§23.G)', { timeout: 60_000 }, () => {
  const historyId = async (p: Phone, other: Phone, roomId: string) => {
    const [row] = await sql`
      select id from public.play_history
      where room_id = ${roomId} and user_id = ${p.userId} and other_user_id = ${other.userId}
    `;
    if (!row) throw new Error('no history');
    return row.id as string;
  };
  const addFromRoom = async (p: Phone, other: Phone, roomId: string) =>
    invoke(p.client, 'friends', {
      action: 'add-from-room',
      historyId: await historyId(p, other, roomId),
    });
  const friendsOf = async (a: Phone, b: Phone) =>
    sql`
      select 1 from public.friendships
      where (user_a = ${a.userId} and user_b = ${b.userId})
         or (user_a = ${b.userId} and user_b = ${a.userId})
    `;

  // An owner and a member on one side, a guest on the other, together for 10 minutes; ended.
  async function endedTable() {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    await backdate(roomId);
    expect(await rooms(owner, { action: 'end' })).toEqual(OK);
    return { owner, guest, ownerMember, roomId };
  }

  it('makes the pair friends when both press, and nothing the other sees when one does', async () => {
    const { owner, guest, ownerMember, roomId } = await endedTable();

    expect((await addFromRoom(owner, guest, roomId)).status).toBe(200);
    expect(await friendsOf(owner, guest)).toHaveLength(0);
    const second = await addFromRoom(guest, owner, roomId);
    expect(second.status).toBe(200);
    expect(await friendsOf(owner, guest)).toHaveLength(1);

    // One press: no friendship, no request, and the guest's own record with the member untouched.
    expect((await addFromRoom(ownerMember, guest, roomId)).status).toBe(200);
    expect(await friendsOf(ownerMember, guest)).toHaveLength(0);
    expect(
      await sql`select 1 from public.friend_requests where from_user_id = ${ownerMember.userId}`,
    ).toHaveLength(0);
    const [guestRow] = await sql`
      select friend_action_at from public.play_history
      where id = ${await historyId(guest, ownerMember, roomId)}
    `;
    expect(guestRow?.friend_action_at).toBeNull();
  });

  // The table's end and the play history send the same call; there is no time limit, so a press
  // days later from the history meets a press made at the table's end.
  it('makes them friends when one presses at the end and the other days later from the history', async () => {
    const { owner, guest, roomId } = await endedTable();
    expect((await addFromRoom(owner, guest, roomId)).status).toBe(200);
    await sql`
      update public.play_history
      set played_at = played_at - interval '5 days', available_at = available_at - interval '5 days'
      where room_id = ${roomId}
    `;
    expect((await addFromRoom(guest, owner, roomId)).status).toBe(200);
    expect(await friendsOf(owner, guest)).toHaveLength(1);
  });

  it('opens nothing on an older record without a mutual "Evet"', async () => {
    const { owner, guest, roomId } = await endedTable();
    await sql`update public.play_history set friend_open = false where room_id = ${roomId}`;

    expect((await addFromRoom(owner, guest, roomId)).status).toBe(200);
    expect((await addFromRoom(guest, owner, roomId)).status).toBe(200);
    expect(await friendsOf(owner, guest)).toHaveLength(0);
    expect(await sql`select 1 from public.mutual_friend_intents`).toHaveLength(0);
  });
});

describe("staged: off until step 23.3's client (§23.N)", { timeout: 60_000 }, () => {
  it('opens the window as before while table end is off, writing records without friend_open', async () => {
    await setTableEnd(false);
    try {
      const [owner, guest, ownerMember, idleOwner, idleGuest] = await tables(5);
      const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
      await backdate(roomId);
      expect(await leave(ownerMember, roomId)).toEqual(OK);
      expect(await rooms(owner, { action: 'end' })).toEqual(OK);

      const row = await roomRow(roomId);
      expect(row.status).toBe('ending');
      expect(row.reveal_ends_at).not.toBeNull();
      const history = await historyOf(roomId);
      expect(history.length).toBeGreaterThan(0);
      expect(history.every((r) => !r.friend_open)).toBe(true);

      // Inactivity: today's 10 minutes open the window of a two-sided room.
      const idleRoom = await teamRoom(idleOwner, idleGuest);
      await idleFor(idleRoom, 11);
      await sql`select private.close_idle_rooms(10, ${REVEAL.decisionSeconds})`;
      expect((await roomRow(idleRoom)).status).toBe('ending');
    } finally {
      await setTableEnd(true);
    }
  });
});
