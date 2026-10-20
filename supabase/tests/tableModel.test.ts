// Faz 4 step 4.5, server part 1 (docs/SPEC_V4.md §4.E, §4.K, §4.M "Adım 4.5"; the plan:
// docs/decisions/4.5-masa-modeli.md): a table's name and icon (K-45, K-59), and taking back the
// silent "Arkadaş ekle" (K-67) with the match told to the pair (K-70), never a friendship from
// before (rule 4). Additive: today's app keeps
// working (rooms.test.ts, teams.test.ts and tableEnd.test.ts stay as they are).
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { TABLE_ICONS } from '../functions/_shared/pure/tableIcons.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, waitUntilBlocked } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import { createRoom, type Phone, roomRow, rooms, table, TEAM_PHONES } from './teamRoom.ts';

let venue: Record<string, string> = {};
const ICON_IDS = TABLE_ICONS.map((i) => i.id);

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  await sql`update public.table_icons set is_active = true`;
  for (const phone of TEAM_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const at = (n: number) => table(venue, n);

describe('a table’s name and icon (K-45)', () => {
  it('gives every new table a name and a free icon, whichever way it is created', async () => {
    const [a, b] = await Promise.all([at(0), at(1)]);
    const lobby = await createRoom(a);
    const solo = await rooms(b, { action: 'create-solo' });
    expect(solo.status, JSON.stringify(solo.body)).toBe(200);
    const [r1, r2] = [
      await roomRow(lobby),
      await roomRow((solo.body as { roomId: string }).roomId),
    ];
    for (const r of [r1, r2]) {
      expect(r.name).toMatch(/^\S+ \S+$/);
      expect(ICON_IDS).toContain(r.icon);
      expect(r.name_rerolls).toBe(0);
    }
    expect(r1.icon).not.toBe(r2.icon);
    expect(r1.name).not.toBe(r2.name);
  });

  it('takes the owner’s icon at creation, and refuses one another table has', async () => {
    const [a, b] = await Promise.all([at(0), at(1)]);
    const created = await rooms(a, { action: 'create', profiled: false, icon: 'kis-kardanadam' });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    expect((await roomRow((created.body as { roomId: string }).roomId)).icon).toBe(
      'kis-kardanadam',
    );
    expect(await rooms(b, { action: 'create', profiled: false, icon: 'kis-kardanadam' })).toEqual({
      status: 409,
      body: errorBody('icon_taken'),
    });
    // Not an icon of the list: refused before the database.
    expect((await rooms(b, { action: 'create', profiled: false, icon: 'kis-yok' })).status).toBe(
      400,
    );
  });

  it('lets only the owner change the icon (K-59) and draw a new name three times', async () => {
    const [a, b] = await Promise.all([at(0), at(1)]);
    const roomId = await createRoom(a);
    const other = await createRoom(b);
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
    const [a, b] = await Promise.all([at(0), at(1)]);
    const roomId = await createRoom(a);
    const icon = (await roomRow(roomId)).icon as string;
    expect((await rooms(a, { action: 'end' })).status).toBe(200);
    expect((await roomRow(roomId)).status).toBe('closed');
    const again = await rooms(b, { action: 'create', profiled: false, icon });
    expect(again.status, JSON.stringify(again.body)).toBe(200);
  });

  it('keeps an icon unique when the last free ones go to tables created at once (locks)', async () => {
    const [a, b] = await Promise.all([at(0), at(1)]);
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
  // A friend_open pair of records, as a table's end writes them (tableEnd.test.ts).
  async function pair(): Promise<{ a: Phone; b: Phone; historyA: string; historyB: string }> {
    const [a, b] = await Promise.all([at(0), at(1)]);
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
  const friendsOp = (p: Phone, action: string, historyId: string) =>
    invoke(p.client, 'friends', { action, historyId });
  const pressed = async (historyId: string) => {
    const [row] =
      await sql`select friend_action_at from public.play_history where id = ${historyId}`;
    return row?.friend_action_at !== null;
  };
  const areFriends = async (a: Phone, b: Phone) =>
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
      for (const phone of TEAM_PHONES) await deleteUserByPhone(phone);
    }
  });
});
