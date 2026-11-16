// DM yönetimi (docs/SPEC_V4.md §4.X): pin, archive, clear and edit, the caller's own, never seen by
// the other member.
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import type { DmInboxResponse, DmInboxThread } from '../functions/_shared/pure/api/friends.ts';
import {
  DM_EDIT_MAX,
  DM_EDIT_RATE,
  DM_EDIT_WINDOW_MS,
  DM_PIN_MAX,
} from '../functions/_shared/pure/dmManage.ts';
import { BROADCAST, dmChannel } from '../functions/_shared/pure/rooms.ts';
import { errorBody, onboarded, waitForBroadcast, waitUntilBlocked } from './helpers.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

// Seven accounts: a and up to six friends (one more than DM_PIN_MAX).
const PHONES = [
  '+905550000001',
  '+905550000002',
  '+905550000003',
  '+905550000004',
  '+905550000005',
  '+905550000006',
  '+905550000007',
] as const;
const NAMES = ['Ayşe', 'Burak', 'Cem', 'Deniz', 'Ece', 'Fırat', 'Gül'] as const;

afterEach(async () => {
  for (const phone of PHONES) await deleteUserByPhone(phone);
  await sql`delete from public.reports`;
});

afterAll(async () => {
  await sql.end();
});

const OK = { status: 200, body: { ok: true } };
const NOT_FRIENDS = { status: 403, body: errorBody('not_friends') };
const NOT_FOUND = { status: 404, body: errorBody('not_found') };

const dm = (client: Client, body: Record<string, unknown>) => invoke(client, 'dm', body);

// a and `count` friends, each with its thread (private.make_friends, as an accepted request does).
async function withFriends(count: number) {
  const clients = await Promise.all(
    PHONES.slice(0, count + 1).map((phone, i) => onboarded(phone, { displayName: NAMES[i] })),
  );
  const [a, ...others] = clients as [Client, ...Client[]];
  const aId = await userIdOf(a);
  const threads: string[] = [];
  for (const other of others) {
    const otherId = await userIdOf(other);
    await sql`select private.make_friends(${aId}, ${otherId}, 'request')`;
    const [row] = await sql`select private.thread_of(${aId}, ${otherId}) as id`;
    threads.push(String(row?.id));
  }
  return { a, others, threads };
}

