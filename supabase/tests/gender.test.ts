// Faz 3 step 23.2, server (docs/SPEC_V3.md §23.D, §23.E, §23.M, rule 12): the gender, a closed
// column like the birth date; the asymmetric anonymity rule of the game flow; the request card's
// profile; "yanlış cinsiyet beyanı" reports. Staged (the owner's decision): until the app asks for the
// gender (step 23.2's client part), sign-up may leave it out and an empty gender passes the game flow.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { Gender } from '../functions/_shared/pure/gender.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { errorBody, onboarded, PHONES, setTestPhoto, TEST_AGE } from './helpers.ts';
import { deleteUserByPhone, invoke, signIn, sql, userIdOf } from './local.ts';
import {
  createRoom,
  FIXTURE_VENUE,
  join,
  type Phone,
  rooms,
  table,
  TEAM_PHONES,
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

const account = (p: { client: Phone['client'] }, body: Record<string, unknown>) =>
  invoke(p.client, 'account', body);

// Phone n checked in at the venue, with a gender (none: left empty, as sign-up does today) and, if
// asked, a visible profile photo.
async function at(
  n: number,
  gender: Gender | null,
  opts: { photo?: boolean } = {},
): Promise<Phone> {
  const p = await table(venue, n);
  if (gender) expect(await account(p, { action: 'set-gender', gender })).toEqual(OK);
  if (opts.photo) await setTestPhoto(p.client);
  return p;
}

async function ownProfile(client: Phone['client']) {
  const { data } = await client.from('profiles').select('public_id').single();
  return invoke(client, 'profile', { action: 'get', publicId: data?.public_id });
}

async function requestIdOf(p: Phone, roomId: string): Promise<string> {
  const [row] = await sql`
    select id from public.join_requests
    where room_id = ${roomId} and requester_session_id = ${p.sessionId} and status = 'pending'
  `;
  if (!row) throw new Error('no pending request');
  return row.id as string;
}

describe('the gender column (§23.D, rule 12)', () => {
  it('is written once at sign-up and read by its owner only through profile/get', async () => {
    const a = { client: await onboarded(PHONES[0], { gender: 'female' }) };
    const own = await ownProfile(a.client);
    expect(own.status).toBe(200);
    expect((own.body as { gender: string }).gender).toBe('female');

    // The same answer again is fine (a re-consent); another one is refused, like the birth date.
    const again = {
      action: 'complete-onboarding',
      termsVersion: 'draft-1',
      kvkkVersion: 'draft-1',
    };
    expect(await account(a, { ...again, gender: 'female' })).toEqual(OK);
    expect(await account(a, { ...again, gender: 'male' })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(await account(a, again)).toEqual(OK);
    const [row] =
      await sql`select gender from public.profiles where id = ${await userIdOf(a.client)}`;
    expect(row?.gender).toBe('female');
  });

  it('is closed to the client, which reads only whether it is set', async () => {
    const client = await onboarded(PHONES[0], { gender: 'male' });
    const hidden = await client.from('profiles').select('gender');
    expect(hidden.error?.code).toBe('42501');
    const flag = await client.from('profiles').select('has_gender').single();
    expect(flag.data).toEqual({ has_gender: true });
    // No client RPC reads it.
    const readers = await sql`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosrc ilike '%gender%'
        and has_function_privilege('authenticated', p.oid, 'execute')
    `;
    expect(readers.map((r) => r.proname)).toEqual([]);
  });

  it('stays empty after a sign-up without it, until the app asks (step 23.2, client part)', async () => {
    const client = await onboarded(PHONES[0]);
    const flag = await client.from('profiles').select('has_gender').single();
    expect(flag.data).toEqual({ has_gender: false });
    expect(((await ownProfile(client)).body as { gender: unknown }).gender).toBeNull();
  });

  it('set-gender writes only an empty gender and needs a finished sign-up', async () => {
    const a = { client: await onboarded(PHONES[0]) };
    expect(await account(a, { action: 'set-gender', gender: 'x' })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(await account(a, { action: 'set-gender', gender: 'unspecified' })).toEqual(OK);
    expect(await account(a, { action: 'set-gender', gender: 'female' })).toEqual({
      status: 400,
      body: errorBody('bad_request'),
    });
    expect(((await ownProfile(a.client)).body as { gender: string }).gender).toBe('unspecified');

    const fresh = { client: await signIn(PHONES[1]) };
    expect(await account(fresh, { action: 'set-gender', gender: 'female' })).toEqual({
      status: 403,
      body: errorBody('onboarding_required'),
    });
  });

  it('set-gender refuses a filled gender, from sign-up or from itself, even the same answer', async () => {
    const refused = { status: 400, body: errorBody('bad_request') };
    const signedUp = { client: await onboarded(PHONES[0], { gender: 'female' }) };
    const answered = { client: await onboarded(PHONES[1]) };
    expect(await account(answered, { action: 'set-gender', gender: 'male' })).toEqual(OK);

    for (const [p, kept] of [
      [signedUp, 'female'],
      [answered, 'male'],
    ] as const) {
      for (const gender of ['female', 'male', 'unspecified']) {
        expect(await account(p, { action: 'set-gender', gender })).toEqual(refused);
      }
      const [row] =
        await sql`select gender from public.profiles where id = ${await userIdOf(p.client)}`;
      expect(row?.gender).toBe(kept);
    }
  });

  it('goes to nobody else, even in a room where both joined with their profile', async () => {
    const owner = await at(0, 'female', { photo: true });
    const guest = await at(1, 'male', { photo: true });
    const created = await rooms(owner, { action: 'create', profiled: true });
    const roomId = (created.body as { roomId: string }).roomId;
    const asked = await rooms(guest, { action: 'request-join', roomId, profiled: true });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    const card = await rooms(owner, {
      action: 'request-profile',
      requestId: await requestIdOf(guest, roomId),
    });
    expect(
      await rooms(owner, {
        action: 'respond',
        requestId: await requestIdOf(guest, roomId),
        accept: true,
      }),
    ).toEqual(OK);

    // The other side's profile as a room member sees it (rule 4, Faz 2): no gender.
    const [other] = await sql`select public_id from public.profiles where id = ${guest.userId}`;
    const seen = await invoke(owner.client, 'profile', {
      action: 'get',
      publicId: other?.public_id,
    });
    expect(seen.status).toBe(200);
    for (const body of [seen.body, card.body]) {
      expect(JSON.stringify(body)).not.toMatch(/gender|female|unspecified|"male"/);
    }
  });
});

describe('the game flow (§23.D)', () => {
  it('refuses an anonymous room, "Katıl" and "Bu masadayım" from a man and from "Belirtmek istemiyorum"', async () => {
    const owner = await at(0, 'female');
    const man = await at(1, 'male', { photo: true });
    const unsaid = await at(2, 'unspecified', { photo: true });
    const roomId = await createRoom(owner);
    const refused = { status: 409, body: errorBody('anonymous_not_allowed') };

    for (const p of [man, unsaid]) {
      expect(await rooms(p, { action: 'create', profiled: false })).toEqual(refused);
      expect(await rooms(p, { action: 'request-join', roomId, profiled: false })).toEqual(refused);
      expect(
        await rooms(p, { action: 'request-join', roomId, profiled: false, side: 'owner' }),
      ).toEqual(refused);
    }
    // Never turned into a profiled entry behind their back: nothing was written.
    const [count] = await sql`
      select count(*)::int as n from public.join_requests where room_id = ${roomId}
    `;
    expect(count?.n).toBe(0);

    // With the profile they join as anyone does.
    const asked = await rooms(man, { action: 'request-join', roomId, profiled: true });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
  });

  it('asks the photo of the profiled entry they must make', async () => {
    const man = await at(0, 'male');
    expect(await rooms(man, { action: 'create', profiled: true })).toEqual({
      status: 409,
      body: errorBody('photo_required'),
    });
    await setTestPhoto(man.client);
    expect((await rooms(man, { action: 'create', profiled: true })).status).toBe(200);
  });

  it('lets a woman choose, and an empty gender pass until the app asks', async () => {
    const empty = await at(0, null);
    const woman = await at(1, 'female', { photo: true });
    const other = await at(2, 'female');
    const roomId = await createRoom(empty);
    for (const [p, profiled] of [
      [woman, true],
      [other, false],
    ] as const) {
      const asked = await rooms(p, { action: 'request-join', roomId, profiled });
      expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    }
  });

  it('does not count "Masanla oyna": a man, "Belirtmek istemiyorum" and an empty gender, without a photo', async () => {
    for (const [n, gender] of [
      [0, 'male'],
      [1, 'unspecified'],
      [2, null],
    ] as const) {
      const p = await at(n, gender);
      expect((await rooms(p, { action: 'create-solo' })).status).toBe(200);
    }
  });

  it('keeps the venue chat anonymous for everyone (§22.G)', async () => {
    const man = await at(0, 'male');
    const sent = await invoke(man.client, 'venue-chat', {
      action: 'send',
      venueId: venue[FIXTURE_VENUE],
      body: 'Selam',
      profiled: false,
    });
    expect(sent.status, JSON.stringify(sent.body)).toBe(200);
  });
});

describe('rooms/request-profile (§23.E)', () => {
  it('gives the leader who can answer the name, age and photo of a profiled requester, while it waits', async () => {
    const owner = await at(0, 'female');
    const man = await at(1, 'male', { photo: true });
    const stranger = await at(2, 'female');
    const roomId = await createRoom(owner);
    expect((await rooms(man, { action: 'request-join', roomId, profiled: true })).status).toBe(200);
    const requestId = await requestIdOf(man, roomId);

    const card = await rooms(owner, { action: 'request-profile', requestId });
    expect(card).toEqual({
      status: 200,
      body: { displayName: 'Kişi 1', age: TEST_AGE, photoUrl: expect.any(String) },
    });
    const notFound = { status: 404, body: errorBody('not_found') };
    expect(await rooms(man, { action: 'request-profile', requestId })).toEqual(notFound);
    expect(await rooms(stranger, { action: 'request-profile', requestId })).toEqual(notFound);

    expect(await rooms(owner, { action: 'respond', requestId, accept: false })).toEqual(OK);
    expect(await rooms(owner, { action: 'request-profile', requestId })).toEqual(notFound);
  });

  it('answers an anonymous request and an expired one with not_found alike', async () => {
    const owner = await at(0, 'female');
    const woman = await at(1, 'female', { photo: true });
    const man = await at(2, 'male', { photo: true });
    const roomId = await createRoom(owner);
    const notFound = { status: 404, body: errorBody('not_found') };

    expect((await rooms(woman, { action: 'request-join', roomId, profiled: false })).status).toBe(
      200,
    );
    expect(
      await rooms(owner, {
        action: 'request-profile',
        requestId: await requestIdOf(woman, roomId),
      }),
    ).toEqual(notFound);

    expect((await rooms(man, { action: 'request-join', roomId, profiled: true })).status).toBe(200);
    const requestId = await requestIdOf(man, roomId);
    await sql`
      update public.join_requests set expires_at = now() - interval '1 second' where id = ${requestId}
    `;
    expect(await rooms(owner, { action: 'request-profile', requestId })).toEqual(notFound);
  });

  it('gives "Bu masadayım" to the leader of that side only', async () => {
    const owner = await at(0, 'female');
    const guest = await at(1, 'female');
    const man = await at(2, 'male', { photo: true });
    const roomId = await createRoom(owner);
    await join(guest, owner, roomId);
    const asked = await rooms(man, {
      action: 'request-join',
      roomId,
      profiled: true,
      side: 'guest',
    });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    const requestId = await requestIdOf(man, roomId);

    expect((await rooms(guest, { action: 'request-profile', requestId })).status).toBe(200);
    expect(await rooms(owner, { action: 'request-profile', requestId })).toEqual({
      status: 404,
      body: errorBody('not_found'),
    });
  });
});

describe('"yanlış cinsiyet beyanı" reports (§23.D)', () => {
  it('are written for a phone in the room and a history row, and refused for the rest', async () => {
    const owner = await at(0, 'female');
    const guest = await at(1, 'female');
    const roomId = await createRoom(owner);
    await join(guest, owner, roomId);

    const report = (body: Record<string, unknown>) =>
      invoke(owner.client, 'safety', { action: 'report', reason: 'wrong_gender', ...body });
    expect(await report({ roomId, sessionId: guest.sessionId })).toEqual(OK);

    // An encounter of 3 minutes, then the room ends: a history row for each side.
    await sql`
      update public.room_members set joined_at = joined_at - interval '10 minutes'
      where room_id = ${roomId}
    `;
    expect(await rooms(owner, { action: 'end' })).toEqual(OK);
    await sql`
      update public.play_history set available_at = now() - interval '1 second'
      where room_id = ${roomId}
    `;
    const [history] = await sql`
      select id from public.play_history where user_id = ${owner.userId} and room_id = ${roomId}
    `;
    expect(history).toBeDefined();
    expect(await report({ target: 'history', historyId: history?.id })).toEqual(OK);

    const rows = await sql`
      select reason, reported_user_id from public.reports where reporter_id = ${owner.userId}
    `;
    expect(rows.map((r) => [r.reason, r.reported_user_id])).toEqual([
      ['wrong_gender', guest.userId],
      ['wrong_gender', guest.userId],
    ]);
    // The reported account sees nothing of it.
    const seen = await guest.client.from('reports').select('*');
    expect(seen.data ?? []).toEqual([]);

    // The venue chat, DMs, profiles and friend requests have no gender rule.
    const bad = { status: 400, body: errorBody('bad_request') };
    const id = '00000000-0000-4000-8000-000000000000';
    expect(await report({ target: 'venue_chat', messageId: id })).toEqual(bad);
    expect(await report({ target: 'dm', threadId: id })).toEqual(bad);
    expect(await report({ target: 'profile', publicId: id })).toEqual(bad);
    expect(await report({ target: 'friend_request', requestId: id })).toEqual(bad);
  });
});
