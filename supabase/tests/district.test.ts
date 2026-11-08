// Semte Git and Geçit (docs/SPEC_V4.md §4.V, K-90): the district is found from a coordinate kept
// nowhere (rule 6); the day's question goes without its answer and has one try (rule 4); rooms of
// 15 with no head count anywhere, the fullest with a seat first, one at a time for the last seat
// (rule 10); the session's time, the extra time and the night; the chat as the venue chat's, read
// only by the room's people from their coming in, on a private topic (rule 9).
import postgres from 'postgres';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import type {
  DistrictAnswerResponse,
  DistrictChatPageResponse,
  DistrictLocateResponse,
  DistrictState,
} from '../functions/_shared/pure/api/district.ts';
import {
  DISTRICT_CHAT_BROADCAST,
  districtChatChannel,
} from '../functions/_shared/pure/district.ts';
import {
  errorBody,
  onboarded,
  setTestPhoto,
  waitForBroadcast,
  waitUntilBlocked,
} from './helpers.ts';
import { TABLE_PHONES } from './people.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

// Points inside the drawn rings (content/districts.json) and one on the Avcılar–Beylikdüzü line.
const AVCILAR = { lat: 40.985, lng: 28.725 };
const BEYLIKDUZU = { lat: 40.98, lng: 28.63 };
const BORDER = { lat: 40.98, lng: 28.676 };
const KADIKOY = { lat: 40.99, lng: 29.03 };

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
  await sql`delete from public.district_rooms`;
  await sql`delete from public.gecit_questions`;
});

afterAll(async () => {
  await sql.end();
});

const district = (c: Client, body: Record<string, unknown>) => invoke(c, 'district', body);
const chat = (c: Client, body: Record<string, unknown>) => invoke(c, 'district-chat', body);

