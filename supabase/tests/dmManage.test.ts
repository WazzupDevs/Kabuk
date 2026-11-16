// DM yönetimi (docs/SPEC_V4.md §4.X): pin, archive, clear and edit, the caller's own, never seen by
// the other member.
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import type { DmInboxResponse, DmInboxThread } from '../functions/_shared/pure/api/friends.ts';
import { DM_EDIT_WINDOW_MS, DM_PIN_MAX } from '../functions/_shared/pure/dmManage.ts';
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
  it('pins at most five, the earliest pinned first; the same twice changes nothing', async () => {
    const { a, others, threads } = await withFriends(DM_PIN_MAX + 1);
    const [t1, t2, t3, t4, t5, t6] = threads as [string, string, string, string, string, string];

    // Pinned in this order: t3 first, then the others.
    for (const threadId of [t3, t1, t2, t4, t5]) {
      expect(await dm(a, { action: 'pin', threadId })).toEqual(OK);
    }
    expect(await dm(a, { action: 'pin', threadId: t6 })).toEqual({
      status: 409,
      body: errorBody('pin_limit'),
    });
    const inbox = await inboxOf(a);
    expect(inbox.threads.map((t) => [t.threadId, t.pinned])).toEqual([
      [t3, true],
      [t1, true],
      [t2, true],
      [t4, true],
      [t5, true],
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
      t3,
      t2,
      t4,
      t5,
      t6,
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
      expect(await dm(c, { action, threadId: tb })).toEqual(NOT_FRIENDS);
      expect(await dm(a, { action, threadId: randomUUID() })).toEqual(NOT_FRIENDS);
    }
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${await userIdOf(b)}, ${await userIdOf(a)}, 'x')
    `;
    expect(await dm(a, { action: 'pin', threadId: tb })).toEqual(NOT_FRIENDS);
    expect(await dm(a, { action: 'clear', threadId: tb })).toEqual(NOT_FRIENDS);
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
    await send(b, threadId, 'iki');
    expect(await dm(a, { action: 'pin', threadId })).toEqual(OK);
    // A report from before keeps its copy (reports are never touched).
    expect(
      (await invoke(b, 'safety', { action: 'report', target: 'dm', threadId, reason: 'spam' }))
        .status,
    ).toBe(200);

    expect(await dm(a, { action: 'clear', threadId })).toEqual(OK);
    const cleared = await prefsOf(threadId);
    expect(await dm(a, { action: 'clear', threadId })).toEqual(OK);
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

  it('takes a conversation without messages out of the inbox until the first one', async () => {
    const { a, others, threads } = await withFriends(1);
    const b = others[0] as Client;
    const threadId = threads[0] as string;
    expect(await dm(a, { action: 'archive', threadId })).toEqual(OK);
    expect(await dm(a, { action: 'clear', threadId })).toEqual(OK);
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

    // Both see the new text and the mark; the quote shows it too; the old text is nowhere.
    const [reply, original] = await page(b, threadId);
    expect(original).toMatchObject({ body: 'Yarın 8de', edited_at: expect.any(String) });
    expect(reply).toMatchObject({
      edited_at: null,
      reply_to: { id: messageId, body: 'Yarın 8de' },
    });
    expect((await page(a, threadId))[1]).toMatchObject({ body: 'Yarın 8de', from_me: true });
    expect(await sql`select 1 from public.dm_messages where body like '%7de%'`).toHaveLength(0);
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
      });
      expect(await edited).toEqual([{ changed: true }]);
    } finally {
      await Promise.all([holder.end(), editing.end()]);
    }
  });
});
