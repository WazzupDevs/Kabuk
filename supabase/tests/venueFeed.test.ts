// Venue feed (docs/SPEC_V4.md §4.Y): only accounts with a live check-in at the venue read and
// write; everyone writes with their profile (a photo is required); a reply answers a post, never a
// reply; likes are counted, never named; nothing carries an account id, a profile id or a nick.
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { VenueFeedPageResponse } from '../functions/_shared/pure/api/venueFeed.ts';
import { venueChatChannel } from '../functions/_shared/pure/venueChat.ts';
import { VENUE_FEED, VENUE_FEED_BROADCAST } from '../functions/_shared/pure/venueFeed.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import {
  checkInAt,
  errorBody,
  onboarded,
  PHONES,
  setTestPhoto,
  waitForBroadcast,
  waitUntilBlocked,
} from './helpers.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

let venue: Record<string, string> = {};
const V = 'at-anchor';
const OK = { status: 200, body: { ok: true } };
const NOT_FOUND = { status: 404, body: errorBody('not_found') };

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

// Three accounts with a photo, checked in at the venue: Ayşe, Burak and Cem.
async function threeAtVenue() {
  const [a, b, c] = (await Promise.all([
    onboarded(PHONES[0], { displayName: 'Ayşe' }),
    onboarded(PHONES[1], { displayName: 'Burak' }),
    onboarded(PHONES[2], { displayName: 'Cem' }),
  ])) as [Client, Client, Client];
  for (const client of [a, b, c]) {
    await setTestPhoto(client);
    await checkInAt(client, venue, V);
  }
  return { a, b, c };
}

function feed(client: Client, body: Record<string, unknown>) {
  return invoke(client, 'venue-feed', body);
}

// Posts without waiting out the limit (the limit has its own test). Returns the post's id.
async function post(client: Client, body: string, replyTo?: string): Promise<string> {
  await sql`update public.venue_post_rate set last_sent_at = '-infinity', count = 0`;
  const res = await feed(client, {
    action: 'post',
    venueId: venue[V],
    body,
    ...(replyTo ? { replyTo } : {}),
  });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as { postId: string }).postId;
}

async function page(client: Client) {
  const res = await feed(client, { action: 'page', venueId: venue[V] });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as VenueFeedPageResponse).posts;
}

async function replies(client: Client, postId: string) {
  const res = await feed(client, { action: 'replies', postId });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as VenueFeedPageResponse).posts;
}

