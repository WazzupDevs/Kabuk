// Faz 4 step 4.7, server (docs/SPEC_V4.md §4.G, §4.K, §4.M "Adım 4.7"): the table invite, the
// bell's list and the notification settings. An invite goes only from a table's owner to a friend
// checked in at the same venue; the owner's answer is the same whatever happened (K-2). It carries
// the table's name and phones, never the venue, and lasts 2 minutes. The list reads the requests,
// the accepted ones, the matches (the first presser only, K-70) and the invites.
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { NotificationsResponse } from '../functions/_shared/pure/api/friends.ts';
import { MAX_TABLE_INVITES_PER_HOUR } from '../functions/_shared/pure/tables.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, setTestPhoto, waitForBroadcast, waitUntilBlocked } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
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

beforeAll(async () => {
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
});

afterAll(async () => {
  await deleteFixtureVenues(sql);
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const at = (n: number, key?: string) => person(venue, n, key ? { key } : {});

async function befriend(a: Person, b: Person): Promise<void> {
  await sql`select private.make_friends(${a.userId}, ${b.userId}, 'request')`;
}

async function publicIdOf(p: Person): Promise<string> {
  const [row] = await sql`select public_id from public.profiles where id = ${p.userId}`;
  return row?.public_id as string;
}

const invite = async (owner: Person, roomId: string, friend: Person) =>
  rooms(owner, { action: 'invite', roomId, friendPublicId: await publicIdOf(friend) });
const answer = (p: Person, inviteId: string, accept: boolean) =>
  rooms(p, { action: 'answer-invite', inviteId, accept });

async function invitesTo(p: Person) {
  return sql`
    select id, room_id, status, expires_at - created_at as ttl from public.table_invites
    where to_user_id = ${p.userId} order by created_at
  `;
}

async function notificationsOf(p: Person): Promise<NotificationsResponse> {
  const res = await invoke(p.client, 'friends', { action: 'notifications' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as NotificationsResponse;
}

describe('the table invite (§4.G)', () => {
  it('goes from the owner to a friend at the venue, carries no venue and lasts 2 minutes', async () => {
    const [owner, friend] = await Promise.all([at(0), at(1)]);
    await befriend(owner, friend);
    const roomId = await openTable(owner);
    const inbox = waitForBroadcast(friend.client, `inbox:${friend.userId}`, 'table_invite');
    await inbox.subscribed;
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    await inbox.received;
    await inbox.close();
    const rows = await invitesTo(friend);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ room_id: roomId, status: 'pending' });
    expect(String(rows[0]?.ttl)).toBe('00:02:00');

    const list = await notificationsOf(friend);
    const row = list.notifications.find((n) => n.kind === 'invite');
    const r = await roomRow(roomId);
    expect(row).toMatchObject({
      kind: 'invite',
      inviteId: rows[0]?.id,
      state: 'open',
      publicId: await publicIdOf(owner),
      displayName: owner.name,
      tableName: r.name,
      phones: 1,
      isNew: true,
    });
    // No venue: neither its name nor its id is anywhere in the list.
    const [v] = await sql`select name from public.venues where id = ${venue['at-anchor'] ?? ''}`;
    const text = JSON.stringify(list);
    expect(text).not.toContain(String(v?.name));
    expect(text).not.toContain(String(venue['at-anchor']));
    expect(text).not.toContain(roomId);
  });

  it('writes nothing, and answers alike, for a friend elsewhere or not checked in, a stranger and a block', async () => {
    const [owner, elsewhere, stranger, blocked, away] = await Promise.all([
      at(0),
      at(1, 'near'),
      at(2),
      at(3),
      at(4),
    ]);
    for (const p of [elsewhere, blocked, away]) await befriend(owner, p);
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${blocked.userId}, ${owner.userId}, 'Sahip')
    `;
    expect(await invoke(away.client, 'checkin', { action: 'leave' })).toMatchObject({
      status: 200,
    });
    const roomId = await openTable(owner);
    for (const p of [elsewhere, stranger, blocked, away]) {
      expect(await invite(owner, roomId, p), p.name).toEqual(OK);
      expect(await invitesTo(p), p.name).toEqual([]);
    }
    // An unknown public_id answers the same too.
    expect(await rooms(owner, { action: 'invite', roomId, friendPublicId: randomUUID() })).toEqual(
      OK,
    );
  });

  it('comes from the owner only, one waiting at a time, at most 30 an hour, not to a full table', async () => {
    const [owner, member, friend, other] = await Promise.all([at(0), at(1), at(2), at(3)]);
    for (const p of [member, friend, other]) await befriend(owner, p);
    await befriend(member, friend);
    const roomId = await tableWith(owner, [member]);
    expect(await invite(member, roomId, friend)).toEqual({
      status: 403,
      body: errorBody('not_owner'),
    });
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    expect(await invitesTo(friend)).toHaveLength(1);
    // The first ran out: the next one is new, the old one expired.
    await sql`
      update public.table_invites set created_at = now() - interval '3 minutes',
        expires_at = now() - interval '1 minute'
      where to_user_id = ${friend.userId}
    `;
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    expect((await invitesTo(friend)).map((i) => i.status)).toEqual(['expired', 'pending']);

    // The hour's limit: what goes over it writes nothing and answers the same.
    await sql`
      insert into public.table_invites (room_id, from_session_id, to_user_id, created_at, expires_at, status)
      select ${roomId}, ${owner.sessionId}, ${member.userId}, now() - interval '10 minutes',
             now() - interval '8 minutes', 'expired'
      from generate_series(1, ${MAX_TABLE_INVITES_PER_HOUR})
    `;
    expect(await invite(owner, roomId, other)).toEqual(OK);
    expect(await invitesTo(other)).toEqual([]);
    await sql`
      update public.table_invites set created_at = now() - interval '2 hours'
      where to_user_id = ${member.userId}
    `;
    // A full table: nothing either.
    await sql`update public.rooms set phones = 12 where id = ${roomId}`;
    expect(await invite(owner, roomId, other)).toEqual(OK);
    expect(await invitesTo(other)).toEqual([]);
    await sql`update public.rooms set phones = 2 where id = ${roomId}`;
    expect(await invite(owner, roomId, other)).toEqual(OK);
    expect(await invitesTo(other)).toHaveLength(1);
    // Someone already at the table gets none.
    expect(await invite(owner, roomId, member)).toEqual(OK);
    const toMember = await invitesTo(member);
    expect(toMember.every((i) => i.status === 'expired')).toBe(true);
  });

  it('keeps the invites closed to every client, the owner included', async () => {
    const [owner, friend] = await Promise.all([at(0), at(1)]);
    await befriend(owner, friend);
    const roomId = await openTable(owner);
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    for (const p of [owner, friend]) {
      const read = await p.client.from('table_invites').select('*');
      expect(read.data ?? []).toEqual([]);
    }
    const closed = await owner.client.rpc('my_notifications', { target_user_id: owner.userId });
    expect(closed.error).not.toBeNull();
  });
});

describe('answering an invite (§4.G)', () => {
  async function invited(friendOpts: { key?: string } = {}) {
    const [owner, friend] = await Promise.all([at(0), at(1, friendOpts.key)]);
    await befriend(owner, friend);
    const roomId = await openTable(owner);
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    const [row] = await invitesTo(friend);
    return { owner, friend, roomId, inviteId: row?.id as string };
  }

  it('sits the friend at the table; a decline ends it and reaches nobody', async () => {
    const { owner, friend, roomId, inviteId } = await invited();
    expect(await answer(friend, inviteId, true)).toEqual(OK);
    expect((await seated(roomId)).map((s) => s.session_id)).toEqual([
      owner.sessionId,
      friend.sessionId,
    ]);
    expect((await roomRow(roomId)).phones).toBe(2);
    expect((await invitesTo(friend))[0]?.status).toBe('accepted');
    const list = await notificationsOf(friend);
    expect(list.notifications.find((n) => n.kind === 'invite')).toMatchObject({ state: 'joined' });

    const other = await at(2);
    await befriend(owner, other);
    expect(await invite(owner, roomId, other)).toEqual(OK);
    const [second] = await invitesTo(other);
    expect(await answer(other, second?.id as string, false)).toEqual(OK);
    expect((await invitesTo(other))[0]?.status).toBe('declined');
    expect((await seated(roomId)).map((s) => s.session_id)).not.toContain(other.sessionId);
    // A decline twice, and an answer to someone else's invite.
    expect(await answer(other, second?.id as string, false)).toEqual(OK);
    expect(await answer(owner, second?.id as string, true)).toEqual({
      status: 404,
      body: errorBody('not_found'),
    });
  });

  it('closes the friend’s own one-person table quietly and moves an owner’s table to the earliest', async () => {
    const { owner, friend, roomId, inviteId } = await invited();
    const own = await openTable(friend, { open: false });
    expect(await answer(friend, inviteId, true)).toEqual(OK);
    expect((await roomRow(own)).status).toBe('closed');

    // The friend now owns nothing; a second friend owns a table with another person.
    const [second, guest] = await Promise.all([at(2), at(3)]);
    await befriend(owner, second);
    const theirs = await tableWith(second, [guest]);
    expect(await invite(owner, roomId, second)).toEqual(OK);
    const [row] = await invitesTo(second);
    expect(await answer(second, row?.id as string, true)).toEqual(OK);
    const left = await roomRow(theirs);
    expect(left.status).toBe('active');
    expect(left.owner_session_id).toBe(guest.sessionId);
    expect((await seated(roomId)).map((s) => s.session_id)).toContain(second.sessionId);
  });

  it('takes a participant out of the table it is at; the table goes on', async () => {
    const { owner, friend, roomId, inviteId } = await invited();
    const host = await at(2);
    const hosts = await tableWith(host, [friend]);
    expect(await answer(friend, inviteId, true)).toEqual(OK);
    expect((await seated(hosts)).map((s) => s.session_id)).toEqual([host.sessionId]);
    expect((await seated(roomId)).map((s) => s.session_id)).toEqual([
      owner.sessionId,
      friend.sessionId,
    ]);
  });

  it('answers a run-out invite, a closed or full table and a new owner with one text', async () => {
    const run = await invited();
    await sql`update public.table_invites set expires_at = now() - interval '1 second',
              created_at = now() - interval '3 minutes' where id = ${run.inviteId}`;
    expect(await answer(run.friend, run.inviteId, true)).toEqual({
      status: 409,
      body: errorBody('invite_unavailable'),
    });
    expect((await notificationsOf(run.friend)).notifications[0]).toMatchObject({
      kind: 'invite',
      state: 'expired',
    });
    for (const p of TABLE_PHONES.slice(0, 2)) await deleteUserByPhone(p);

    const full = await invited();
    await sql`update public.rooms set phones = 12 where id = ${full.roomId}`;
    expect(await answer(full.friend, full.inviteId, true)).toEqual({
      status: 409,
      body: errorBody('invite_unavailable'),
    });
    await sql`update public.rooms set phones = 1 where id = ${full.roomId}`;
    expect(await rooms(full.owner, { action: 'end' })).toEqual(OK);
    expect(await answer(full.friend, full.inviteId, true)).toEqual({
      status: 409,
      body: errorBody('invite_unavailable'),
    });
    for (const p of TABLE_PHONES.slice(0, 2)) await deleteUserByPhone(p);

    const moved = await invited();
    const heir = await at(2);
    await sit(heir, moved.owner, moved.roomId);
    expect(await leave(moved.owner, moved.roomId)).toEqual(OK);
    expect(await answer(moved.friend, moved.inviteId, true)).toEqual({
      status: 409,
      body: errorBody('invite_unavailable'),
    });
  });

  it('seats with the check-in’s identity: a man without a photo is photo_required', async () => {
    const [owner, friend] = await Promise.all([at(0), person(venue, 1, { gender: 'male' })]);
    await befriend(owner, friend);
    const roomId = await openTable(owner);
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    const [row] = await invitesTo(friend);
    expect(await answer(friend, row?.id as string, true)).toEqual({
      status: 409,
      body: errorBody('photo_required'),
    });
    await setTestPhoto(friend.client);
    expect(await answer(friend, row?.id as string, true)).toEqual(OK);
    const [seat] = await sql`
      select alias, profiled from public.room_members
      where room_id = ${roomId} and session_id = ${friend.sessionId} and left_at is null
    `;
    expect(seat).toEqual({ alias: friend.name, profiled: true });
  });

  it('does not take a friend checked in at another venue, and a block made later stops it', async () => {
    const { friend, inviteId } = await invited();
    await checkIn(friend.client, venue, 'near');
    expect(await answer(friend, inviteId, true)).toEqual({
      status: 409,
      body: errorBody('invite_unavailable'),
    });
    for (const p of TABLE_PHONES.slice(0, 2)) await deleteUserByPhone(p);
    const blocked = await invited();
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${blocked.owner.userId}, ${blocked.friend.userId}, 'Arkadaş')
    `;
    expect(await answer(blocked.friend, blocked.inviteId, true)).toEqual({
      status: 409,
      body: errorBody('invite_unavailable'),
    });
  });
});

describe('the bell (§4.G, K-70)', () => {
  it('lists requests, accepted requests, matches and invites, new until the list is opened', async () => {
    const [me, viaChat, viaHistory, accepted, firstPresser, secondPresser] = await Promise.all([
      at(0),
      at(1),
      at(2),
      at(3),
      at(4),
      at(5),
    ]);
    await setTestPhoto(viaChat.client);
    // A request from the venue chat: name, age, photo and the venue as today.
    await sql`
      insert into public.friend_requests (from_user_id, to_user_id, source, venue_chat_context)
      values (${viaChat.userId}, ${me.userId}, 'venue_chat',
              ${sql.json({ venueName: 'Test Kafe Çapa', at: new Date().toISOString() })})
    `;
    // A request from a play history: only the name at the table.
    const encounter = randomUUID();
    await sql`
      insert into public.play_history
        (encounter_id, user_id, other_user_id, concept, mode, own_alias, other_alias,
         other_headcount, available_at)
      values
        (${encounter}, ${me.userId}, ${viaHistory.userId}, 'chat', 'text', 'Ben', 'kapsul-ab12', 1,
         now()),
        (${encounter}, ${viaHistory.userId}, ${me.userId}, 'chat', 'text', 'kapsul-ab12', 'Ben', 1,
         now())
    `;
    await sql`
      insert into public.friend_requests (from_user_id, to_user_id, source, encounter_id)
      values (${viaHistory.userId}, ${me.userId}, 'encounter', ${encounter})
    `;
    // My request someone accepted.
    await sql`
      insert into public.friend_requests (from_user_id, to_user_id, source, venue_chat_context)
      values (${me.userId}, ${accepted.userId}, 'venue_chat', ${sql.json({ venueName: 'X' })})
    `;
    await befriend(me, accepted);
    // Two matches: I pressed first with one, second with the other.
    for (const [other, mineFirst] of [
      [firstPresser, true],
      [secondPresser, false],
    ] as const) {
      const e = randomUUID();
      await sql`
        insert into public.mutual_friend_intents (encounter_id, user_id, created_at) values
          (${e}, ${me.userId}, now() - ${mineFirst ? '2 minutes' : '1 minute'}::interval),
          (${e}, ${other.userId}, now() - ${mineFirst ? '1 minute' : '2 minutes'}::interval)
      `;
      await sql`select private.make_friends(${me.userId}, ${other.userId}, 'room_end_mutual')`;
    }

    const list = await notificationsOf(me);
    const kinds = list.notifications.map((n) => n.kind).sort();
    expect(kinds).toEqual(['accepted', 'match', 'request', 'request']);
    const chat = list.notifications.find((n) => n.kind === 'request' && n.source === 'venue_chat');
    expect(chat).toMatchObject({
      state: 'pending',
      venueName: 'Test Kafe Çapa',
      displayName: viaChat.name,
      age: expect.any(Number),
      photoUrl: expect.stringContaining('http'),
      publicId: null,
    });
    const history = list.notifications.find(
      (n) => n.kind === 'request' && n.source === 'encounter',
    );
    expect(history).toMatchObject({
      state: 'pending',
      otherAlias: 'kapsul-ab12',
      displayName: null,
      age: null,
      photoUrl: null,
      publicId: null,
    });
    // No profile id before a friendship, and no account id anywhere (rule 4).
    const text = JSON.stringify(list);
    for (const p of [viaChat, viaHistory]) {
      expect(text).not.toContain(await publicIdOf(p));
      expect(text).not.toContain(p.userId);
    }
    expect(list.notifications.find((n) => n.kind === 'accepted')).toMatchObject({
      publicId: await publicIdOf(accepted),
    });
    // K-70: only the first presser's list has the match.
    expect(list.notifications.find((n) => n.kind === 'match')).toMatchObject({
      publicId: await publicIdOf(firstPresser),
    });
    // With the other pair it was the other way round: the match is in their list, not in mine.
    const theirs = await notificationsOf(secondPresser);
    expect(theirs.notifications.map((n) => [n.kind, 'publicId' in n ? n.publicId : null])).toEqual([
      ['match', await publicIdOf(me)],
    ]);
    expect((await notificationsOf(firstPresser)).notifications).toEqual([]);

    // New until opened; opening twice is the same.
    expect(list.unseen).toBe(4);
    for (let i = 0; i < 2; i++) {
      expect(await invoke(me.client, 'account', { action: 'notifications-seen' })).toEqual(OK);
    }
    const seen = await notificationsOf(me);
    expect(seen.unseen).toBe(0);
    expect(seen.notifications.every((n) => !n.isNew)).toBe(true);
    // Read twice, alike.
    expect(await notificationsOf(me)).toEqual(seen);
  });

  it('drops a row on a block, and an accepted request or a match after 7 days', async () => {
    const [me, sender, friend] = await Promise.all([at(0), at(1), at(2)]);
    await sql`
      insert into public.friend_requests (from_user_id, to_user_id, source, venue_chat_context)
      values (${sender.userId}, ${me.userId}, 'venue_chat', ${sql.json({ venueName: 'X' })}),
             (${me.userId}, ${friend.userId}, 'venue_chat', ${sql.json({ venueName: 'X' })})
    `;
    await befriend(me, friend);
    expect((await notificationsOf(me)).notifications).toHaveLength(2);
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${me.userId}, ${sender.userId}, 'Gönderen')
    `;
    await sql`
      update public.friend_requests set responded_at = now() - interval '8 days'
      where from_user_id = ${me.userId}
    `;
    expect((await notificationsOf(me)).notifications).toEqual([]);
  });

  it('keeps the silent "Arkadaş ekle" out: a one-sided press and a take-back write no row', async () => {
    const [me, other] = await Promise.all([at(0), at(1)]);
    const e = randomUUID();
    await sql`
      insert into public.mutual_friend_intents (encounter_id, user_id) values (${e}, ${me.userId})
    `;
    expect((await notificationsOf(me)).notifications).toEqual([]);
    expect((await notificationsOf(other)).notifications).toEqual([]);
  });
});

describe('notification settings (K-53, K-62)', () => {
  it('saves "Masa davetleri" next to the other two, read by the account itself', async () => {
    const me = await at(0);
    expect(
      await invoke(me.client, 'profile', {
        action: 'update',
        notifyInvites: false,
        notifyDm: true,
        notifyFriendRequests: false,
      }),
    ).toEqual(OK);
    const { data, error } = await me.client
      .from('profiles')
      .select('notify_invites, notify_dm, notify_friend_requests, notifications_seen_at')
      .single();
    expect(error).toBeNull();
    expect(data).toEqual({
      notify_invites: false,
      notify_dm: true,
      notify_friend_requests: false,
      notifications_seen_at: null,
    });
  });
});

describe('locks (§4.K)', () => {
  // The 12th seat: an invite's join and a request's accept at once. Both hold the inviting table
  // first; the second sees it full.
  it('lets one of an invite and an accept take the last seat', async () => {
    const people = await Promise.all(Array.from({ length: 12 }, (_, n) => at(n)));
    const [owner, friend, asker, ...rest] = people as [Person, Person, Person, ...Person[]];
    await befriend(owner, friend);
    const roomId = await tableWith(owner, rest);
    expect((await roomRow(roomId)).phones).toBe(10);
    const asked = await rooms(asker, { action: 'request-join', roomId });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    const requestId = (asked.body as { requestId: string }).requestId;
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    const [row] = await invitesTo(friend);
    // One seat left (the twelve test phones are all in this test: one stands in for an eleventh).
    await sql`update public.rooms set phones = 11 where id = ${roomId}`;

    const joining = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const accepting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let accepted: Promise<unknown> = Promise.resolve();
      await joining.begin(async (tx) => {
        await tx`select (public.rooms_answer_invite(${friend.userId}, ${row?.id}, true)).left_room_id`;
        accepted =
          accepting`select (public.rooms_respond(${owner.userId}, ${requestId}, true)).status`
            .execute()
            .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_respond');
      });
      const result = await accepted;
      expect(String((result as { message?: string }).message ?? result)).toContain('table_full');
    } finally {
      await Promise.all([joining.end(), accepting.end()]);
    }
    expect((await roomRow(roomId)).phones).toBe(12);
    expect((await seated(roomId)).map((s) => s.session_id)).toContain(friend.sessionId);
  });

  // The owner ends the table while the friend joins: whichever comes second waits; a join after the
  // end finds the invite unavailable.
  it('lets a join wait for "Masayı bitir" and find the invite unavailable', async () => {
    const [owner, friend] = await Promise.all([at(0), at(1)]);
    await befriend(owner, friend);
    const roomId = await openTable(owner);
    expect(await invite(owner, roomId, friend)).toEqual(OK);
    const [row] = await invitesTo(friend);
    const ending = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const joining = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let joined: Promise<unknown> = Promise.resolve();
      await ending.begin(async (tx) => {
        await tx`select (public.rooms_end(${owner.userId})).status`;
        joined =
          joining`select (public.rooms_answer_invite(${friend.userId}, ${row?.id}, true)).left_room_id`
            .execute()
            .catch((err: unknown) => err);
        await waitUntilBlocked('rooms_answer_invite');
      });
      const result = await joined;
      expect(String((result as { message?: string }).message ?? result)).toContain(
        'invite_unavailable',
      );
    } finally {
      await Promise.all([ending.end(), joining.end()]);
    }
    expect((await roomRow(roomId)).status).toBe('closed');
  });
});
