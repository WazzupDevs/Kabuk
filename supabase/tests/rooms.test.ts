// Tables (docs/SPEC_V4.md §4.E) around the edges: the paths that lock a check-in, the scheduled
// jobs and the closed helpers. The table model itself is tableModel.test.ts's.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ROOM_IDLE_MINUTES } from '../functions/_shared/pure/rooms.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { checkInAt, onboarded, PHONES } from './helpers.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

let venue: Record<string, string> = {};
const V = 'at-anchor';

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

const rooms = (client: Client, body: Record<string, unknown>) => invoke(client, 'rooms', body);

// "Masa kur", in the lobby.
async function createRoom(client: Client): Promise<string> {
  const res = await rooms(client, { action: 'create' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as { roomId: string }).roomId;
}

async function tables(client: Client, key = V) {
  const { data, error } = await client.rpc('venue_tables', { target_venue_id: venue[key] ?? '' });
  expect(error).toBeNull();
  return data ?? [];
}

async function requestJoin(client: Client, roomId: string) {
  return rooms(client, { action: 'request-join', roomId });
}

async function pendingRequestIds(owner: Client, roomId: string): Promise<string[]> {
  const { data } = await owner
    .from('join_requests')
    .select('id')
    .eq('room_id', roomId)
    .eq('status', 'pending');
  return (data ?? []).map((r) => r.id);
}

async function expireRequestsOf(client: Client): Promise<void> {
  await sql`
    update public.join_requests jr set expires_at = now() - interval '1 second'
    from public.table_sessions ts
    where ts.id = jr.requester_session_id and ts.user_id = ${await userIdOf(client)}
  `;
}

// Three people checked in at the same venue.
async function threeTables(): Promise<[Client, Client, Client]> {
  const clients = await Promise.all(PHONES.map((p) => onboarded(p)));
  for (const c of clients) await checkInAt(c, venue, V);
  return clients as [Client, Client, Client];
}

describe('venue_tables', () => {
  it('lists no table of another venue', async () => {
    const [owner, other] = await threeTables();
    const roomId = await createRoom(owner);
    expect((await tables(other)).map((r) => r.room_id)).toEqual([roomId]);
    const elsewhere = await onboarded(PHONES[2]);
    await checkInAt(elsewhere, venue, 'near');
    expect(await tables(elsewhere, V)).toEqual([]);
  });
});

describe('locks', () => {
  type Tx = postgres.TransactionSql;
  // Every path that locks a check-in, run inside a transaction that stays open.
  const sessionLockers: [
    string,
    (tx: Tx, userId: string, sessionId: string) => Promise<unknown>,
  ][] = [
    [
      'an action (active_session_for_update)',
      (tx, userId) => tx`select id from private.active_session_for_update(${userId})`,
    ],
    ['leaving (end_table_session)', (tx, userId) => tx`select public.end_table_session(${userId})`],
    [
      'checking in again (start_table_session)',
      (tx, userId) =>
        tx`select public.start_table_session(${userId}, ${venue[V] ?? ''}, 'test', 10, null, null)`,
    ],
    [
      // docs/SPEC_V4.md §4.D: the check-in's one change of identity.
      'changing the identity (set_checkin_identity)',
      (tx, userId) => tx`select id from public.set_checkin_identity(${userId}, 'anonymous')`,
    ],
    [
      'writing in the venue chat (venue_chat_send_once)',
      (tx, userId) =>
        tx`select message_id from public.venue_chat_send_once(${userId}, ${venue[V] ?? ''}, 'kilit',
             3000, 600, 20, (select identity_mode from public.table_sessions where user_id = ${userId} and status = 'active'))`,
    ],
    [
      'the expiry job (end_expired_table_sessions)',
      async (tx, _userId, sessionId) => {
        await tx`update public.table_sessions set expires_at = now() - interval '1 minute'
                 where id = ${sessionId}`;
        return tx`select private.end_expired_table_sessions()`;
      },
    ],
  ];

  // Both tables ending a Tabu turn at once deadlocked: the owner, holding the room, wrote the next
  // turn whose describer is the guest's session while the guest held that row FOR UPDATE. Rows
  // still reference check-ins (room_members, join_requests, messages): no path takes FOR UPDATE.
  it.each(sessionLockers)(
    "lets rows reference a table's session while %s holds it",
    async (_name, lock) => {
      const client = await onboarded(PHONES[0]);
      const { sessionId } = await checkInAt(client, venue, V);
      const userId = await userIdOf(client);
      const other = postgres(dbUrl, { max: 1, onnotice: () => {} });
      try {
        await sql.begin(async (tx) => {
          await lock(tx, userId, sessionId);
          // What a foreign key check takes on the referenced row.
          const referenced = await other.begin(async (otx) => {
            await otx`set local lock_timeout = '2s'`;
            return otx`select id from public.table_sessions where id = ${sessionId} for key share`;
          });
          expect(referenced).toHaveLength(1);
        });
      } finally {
        await other.end();
      }
    },
  );
});

describe('scheduled jobs', () => {
  it('closes one-person tables idle for ROOM_IDLE_MINUTES and expires old requests', async () => {
    const [owner, requester] = await threeTables();
    const roomId = await createRoom(owner);
    await requestJoin(requester, roomId);
    await expireRequestsOf(requester);

    await sql`select private.expire_join_requests()`;
    const [jr] = await sql`select status from public.join_requests where room_id = ${roomId}`;
    expect(jr?.status).toBe('expired');

    await sql`update public.rooms set last_activity_at = now() - make_interval(mins => ${ROOM_IDLE_MINUTES + 1}) where id = ${roomId}`;
    await sql`select private.close_idle_rooms(${ROOM_IDLE_MINUTES})`;
    const [room] = await sql`select status from public.rooms where id = ${roomId}`;
    expect(room?.status).toBe('closed');

    const jobs =
      await sql`select jobname from cron.job where jobname in ('close-idle-rooms', 'expire-join-requests') order by jobname`;
    expect(jobs.map((j) => j.jobname)).toEqual(['close-idle-rooms', 'expire-join-requests']);
  });

  it('skips a room or request a user action holds instead of waiting for it', async () => {
    const [owner, requester] = await threeTables();
    const roomId = await createRoom(owner);
    await requestJoin(requester, roomId);
    await expireRequestsOf(requester);
    await sql`update public.rooms set last_activity_at = now() - make_interval(mins => ${ROOM_IDLE_MINUTES + 1}) where id = ${roomId}`;

    const job = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await sql.begin(async (tx) => {
        await tx`select id from public.rooms where id = ${roomId} for update`;
        await tx`select id from public.join_requests where room_id = ${roomId} for update`;
        const [ran] = await job.begin(async (jtx) => {
          await jtx`set local lock_timeout = '2s'`;
          return jtx`
            select private.close_idle_rooms(${ROOM_IDLE_MINUTES}) as rooms,
                   private.expire_join_requests() as requests
          `;
        });
        expect(ran).toEqual({ rooms: 0, requests: 0 });
      });
    } finally {
      await job.end();
    }
    // The next run takes them.
    const [next] = await sql`
      select private.close_idle_rooms(${ROOM_IDLE_MINUTES}) as rooms,
             private.expire_join_requests() as requests
    `;
    expect(next).toEqual({ rooms: 1, requests: 1 });
  });

  // Step 23.3 (docs/SPEC_V3.md §23.G), §4.E: people at one table talk with their phones away, so
  // an idle table of two or more is neither closed nor ended.
  it('leaves an idle table of two open', async () => {
    const [owner, guest] = await threeTables();
    const roomId = await createRoom(owner);
    await requestJoin(guest, roomId);
    const [requestId] = await pendingRequestIds(owner, roomId);
    await rooms(owner, { action: 'respond', requestId, accept: true });
    await sql`update public.rooms set last_activity_at = now() - make_interval(mins => ${ROOM_IDLE_MINUTES + 1}) where id = ${roomId}`;
    await sql`select private.close_idle_rooms(${ROOM_IDLE_MINUTES})`;
    const [room] = await sql`select status from public.rooms where id = ${roomId}`;
    expect(room).toEqual({ status: 'active' });
  });

  it('runs the idle job every minute with the numbers of pure/, and no proposal job', async () => {
    const jobs = await sql`
      select jobname, schedule, command from cron.job
      where jobname in ('close-idle-rooms', 'expire-game-proposals') order by jobname
    `;
    expect(jobs).toEqual([
      {
        jobname: 'close-idle-rooms',
        schedule: '* * * * *',
        command: `select private.close_idle_rooms(${ROOM_IDLE_MINUTES})`,
      },
    ]);
  });
});