describe('venue feed: who reads and writes', () => {
  it('lets only accounts with a live check-in at the venue read and write, with a photo', async () => {
    const { a, b, c } = await threeAtVenue();
    await post(a, 'Merhaba mekan');
    expect((await page(b)).map((p) => p.body)).toEqual(['Merhaba mekan']);

    // Without a profile photo: reads, writes nothing.
    expect(await invoke(c, 'profile', { action: 'photo-remove' })).toEqual(OK);
    expect(await page(c)).toHaveLength(1);
    expect(await feed(c, { action: 'post', venueId: venue[V], body: 'x' })).toEqual({
      status: 409,
      body: errorBody('photo_required'),
    });

    // Another venue: nothing to read, nothing to write here.
    await checkInAt(b, venue, 'near');
    expect(await page(b)).toEqual([]);
    expect(await feed(b, { action: 'post', venueId: venue[V], body: 'x' })).toEqual({
      status: 409,
      body: errorBody('no_active_table'),
    });

    // Leaving the venue ends access at once; an expired check-in too.
    await invoke(a, 'checkin', { action: 'leave' });
    expect(await page(a)).toEqual([]);
    await sql`update public.table_sessions set expires_at = now() - interval '1 second'
              where user_id = ${await userIdOf(c)}`;
    expect(await page(c)).toEqual([]);
    expect(await sql`select 1 from public.venue_posts`).toHaveLength(1);
  });

  it('writes with the profile whatever the check-in identity, and names no account, profile id or nick', async () => {
    const { a, b } = await threeAtVenue();
    const [mine] = await sql`
      select p.public_id, p.capsule_nick, s.identity_mode
      from public.profiles p join public.table_sessions s on s.user_id = p.id
      where p.id = ${await userIdOf(a)} and s.status = 'active'
    `;
    const id = await post(a, 'Selam');
    const seen = await page(b);
    expect(seen).toEqual([
      {
        id,
        displayName: 'Ayşe',
        photoUrl: expect.stringContaining('token='),
        body: 'Selam',
        createdAt: expect.any(String),
        fromMe: false,
        likes: 0,
        liked: false,
        replies: 0,
      },
    ]);
    expect((await page(a))[0]?.fromMe).toBe(true);
    const text = JSON.stringify(seen);
    expect(text).not.toContain(await userIdOf(a));
    expect(text).not.toContain(mine?.public_id as string);
    if (mine?.capsule_nick) expect(text).not.toContain(mine.capsule_nick as string);
  });

  it('gives no client a way to the tables or the functions', async () => {
    const { a } = await threeAtVenue();
    const id = await post(a, 'Selam');
    expect((await a.from('venue_posts').select('id')).data ?? []).toEqual([]);
    expect((await a.from('venue_post_likes').select('post_id')).data ?? []).toEqual([]);
    const called = await a.rpc('venue_feed_page_for', {
      target_user_id: await userIdOf(a),
      target_venue_id: venue[V] ?? '',
    });
    expect(called.error).not.toBeNull();
    const liked = await a.rpc('venue_feed_like', {
      target_user_id: await userIdOf(a),
      target_post_id: id,
      liked: true,
      window_seconds: 10,
      window_max: 10,
    });
    expect(liked.error).not.toBeNull();
  });

  it('rejects profanity, empty and long posts, and limits the rate', async () => {
    const { a } = await threeAtVenue();
    const send = (body: string) => feed(a, { action: 'post', venueId: venue[V], body });
    expect((await send('amk bu ne')).body).toEqual(errorBody('profanity_rejected'));
    expect((await send('   ')).body).toEqual(errorBody('message_invalid'));
    expect((await send('a'.repeat(VENUE_FEED.maxLength + 1))).body).toEqual(
      errorBody('message_invalid'),
    );
    expect((await send('a'.repeat(VENUE_FEED.maxLength))).status).toBe(200);
    expect((await send('hemen bir daha')).body).toEqual(errorBody('too_soon'));
    await sql`update public.venue_post_rate
              set last_sent_at = '-infinity', count = ${VENUE_FEED.windowMax}`;
    expect((await send('çok fazla')).body).toEqual(errorBody('rate_limited'));
    expect(await sql`select 1 from public.venue_posts`).toHaveLength(1);
  });
});

describe('venue feed: one post per client id', () => {
  it('answers the same clientId with the same post and writes nothing new', async () => {
    const { a, b } = await threeAtVenue();
    const clientId = randomUUID();
    const body = { action: 'post', venueId: venue[V], body: 'bir kez', clientId };
    const first = await feed(a, body);
    expect(first.status, JSON.stringify(first.body)).toBe(200);
    // The repeat is not counted either: no too_soon.
    expect(await feed(a, body)).toEqual(first);
    expect(await page(b)).toHaveLength(1);
    expect(await feed(a, { ...body, body: 'başka' })).toEqual({
      status: 409,
      body: errorBody('client_id_reused'),
    });
  });
});

describe('venue feed: replies', () => {
  it('answers a post, never a reply; the page counts them', async () => {
    const { a, b, c } = await threeAtVenue();
    const id = await post(a, 'Bu akşam kim var?');
    const first = await post(b, 'Ben varım', id);
    await post(c, 'Ben de', id);
    await sql`update public.venue_post_rate set last_sent_at = '-infinity', count = 0`;
    expect(await feed(c, { action: 'post', venueId: venue[V], body: 'x', replyTo: first })).toEqual(
      {
        status: 409,
        body: errorBody('reply_unavailable'),
      },
    );
    expect(
      await feed(c, { action: 'post', venueId: venue[V], body: 'x', replyTo: randomUUID() }),
    ).toEqual({ status: 409, body: errorBody('reply_unavailable') });

    // Replies stay out of the page; the post counts them.
    expect(await page(a)).toEqual([expect.objectContaining({ id, replies: 2 })]);
    // venue-feed/replies, the same when sent twice.
    const listed = await replies(a, id);
    expect(listed.map((r) => [r.displayName, r.body])).toEqual([
      ['Cem', 'Ben de'],
      ['Burak', 'Ben varım'],
    ]);
    expect(await replies(a, id)).toEqual(listed);
    expect(await replies(a, randomUUID())).toEqual([]);
  });

  it('pages posts, the same when sent twice', async () => {
    const { a, b } = await threeAtVenue();
    await post(a, 'bir');
    await post(a, 'iki');
    const first = await page(b);
    expect(first.map((p) => p.body)).toEqual(['iki', 'bir']);
    expect(await page(b)).toEqual(first);
    const older = await feed(b, {
      action: 'page',
      venueId: venue[V],
      before: first[0]?.createdAt,
    });
    expect((older.body as VenueFeedPageResponse).posts.map((p) => p.body)).toEqual(['bir']);
  });
});

