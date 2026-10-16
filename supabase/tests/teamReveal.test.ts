// Faz 2 step 22.4 (docs/SPEC_V3.md §22.F, §22.G, §22.I, §22.K, §22.M): "Tanışalım mı?" per phone,
// play history and friendship per pair. Two phones on opposite sides that both say "Evet" match at
// once and only they hear it; anything else shows only at reveal_ends_at (rule 5, per pair). Rooms
// with one phone a side (old apps) are reveal.test.ts's and friends.test.ts's, which run unchanged.
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { RevealMatchesResponse } from '../functions/_shared/pure/api/reveal.ts';
import { REVEAL_COLORS, REVEAL_EMOJIS } from '../functions/_shared/pure/reveal.ts';
import { BROADCAST, sessionChannel } from '../functions/_shared/pure/rooms.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, setTestPhoto } from './helpers.ts';
import { dbUrl, deleteUserByPhone, invoke, sql } from './local.ts';
import {
  join,
  leave,
  type Phone,
  roomRow,
  rooms,
  table as checkIn,
  TEAM_PHONES,
  teamRoom,
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

const decide = (p: Phone, roomId: string, wantsMeet: boolean) =>
  invoke(p.client, 'reveal', { action: 'decide', roomId, wantsMeet });
const finalize = (p: Phone, roomId: string) =>
  invoke(p.client, 'reveal', { action: 'finalize', roomId });

async function matchesOf(p: Phone, roomId: string): Promise<RevealMatchesResponse> {
  const res = await invoke(p.client, 'reveal', { action: 'matches', roomId });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as RevealMatchesResponse;
}

// "Odayı bitir" by a leader: the window opens.
async function end(leader: Phone, roomId: string) {
  expect(await rooms(leader, { action: 'end' })).toEqual(OK);
  expect((await roomRow(roomId)).status).toBe('ending');
}

async function expireWindow(roomId: string) {
  await sql`
    update public.rooms set reveal_ends_at = now() - interval '1 second' where id = ${roomId}
  `;
}

// Every phone now in the room has been in it for `minutes` (the 3-minute rule of play history).
async function backdate(roomId: string, minutes = 10) {
  await sql`
    update public.room_members
    set joined_at = joined_at - make_interval(mins => ${minutes})
    where room_id = ${roomId} and left_at is null
  `;
}

async function signals(roomId: string) {
  const [row] =
    await sql`select color, pair_emojis from public.reveal_signals where room_id = ${roomId}`;
  return row as { color: string; pair_emojis: Record<string, string> } | undefined;
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

// The room channel as the app subscribes to it: every row change of the room and its rows.
async function roomChanges(p: Phone, roomId: string) {
  const payloads: unknown[] = [];
  const channel = p.client.channel(`room:${roomId}`, { config: { private: true } });
  for (const t of ['rooms', 'game_events', 'game_proposals', 'messages']) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: t,
        filter: t === 'rooms' ? `id=eq.${roomId}` : `room_id=eq.${roomId}`,
      },
      (payload: unknown) => payloads.push(payload),
    );
  }
  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(status));
    });
  });
  // SUBSCRIBED comes before Postgres Changes are live: touch the row until a change arrives.
  await expect
    .poll(
      async () => {
        await sql`update public.rooms set last_activity_at = last_activity_at where id = ${roomId}`;
        return payloads.length;
      },
      { timeout: 15_000, interval: 500 },
    )
    .toBeGreaterThan(0);
  await new Promise((resolve) => setTimeout(resolve, 500));
  payloads.length = 0;
  return { payloads, close: async () => void (await p.client.removeChannel(channel)) };
}

// Joins presence:{room}; resolves with the final status.
function presenceStatus(p: Phone, roomId: string): Promise<string> {
  const channel = p.client.channel(`presence:${roomId}`, { config: { private: true } });
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 1500));