async function stateOf(c: Client): Promise<DistrictState> {
  const res = await district(c, { action: 'state' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as DistrictState;
}

async function at(c: Client, p: { lat: number; lng: number }, choice?: string) {
  const res = await district(c, { action: 'locate', ...p, ...(choice ? { choice } : {}) });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as DistrictLocateResponse;
}

async function todaysQuestion(answer = 1): Promise<string> {
  const [row] = await sql`
    insert into public.gecit_questions (day, prompt, options, answer)
    values ((now() at time zone 'Europe/Istanbul')::date, 'Soru?',
            array['A', 'B', 'C', 'D'], ${answer})
    returning day::text as day
  `;
  return row?.day as string;
}

async function enter(c: Client): Promise<DistrictState> {
  const res = await district(c, { action: 'enter' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as DistrictState;
}

// Someone in Avcılar's room (no question today: the gate is open).
async function inRoom(
  n: number,
  name = `Kişi ${n}`,
): Promise<{ c: Client; userId: string; roomId: string }> {
  const phone = TABLE_PHONES[n] as string;
  const c = await onboarded(phone, { displayName: name });
  await at(c, AVCILAR);
  const s = await enter(c);
  return { c, userId: await userIdOf(c), roomId: s.session?.roomId as string };
}

async function send(c: Client, body: string, identity: 'anonymous' | 'profiled' = 'anonymous') {
  await sql`update public.district_chat_rate set last_sent_at = '-infinity'`;
  const res = await chat(c, { action: 'send', body, identity });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as { messageId: string }).messageId;
}

async function page(c: Client): Promise<DistrictChatPageResponse> {
  const res = await chat(c, { action: 'page' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as DistrictChatPageResponse;
}

describe('finding the district (rule 6)', () => {
  it('keeps only the district, offers both near a shared border, and knows outside', async () => {
    const a = await onboarded(TABLE_PHONES[0]);
    expect((await stateOf(a)).located).toBe('never');

    const inside = await at(a, AVCILAR);
    expect(inside.candidates).toBeNull();
    expect(inside.state.district).toEqual({ ref: 'avcilar', name: 'Avcılar' });
    // No coordinate column anywhere in the row.
    const [row] =
      await sql`select * from public.user_districts where user_id = ${await userIdOf(a)}`;
    expect(Object.keys(row ?? {}).sort()).toEqual(['district_id', 'located_at', 'user_id']);

    const near = await at(a, BORDER);
    expect(near.candidates?.map((d) => d.ref).sort()).toEqual(['avcilar', 'beylikduzu']);
    // Nothing changes until the person chooses.
    expect(near.state.district?.ref).toBe('avcilar');
    expect((await at(a, BORDER, 'beylikduzu')).state.district?.ref).toBe('beylikduzu');
    // A choice that is not a candidate here is not taken.
    expect((await at(a, BEYLIKDUZU, 'avcilar')).state.district?.ref).toBe('beylikduzu');

    const outside = await at(a, KADIKOY);
    expect(outside.state).toMatchObject({ district: null, located: 'outside' });
  });

  it('refuses a mock location app’s position (as at check-in)', async () => {
    const a = await onboarded(TABLE_PHONES[0]);
    // The local stack takes the phone's mock flag as the emulator's (refusesMockedPosition): the
    // refusal itself is pure (devProject.test.ts); here the field is accepted.
    const res = await district(a, { action: 'locate', ...AVCILAR, mocked: true });
    expect(res.status).toBe(200);
  });

  it('closes the open session when the district changes or is outside', async () => {
    const { c } = await inRoom(0);
    expect((await at(c, AVCILAR)).state.session).not.toBeNull();
    expect((await at(c, BEYLIKDUZU)).state.session).toBeNull();
    await at(c, AVCILAR);
    expect((await enter(c)).session).not.toBeNull();
    expect((await at(c, KADIKOY)).state.session).toBeNull();
    expect(await district(c, { action: 'enter' })).toEqual({
      status: 409,
      body: errorBody('district_required'),
    });
  });
});

describe('Geçit (rule 4)', () => {
  it('sends the question without its answer, takes one try, and closes the day on a wrong one', async () => {
    const day = await todaysQuestion(1);
    const a = await onboarded(TABLE_PHONES[0]);
    await at(a, AVCILAR);
    const s = await stateOf(a);
    expect(s.gate).toBe('question');
    expect(s.question).toEqual({ day, prompt: 'Soru?', options: ['A', 'B', 'C', 'D'] });
    expect(JSON.stringify(s)).not.toContain('answer');
    expect(await district(a, { action: 'enter' })).toEqual({
      status: 403,
      body: errorBody('gate_closed'),
    });

    const wrong = await district(a, { action: 'answer', day, choice: 0 });
    expect(wrong.status).toBe(200);
    expect(wrong.body as DistrictAnswerResponse).toMatchObject({
      correct: false,
      state: { gate: 'failed', question: null },
    });
    // The second try changes nothing.
    const again = await district(a, { action: 'answer', day, choice: 1 });
    expect((again.body as DistrictAnswerResponse).correct).toBe(false);
    expect(await district(a, { action: 'enter' })).toEqual({
      status: 403,
      body: errorBody('gate_closed'),
    });
    expect(await district(a, { action: 'answer', day: '2020-01-01', choice: 1 })).toEqual({
      status: 409,
      body: errorBody('question_expired'),
    });

    const b = await onboarded(TABLE_PHONES[1]);
    await at(b, AVCILAR);
    const right = await district(b, { action: 'answer', day, choice: 1 });
    expect(right.body as DistrictAnswerResponse).toMatchObject({
      correct: true,
      state: { gate: 'passed' },
    });
    expect((await enter(b)).session).not.toBeNull();
  });

  it('opens without a question loaded for the day', async () => {
    const a = await onboarded(TABLE_PHONES[0]);
    await at(a, AVCILAR);
    expect((await stateOf(a)).gate).toBe('passed');
    expect((await enter(a)).session).not.toBeNull();
  });
});

describe('rooms', () => {
  it('seats the fullest room with a seat, and tells nobody how many', async () => {
    const userIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      const c = await onboarded(TABLE_PHONES[i] as string);
      await at(c, AVCILAR);
      userIds.push(await userIdOf(c));
    }
    const [a, b, c, d] = userIds as [string, string, string, string];
    const enterSql = async (u: string, capacity: number) => {
      const [row] =
        await sql`select room_id from public.district_enter(${u}, ${capacity}, 120, 10)`;
      return row?.room_id as string;
    };
    const r1 = await enterSql(a, 2);
    expect(await enterSql(b, 2)).toBe(r1);
    const r2 = await enterSql(c, 2);
    expect(r2).not.toBe(r1);
    // b leaves: r1 (1) and r2 (1) tie, the older wins.
    await sql`select public.district_leave(${b})`;
    expect(await enterSql(d, 2)).toBe(r1);

    const { c: client } = await inRoom(5);
    const s = await stateOf(client);
    const text = JSON.stringify(s) + JSON.stringify(await page(client));
    expect(text).not.toMatch(/count|people|members|capacity/i);
  });

  it('goes back to the same room the same day, with its old messages', async () => {
    const a = await inRoom(0);
    const b = await inRoom(1);
    expect(b.roomId).toBe(a.roomId);
    await send(a.c, 'merhaba');
    await district(b.c, { action: 'leave' });
    expect((await stateOf(b.c)).session).toBeNull();
    const back = await enter(b.c);
    expect(back.session?.roomId).toBe(a.roomId);
    expect((await page(b.c)).messages.map((m) => m.body)).toEqual(['merhaba']);
  });
});

describe('time', () => {
  it('extends only once the time is up, for two more hours in the same room', async () => {
    const { c, userId, roomId } = await inRoom(0);
    expect(await district(c, { action: 'extend' })).toEqual({
      status: 409,
      body: errorBody('not_due'),
    });
    await sql`
      update public.district_sessions
      set ends_at = now() - interval '1 minute', grace_ends_at = now() + interval '9 minutes'
      where user_id = ${userId} and status = 'open'
    `;
    expect((await stateOf(c)).session?.phase).toBe('grace');
    const res = await district(c, { action: 'extend' });
    expect(res.status).toBe(200);
    const s = (res.body as DistrictState).session;
    expect(s?.roomId).toBe(roomId);
    expect(s?.phase).toBe('active');
    // Two hours, but never past Istanbul midnight (the room is the day's): late in the evening the
    // session ends at midnight.
    const [{ midnight }] = await sql<{ midnight: Date }[]>`
      select private.istanbul_midnight() as midnight
    `;
    const expected = Math.min(Date.now() + 120 * 60 * 1000, midnight.getTime());
    expect(Math.abs(Date.parse(s?.endsAt as string) - expected)).toBeLessThan(60 * 1000);
  });

  it('closes after the extra time and empties the past days at night', async () => {
    const { c, userId } = await inRoom(0);
    await send(c, 'gece');
    await sql`
      update public.district_sessions
      set ends_at = now() - interval '20 minutes', grace_ends_at = now() - interval '10 minutes'
      where user_id = ${userId}
    `;
    await sql`select private.district_close_due()`;
    expect((await stateOf(c)).session).toBeNull();
    const [s] = await sql`select status from public.district_sessions where user_id = ${userId}`;
    expect(s?.status).toBe('closed');

    await sql`update public.district_rooms set day = day - 1`;
    await sql`
      insert into public.gecit_answers (user_id, day, correct)
      values (${userId}, (now() at time zone 'Europe/Istanbul')::date - 1, false)
    `;
    await sql`select private.district_close_due()`;
    const [left] = await sql`
      select (select count(*)::int from public.district_rooms) as rooms,
             (select count(*)::int from public.district_chat_messages) as messages,
             (select count(*)::int from public.gecit_answers) as answers
    `;
    expect(left).toEqual({ rooms: 0, messages: 0, answers: 0 });
  });
});

describe('the room chat', () => {
  it('shows the room only what came after one came in, and is the room’s alone', async () => {
    const a = await inRoom(0, 'Ayşe');
    await send(a.c, 'erken');
    const b = await inRoom(1, 'Burak');
    expect(b.roomId).toBe(a.roomId);
    expect((await page(b.c)).messages).toEqual([]);
    const id = await send(a.c, 'merhaba');
    const seen = (await page(b.c)).messages;
    expect(seen.map((m) => m.body)).toEqual(['merhaba']);
    expect(seen[0]).toMatchObject({ id, profiled: false, displayName: null, fromMe: false });
    expect(seen[0]?.senderAlias).toMatch(/^kapsul-/);

    // Someone with no session reads nothing and cannot write.
    const outsider = await onboarded(TABLE_PHONES[2] as string);
    expect((await page(outsider)).messages).toEqual([]);
    expect(await chat(outsider, { action: 'send', body: 'x', identity: 'anonymous' })).toEqual({
      status: 409,
      body: errorBody('no_session'),
    });
    expect(
      await chat(a.c, { action: 'send', body: 'sik', identity: 'anonymous' }).then((r) => r.status),
    ).toBe(422);
  });

  it('changes identity once, profiled with a photo, and opens the profile only to the room', async () => {
    const a = await inRoom(0, 'Ayşe');
    const b = await inRoom(1, 'Burak');
    expect(await district(a.c, { action: 'set-identity', anonymous: false })).toEqual({
      status: 409,
      body: errorBody('photo_required'),
    });
    await setTestPhoto(a.c);
    const set = await district(a.c, { action: 'set-identity', anonymous: false });
    expect((set.body as DistrictState).session).toMatchObject({
      identity: 'profiled',
      identitySwitchUsed: true,
    });
    expect(await district(a.c, { action: 'set-identity', anonymous: true })).toEqual({
      status: 409,
      body: errorBody('identity_switch_used'),
    });
    const id = await send(a.c, 'profilli', 'profiled');
    const [m] = (await page(b.c)).messages;
    expect(m).toMatchObject({ profiled: true, displayName: 'Ayşe', senderAlias: null });
    expect(JSON.stringify(m)).not.toMatch(/public_?id/i);

    const profile = await invoke(b.c, 'profile', { action: 'get', districtChatMessageId: id });
    expect(profile.status).toBe(200);
    expect(profile.body).toMatchObject({ displayName: 'Ayşe' });
    expect(JSON.stringify(profile.body)).not.toMatch(/publicId/);
    await district(b.c, { action: 'leave' });
    expect(
      (await invoke(b.c, 'profile', { action: 'get', districtChatMessageId: id })).status,
    ).toBe(404);
  });

  it('mutes by identity in the shared list, and sends a friend request named after the district', async () => {
    const a = await inRoom(0, 'Ayşe');
    const b = await inRoom(1, 'Burak');
    await setTestPhoto(a.c);
    await district(a.c, { action: 'set-identity', anonymous: false });
    const id = await send(a.c, 'selam', 'profiled');

    const req = await invoke(b.c, 'friends', { action: 'request', districtChatMessageId: id });
    expect(req).toEqual({ status: 200, body: { ok: true } });
    const [fr] = await sql`
      select source, venue_chat_context ->> 'venueName' as name from public.friend_requests
      where from_user_id = ${b.userId} and to_user_id = ${a.userId}
    `;
    expect(fr).toEqual({ source: 'venue_chat', name: 'Avcılar' });

    const mute = await chat(b.c, { action: 'mute', messageId: id });
    expect(mute.status).toBe(200);
    expect((await page(b.c)).messages).toEqual([]);
    const mutes = await invoke(b.c, 'venue-chat', { action: 'mutes' });
    expect((mutes.body as { mutes: { label: string }[] }).mutes.map((x) => x.label)).toEqual([
      'Ayşe',
    ]);
  });

  it('hides a message three accounts report', async () => {
    const sender = await inRoom(0);
    const reporters = [await inRoom(1), await inRoom(2), await inRoom(3)];
    const id = await send(sender.c, 'kötü değil ama');
    for (const r of reporters) {
      expect(await chat(r.c, { action: 'report', messageId: id, reason: 'spam' })).toEqual({
        status: 200,
        body: { ok: true },
      });
    }
    const [m] = await sql`select hidden_at from public.district_chat_messages where id = ${id}`;
    expect(m?.hidden_at).not.toBeNull();
    const [rep] = await sql`
      select count(*)::int as n from public.reports
      where target_type = 'district_chat' and district_chat_message_id = ${id}
    `;
    expect(rep?.n).toBe(3);
  });
});

describe('Realtime (rule 9)', () => {
  it('lets only the room’s people listen, and only the server send', async () => {
    const a = await inRoom(0);
    const b = await inRoom(1);
    const topic = districtChatChannel(a.roomId);
    const listen = waitForBroadcast(b.c, topic, DISTRICT_CHAT_BROADCAST);
    await listen.subscribed;
    await send(a.c, 'duyuyor musun');
    await listen.received;
    await listen.close();

    const outsider = await onboarded(TABLE_PHONES[2] as string);
    const refused = waitForBroadcast(outsider, topic, DISTRICT_CHAT_BROADCAST, 3000);
    // Nothing arrives on a refused channel: its timeout is expected.
    const nothing = refused.received.catch(() => {});
    await expect(refused.subscribed).rejects.toThrow();
    await nothing;
    await refused.close();
  });
});

describe('locks (rule 10)', () => {
  // Rooms come before sessions: entering locks the room first, and only then the old open session.
  it('locks the room before the old session', async () => {
    const x = await inRoom(0);
    const y = await inRoom(1);
    expect(y.roomId).toBe(x.roomId);
    // y's session is over but not closed yet (the job has not run).
    const [old] = await sql`
      update public.district_sessions
      set ends_at = now() - interval '20 minutes', grace_ends_at = now() - interval '1 minute'
      where user_id = ${y.userId} and status = 'open'
      returning id
    `;
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const entering = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let entered: Promise<unknown> = Promise.resolve();
      await holder.begin(async (tx) => {
        await tx`select id from public.district_rooms where id = ${x.roomId} for update`;
        entered = entering`select room_id from public.district_enter(${y.userId}, 15, 120, 10)`
          .execute()
          .catch((err: unknown) => err);
        await waitUntilBlocked('district_enter');
        // While it waits on the room, the old session is not locked.
        await tx`set local lock_timeout = '1s'`;
        await tx`select id from public.district_sessions where id = ${old?.id as string} for update`;
      });
      expect(await entered).toEqual([{ room_id: x.roomId }]);
      const [closed] =
        await sql`select status from public.district_sessions where id = ${old?.id as string}`;
      expect(closed?.status).toBe('closed');
    } finally {
      await Promise.all([holder.end(), entering.end()]);
    }
  });

  // Two people going for the last seat at the same time: one gets it, the other the next room.
  it('places one at a time under the district-day lock', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const c = await onboarded(TABLE_PHONES[i] as string);
      await at(c, AVCILAR);
      ids.push(await userIdOf(c));
    }
    const [a, b, c] = ids as [string, string, string];
    const [first] = await sql`select room_id from public.district_enter(${a}, 2, 120, 10)`;
    const [d] = await sql`select id from public.districts where ref = 'avcilar'`;
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const one = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const two = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let rooms: Promise<unknown>[] = [];
      await holder.begin(async (tx) => {
        await tx`select private.lock_district_day(${d?.id as string}, private.istanbul_today())`;
        rooms = [
          one`select room_id from public.district_enter(${b}, 2, 120, 10)`.execute(),
          two`select room_id from public.district_enter(${c}, 2, 120, 10)`.execute(),
        ];
        await waitUntilBlocked('district_enter', 2);
      });
      const got = (await Promise.all(rooms)) as { room_id: string }[][];
      const placed = got.map((r) => r[0]?.room_id);
      expect(placed.filter((r) => r === first?.room_id)).toHaveLength(1);
      expect(new Set(placed).size).toBe(2);
    } finally {
      await Promise.all([holder.end(), one.end(), two.end()]);
    }
  });
});
