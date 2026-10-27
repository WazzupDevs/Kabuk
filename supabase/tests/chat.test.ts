import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';

import { BROADCAST, messagesChannel } from '../functions/_shared/pure/rooms.ts';
import {
  checkInAt,
  errorBody,
  onboarded,
  PHONES,
  waitForBroadcast,
  waitUntilBlocked,
} from './helpers.ts';
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

const send = (client: Client, roomId: string, body: string) =>
  invoke(client, 'chat', { action: 'send', roomId, body });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The owner's table with the guest sat down at it ("Katıl", docs/SPEC_V4.md §4.E); a third person
// checked in at the venue.
async function roomWithGuest() {
  const [owner, guest, third] = (await Promise.all(PHONES.map((p) => onboarded(p)))) as [
    Client,
    Client,
    Client,
  ];
  const [ownerSession, guestSession] = [
    (await checkInAt(owner, venue, V)).sessionId,
    (await checkInAt(guest, venue, V)).sessionId,
  ];
  await checkInAt(third, venue, V);
  const created = await invoke(owner, 'rooms', { action: 'create' });
  const roomId = (created.body as { roomId: string }).roomId;
  await invoke(guest, 'rooms', { action: 'request-join', roomId });
  const [request] =
    await sql`select id from public.join_requests where room_id = ${roomId} and status = 'pending'`;
  await invoke(owner, 'rooms', { action: 'respond', requestId: request?.id, accept: true });
  return { owner, guest, third, roomId, ownerSession, guestSession };
}

// The names the owner and the guest sat down with (their capsule nicks: anonymous women).
async function seatNames(roomId: string, ownerSession: string, guestSession: string) {
  const rows = await sql`
    select session_id, alias, joined_at from public.room_members where room_id = ${roomId}
  `;
  const of = (session: string) => rows.find((r) => r.session_id === session);
  return {
    owner: of(ownerSession)?.alias as string,
    guest: of(guestSession)?.alias as string,
    guestJoinedAt: of(guestSession)?.joined_at as Date,
  };
}

async function messages(client: Client, roomId: string) {
  const { data } = await client
    .from('messages')
    .select('sender_alias, body')
    .eq('room_id', roomId)
    .order('created_at');
  return data ?? [];
}