describe('"Tanışalım mı?" per phone (§22.F)', { timeout: 60_000 }, () => {
  it('matches two "Evet" across sides, tells only those two and never teammates', async () => {
    const [owner, guest, ownerMember, guestMember] = await tables(4);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember], guest: [guestMember] });
    const heard = await Promise.all(
      [owner, guest, ownerMember, guestMember].map((p) => sessionEvents(p)),
    );
    const watch = await roomChanges(guest, roomId);
    await end(owner, roomId);

    // Teammates both say "Evet": no match.
    expect(await decide(owner, roomId, true)).toEqual(OK);
    expect(await decide(ownerMember, roomId, true)).toEqual(OK);
    expect(await matchesOf(owner, roomId)).toEqual({ color: null, matches: [], unmatched: null });
    // The guest's member says "Evet": it matches both phones of the owner's side.
    expect(await decide(guestMember, roomId, true)).toEqual(OK);
    await settle();
    const [o, g, om, gm] = heard.map((h) => h.events.filter((e) => e === BROADCAST.revealMatch));
    expect([o, g, om, gm]).toEqual([['reveal_match'], [], ['reveal_match'], ['reveal_match']]);

    const sig = await signals(roomId);
    expect(REVEAL_COLORS).toContain(sig?.color);
    const fromMember = await matchesOf(guestMember, roomId);
    expect(fromMember.color).toBe(sig?.color);
    expect(fromMember.unmatched).toBeNull();
    expect(fromMember.matches.map((m) => m.sessionId).sort()).toEqual(
      [owner.sessionId, ownerMember.sessionId].sort(),
    );
    const emojis = fromMember.matches.map((m) => m.emoji);
    expect(new Set(emojis).size).toBe(2);
    for (const e of emojis) expect(REVEAL_EMOJIS).toContain(e);
    // The pair's two phones see the same emoji.
    const fromOwner = await matchesOf(owner, roomId);
    expect(fromOwner).toEqual({
      color: sig?.color,
      matches: [
        {
          sessionId: guestMember.sessionId,
          alias: guestMember.alias,
          emoji: fromMember.matches.find((m) => m.sessionId === owner.sessionId)?.emoji,
          profile: null,
        },
      ],
      unmatched: null,
    });
    // The guest's leader, with no answer yet, sees nothing.
    expect(await matchesOf(guest, roomId)).toEqual({ color: null, matches: [], unmatched: null });

    // The color and the emojis are nowhere a phone reads: the room row, its events, Realtime.
    const { data: row } = await guest.client.from('rooms').select('*').eq('id', roomId).single();
    const { data: events } = await guest.client
      .from('game_events')
      .select('*')
      .eq('room_id', roomId);
    const pushed = JSON.stringify(watch.payloads);
    for (const text of [JSON.stringify(row), JSON.stringify(events), pushed]) {
      expect(text).not.toContain(sig?.color);
      for (const e of emojis) expect(text).not.toContain(e);
    }

    // One "Hayır": the room waits for reveal_ends_at and closes with "none".
    expect(await decide(guest, roomId, false)).toEqual(OK);
    expect((await roomRow(roomId)).status).toBe('ending');
    await expireWindow(roomId);
    expect(await finalize(owner, roomId)).toEqual(OK);
    expect(await roomRow(roomId)).toMatchObject({
      status: 'closed',
      reveal_result: 'none',
      reveal_token: null,
    });
    // Now the others: alias only, no reason.
    expect(await matchesOf(guest, roomId)).toEqual({
      color: null,
      matches: [],
      unmatched: expect.arrayContaining([
        { sessionId: owner.sessionId, alias: owner.alias },
        { sessionId: ownerMember.sessionId, alias: ownerMember.alias },
      ]),
    });
    expect((await matchesOf(owner, roomId)).unmatched).toEqual([
      { sessionId: guest.sessionId, alias: guest.alias },
    ]);
    for (const h of heard) await h.close();
    await watch.close();
  });

  it('closes at once when every participant says "Evet", without a token for a larger room', async () => {
    const [owner, guest, guestMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await end(owner, roomId);
    for (const p of [owner, guest, guestMember]) expect(await decide(p, roomId, true)).toEqual(OK);
    expect(await roomRow(roomId)).toMatchObject({
      status: 'closed',
      reveal_result: 'mutual',
      reveal_token: null,
    });
    expect(Object.keys((await signals(roomId))?.pair_emojis ?? {})).toHaveLength(2);
    expect((await matchesOf(owner, roomId)).matches).toHaveLength(2);
    expect((await matchesOf(guest, roomId)).unmatched).toEqual([]);
  });

  it('keeps the first answer of each phone and refuses phones outside the window', async () => {
    const [owner, guest, guestMember, outsider] = await tables(4);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await end(owner, roomId);
    expect(await decide(guestMember, roomId, false)).toEqual(OK);
    expect(await decide(guestMember, roomId, true)).toEqual(OK);
    expect(await decide(owner, roomId, true)).toEqual(OK);
    expect((await matchesOf(owner, roomId)).matches).toEqual([]);
    expect(await decide(outsider, roomId, true)).toEqual({
      status: 403,
      body: errorBody('not_in_room'),
    });
  });
});

