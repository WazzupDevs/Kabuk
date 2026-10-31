// Faz 3 step 23.2, server (docs/SPEC_V3.md §23.D, §23.E, §23.M, rule 12): the gender, a closed
// column like the birth date; the asymmetric anonymity rule of the game flow; the request card's
// profile; "yanlış cinsiyet beyanı" reports. Step 23.2b (the app asks for it): sign-up without it is
// bad_request, and an account from before the step meets gender_required in the game flow. From step
// 4.5 (docs/SPEC_V4.md §4.D, §4.E) a seat takes the check-in's identity: a man and "Belirtmek
// istemiyorum" always sit profiled, and nobody chooses per table.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { istanbulToday } from '../functions/_shared/pure/age.ts';
import { CURRENT_KVKK_VERSION, CURRENT_TERMS_VERSION } from '../functions/_shared/pure/consent.ts';
import type { Gender } from '../functions/_shared/pure/gender.ts';
import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import {
  clearGender,
  errorBody,
  onboarded,
  PHONES,
  setTestPhoto,
  TEST_AGE,
  TEST_BIRTH_DATE,
} from './helpers.ts';
import { deleteUserByPhone, invoke, signIn, sql, userIdOf } from './local.ts';
import {
  FIXTURE_VENUE,
  openTable,
  type Person as Phone,
  person,
  rooms,
  sit,
  TABLE_PHONES,
  tableWith,
} from './people.ts';

let venue: Record<string, string> = {};
const OK = { status: 200, body: { ok: true } };

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

const account = (p: { client: Phone['client'] }, body: Record<string, unknown>) =>
  invoke(p.client, 'account', body);