async function inboxOf(client: Client): Promise<DmInboxResponse> {
  const res = await dm(client, { action: 'inbox' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as DmInboxResponse;
}

const byThread = (inbox: DmInboxResponse, threadId: string): DmInboxThread | undefined =>
  inbox.threads.find((t) => t.threadId === threadId);

async function page(client: Client, threadId: string) {
  const { data, error } = await client.rpc('dm_messages_page', { target_thread_id: threadId });
  expect(error).toBeNull();
  return data ?? [];
}

// The DM limit is one message per second per account; tests step the clock back instead (every
// time the DMs keep).
const spaced = async () => {
  await sql`update public.dm_messages set created_at = created_at - interval '2 seconds'`;
  await sql`update public.dm_threads set last_message_at = last_message_at - interval '2 seconds'`;
  await sql`update public.dm_thread_prefs set cleared_at = cleared_at - interval '2 seconds'`;
  await sql`update public.dm_reads set last_read_at = last_read_at - interval '2 seconds'`;
};

async function send(client: Client, threadId: string, body: string, replyTo?: string) {
  const res = await dm(client, { action: 'send', threadId, body, ...(replyTo ? { replyTo } : {}) });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  await spaced();
  return (res.body as { messageId: string }).messageId;
}

const prefsOf = (threadId: string) => sql`
  select user_id, pinned_at, archived_at, cleared_at from public.dm_thread_prefs
  where thread_id = ${threadId} order by user_id
`;

describe('dm/pin and dm/archive (§4.X)', () => {
  it('pins at most five, the last pinned on top; the same twice changes nothing', async () => {
    const { a, others, threads } = await withFriends(DM_PIN_MAX + 1);
    const [t1, t2, t3, t4, t5, t6] = threads as [string, string, string, string, string, string];

    // Pinned in this order: t3 first, t5 last (on top: the project owner's decision, 16 Kasım).
    for (const threadId of [t3, t1, t2, t4, t5]) {
      expect(await dm(a, { action: 'pin', threadId })).toEqual(OK);
    }
    expect(await dm(a, { action: 'pin', threadId: t6 })).toEqual({
      status: 409,
      body: errorBody('pin_limit'),
    });
    const inbox = await inboxOf(a);
    expect(inbox.threads.map((t) => [t.threadId, t.pinned])).toEqual([
      [t5, true],
      [t4, true],
      [t2, true],
      [t1, true],
      [t3, true],
      [t6, false],
    ]);

    // Sent twice: the same row and the same order (pure/apiRetry.ts).
    const before = await prefsOf(t3);
    expect(await dm(a, { action: 'pin', threadId: t3 })).toEqual(OK);
    expect(await prefsOf(t3)).toEqual(before);
    expect(await inboxOf(a)).toEqual(inbox);

    // Unpinned (twice: the same), the place is free again.
    expect(await dm(a, { action: 'unpin', threadId: t1 })).toEqual(OK);
    const unpinned = await prefsOf(t1);
    expect(await dm(a, { action: 'unpin', threadId: t1 })).toEqual(OK);
    expect(await prefsOf(t1)).toEqual(unpinned);
    expect(byThread(await inboxOf(a), t1)?.pinned).toBe(false);
    expect(await dm(a, { action: 'pin', threadId: t6 })).toEqual(OK);
    expect((await inboxOf(a)).threads.slice(0, 5).map((t) => t.threadId)).toEqual([
      t6,
      t5,
      t4,
      t2,
      t3,
    ]);

    // The other member sees nothing of it: not in its inbox, not in what it can read.
    const b = others[2] as Client;
    expect(byThread(await inboxOf(b), t3)).toMatchObject({ pinned: false, archived: false });
    const { data: ownRows } = await b.from('dm_thread_prefs').select('*');
    expect(ownRows).toEqual([]);
    const { data: aRows } = await a.from('dm_thread_prefs').select('thread_id');
    expect(aRows?.map((r) => r.thread_id).sort()).toEqual([...threads].sort());
  });

  it('archives and unarchives; the archive keeps its unread through a new message and takes no pin', async () => {
    const { a, others, threads } = await withFriends(2);
    const [b, c] = others as [Client, Client];
    const [tb, tc] = threads as [string, string];
    expect(await dm(a, { action: 'pin', threadId: tb })).toEqual(OK);

    // Archiving takes the pin off; twice: the same row (pure/apiRetry.ts).
    expect(await dm(a, { action: 'archive', threadId: tb })).toEqual(OK);
    const archived = await prefsOf(tb);
    expect(await dm(a, { action: 'archive', threadId: tb })).toEqual(OK);
    expect(await prefsOf(tb)).toEqual(archived);
    expect(byThread(await inboxOf(a), tb)).toMatchObject({ pinned: false, archived: true });
    expect(await dm(a, { action: 'pin', threadId: tb })).toEqual({
      status: 409,
      body: errorBody('thread_archived'),
    });

    // A new message leaves it in the archive; its unread counts there, apart.
    await send(b, tb, 'selam');
    await send(b, tb, 'orada mısın');
    await send(c, tc, 'merhaba');
    const inbox = await inboxOf(a);
    expect(byThread(inbox, tb)).toMatchObject({
      archived: true,
      unreadCount: 2,
      lastBody: 'orada mısın',
    });
    expect(byThread(inbox, tc)).toMatchObject({ archived: false, unreadCount: 1 });
    expect(inbox.archivedUnread).toBe(2);
    // The other member's side: nothing archived.
    expect(byThread(await inboxOf(b), tb)).toMatchObject({ archived: false });
    expect((await inboxOf(b)).archivedUnread).toBe(0);

    // Out again, by its own action only; twice: the same.
    expect(await dm(a, { action: 'unarchive', threadId: tb })).toEqual(OK);
    const out = await prefsOf(tb);
    expect(await dm(a, { action: 'unarchive', threadId: tb })).toEqual(OK);
    expect(await prefsOf(tb)).toEqual(out);
    expect(byThread(await inboxOf(a), tb)).toMatchObject({ archived: false, unreadCount: 2 });
    expect((await inboxOf(a)).archivedUnread).toBe(0);
  });

  it('answers not_friends outside the conversation and across a block', async () => {
    const { a, others, threads } = await withFriends(2);
    const [b, c] = others as [Client, Client];
    const [tb] = threads as [string];
    for (const action of ['pin', 'unpin', 'archive', 'unarchive', 'clear']) {
      expect(await dm(c, { action, threadId: tb, upTo: null })).toEqual(NOT_FRIENDS);
      expect(await dm(a, { action, threadId: randomUUID(), upTo: null })).toEqual(NOT_FRIENDS);
    }
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${await userIdOf(b)}, ${await userIdOf(a)}, 'x')
    `;
    expect(await dm(a, { action: 'pin', threadId: tb })).toEqual(NOT_FRIENDS);
    expect(await dm(a, { action: 'clear', threadId: tb, upTo: null })).toEqual(NOT_FRIENDS);
    expect(
      await sql`select 1 from public.dm_thread_prefs where user_id <> ${await userIdOf(a)}`,
    ).toHaveLength(0);
  });
});

describe('dm/clear (§4.X)', () => {
  it('hides everything so far from the clearer only, until a newer message; the same twice changes nothing', async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    const first = await send(a, threadId, 'bir');
    const seen = await send(b, threadId, 'iki');
    expect(await dm(a, { action: 'pin', threadId })).toEqual(OK);
    // A report from before keeps its copy (reports are never touched).
    expect(
      (await invoke(b, 'safety', { action: 'report', target: 'dm', threadId, reason: 'spam' }))
        .status,
    ).toBe(200);

    // upTo is required (null: none seen) and must be a message of this conversation.
    expect(await dm(a, { action: 'clear', threadId })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(await dm(a, { action: 'clear', threadId, upTo: randomUUID() })).toEqual(NOT_FOUND);
    expect(await dm(a, { action: 'clear', threadId, upTo: seen })).toEqual(OK);
    const cleared = await prefsOf(threadId);
    expect(await dm(a, { action: 'clear', threadId, upTo: seen })).toEqual(OK);
    expect(await prefsOf(threadId)).toEqual(cleared);
    // An older upTo never moves the mark back.
    expect(await dm(a, { action: 'clear', threadId, upTo: first })).toEqual(OK);
    expect(await prefsOf(threadId)).toEqual(cleared);

    // a: no conversation, no messages, nothing unread; the pin is gone with it.
    expect(byThread(await inboxOf(a), threadId)).toBeUndefined();
    expect(await page(a, threadId)).toEqual([]);
    const friendsA = await invoke(a, 'friends', { action: 'list' });
    expect((friendsA.body as { friends: unknown[] }).friends).toEqual([
      expect.objectContaining({ threadId, unread: false, lastMessageAt: null }),
    ]);
    // b: all as before, and the friendship goes on.
    expect((await page(b, threadId)).map((m) => m.body)).toEqual(['iki', 'bir']);
    expect(byThread(await inboxOf(b), threadId)).toMatchObject({ lastBody: 'iki' });
    expect(await sql`select body from public.dm_messages order by created_at`).toHaveLength(2);
    const [report] = await sql`select messages_snapshot from public.reports`;
    expect((report?.messages_snapshot as { body: string }[]).map((m) => m.body)).toEqual([
      'bir',
      'iki',
    ]);

    // Nothing from before the mark can be quoted or reacted to by a.
    expect(await dm(a, { action: 'react', messageId: first, emoji: 'begen' })).toEqual(NOT_FOUND);
    expect(await dm(a, { action: 'send', threadId, body: 'x', replyTo: first })).toEqual({
      status: 409,
      body: errorBody('reply_unavailable'),
    });
    expect(await dm(a, { action: 'edit', messageId: first, body: 'yeni' })).toEqual(NOT_FOUND);

    // b answers an old message: the conversation comes back for a from that message on, with
    // only it unread and its quote gone.
    await send(b, threadId, 'üç', first);
    const back = byThread(await inboxOf(a), threadId);
    expect(back).toMatchObject({ lastBody: 'üç', unreadCount: 1, pinned: false, archived: false });
    const pageA = await page(a, threadId);
    expect(pageA.map((m) => [m.body, m.reply_to])).toEqual([['üç', { gone: true }]]);
    expect((await page(b, threadId))[0]?.reply_to).toMatchObject({ id: first, body: 'bir' });
  });

  it('keeps a message that came between a clear and its repeat', async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    const seen = await send(b, threadId, 'bir');
    expect(await dm(a, { action: 'clear', threadId, upTo: seen })).toEqual(OK);
    await send(b, threadId, 'iki');
    // (Read after send, which steps the clock back.)
    const cleared = await prefsOf(threadId);
    // The same call again (a retry after a 5xx): the mark stays at what a saw.
    expect(await dm(a, { action: 'clear', threadId, upTo: seen })).toEqual(OK);
    expect(await prefsOf(threadId)).toEqual(cleared);
    expect((await page(a, threadId)).map((m) => m.body)).toEqual(['iki']);
    expect(byThread(await inboxOf(a), threadId)).toMatchObject({ lastBody: 'iki', unreadCount: 1 });
  });

  it('takes a conversation without messages out of the inbox until the first one', async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    expect(await dm(a, { action: 'archive', threadId })).toEqual(OK);
    expect(await dm(a, { action: 'clear', threadId, upTo: null })).toEqual(OK);
    const [row] = await sql`
      select cleared_at = '-infinity'::timestamptz as none from public.dm_thread_prefs
      where thread_id = ${threadId}
    `;
    expect(row?.none).toBe(true);
    expect(byThread(await inboxOf(a), threadId)).toBeUndefined();
    await send(b, threadId, 'selam');
    expect(byThread(await inboxOf(a), threadId)).toMatchObject({
      lastBody: 'selam',
      unreadCount: 1,
      archived: false,
    });
  });
});

describe('dm/edit (§4.X)', () => {
  it("edits one's own text within fifteen minutes, by the send's rules, announced without data", async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'Yarın 7de');
    await send(b, threadId, 'Olur', messageId);

    const heard = waitForBroadcast(b, dmChannel(threadId), BROADCAST.dmEdit);
    await heard.subscribed;
    const edited = await dm(a, { action: 'edit', messageId, body: '  Yarın 8de ' });
    expect(edited).toEqual({
      status: 200,
      body: { ok: true, body: 'Yarın 8de', editedAt: expect.any(String) },
    });
    await heard.received;
    await heard.close();

    // A report afterwards shows the message was edited and its earlier text (§4.X).
    expect(
      (await invoke(b, 'safety', { action: 'report', target: 'dm', threadId, reason: 'spam' }))
        .status,
    ).toBe(200);
    const [report] = await sql`select messages_snapshot from public.reports`;
    expect(report?.messages_snapshot).toEqual([
      expect.objectContaining({
        body: 'Yarın 8de',
        edited: true,
        edited_at: expect.any(String),
        versions: [{ version: 1, body: 'Yarın 7de', saved_at: expect.any(String) }],
      }),
      expect.objectContaining({
        body: 'Olur',
        edited: false,
        edited_at: null,
        versions: [],
      }),
    ]);

    // Both see the new text and the mark; the quote shows it too; the old text reaches no member.
    const [reply, original] = await page(b, threadId);
    expect(original).toMatchObject({ body: 'Yarın 8de', edited_at: expect.any(String) });
    expect(reply).toMatchObject({
      edited_at: null,
      reply_to: { id: messageId, body: 'Yarın 8de' },
    });
    expect((await page(a, threadId))[1]).toMatchObject({ body: 'Yarın 8de', from_me: true });
    expect(await sql`select 1 from public.dm_messages where body like '%7de%'`).toHaveLength(0);
    for (const client of [a, b]) {
      expect(JSON.stringify(await page(client, threadId))).not.toContain('7de');
      expect(JSON.stringify(await inboxOf(client))).not.toContain('7de');
    }
    // An edit is no new message: b, who answered after it, has nothing unread.
    expect(byThread(await inboxOf(b), threadId)?.unreadCount).toBe(0);

    // The send's rules (rule 7).
    expect(await dm(a, { action: 'edit', messageId, body: 'amk' })).toEqual({
      status: 422,
      body: errorBody('profanity_rejected'),
    });
    expect(await dm(a, { action: 'edit', messageId, body: '   ' })).toEqual({
      status: 400,
      body: errorBody('message_invalid'),
    });
    expect(await dm(a, { action: 'edit', messageId, body: 'x'.repeat(501) })).toEqual({
      status: 400,
      body: errorBody('message_invalid'),
    });
    // Only one's own, and only an existing one.
    const replyId = String(reply?.id);
    expect(await dm(a, { action: 'edit', messageId: replyId, body: 'Olmaz' })).toEqual(NOT_FOUND);
    expect(await dm(a, { action: 'edit', messageId: randomUUID(), body: 'x' })).toEqual(NOT_FOUND);
    const c = await onboarded(PHONES[2], { displayName: 'Cem' });
    expect(await dm(c, { action: 'edit', messageId, body: 'x' })).toEqual(NOT_FOUND);

    // Past the window, by the server's clock.
    await sql`
      update public.dm_messages
      set created_at = now() - make_interval(secs => ${DM_EDIT_WINDOW_MS / 1000 + 5})
      where id = ${messageId}
    `;
    expect(await dm(a, { action: 'edit', messageId, body: 'Yarın 9da' })).toEqual({
      status: 409,
      body: errorBody('edit_expired'),
    });

    // A block: refused as a send would be.
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${await userIdOf(b)}, ${await userIdOf(a)}, 'x')
    `;
    const fresh = await sql`
      insert into public.dm_messages (thread_id, sender_user_id, body)
      values (${threadId}, ${await userIdOf(a)}, 'yeni') returning id
    `;
    expect(await dm(a, { action: 'edit', messageId: fresh[0]?.id, body: 'yeni2' })).toEqual(
      NOT_FRIENDS,
    );
  });

  it('limits edits per account per window, asked before the edit', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'selam');
    for (let i = 1; i <= DM_EDIT_RATE.windowMax; i++) {
      expect((await dm(a, { action: 'edit', messageId, body: `selam ${i}` })).status).toBe(200);
    }
    expect(await dm(a, { action: 'edit', messageId, body: 'selam son' })).toEqual({
      status: 429,
      body: errorBody('rate_limited'),
    });
    const [row] = await sql`select body from public.dm_messages where id = ${messageId}`;
    expect(row?.body).toBe(`selam ${DM_EDIT_RATE.windowMax}`);
    // A new window opens the budget again.
    await sql`
      update public.dm_edit_rate
      set window_started_at = now() - make_interval(secs => ${DM_EDIT_RATE.windowSeconds + 1})
    `;
    expect((await dm(a, { action: 'edit', messageId, body: 'selam son' })).status).toBe(200);
  });

  it('answers the same edit twice with the first result and writes nothing', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'selam');

    // The unedited text again: nothing changes, no mark.
    expect(await dm(a, { action: 'edit', messageId, body: 'selam' })).toEqual({
      status: 200,
      body: { ok: true, body: 'selam', editedAt: null },
    });
    const first = await dm(a, { action: 'edit', messageId, body: 'selamlar' });
    const row = async () =>
      sql`select body, edited_at from public.dm_messages where id = ${messageId}`;
    const after = await row();
    expect(await dm(a, { action: 'edit', messageId, body: 'selamlar' })).toEqual(first);
    expect(await row()).toEqual(after);
  });
});