// Rule 5, per pair: for the phone that said "Evet" (the owner), the guest's member saying "Hayır",
// not answering, leaving, blocking, leaving the venue or being removed by its leader look the same
// until reveal_ends_at; and so do its teammate's (the guest's leader's) actions.
describe('rule 5 per pair (§22.F, §22.M)', { timeout: 180_000 }, () => {
  type Who = 'member' | 'leader';
  type Does = 'nothing' | 'no' | 'leave' | 'block' | 'venue' | 'removed';

  async function yesSide(who: Who, does: Does) {
    const [owner, guest, guestMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await end(owner, roomId);
    const heard = await sessionEvents(owner);
    const watch = await roomChanges(owner, roomId);

    const decided = await decide(owner, roomId, true);
    const row = async () =>
      (await owner.client.from('rooms').select('*').eq('id', roomId).single()).data;
    const phones = async () =>
      (await owner.client.rpc('room_phones', { target_room_id: roomId })).data;
    const before = { row: await row(), phones: await phones() };

    const actor = who === 'member' ? guestMember : guest;
    const reply =
      does === 'nothing'
        ? null
        : does === 'no'
          ? await decide(actor, roomId, false)
          : does === 'leave'
            ? await leave(actor, roomId)
            : does === 'block'
              ? await invoke(actor.client, 'safety', {
                  action: 'block',
                  roomId,
                  sessionId: owner.sessionId,
                })
              : does === 'venue'
                ? await invoke(actor.client, 'checkin', { action: 'leave' })
                : await invoke(guest.client, 'safety', {
                    action: 'block',
                    roomId,
                    sessionId: guestMember.sessionId,
                  });
    await settle();

    const during = {
      decided,
      rowUnchanged: JSON.stringify(await row()) === JSON.stringify(before.row),
      phonesUnchanged: JSON.stringify(await phones()) === JSON.stringify(before.phones),
      phoneCount: before.phones?.length,
      matches: await matchesOf(owner, roomId),
      profiles: (await owner.client.rpc('room_member_profiles', { target_room_id: roomId })).data,
      sessionEvents: [...heard.events],
      roomChanges: watch.payloads.length,
      presence: await presenceStatus(owner, roomId),
      early: await finalize(owner, roomId),
      status: (await row())?.status,
    };
    await heard.close();
    await watch.close();

    await expireWindow(roomId);
    await finalize(owner, roomId);
    const after = await matchesOf(owner, roomId);
    const final = await row();
    for (const phone of TEAM_PHONES) await deleteUserByPhone(phone);
    return {
      reply: reply?.status ?? null,
      view: {
        during,
        after: {
          color: after.color,
          matches: after.matches,
          unmatched: after.unmatched?.map((u) => Object.keys(u).sort()),
          status: final?.status,
          result: final?.reveal_result,
          token: final?.reveal_token,
        },
      },
    };
  }

  it('looks the same for every way the other side says no', async () => {
    const baseline = await yesSide('member', 'nothing');
    expect(baseline.view.during).toMatchObject({
      decided: OK,
      rowUnchanged: true,
      phonesUnchanged: true,
      phoneCount: 3,
      matches: { color: null, matches: [], unmatched: null },
      sessionEvents: [],
      roomChanges: 0,
      presence: 'CHANNEL_ERROR',
      early: OK,
      status: 'ending',
    });
    expect(baseline.view.after).toMatchObject({
      color: null,
      matches: [],
      status: 'closed',
      result: 'none',
      token: null,
    });
    for (const [who, does] of [
      ['member', 'no'],
      ['member', 'leave'],
      ['member', 'block'],
      ['member', 'venue'],
      ['member', 'removed'],
      ['leader', 'no'],
      ['leader', 'leave'],
      ['leader', 'block'],
      ['leader', 'venue'],
    ] as const) {
      const run = await yesSide(who, does);
      expect(run.reply, `${who} ${does}`).toBe(200);
      expect(run.view, `${who} ${does}`).toEqual(baseline.view);
    }
  });
});

describe('play history per pair (§22.F)', { timeout: 60_000 }, () => {
  async function historyOf(roomId: string) {
    return sql`
      select user_id, other_user_id, encounter_id, reveal_mutual, available_at, own_alias,
             other_alias, started_at
      from public.play_history where room_id = ${roomId}
    `;
  }

  it('writes every pair of 2 + 3 phones that met for 3 minutes, opening a matched pair at once', async () => {
    const [owner, guest, ownerMember, guestMember, guestMember2, latecomer] = await tables(6);
    const roomId = await teamRoom(owner, guest, {
      owner: [ownerMember],
      guest: [guestMember, guestMember2],
    });
    await backdate(roomId);
    // Joined a minute ago: its pairs are shorter than 3 minutes.
    await join(latecomer, guest, roomId, 'guest');
    await end(owner, roomId);
    const { reveal_ends_at: endsAt } = await roomRow(roomId);

    let rows = await historyOf(roomId);
    expect(rows).toHaveLength(12);
    const sides = new Map([
      [owner.userId, 'owner'],
      [ownerMember.userId, 'owner'],
      [guest.userId, 'guest'],
      [guestMember.userId, 'guest'],
      [guestMember2.userId, 'guest'],
    ]);
    for (const r of rows) {
      expect(sides.get(r.user_id)).toBeDefined();
      expect(sides.get(r.other_user_id)).toBeDefined();
      expect(sides.get(r.user_id)).not.toBe(sides.get(r.other_user_id));
      expect(r.available_at).toEqual(endsAt);
      expect(r.reveal_mutual).toBe(false);
      // The pair's other row: the same encounter, the other way round.
      const back = rows.filter((x) => x.encounter_id === r.encounter_id);
      expect(back).toHaveLength(2);
      expect(back.map((x) => x.user_id).sort()).toEqual([r.user_id, r.other_user_id].sort());
    }
    expect(new Set(rows.map((r) => r.encounter_id)).size).toBe(6);
    expect(rows.some((r) => r.user_id === latecomer.userId)).toBe(false);

    // The owner and the guest's member match: their two rows open now; the rest wait.
    await decide(owner, roomId, true);
    await decide(guestMember, roomId, true);
    rows = await historyOf(roomId);
    for (const r of rows) {
      const pair = [r.user_id, r.other_user_id].sort().join();
      const matched = pair === [owner.userId, guestMember.userId].sort().join();
      expect(r.reveal_mutual).toBe(matched);
      if (matched) expect(+r.available_at).toBeLessThanOrEqual(Date.now());
      else expect(r.available_at).toEqual(endsAt);
    }
  });

  it("writes a leaving phone's pairs when it leaves", async () => {
    const [owner, guest, guestMember, brief] = await tables(4);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await backdate(roomId);
    expect(await leave(guestMember, roomId)).toEqual(OK);
    const rows = await historyOf(roomId);
    expect(rows.map((r) => [r.user_id, r.other_user_id]).sort()).toEqual(
      [
        [owner.userId, guestMember.userId],
        [guestMember.userId, owner.userId],
      ].sort(),
    );
    for (const r of rows) {
      expect(+r.available_at).toBeLessThanOrEqual(Date.now());
      expect(r.reveal_mutual).toBe(false);
    }
    // A phone that stays less than 3 minutes leaves no record.
    await join(brief, guest, roomId, 'guest');
    expect(await leave(brief, roomId)).toEqual(OK);
    expect(
      (await historyOf(roomId)).filter((r) => [r.user_id, r.other_user_id].includes(brief.userId)),
    ).toEqual([]);
  });
});

describe('friends per pair (§22.F)', { timeout: 60_000 }, () => {
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

  it('makes a matched pair friends when both press "Arkadaş ekle", and nothing when one does', async () => {
    const [owner, guest, ownerMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { owner: [ownerMember] });
    await backdate(roomId);
    await end(owner, roomId);
    for (const p of [owner, ownerMember, guest]) expect(await decide(p, roomId, true)).toEqual(OK);
    expect((await roomRow(roomId)).reveal_result).toBe('mutual');

    expect((await addFromRoom(owner, guest, roomId)).status).toBe(200);
    expect((await addFromRoom(guest, owner, roomId)).status).toBe(200);
    expect((await addFromRoom(ownerMember, guest, roomId)).status).toBe(200);

    const friendsOf = async (a: Phone, b: Phone) =>
      sql`
        select 1 from public.friendships
        where (user_a = ${a.userId} and user_b = ${b.userId})
           or (user_a = ${b.userId} and user_b = ${a.userId})
      `;
    expect(await friendsOf(owner, guest)).toHaveLength(1);
    expect(await friendsOf(ownerMember, guest)).toHaveLength(0);
    // The guest sees nothing of the member's press: its own row with the member is untouched and
    // no request exists.
    const [guestRow] = await sql`
      select friend_action_at from public.play_history where id = ${await historyId(guest, ownerMember, roomId)}
    `;
    expect(guestRow?.friend_action_at).toBeNull();
    expect(
      await sql`select 1 from public.friend_requests where from_user_id = ${ownerMember.userId}`,
    ).toHaveLength(0);

    // A request goes from the pair's own record.
    expect(
      (
        await invoke(ownerMember.client, 'friends', {
          action: 'request',
          historyId: await historyId(ownerMember, guest, roomId),
        })
      ).status,
    ).toBe(200);
    const [request] = await sql`
      select r.encounter_id from public.friend_requests r
      where r.from_user_id = ${ownerMember.userId} and r.to_user_id = ${guest.userId}
    `;
    const [pairRow] = await sql`
      select encounter_id from public.play_history where id = ${await historyId(ownerMember, guest, roomId)}
    `;
    expect(request?.encounter_id).toBe(pairRow?.encounter_id);
  });
});

describe('profiles in the room (§22.G, rule 4)', { timeout: 60_000 }, () => {
  it('lists the other profiled phones of both sides, keeps them through the window, and nothing outside', async () => {
    const [owner, guest, ownerMember, guestMember, outsider] = await tables(5);
    for (const p of [owner, guestMember]) await setTestPhoto(p.client);
    const created = await rooms(owner, { action: 'create', profiled: true });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;
    await join(guest, owner, roomId);
    await join(ownerMember, owner, roomId, 'owner');
    const asked = await rooms(guestMember, {
      action: 'request-join',
      roomId,
      profiled: true,
      side: 'guest',
    });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    const [request] = await sql`
      select id from public.join_requests
      where room_id = ${roomId} and requester_session_id = ${guestMember.sessionId}
    `;
    expect(await rooms(guest, { action: 'respond', requestId: request?.id, accept: true })).toEqual(
      OK,
    );

    const publicIdOf = async (p: Phone) =>
      (await sql`select public_id from public.profiles where id = ${p.userId}`)[0]?.public_id;
    const profiles = async (p: Phone) =>
      ((await p.client.rpc('room_member_profiles', { target_room_id: roomId })).data ?? [])
        .map((x) => x.session_id)
        .sort();
    expect(await profiles(guest)).toEqual([owner.sessionId, guestMember.sessionId].sort());
    expect(await profiles(owner)).toEqual([guestMember.sessionId]);
    expect(await profiles(ownerMember)).toEqual([owner.sessionId, guestMember.sessionId].sort());
    expect(await profiles(outsider)).toEqual([]);
    const { data: full } = await guest.client.rpc('room_member_profiles', {
      target_room_id: roomId,
    });
    expect(full?.find((x) => x.session_id === owner.sessionId)?.public_id).toBe(
      await publicIdOf(owner),
    );

    // In the window a profiled phone that leaves stays listed (rule 5).
    await end(owner, roomId);
    expect(await decide(guest, roomId, true)).toEqual(OK);
    expect(await leave(guestMember, roomId)).toEqual(OK);
    expect(await profiles(guest)).toEqual([owner.sessionId, guestMember.sessionId].sort());

    // A match shows the profile (name, age, photo), never an account id or public_id.
    expect(await decide(owner, roomId, true)).toEqual(OK);
    const seen = await matchesOf(guest, roomId);
    expect(seen.matches).toEqual([
      {
        sessionId: owner.sessionId,
        alias: owner.alias,
        emoji: expect.any(String),
        profile: {
          displayName: 'Kişi 0',
          age: expect.any(Number),
          photoUrl: expect.stringContaining('/storage/v1/object/sign/'),
        },
      },
    ]);
    const text = JSON.stringify([seen, await matchesOf(owner, roomId)]);
    for (const p of [owner, guest, ownerMember, guestMember]) {
      expect(text).not.toContain(p.userId);
      expect(text).not.toContain(String(await publicIdOf(p)));
    }
    // The window over and the room closed: nothing.
    await expireWindow(roomId);
    await finalize(owner, roomId);
    expect(await profiles(guest)).toEqual([]);
  });
});

describe('reveal/matches (§22.F)', { timeout: 60_000 }, () => {
  it('answers the same when sent twice, and nothing to a phone outside the window', async () => {
    const [owner, guest, guestMember, outsider] = await tables(4);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    const notYet = await invoke(owner.client, 'reveal', { action: 'matches', roomId });
    expect(notYet).toEqual({ status: 403, body: errorBody('not_in_room') });
    await end(owner, roomId);
    await decide(owner, roomId, true);
    await decide(guest, roomId, true);
    const once = await matchesOf(owner, roomId);
    expect(once.matches).toHaveLength(1);
    expect(await matchesOf(owner, roomId)).toEqual(once);
    expect(await invoke(outsider.client, 'reveal', { action: 'matches', roomId })).toEqual({
      status: 403,
      body: errorBody('not_in_room'),
    });
  });

  // Rule 4: a profile goes only while the room lasts. The pair's profile comes until
  // reveal_ends_at, also when every "Evet" closed the room early; after it the match is its table
  // session id, alias and emoji, and no photo is signed.
  it('gives a matched profile only until reveal_ends_at, also when the room closed early', async () => {
    const [owner, guest] = await tables(2);
    await setTestPhoto(owner.client);
    const created = await rooms(owner, { action: 'create', profiled: true });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;
    await join(guest, owner, roomId);
    await end(owner, roomId);
    await decide(owner, roomId, true);
    await decide(guest, roomId, true);
    expect((await roomRow(roomId)).status).toBe('closed');

    const pathFor = async () =>
      (
        await sql`
        select photo_path, display_name, birth_date
        from public.reveal_matches(${guest.userId}, ${roomId})
      `
      )[0];
    const during = await matchesOf(guest, roomId);
    expect(during.matches).toEqual([
      {
        sessionId: owner.sessionId,
        alias: owner.alias,
        emoji: expect.any(String),
        profile: {
          displayName: 'Kişi 0',
          age: expect.any(Number),
          photoUrl: expect.stringContaining('/storage/v1/object/sign/'),
        },
      },
    ]);
    expect((await pathFor())?.photo_path).toEqual(expect.any(String));

    await expireWindow(roomId);
    const after = await matchesOf(guest, roomId);
    expect(after).toEqual({
      color: during.color,
      matches: [
        {
          sessionId: owner.sessionId,
          alias: owner.alias,
          emoji: during.matches[0]?.emoji,
          profile: null,
        },
      ],
      unmatched: [],
    });
    // Nothing to sign: the path, the name and the birth date stay on the server.
    expect(await pathFor()).toEqual({ photo_path: null, display_name: null, birth_date: null });
  });
});

describe('reveal lists (pure/reveal.ts)', () => {
  it('agree in SQL and in TypeScript, with an emoji for each of 16 pairs', async () => {
    const [row] = await sql`
      select private.reveal_colors() as colors, private.reveal_emojis() as emojis
    `;
    expect(row?.colors).toEqual([...REVEAL_COLORS]);
    expect(row?.emojis).toEqual([...REVEAL_EMOJIS]);
    expect(REVEAL_EMOJIS.length).toBeGreaterThanOrEqual(16);
  });
});

describe('locks (§22.K)', { timeout: 60_000 }, () => {
  // Two phones on opposite sides say "Evet" at once: one pair, one emoji, both told.
  it('matches a pair once when both phones answer at once', async () => {
    const [owner, guest, guestMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await end(owner, roomId);
    const heard = await Promise.all([owner, guest].map((p) => sessionEvents(p)));
    expect(await Promise.all([decide(owner, roomId, true), decide(guest, roomId, true)])).toEqual([
      OK,
      OK,
    ]);
    await settle();
    expect(Object.keys((await signals(roomId))?.pair_emojis ?? {})).toHaveLength(1);
    for (const h of heard) {
      expect(h.events.filter((e) => e === BROADCAST.revealMatch)).toEqual(['reveal_match']);
      await h.close();
    }
    expect((await roomRow(roomId)).status).toBe('ending');
  });

  // A phone's answer holds its own session, then the room: another phone's session held elsewhere
  // does not stop it.
  it("takes an answer while another phone's session is held", async () => {
    const [owner, guest, guestMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await end(owner, roomId);
    await decide(owner, roomId, true);
    const answering = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      await sql.begin(async (tx) => {
        await tx`select id from private.active_session_for_update(${owner.userId})`;
        const matched = await answering.begin(async (atx) => {
          await atx`set local lock_timeout = '2s'`;
          return atx`
            select matched_session_id from public.reveal_decide(${guestMember.userId}, ${roomId}, true)
          `;
        });
        expect(matched.map((m) => m.matched_session_id).sort()).toEqual(
          [owner.sessionId, guestMember.sessionId].sort(),
        );
      });
    } finally {
      await answering.end();
    }
  });

  // The window opening (a leader ends the room) and a member leaving at the same moment: both
  // finish, the member's pairs are written once.
  it('opens the window while a member leaves', async () => {
    const [owner, guest, guestMember] = await tables(3);
    const roomId = await teamRoom(owner, guest, { guest: [guestMember] });
    await backdate(roomId);
    const [ended, left] = await Promise.all([
      rooms(owner, { action: 'end' }),
      leave(guestMember, roomId),
    ]);
    expect(ended).toEqual(OK);
    expect(left).toEqual(OK);
    expect((await roomRow(roomId)).status).toBe('ending');
    const rows = await sql`
      select user_id, other_user_id from public.play_history where room_id = ${roomId}
    `;
    expect(rows).toHaveLength(4);
  });
});