// Phone n checked in at the venue, with a gender (null: an account from before the gender step) and,
// if asked, a visible profile photo.
async function at(
  n: number,
  gender: Gender | null,
  opts: { photo?: boolean } = {},
): Promise<Phone> {
  const p = await person(venue, n, gender ? { gender } : {});
  if (gender === null) await clearGender(p.client);
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
      termsVersion: CURRENT_TERMS_VERSION,
      kvkkVersion: CURRENT_KVKK_VERSION,
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

  it('is needed at sign-up: without it bad_request, and nothing is written or deleted', async () => {
    const client = await signIn(PHONES[0]);
    const id = await userIdOf(client);
    const signUp = {
      action: 'complete-onboarding',
      termsVersion: CURRENT_TERMS_VERSION,
      kvkkVersion: CURRENT_KVKK_VERSION,
      displayName: 'Ayşe',
      birthDate: TEST_BIRTH_DATE,
    };
    const refused = { status: 400, body: errorBody('bad_request') };
    expect(await account({ client }, signUp)).toEqual(refused);
    // Checked before the age: an under-18 date without a gender deletes nothing either.
    const underAge = `${istanbulToday(new Date()).year - 17}-01-01`;
    expect(await account({ client }, { ...signUp, birthDate: underAge })).toEqual(refused);
    expect(await sql`select 1 from public.profiles where id = ${id}`).toHaveLength(0);
    expect(await sql`select 1 from auth.users where id = ${id}`).toHaveLength(1);

    // An account from before v3 (consents only) completes its profile with a gender too.
    await sql`
      insert into public.profiles
        (id, age_confirmed_at, terms_accepted_at, terms_version, kvkk_accepted_at, kvkk_version)
      values (${id}, now(), now(), 'draft-0', now(), 'draft-0')
    `;
    expect(await account({ client }, signUp)).toEqual(refused);
    expect(await account({ client }, { ...signUp, gender: 'unspecified' })).toEqual(OK);
    const flag = await client.from('profiles').select('has_gender').single();
    expect(flag.data).toEqual({ has_gender: true });
  });

  it('lets an account from before the step re-consent without it, then answer once', async () => {
    const a = { client: await onboarded(PHONES[0]) };
    await clearGender(a.client);
    // The new KVKK notice comes first (§23.N): a re-consent of a complete profile needs no gender.
    expect(
      await account(a, {
        action: 'complete-onboarding',
        termsVersion: CURRENT_TERMS_VERSION,
        kvkkVersion: CURRENT_KVKK_VERSION,
      }),
    ).toEqual(OK);
    const flag = await a.client.from('profiles').select('has_gender').single();
    expect(flag.data).toEqual({ has_gender: false });
    expect(((await ownProfile(a.client)).body as { gender: unknown }).gender).toBeNull();
    expect(await account(a, { action: 'set-gender', gender: 'male' })).toEqual(OK);
    expect(((await ownProfile(a.client)).body as { gender: string }).gender).toBe('male');
  });

  it('set-gender writes only an empty gender and needs a finished sign-up', async () => {
    const a = { client: await onboarded(PHONES[0]) };
    await clearGender(a.client);
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
    await clearGender(answered.client);
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

  it('goes to nobody else, even at a table where the other sat with their profile', async () => {
    const owner = await at(0, 'female', { photo: true });
    const guest = await at(1, 'male', { photo: true });
    const roomId = await openTable(owner);
    const asked = await rooms(guest, { action: 'request-join', roomId });
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

    // The other's profile as a person at the table sees it (rule 4): no gender.
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
  it('seats a man and "Belirtmek istemiyorum" profiled, whatever a table or a request says', async () => {
    const owner = await at(0, 'female');
    const man = await at(1, 'male', { photo: true });
    const unsaid = await at(2, 'unspecified', { photo: true });
    const roomId = await openTable(owner);

    // Today's app's anonymous choice changes nothing; nobody is refused for it.
    const asked = await rooms(man, { action: 'request-join', roomId, profiled: false });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    expect(
      await sql`select requester_alias, requester_profiled from public.join_requests
                where room_id = ${roomId}`,
    ).toEqual([{ requester_alias: man.name, requester_profiled: true }]);
    const own = await openTable(unsaid, { profiled: false });
    expect(
      await sql`select alias, profiled from public.room_members where room_id = ${own}`,
    ).toEqual([{ alias: unsaid.name, profiled: true }]);
  });

  it('asks the photo of the profiled seat they must take', async () => {
    const owner = await at(0, 'female');
    const man = await at(1, 'male');
    const roomId = await openTable(owner);
    const noPhoto = { status: 409, body: errorBody('photo_required') };
    expect(await rooms(man, { action: 'create' })).toEqual(noPhoto);
    expect(await rooms(man, { action: 'request-join', roomId })).toEqual(noPhoto);
    await setTestPhoto(man.client);
    expect((await rooms(man, { action: 'request-join', roomId })).status).toBe(200);
  });

  it('lets a woman sit with the identity she chose at check-in', async () => {
    const owner = await at(0, 'female');
    const woman = await at(1, 'female', { photo: true });
    const other = await at(2, 'female');
    expect(
      await invoke(woman.client, 'checkin', { action: 'set-identity', anonymous: false }),
    ).toEqual(expect.objectContaining({ status: 200 }));
    const roomId = await openTable(owner);
    for (const p of [woman, other]) {
      const asked = await rooms(p, { action: 'request-join', roomId });
      expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    }
    const rows = await sql`
      select requester_session_id, requester_profiled from public.join_requests
      where room_id = ${roomId}
    `;
    const profiledOf = (p: Phone) =>
      rows.find((r) => r.requester_session_id === p.sessionId)?.requester_profiled;
    expect([profiledOf(woman), profiledOf(other)]).toEqual([true, false]);
  });

  it('refuses an empty gender with gender_required on both roads and writes nothing', async () => {
    const owner = await at(0, 'female');
    const running = await at(1, 'female');
    const empty = await at(2, null, { photo: true });
    const lobbyTable = await openTable(owner);
    const runningTable = await openTable(running, { open: false });
    const refused = { status: 409, body: errorBody('gender_required') };

    expect(await rooms(empty, { action: 'create' })).toEqual(refused);
    expect(await rooms(empty, { action: 'request-join', roomId: lobbyTable })).toEqual(refused);
    expect(
      await rooms(empty, { action: 'request-join', roomId: runningTable, asMember: true }),
    ).toEqual(refused);
    const [count] = await sql`
      select count(*)::int as n from public.join_requests
      where requester_session_id = ${empty.sessionId}
    `;
    expect(count?.n).toBe(0);
    const [seats] = await sql`
      select count(*)::int as n from public.room_members where session_id = ${empty.sessionId}
    `;
    expect(seats?.n).toBe(0);

    // Once answered, the game flow opens.
    expect(await account(empty, { action: 'set-gender', gender: 'female' })).toEqual(OK);
    const asked = await rooms(empty, { action: 'request-join', roomId: lobbyTable });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
  });

  it('keeps the venue chat anonymous for everyone (§22.G)', async () => {
    const man = await at(0, 'male');
    const sent = await invoke(man.client, 'venue-chat', {
      action: 'send',
      venueId: venue[FIXTURE_VENUE],
      body: 'Selam',
      identity: 'anonymous',
    });
    expect(sent.status, JSON.stringify(sent.body)).toBe(200);
  });
});

describe('rooms/request-profile (§23.E)', () => {
  it('gives the owner the name, age and photo of a profiled requester, while it waits', async () => {
    const owner = await at(0, 'female');
    const man = await at(1, 'male', { photo: true });
    const stranger = await at(2, 'female');
    const roomId = await openTable(owner);
    expect((await rooms(man, { action: 'request-join', roomId })).status).toBe(200);
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
    const roomId = await openTable(owner);
    const notFound = { status: 404, body: errorBody('not_found') };

    expect((await rooms(woman, { action: 'request-join', roomId })).status).toBe(200);
    expect(
      await rooms(owner, {
        action: 'request-profile',
        requestId: await requestIdOf(woman, roomId),
      }),
    ).toEqual(notFound);

    expect((await rooms(man, { action: 'request-join', roomId })).status).toBe(200);
    const requestId = await requestIdOf(man, roomId);
    await sql`
      update public.join_requests set expires_at = now() - interval '1 second' where id = ${requestId}
    `;
    expect(await rooms(owner, { action: 'request-profile', requestId })).toEqual(notFound);
  });

  it('gives "Bu masadayım" to the owner only, not to a person at the table', async () => {
    const owner = await at(0, 'female');
    const guest = await at(1, 'female');
    const man = await at(2, 'male', { photo: true });
    const roomId = await openTable(owner, { open: false });
    await sit(guest, owner, roomId);
    const asked = await rooms(man, { action: 'request-join', roomId, asMember: true });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    const requestId = await requestIdOf(man, roomId);

    expect((await rooms(owner, { action: 'request-profile', requestId })).status).toBe(200);
    expect(await rooms(guest, { action: 'request-profile', requestId })).toEqual({
      status: 404,
      body: errorBody('not_found'),
    });
  });
});

describe('"yanlış cinsiyet beyanı" reports (§23.D)', () => {
  it('are written for a person at the table and a history row, and refused for the rest', async () => {
    const owner = await at(0, 'female');
    const guest = await at(1, 'female');
    const roomId = await tableWith(owner, [guest]);

    const report = (body: Record<string, unknown>) =>
      invoke(owner.client, 'safety', { action: 'report', reason: 'wrong_gender', ...body });
    expect(await report({ roomId, sessionId: guest.sessionId })).toEqual(OK);

    // An encounter of 3 minutes, then the table ends: a history row for each of the pair.
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