describe('chat/send', () => {
  it('delivers messages to everyone at the table, with the seat name, and to nobody else', async () => {
    const { owner, guest, third, roomId, ownerSession, guestSession } = await roomWithGuest();
    expect(await send(owner, roomId, '  Merhaba!  ')).toEqual({
      status: 200,
      body: { messageId: expect.any(String) },
    });
    await sleep(1100);
    await send(guest, roomId, 'Selam');

    const forOwner = await messages(owner, roomId);
    expect(forOwner.map((m) => m.body)).toEqual(['Merhaba!', 'Selam']);
    expect(await messages(guest, roomId)).toEqual(forOwner);
    expect(await messages(third, roomId)).toEqual([]);
    const names = await seatNames(roomId, ownerSession, guestSession);
    expect(forOwner.map((m) => m.sender_alias)).toEqual([names.owner, names.guest]);
  });

  it('streams new messages to the other table through Postgres Changes', async () => {
    const { owner, guest, roomId } = await roomWithGuest();
    const received = new Promise<string>((resolve, reject) => {
      const channel = guest
        .channel(`messages:${roomId}`, { config: { private: true } })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
          (payload) => resolve((payload.new as { body: string }).body),
        )
        // Postgres Changes are live once the server confirms the database subscription.
        .on('system', {}, (payload: { extension?: string; status?: string }) => {
          if (payload.extension === 'postgres_changes' && payload.status === 'ok') {
            void send(owner, roomId, 'canlı mesaj');
          }
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') reject(new Error(status));
        });
      setTimeout(() => {
        void guest.removeChannel(channel);
        reject(new Error('no realtime message'));
      }, 10_000);
    });
    await expect(received).resolves.toBe('canlı mesaj');
  });

  it('filters profanity and length on the server', async () => {
    const { owner, roomId } = await roomWithGuest();
    expect(await send(owner, roomId, 'Siktir git')).toEqual({
      status: 422,
      body: errorBody('profanity_rejected'),
    });
    expect(await send(owner, roomId, 'ŞEREFSİZ')).toEqual({
      status: 422,
      body: errorBody('profanity_rejected'),
    });
    expect(await send(owner, roomId, '   ')).toEqual({
      status: 400,
      body: errorBody('message_invalid'),
    });
    expect(await send(owner, roomId, 'a'.repeat(201))).toEqual({
      status: 400,
      body: errorBody('message_invalid'),
    });
    expect((await send(owner, roomId, 'çok sıkıldım, sık sık gelelim')).status).toBe(200);
    expect(await messages(owner, roomId)).toHaveLength(1);
  });

  it('allows one message per second per person', async () => {
    const { owner, guest, roomId } = await roomWithGuest();
    expect((await send(owner, roomId, 'bir')).status).toBe(200);
    expect(await send(owner, roomId, 'iki')).toEqual({
      status: 429,
      body: errorBody('rate_limited'),
    });
    expect((await send(guest, roomId, 'misafir')).status).toBe(200);
    await sleep(1100);
    expect((await send(owner, roomId, 'üç')).status).toBe(200);
  });

  it('refuses non-members and closed rooms', async () => {
    const { owner, third, roomId } = await roomWithGuest();
    expect(await send(third, roomId, 'selam')).toEqual({
      status: 403,
      body: errorBody('not_in_room'),
    });
    // "Masayı bitir" closes the table for everyone (docs/SPEC_V4.md §4.E).
    await invoke(owner, 'rooms', { action: 'end' });
    expect(await send(owner, roomId, 'selam')).toEqual({
      status: 403,
      body: errorBody('not_in_room'),
    });
  });

  // docs/SPEC_V4.md §4.E: the table goes on after a person leaves and takes others; a later person
  // reads only what was written after it sat down.
  it('never shows a later person what was written before it sat down', async () => {
    const { owner, guest, third, roomId } = await roomWithGuest();
    await send(guest, roomId, 'eski misafir');
    await invoke(guest, 'checkin', { action: 'leave' });
    expect((await invoke(third, 'rooms', { action: 'request-join', roomId })).status).toBe(200);
    const [request] =
      await sql`select id from public.join_requests where room_id = ${roomId} and status = 'pending'`;
    await invoke(owner, 'rooms', { action: 'respond', requestId: request?.id, accept: true });
    expect(await messages(third, roomId)).toEqual([]);
    await sleep(1100);
    await send(owner, roomId, 'hoş geldin');
    expect((await messages(third, roomId)).map((m) => m.body)).toEqual(['hoş geldin']);
  });
});