// The earlier texts of an edited message, kept for a report only (docs/decisions/dm-ilk-hal.md).
const versionsOf = (messageId: string) => sql`
  select version, body from private.dm_message_versions
  where message_id = ${messageId} order by version
`;

const reportAs = async (client: Client, threadId: string) =>
  expect(
    (await invoke(client, 'safety', { action: 'report', target: 'dm', threadId, reason: 'spam' }))
      .status,
  ).toBe(200);

describe('dm/edit versions (§4.X)', () => {
  it('keeps each replaced text, at most DM_EDIT_MAX real edits; the same text is none', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 's0');

    // The same text: no change, nothing kept, nothing counted.
    expect((await dm(a, { action: 'edit', messageId, body: 's0' })).status).toBe(200);
    expect(await versionsOf(messageId)).toEqual([]);
    for (let i = 1; i <= DM_EDIT_MAX; i++) {
      expect((await dm(a, { action: 'edit', messageId, body: `s${i}` })).status).toBe(200);
      // The same text again between edits counts nothing either.
      if (i === 2)
        expect((await dm(a, { action: 'edit', messageId, body: 's2' })).status).toBe(200);
    }
    expect(await versionsOf(messageId)).toEqual(
      Array.from({ length: DM_EDIT_MAX }, (_, i) => ({ version: i + 1, body: `s${i}` })),
    );
    // One more real edit: refused, nothing written; the same text still answers as before.
    expect(await dm(a, { action: 'edit', messageId, body: 'fazla' })).toEqual({
      status: 409,
      body: errorBody('edit_limit'),
    });
    expect(await dm(a, { action: 'edit', messageId, body: `s${DM_EDIT_MAX}` })).toEqual({
      status: 200,
      body: { ok: true, body: `s${DM_EDIT_MAX}`, editedAt: expect.any(String) },
    });
    const [row] = await sql`select body from public.dm_messages where id = ${messageId}`;
    expect(row?.body).toBe(`s${DM_EDIT_MAX}`);
    expect(await versionsOf(messageId)).toHaveLength(DM_EDIT_MAX);
  });

  it('counts the window from the send; an edit does not lengthen it', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'ilk');
    await sql`
      update public.dm_messages
      set created_at = now() - make_interval(secs => ${DM_EDIT_WINDOW_MS / 1000 - 30})
      where id = ${messageId}
    `;
    const [before] = await sql`select created_at from public.dm_messages where id = ${messageId}`;
    expect((await dm(a, { action: 'edit', messageId, body: 'ikinci' })).status).toBe(200);
    // The edit leaves the send's time as it was.
    const [after] = await sql`select created_at from public.dm_messages where id = ${messageId}`;
    expect(after?.created_at).toEqual(before?.created_at);
    // Past fifteen minutes from the send, though the edit was a moment ago.
    await sql`
      update public.dm_messages set created_at = created_at - interval '31 seconds'
      where id = ${messageId}
    `;
    expect(await dm(a, { action: 'edit', messageId, body: 'üçüncü' })).toEqual({
      status: 409,
      body: errorBody('edit_expired'),
    });
  });

  it('reaches no client answer, page, broadcast or role; a report copies it from the server', async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'gizli-ilk');
    const heard = waitForBroadcast(b, dmChannel(threadId), BROADCAST.dmEdit);
    await heard.subscribed;
    const edited = await dm(a, { action: 'edit', messageId, body: 'gizli-son' });
    expect(edited).toEqual({
      status: 200,
      body: { ok: true, body: 'gizli-son', editedAt: expect.any(String) },
    });
    // The announcement carries no data (dm/index.ts → broadcast(dmChannel, BROADCAST.dmEdit)).
    await heard.received;
    await heard.close();

    for (const client of [a, b]) {
      expect(JSON.stringify(await page(client, threadId))).not.toContain('gizli-ilk');
      expect(JSON.stringify(await inboxOf(client))).not.toContain('gizli-ilk');
    }

    // No client role reads or writes the table (rule 1, rule 2).
    for (const role of ['authenticated', 'anon']) {
      await expect(
        sql.begin(async (tx) => {
          await tx.unsafe(`set local role ${role}`);
          return tx`select body from private.dm_message_versions`;
        }),
      ).rejects.toThrow(/permission denied/);
      await expect(
        sql.begin(async (tx) => {
          await tx.unsafe(`set local role ${role}`);
          return tx`
            insert into private.dm_message_versions (message_id, version, body)
            values (${messageId}, 2, 'x')
          `;
        }),
      ).rejects.toThrow(/permission denied/);
    }

    await reportAs(b, threadId);
    const [report] = await sql`select messages_snapshot from public.reports`;
    expect(report?.messages_snapshot).toEqual([
      expect.objectContaining({
        body: 'gizli-son',
        edited: true,
        versions: [{ version: 1, body: 'gizli-ilk', saved_at: expect.any(String) }],
      }),
    ]);
  });

  it('adds an edited message older than the last 50 to a report', async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    const [aId, bId] = await Promise.all([userIdOf(a), userIdOf(b)]);
    const old = await send(a, threadId, 'eski-ilk');
    expect((await dm(a, { action: 'edit', messageId: old, body: 'eski-son' })).status).toBe(200);
    // 60 later messages, none edited.
    await sql`
      insert into public.dm_messages (thread_id, sender_user_id, body, created_at)
      select ${threadId}, case when i % 2 = 0 then ${aId}::uuid else ${bId}::uuid end, 'm' || i,
             now() + make_interval(secs => i)
      from generate_series(1, 60) i
    `;
    await reportAs(b, threadId);
    const [report] = await sql`select messages_snapshot from public.reports`;
    const copy = report?.messages_snapshot as { body: string }[];
    expect(copy).toHaveLength(51);
    expect(copy[0]).toEqual(
      expect.objectContaining({
        body: 'eski-son',
        versions: [{ version: 1, body: 'eski-ilk', saved_at: expect.any(String) }],
      }),
    );
    expect(copy.map((m) => m.body)).not.toContain('m10');
    expect(copy.at(-1)?.body).toBe('m60');
  });

  it('goes with a removal and a block; a report made before keeps its copy', async () => {
    const { a, others, threads } = await withFriends(2);
    const [b, c] = others as [Client, Client];
    const [aId, bId, cId] = await Promise.all([userIdOf(a), userIdOf(b), userIdOf(c)]);
    const publicIdOf = async (id: string) =>
      String((await sql`select public_id from public.profiles where id = ${id}`)[0]?.public_id);

    // "Çıkar + bildir": the copy is taken before the thread goes, in the same transaction.
    const ab = threads[0] as string;
    const toB = await send(a, ab, 'önce');
    expect((await dm(a, { action: 'edit', messageId: toB, body: 'sonra' })).status).toBe(200);
    await sql`select public.friends_remove(${bId}, ${await publicIdOf(aId)}, 'harassment')`;
    expect(await versionsOf(toB)).toEqual([]);
    expect(await sql`select 1 from public.dm_messages where id = ${toB}`).toHaveLength(0);
    const [removal] = await sql`select messages_snapshot from public.reports`;
    expect(removal?.messages_snapshot).toEqual([
      expect.objectContaining({
        body: 'sonra',
        versions: [expect.objectContaining({ body: 'önce' })],
      }),
    ]);

    // A report first, then a block without one: the report keeps its copy.
    const ac = threads[1] as string;
    const toC = await send(a, ac, 'eski');
    expect((await dm(a, { action: 'edit', messageId: toC, body: 'yeni' })).status).toBe(200);
    await reportAs(c, ac);
    await sql`select public.safety_block_friend(${cId}, ${await publicIdOf(aId)}, null)`;
    expect(await versionsOf(toC)).toEqual([]);
    const snapshots = await sql`select messages_snapshot from public.reports order by created_at`;
    expect(snapshots).toHaveLength(2);
    expect(snapshots[1]?.messages_snapshot).toEqual([
      expect.objectContaining({
        body: 'yeni',
        versions: [expect.objectContaining({ body: 'eski' })],
      }),
    ]);
  });

  it("goes with the account's deletion; a report about it keeps its copy", async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'merhaba');
    expect((await dm(a, { action: 'edit', messageId, body: 'selam' })).status).toBe(200);
    await reportAs(b, threadId);
    expect(await versionsOf(messageId)).toHaveLength(1);
    await deleteUserByPhone(PHONES[0]);
    expect(await versionsOf(messageId)).toEqual([]);
    const left = await sql`select reported_user_id, messages_snapshot from public.reports`;
    expect(left).toEqual([
      {
        reported_user_id: null,
        messages_snapshot: [
          expect.objectContaining({
            body: 'selam',
            versions: [expect.objectContaining({ body: 'merhaba' })],
          }),
        ],
      },
    ]);
  });

  it('is deleted hourly once dm_versions_keep() has passed since the edit; a newer one stays', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    const old = await send(a, threadId, 'eski 1');
    const fresh = await send(a, threadId, 'yeni 1');
    for (const [id, body] of [
      [old, 'eski 2'],
      [fresh, 'yeni 2'],
    ] as const) {
      expect((await dm(a, { action: 'edit', messageId: id, body })).status).toBe(200);
    }
    await sql`
      update private.dm_message_versions
      set saved_at = now() - private.dm_versions_keep() - interval '1 minute'
      where message_id = ${old}
    `;
    const [run] = await sql`select private.delete_old_dm_versions() as n`;
    expect(run?.n).toBe(1);
    expect(await versionsOf(old)).toEqual([]);
    expect(await versionsOf(fresh)).toEqual([{ version: 1, body: 'yeni 1' }]);
    expect(
      await sql`select schedule, command from cron.job where jobname = 'delete-old-dm-versions'`,
    ).toEqual([{ schedule: '29 * * * *', command: 'select private.delete_old_dm_versions()' }]);
  });
});