describe('venue feed: likes', () => {
  it('counts a like once per person, never names it, the same when sent twice', async () => {
    const { a, b, c } = await threeAtVenue();
    const id = await post(a, 'Selam');
    const heard = waitForBroadcast(a, venueChatChannel(venue[V] ?? ''), VENUE_FEED_BROADCAST);
    await heard.subscribed;
    expect(await feed(b, { action: 'like', postId: id })).toEqual(OK);
    await heard.received;
    await heard.close();
    expect(await feed(b, { action: 'like', postId: id })).toEqual(OK);
    expect(await feed(c, { action: 'like', postId: id })).toEqual(OK);
    expect(await page(b)).toEqual([expect.objectContaining({ likes: 2, liked: true })]);
    const forAuthor = await page(a);
    expect(forAuthor).toEqual([expect.objectContaining({ likes: 2, liked: false })]);
    expect(JSON.stringify(forAuthor)).not.toContain(await userIdOf(b));

    // Taken back, the same when sent twice.
    expect(await feed(b, { action: 'unlike', postId: id })).toEqual(OK);
    expect(await feed(b, { action: 'unlike', postId: id })).toEqual(OK);
    expect(await page(b)).toEqual([expect.objectContaining({ likes: 1, liked: false })]);
    expect(await feed(b, { action: 'like', postId: randomUUID() })).toEqual(NOT_FOUND);

    await sql`update public.venue_post_like_rate set count = ${VENUE_FEED.likeWindowMax}, window_started_at = now()`;
    expect((await feed(b, { action: 'like', postId: id })).body).toEqual(errorBody('rate_limited'));
  });
});