describe('push tokens and closed helpers', () => {
  it('stores a valid Expo token, rejects others and clears on null', async () => {
    const client = await onboarded(PHONES[0]);
    const id = await userIdOf(client);
    const token = 'ExponentPushToken[integration-test]';
    expect((await invoke(client, 'account', { action: 'register-push', token })).status).toBe(200);
    expect(
      (await sql`select push_token from public.profiles where id = ${id}`)[0]?.push_token,
    ).toBe(token);
    expect(
      (await invoke(client, 'account', { action: 'register-push', token: 'nope' })).status,
    ).toBe(400);
    await invoke(client, 'account', { action: 'register-push', token: null });
    expect(
      (await sql`select push_token from public.profiles where id = ${id}`)[0]?.push_token,
    ).toBeNull();
  });

  it("takes a phone's token from the account that had it before (audit AUTH-12)", async () => {
    const first = await onboarded(PHONES[0]);
    const second = await onboarded(PHONES[1]);
    const token = 'ExponentPushToken[integration-shared]';
    const tokenOf = async (client: typeof first) =>
      (await sql`select push_token from public.profiles where id = ${await userIdOf(client)}`)[0]
        ?.push_token;
    await invoke(first, 'account', { action: 'register-push', token });
    await invoke(second, 'account', { action: 'register-push', token });
    expect(await tokenOf(first)).toBeNull();
    expect(await tokenOf(second)).toBe(token);
  });

  it('keeps table state changes server-side only', async () => {
    const client = await onboarded(PHONES[0]);
    const id = await userIdOf(client);
    const roomId = '00000000-0000-0000-0000-000000000000';
    for (const [fn, args] of [
      ['rooms_create', { target_user_id: id }],
      ['rooms_set_visibility', { target_user_id: id, target_room_id: roomId, in_lobby: true }],
      [
        'rooms_request_join',
        { target_user_id: id, target_room_id: roomId, ttl_seconds: 60, max_per_hour: 10 },
      ],
      ['rooms_respond', { target_user_id: id, target_request_id: roomId, accept: true }],
      ['rooms_leave', { target_user_id: id, target_room_id: roomId }],
      ['rooms_end_game', { target_user_id: id, target_room_id: roomId }],
      ['rooms_end', { target_user_id: id }],
    ] as const) {
      const { error } = await client.rpc(fn, args as never);
      expect(error?.code, fn).toBe('42501');
    }
    // The side model's own calls are gone (step 4.5), the game proposals and rooms_end's
    // decision_seconds too (step 4.8b, docs/SPEC_V4.md §4.H).
    for (const [fn, args] of [
      ['rooms_create_solo', { target_user_id: id }],
      ['reroll_table_alias', { target_user_id: id, new_alias: 'Mor Simit', max_rerolls: 3 }],
      [
        'rooms_propose_game',
        { target_user_id: id, target_room_id: roomId, new_concept: 'tabu', ttl_seconds: 30 },
      ],
      ['rooms_end', { target_user_id: id, decision_seconds: 30 }],
    ] as const) {
      const { error } = await client.rpc(fn as never, args as never);
      expect(error?.code, fn).toBe('PGRST202');
    }
  });
});