describe('room chat replies and reactions (docs/SPEC_V3.md §21)', () => {
  const OK = { status: 200, body: { ok: true } };
  const sendReply = (client: Client, roomId: string, body: string, replyTo: string) =>
    invoke(client, 'chat', { action: 'send', roomId, body, replyTo });
  const react = (client: Client, messageId: string, emoji: string | null) =>
    invoke(client, 'chat', { action: 'react', messageId, emoji });
  const extras = async (client: Client, roomId: string) => {
    const { data, error } = await client.rpc('room_chat_extras', { target_room_id: roomId });
    expect(error).toBeNull();
    return Object.fromEntries((data ?? []).map((r) => [r.message_id, r]));
  };
  it('quotes a message of the table by its seat name; nothing from outside the table', async () => {
    const { owner, guest, third, roomId, ownerSession, guestSession } = await roomWithGuest();
    const names = await seatNames(roomId, ownerSession, guestSession);
    const first = await send(owner, roomId, 'Yarın aynı yerde mi?');
    const firstId = (first.body as { messageId: string }).messageId;
    const reply = await sendReply(guest, roomId, 'Olur', firstId);
    expect(reply.status).toBe(200);
    const replyId = (reply.body as { messageId: string }).messageId;

    const quote = { id: firstId, body: 'Yarın aynı yerde mi?', name: names.owner };
    expect((await extras(owner, roomId))[replyId]?.reply_to).toEqual({ ...quote, from_me: true });
    expect((await extras(guest, roomId))[replyId]?.reply_to).toEqual({ ...quote, from_me: false });
    // The messages carry the reply too (RLS read), and nobody outside the room gets extras.
    const { data: rows } = await owner
      .from('messages')
      .select('reply_to_id, replied')
      .eq('id', replyId);
    expect(rows).toEqual([{ reply_to_id: firstId, replied: true }]);
    expect(await extras(third, roomId)).toEqual({});

    await sleep(1100);
    const unavailable = { status: 409, body: errorBody('reply_unavailable') };
    expect(await sendReply(owner, roomId, 'x', randomUUID())).toEqual(unavailable);
    // A message from before the guest sat down (the owner sat 10 minutes earlier): the guest cannot
    // quote it, and sees a reply to it as gone.
    await sql`
      update public.room_members set joined_at = joined_at - interval '10 minutes'
      where room_id = ${roomId} and session_id = ${ownerSession}
    `;
    const [old] = await sql`
      insert into public.messages (room_id, session_id, sender_alias, body, created_at)
      values (${roomId}, ${ownerSession}, ${names.owner}, 'eski',
              ${names.guestJoinedAt}::timestamptz - interval '1 minute')
      returning id
    `;
    expect(await sendReply(guest, roomId, 'x', old?.id)).toEqual(unavailable);
    const toOld = await sendReply(owner, roomId, 'hatırladın mı', old?.id);
    const toOldId = (toOld.body as { messageId: string }).messageId;
    expect((await extras(guest, roomId))[toOldId]?.reply_to).toEqual({ gone: true });
    expect((await extras(owner, roomId))[toOldId]?.reply_to).toMatchObject({ body: 'eski' });

    // The quoted message deleted.
    await sql`delete from public.messages where id = ${firstId}`;
    expect((await extras(owner, roomId))[replyId]?.reply_to).toEqual({ gone: true });
  });

  it('keeps one reaction per person, named by the seat names, the same when sent twice', async () => {
    const { owner, guest, third, roomId, ownerSession, guestSession } = await roomWithGuest();
    const names = await seatNames(roomId, ownerSession, guestSession);
    const sentOwner = await send(owner, roomId, 'selam');
    const messageId = (sentOwner.body as { messageId: string }).messageId;

    const heard = waitForBroadcast(owner, messagesChannel(roomId), BROADCAST.reaction);
    await heard.subscribed;
    expect(await react(guest, messageId, 'begen')).toEqual(OK);
    await heard.received;
    await heard.close();
    expect(await react(guest, messageId, 'begen')).toEqual(OK);
    expect(await react(owner, messageId, 'begen')).toEqual(OK);
    expect((await extras(owner, roomId))[messageId]?.reactions).toEqual([
      { emoji: 'begen', count: 2, aliases: [names.guest, names.owner], mine: true },
    ]);
    expect(await react(guest, messageId, 'kizgin')).toEqual(OK);
    expect(await react(owner, messageId, null)).toEqual(OK);
    expect((await extras(owner, roomId))[messageId]?.reactions).toEqual([
      { emoji: 'kizgin', count: 1, aliases: [names.guest], mine: false },
    ]);
    expect((await extras(guest, roomId))[messageId]?.reactions).toEqual([
      { emoji: 'kizgin', count: 1, aliases: [names.guest], mine: true },
    ]);

    expect(await react(guest, messageId, '💩')).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(await react(third, messageId, 'begen')).toEqual({
      status: 403,
      body: errorBody('not_in_room'),
    });
    expect(await react(guest, randomUUID(), 'begen')).toEqual({
      status: 404,
      body: errorBody('not_found'),
    });
    // No account id anywhere in what a person reads.
    const seen = JSON.stringify(await extras(owner, roomId));
    expect(seen).not.toContain(await userIdOf(guest));

    await sql`delete from public.messages where id = ${messageId}`;
    expect(await sql`select count(*)::int as n from public.message_reactions`).toEqual([{ n: 0 }]);
  });

  // chat_react (docs/SPEC_V3.md §21.3): the check-in and the table, then the message's reactions.
  it('reacts only after taking the room', async () => {
    const { owner, guest, roomId } = await roomWithGuest();
    const sentOwner = await send(owner, roomId, 'selam');
    const messageId = (sentOwner.body as { messageId: string }).messageId;
    expect(await react(guest, messageId, 'begen')).toEqual(OK);
    const guestId = await userIdOf(guest);

    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const reacting = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let reacted: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.rooms where id = ${roomId} for update`;
        reacted =
          reacting`select changed from public.chat_react(${guestId}, ${messageId}, 'kizgin')`
            .execute()
            .catch((err: unknown) => err);
        await waitUntilBlocked('chat_react');
        await tx`set local lock_timeout = '2s'`;
        const held = await tx`
          select emoji from public.message_reactions where message_id = ${messageId} for update
        `;
        expect(held).toHaveLength(1);
      });
      expect(await reacted).toEqual([{ changed: true }]);
    } finally {
      await Promise.all([holder.end(), reacting.end()]);
    }
  });
});

describe('safety/report', () => {
  it('stores the last 50 messages and the reported account, hidden from clients', async () => {
    const { owner, guest, roomId, ownerSession, guestSession } = await roomWithGuest();
    const names = await seatNames(roomId, ownerSession, guestSession);
    for (let i = 1; i <= 60; i++) {
      await sql`
        insert into public.messages (room_id, session_id, sender_alias, body, created_at)
        values (${roomId}, ${ownerSession}, ${names.owner}, ${`mesaj ${i}`}, now() + make_interval(secs => ${i}))
      `;
    }
    // docs/SPEC_V4.md §4.E: the report names a person of the table.
    expect(
      await invoke(guest, 'safety', { action: 'report', roomId, reason: 'harassment' }),
    ).toEqual({ status: 404, body: errorBody('not_found') });
    expect(
      await invoke(guest, 'safety', {
        action: 'report',
        roomId,
        reason: 'harassment',
        sessionId: ownerSession,
      }),
    ).toEqual({
      status: 200,
      body: { ok: true },
    });

    const [report] = await sql`select * from public.reports where room_id = ${roomId}`;
    expect(report).toMatchObject({
      reporter_id: await userIdOf(guest),
      reported_user_id: await userIdOf(owner),
      reason: 'harassment',
      status: 'open',
    });
    const snapshot = report?.messages_snapshot as { body: string; alias: string }[];
    expect(snapshot).toHaveLength(50);
    expect(snapshot[0]?.body).toBe('mesaj 11');
    expect(snapshot[49]?.body).toBe('mesaj 60');

    const { error } = await guest.from('reports').select('id');
    expect(error?.code).toBe('42501');
  });

  it('validates the reason', async () => {
    const { guest, roomId, ownerSession } = await roomWithGuest();
    expect(
      (
        await invoke(guest, 'safety', {
          action: 'report',
          roomId,
          reason: 'nope',
          sessionId: ownerSession,
        })
      ).status,
    ).toBe(400);
  });
});

describe('safety/block and unblock', () => {
  it('blocks the person it names, takes them out of the table, and can be undone', async () => {
    const { owner, guest, third, roomId, ownerSession, guestSession } = await roomWithGuest();
    const names = await seatNames(roomId, ownerSession, guestSession);
    expect(
      await invoke(owner, 'safety', { action: 'block', roomId, sessionId: guestSession }),
    ).toEqual({
      status: 200,
      body: { ok: true },
    });

    const [row] = await sql`select id, blocked_id from public.blocks`;
    expect(row?.blocked_id).toBe(await userIdOf(guest));
    const { data: blocks } = await owner.from('blocks').select('id, blocked_alias, created_at');
    expect(blocks).toEqual([
      { id: row?.id, blocked_alias: names.guest, created_at: expect.any(String) },
    ]);
    expect((await guest.from('blocks').select('id')).data).toEqual([]);
    // K-13: the owner's block takes the person out; the table goes on (tableModel.test.ts has the
    // other roads).
    const here = await sql`
      select session_id from public.room_members where room_id = ${roomId} and left_at is null
    `;
    expect(here).toEqual([{ session_id: ownerSession }]);

    // Someone else's block id does nothing.
    expect(await invoke(third, 'safety', { action: 'unblock', blockId: row?.id })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect(await sql`select 1 from public.blocks`).toHaveLength(1);

    expect(await invoke(owner, 'safety', { action: 'unblock', blockId: row?.id })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect((await owner.from('blocks').select('id')).data).toEqual([]);
  });

  // Rule 4: the blocked account's id never reaches the blocker's client.
  it('never shows the blocked account id to the client', async () => {
    const { owner, roomId, guestSession } = await roomWithGuest();
    await invoke(owner, 'safety', { action: 'block', roomId, sessionId: guestSession });
    expect((await owner.from('blocks').select('blocked_id')).error?.code).toBe('42501');
    expect((await owner.from('blocks').select('*')).error?.code).toBe('42501');
  });

  it('needs another person at the table', async () => {
    const [owner] = [await onboarded(PHONES[0])];
    const { sessionId } = await checkInAt(owner, venue, V);
    const created = await invoke(owner, 'rooms', { action: 'create' });
    const roomId = (created.body as { roomId: string }).roomId;
    for (const body of [
      { action: 'block', roomId },
      { action: 'block', roomId, sessionId },
    ]) {
      expect(await invoke(owner, 'safety', body)).toEqual({
        status: 409,
        body: errorBody('nothing_to_block'),
      });
    }
  });
});

describe('cleanup jobs', () => {
  it('deletes messages 24 hours after the room closed and reports after 30 days', async () => {
    const { owner, guest, roomId, ownerSession } = await roomWithGuest();
    await send(owner, roomId, 'silinecek');
    await invoke(guest, 'safety', {
      action: 'report',
      roomId,
      reason: 'spam',
      sessionId: ownerSession,
    });
    await invoke(owner, 'rooms', { action: 'end' });

    await sql`update public.rooms set closed_at = now() - interval '23 hours' where id = ${roomId}`;
    await sql`select private.delete_old_messages()`;
    expect(await sql`select 1 from public.messages where room_id = ${roomId}`).toHaveLength(1);

    await sql`update public.rooms set closed_at = now() - interval '25 hours' where id = ${roomId}`;
    await sql`select private.delete_old_messages()`;
    expect(await sql`select 1 from public.messages where room_id = ${roomId}`).toHaveLength(0);
    // The report keeps its copy after the messages are gone.
    const [report] =
      await sql`select messages_snapshot from public.reports where room_id = ${roomId}`;
    expect((report?.messages_snapshot as unknown[]).length).toBe(1);

    await sql`update public.reports set created_at = now() - interval '31 days' where room_id = ${roomId}`;
    await sql`select private.delete_old_reports()`;
    expect(await sql`select 1 from public.reports where room_id = ${roomId}`).toHaveLength(0);

    const jobs =
      await sql`select jobname, schedule from cron.job where jobname like 'delete-old-%' order by jobname`;
    expect(jobs.map((j) => [j.jobname, j.schedule])).toEqual([
      ['delete-old-messages', '0 * * * *'],
      ['delete-old-reports', '0 * * * *'],
      // The venue chat's own job (venueChat.test.ts checks its command).
      ['delete-old-venue-chat', '17 * * * *'],
    ]);
  });
});