describe('locks', () => {
  // dm_thread_pref: the thread (for key share), the caller's pin lock, then its own prefs row.
  it('sets a pin only after taking the thread', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    expect(await dm(a, { action: 'unpin', threadId })).toEqual(OK);
    const aId = await userIdOf(a);

    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const pinning = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let pinned: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.dm_threads where id = ${threadId} for update`;
        pinned = pinning`select public.dm_thread_pref(${aId}, ${threadId}, 'pin', 5)`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('dm_thread_pref');
        await tx`set local lock_timeout = '2s'`;
        const held = await tx`
          select pinned_at from public.dm_thread_prefs where thread_id = ${threadId} for update
        `;
        expect(held).toEqual([{ pinned_at: null }]);
      });
      expect(await pinned).toHaveLength(1);
      expect(byThread(await inboxOf(a), threadId)?.pinned).toBe(true);
    } finally {
      await Promise.all([holder.end(), pinning.end()]);
    }
  });

  // dm_send writes its time under the thread's lock, later than the message before: a send that
  // began first but waited for the lock lands after the other, so a clear up to that other
  // message never hides it.
  it('lands a send that waited for the thread after every message before it', async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    const [aId, bId] = await Promise.all([userIdOf(a), userIdOf(b)]);

    const early = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let releaseEarly: () => void = () => {};
      const mayGo = new Promise<void>((resolve) => (releaseEarly = resolve));
      let markBegan: () => void = () => {};
      const began = new Promise<void>((resolve) => (markBegan = resolve));
      // a's send: its transaction, and so its now(), begins first.
      const earlySend = early.begin(async (tx) => {
        await tx`select now()`;
        markBegan();
        await mayGo;
        return tx`
          select message_id, created_at from public.dm_send_message(${aId}, ${threadId}, 'geç', 0)
        `;
      });
      await began;
      await new Promise((resolve) => setTimeout(resolve, 50));
      // b's send begins later, takes the thread first and holds it until a's send waits.
      const held = await holder.begin(async (tx) => {
        const rows = await tx`
          select message_id, created_at from public.dm_send_message(${bId}, ${threadId}, 'önce', 0)
        `;
        releaseEarly();
        await waitUntilBlocked('dm_send_message');
        return rows;
      });
      const late = await earlySend;
      // Compared in the database: the times differ by a microsecond.
      const [order] = await sql`
        select (select created_at from public.dm_messages where id = ${late[0]?.message_id})
             > (select created_at from public.dm_messages where id = ${held[0]?.message_id})
             as later
      `;
      expect(order?.later).toBe(true);

      // a clears up to b's message, the newest it had seen: a's own later message stays.
      expect(await dm(a, { action: 'clear', threadId, upTo: held[0]?.message_id })).toEqual(OK);
      expect((await page(a, threadId)).map((m) => m.body)).toEqual(['geç']);
    } finally {
      await Promise.all([early.end(), holder.end()]);
    }
  });

  // dm_edit (as dm_react): the thread, then the message.
  it('edits only after taking the thread', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'selam');
    await sql`update public.dm_messages set created_at = now() where id = ${messageId}`;
    const aId = await userIdOf(a);

    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const editing = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let edited: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.dm_threads where id = ${threadId} for update`;
        edited = editing`
          select changed from public.dm_edit(${aId}, ${messageId}, 'merhaba', ${DM_EDIT_WINDOW_MS})
        `
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('dm_edit');
        await tx`set local lock_timeout = '2s'`;
        const held =
          await tx`select body from public.dm_messages where id = ${messageId} for update`;
        expect(held).toEqual([{ body: 'selam' }]);
        // The replaced text is written only after the thread and the message (rule 10).
        expect(await tx`select 1 from private.dm_message_versions`).toHaveLength(0);
      });
      expect(await edited).toEqual([{ changed: true }]);
      expect(await versionsOf(messageId)).toEqual([{ version: 1, body: 'selam' }]);
    } finally {
      await Promise.all([holder.end(), editing.end()]);
    }
  });

  // delete_old_dm_versions picks its rows `skip locked`: a row held elsewhere is left for the
  // next hour, and the job does not wait for it.
  it('skips a version held elsewhere when deleting old ones', async () => {
    const { a, threads } = await withFriends(1);
    const threadId = threads[0] as string;
    const messageId = await send(a, threadId, 'selam');
    expect((await dm(a, { action: 'edit', messageId, body: 'merhaba' })).status).toBe(200);
    await sql`
      update private.dm_message_versions set saved_at = now() - private.dm_versions_keep() - interval '1 minute'
      where message_id = ${messageId}
    `;

    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const job = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await holder.begin(async (tx) => {
        await tx`
          select message_id from private.dm_message_versions where message_id = ${messageId}
          for update
        `;
        const [run] = await job.begin(async (jt) => {
          await jt`set local lock_timeout = '2s'`;
          return jt`select private.delete_old_dm_versions() as n`;
        });
        expect(run?.n).toBe(0);
      });
      const [run] = await sql`select private.delete_old_dm_versions() as n`;
      expect(run?.n).toBe(1);
      expect(await versionsOf(messageId)).toEqual([]);
    } finally {
      await Promise.all([holder.end(), job.end()]);
    }
  });
});