describe('venue feed: delete, report, mute and block', () => {
  it('lets the author take a post back, with its replies', async () => {
    const { a, b } = await threeAtVenue();
    const id = await post(a, 'Selam');
    const reply = await post(b, 'Merhaba', id);
    expect(await feed(b, { action: 'delete', postId: id })).toEqual(NOT_FOUND);
    expect(await feed(a, { action: 'delete', postId: id })).toEqual(OK);
    expect(await feed(a, { action: 'delete', postId: id })).toEqual(NOT_FOUND);
    expect(await page(b)).toEqual([]);
    expect(await replies(b, id)).toEqual([]);
    expect(await feed(a, { action: 'like', postId: reply })).toEqual(NOT_FOUND);
  });

  it('keeps a copy of a reported post and hides it after enough different reporters', async () => {
    const { a, b, c } = await threeAtVenue();
    const id = await post(a, 'Selam');
    const reply = await post(a, 'Kendime yanıt', id);
    // The author's own report does nothing; the answer is the same.
    expect(await feed(a, { action: 'report', postId: id, reason: 'spam' })).toEqual(OK);
    expect(
      await sql`select 1 from public.reports where venue_post_id in ${sql([id, reply])}`,
    ).toHaveLength(0);
    expect(await feed(b, { action: 'report', postId: reply, reason: 'spam' })).toEqual(OK);
    const [row] = await sql`select * from public.reports where venue_post_id = ${reply}`;
    expect(row).toMatchObject({
      target_type: 'venue_post',
      venue_post_id: reply,
      reason: 'spam',
      reporter_id: await userIdOf(b),
      reported_user_id: await userIdOf(a),
    });
    expect(
      (row?.messages_snapshot as { body: string; reported: boolean }[]).map((m) => [
        m.body,
        m.reported,
      ]),
    ).toEqual([
      ['Selam', false],
      ['Kendime yanıt', true],
    ]);
    // Still shown: one reporter. The same reporter again counts once.
    expect(await feed(b, { action: 'report', postId: reply, reason: 'spam' })).toEqual(OK);
    expect(await replies(c, id)).toHaveLength(1);
    // Enough different reporters (the number is the function's; here two): hidden from everyone
    // but its author.
    const [hidden] = await sql`
      select public.safety_report_venue_post(${await userIdOf(c)}, ${reply}, 'spam', 2) as hidden
    `;
    expect(hidden?.hidden).toBe(true);
    expect(await replies(c, id)).toEqual([]);
    expect(await replies(a, id)).toHaveLength(1);
    expect(await page(c)).toEqual([expect.objectContaining({ id, replies: 0 })]);
  });

  it('mutes the author for the muter only, shared with the chats, and hides both ways on a block', async () => {
    const { a, b, c } = await threeAtVenue();
    const id = await post(a, 'Selam');
    await post(a, 'Yanıtım', await post(c, 'Cem yazdı'));
    expect(await feed(a, { action: 'mute', postId: id })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    const muted = await feed(b, { action: 'mute', postId: id });
    expect(muted).toEqual({ status: 200, body: { muteId: expect.any(String) } });
    expect(
      await sql`select profiled, label, look from public.venue_chat_mutes
                where user_id = ${await userIdOf(b)}`,
    ).toEqual([{ profiled: true, label: 'Ayşe', look: null }]);
    // b: Ayşe's post and her reply are gone; everyone else sees them.
    expect(await page(b)).toEqual([expect.objectContaining({ body: 'Cem yazdı', replies: 0 })]);
    expect(await replies(b, id)).toEqual([]);
    expect((await page(a)).map((p) => p.body)).toEqual(['Cem yazdı', 'Selam']);
    expect((await page(c)).map((p) => p.body)).toEqual(['Cem yazdı', 'Selam']);

    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${await userIdOf(c)}, ${await userIdOf(a)}, 'x')
    `;
    expect((await page(c)).map((p) => [p.body, p.replies])).toEqual([['Cem yazdı', 0]]);
    expect((await page(a)).map((p) => p.body)).toEqual(['Selam']);
    expect(await feed(c, { action: 'like', postId: id })).toEqual(NOT_FOUND);
  });
});

// docs/SPEC_V4.md §4.Y: the profile behind a post and a friend request from it, as the venue chat's.
describe('venue feed: the profile and a friend request from a post', () => {
  const profile = (client: Client, venuePostId: string) =>
    invoke(client, 'profile', { action: 'get', venuePostId });
  const request = (client: Client, venuePostId: string) =>
    invoke(client, 'friends', { action: 'request', venuePostId });

  it('opens the profile to someone at the venue, never the profile id, and to nobody else', async () => {
    const { a, b, c } = await threeAtVenue();
    const id = await post(a, 'Selam');
    const reply = await post(a, 'Yanıt', id);
    for (const postId of [id, reply]) {
      const seen = await profile(b, postId);
      expect(seen.status, JSON.stringify(seen.body)).toBe(200);
      expect(seen.body).toMatchObject({ displayName: 'Ayşe', photoUrl: expect.any(String) });
      expect(JSON.stringify(seen.body)).not.toMatch(/public_?id|kapsul|alias/i);
    }
    // Unknown, across a block, deleted, and after leaving the venue: the same answer.
    expect(await profile(b, randomUUID())).toEqual(NOT_FOUND);
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${await userIdOf(a)}, ${await userIdOf(c)}, 'x')
    `;
    expect(await profile(c, id)).toEqual(NOT_FOUND);
    await sql`delete from public.blocks`;
    expect((await invoke(b, 'checkin', { action: 'leave' })).status).toBe(200);
    expect(await profile(b, id)).toEqual(NOT_FOUND);
    expect(await feed(a, { action: 'delete', postId: id })).toEqual(OK);
    expect(await profile(c, id)).toEqual(NOT_FOUND);
  });

  it('sends a request named after the venue, says ok whatever happens, and tells a friend', async () => {
    const { a, b, c } = await threeAtVenue();
    const id = await post(a, 'Selam');
    const [aId, bId] = await Promise.all([userIdOf(a), userIdOf(b)]);
    expect(await request(b, id)).toEqual(OK);
    expect(await request(b, id)).toEqual(OK);
    expect(
      await sql`
      select source, venue_chat_context ->> 'venueName' as venue,
             venue_chat_context ->> 'fromName' as "from"
      from public.friend_requests where from_user_id = ${bId} and to_user_id = ${aId}
    `,
    ).toEqual([{ source: 'venue_chat', venue: 'Test Kafe Çapa', from: 'Burak' }]);
    // The sender's "Gönderdiğin" shows it waiting.
    const sent = await invoke(b, 'friends', { action: 'sent' });
    expect((sent.body as { sent: { name: string }[] }).sent.map((x) => x.name)).toEqual(['Ayşe']);

    // One's own post, an unknown one and one across a block: ok, nothing written.
    expect(await request(a, id)).toEqual(OK);
    expect(await request(c, randomUUID())).toEqual(OK);
    await sql`
      insert into public.blocks (blocker_id, blocked_id, blocked_alias)
      values (${aId}, ${await userIdOf(c)}, 'x')
    `;
    expect(await request(c, id)).toEqual(OK);
    await sql`delete from public.blocks`;
    expect(await sql`select 1 from public.friend_requests`).toHaveLength(1);

    // The author asking back makes them friends; then it says so.
    const back = await post(b, 'Ben de');
    expect(await request(a, back)).toEqual(OK);
    expect(await sql`select source from public.friendships`).toEqual([{ source: 'request' }]);
    expect(await request(b, id)).toEqual({ status: 409, body: errorBody('already_friends') });
    // A friend's profile carries the profile id (rule 4).
    expect((await profile(b, id)).body).toHaveProperty('friendPublicId');
  });
});

describe('venue feed: a post lives a day', () => {
  it('deletes old posts with their replies and likes', async () => {
    const { a, b } = await threeAtVenue();
    const old = await post(a, 'eski');
    await post(b, 'eskiye yanıt', old);
    expect(await feed(b, { action: 'like', postId: old })).toEqual(OK);
    const fresh = await post(a, 'yeni');
    await sql`update public.venue_posts
              set created_at = now() - make_interval(hours => ${VENUE_FEED.keepHours + 1})
              where id = ${old}`;
    // Past its day it is gone for every reader at once, before the job runs.
    expect((await page(b)).map((p) => p.body)).toEqual(['yeni']);
    expect(await replies(b, old)).toEqual([]);
    expect(await feed(b, { action: 'unlike', postId: old })).toEqual(NOT_FOUND);
    await sql`select private.delete_old_venue_posts(${VENUE_FEED.keepHours})`;
    expect(await sql`select id from public.venue_posts`).toEqual([{ id: fresh }]);
    expect(await sql`select 1 from public.venue_post_likes`).toHaveLength(0);
  });
});

describe('locks (rule 10)', () => {
  // table_sessions → venue_post_rate → venue_posts: a post waits on the check-in before it
  // touches the rate row.
  it('locks the check-in before the rate row when posting', async () => {
    const { a } = await threeAtVenue();
    await post(a, 'ilk');
    await sql`update public.venue_post_rate set last_sent_at = '-infinity', count = 0`;
    const userId = await userIdOf(a);
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const writer = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let written: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.table_sessions
                 where user_id = ${userId} and status = 'active' for update`;
        written = writer`
          select replayed from public.venue_feed_post_once(
            ${userId}, ${venue[V] ?? ''}, 'ikinci', 0, 600, 10)
        `
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('venue_feed_post_once');
        // While it waits on the check-in, the rate row is not locked.
        await tx`set local lock_timeout = '1s'`;
        await tx`select user_id from public.venue_post_rate where user_id = ${userId} for update`;
      });
      expect(await written).toEqual([{ replayed: false }]);
    } finally {
      await Promise.all([holder.end(), writer.end()]);
    }
  });

  // table_sessions → venue_post_like_rate → venue_posts → venue_post_likes: a like waits on the
  // check-in before it touches the post.
  it('locks the check-in before the post when liking', async () => {
    const { a, b } = await threeAtVenue();
    const id = await post(a, 'Selam');
    const userId = await userIdOf(b);
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const liker = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let liked: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.table_sessions
                 where user_id = ${userId} and status = 'active' for update`;
        liked = liker`select changed from public.venue_feed_like(${userId}, ${id}, true, 10, 20)`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('venue_feed_like');
        // While it waits on the check-in, the post is not locked.
        await tx`set local lock_timeout = '1s'`;
        await tx`select id from public.venue_posts where id = ${id} for update`;
      });
      expect(await liked).toEqual([{ changed: true }]);
    } finally {
      await Promise.all([holder.end(), liker.end()]);
    }
  });

  // table_sessions → venue_posts → venue_post_reports → reports: a report waits on the check-in
  // before it touches the post.
  it('locks the check-in before the post when reporting', async () => {
    const { a, b } = await threeAtVenue();
    const id = await post(a, 'Selam');
    const userId = await userIdOf(b);
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const reporter = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let reported: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.table_sessions
                 where user_id = ${userId} and status = 'active' for update`;
        reported = reporter`
          select public.safety_report_venue_post(${userId}, ${id}, 'spam', 3) as hidden
        `
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('safety_report_venue_post');
        // While it waits on the check-in, the post is not locked.
        await tx`set local lock_timeout = '1s'`;
        await tx`select id from public.venue_posts where id = ${id} for update`;
      });
      expect(await reported).toEqual([{ hidden: false }]);
      expect(await sql`select 1 from public.reports where venue_post_id = ${id}`).toHaveLength(1);
    } finally {
      await Promise.all([holder.end(), reporter.end()]);
    }
  });
});
