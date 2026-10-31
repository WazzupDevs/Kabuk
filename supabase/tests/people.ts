// Tables of people (docs/SPEC_V4.md §4.E) for the tests from step 4.5 on: up to 12 people checked
// in at the fixture venue, the tables they open and the two roads in ("Katıl", "Bu masadayım").
import { randomUUID } from 'node:crypto';

import { expect } from 'vitest';

import { CURRENT_LOCATION_CONSENT_VERSION } from '../functions/_shared/pure/consent.ts';
import type { Gender } from '../functions/_shared/pure/gender.ts';
import { ANCHOR, FIXTURE_VENUES, offset } from './fixtures/venues.ts';
import { onboarded, PHONES } from './helpers.ts';
import { type Client, invoke, sql, userIdOf } from './local.ts';

// A full table: MAX_TABLE_PHONES phones ([auth.sms.test_otp] in config.toml).
export const TABLE_PHONES = [
  ...PHONES,
  '+905550000004',
  '+905550000005',
  '+905550000006',
  '+905550000007',
  '+905550000008',
  '+905550000009',
  '+905550000010',
  '+905550000011',
  '+905550000012',
] as const;

export const FIXTURE_VENUE = 'at-anchor';

export type Person = { client: Client; sessionId: string; userId: string; name: string };

// Phone n, signed up (a woman unless told otherwise) and checked in at a fixture venue (venue ids
// from insertFixtureVenues). A check-in asks no headcount and opens no table.
export async function person(
  venue: Record<string, string>,
  n: number,
  opts: { gender?: Gender; key?: string } = {},
): Promise<Person> {
  const phone = TABLE_PHONES[n];
  if (!phone) throw new Error(`no test phone ${n}`);
  const name = `Kişi ${n}`;
  const client = await onboarded(phone, { displayName: name, gender: opts.gender });
  const key = opts.key ?? FIXTURE_VENUE;
  const sessionId = await checkIn(client, venue, key);
  return { client, sessionId, userId: await userIdOf(client), name };
}

export async function checkIn(
  client: Client,
  venue: Record<string, string>,
  key = FIXTURE_VENUE,
): Promise<string> {
  const fixture = FIXTURE_VENUES.find((v) => v.key === key);
  if (!fixture) throw new Error(`unknown fixture venue ${key}`);
  const here = offset(ANCHOR, fixture.distanceM, fixture.bearingDeg);
  const res = await invoke(client, 'checkin', {
    action: 'check-in',
    venueId: venue[key],
    lat: here.lat,
    lng: here.lng,
    accuracyM: 10,
    locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    requestId: randomUUID(),
  });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as { sessionId: string }).sessionId;
}

export async function people(venue: Record<string, string>, count: number): Promise<Person[]> {
  return Promise.all(Array.from({ length: count }, (_, n) => person(venue, n)));
}

export const rooms = (p: Person, body: Record<string, unknown>) => invoke(p.client, 'rooms', body);

// "Masa kur": in the lobby unless `open: false`.
export async function openTable(
  owner: Person,
  body: Record<string, unknown> = {},
): Promise<string> {
  const res = await rooms(owner, { action: 'create', ...body });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as { roomId: string }).roomId;
}

// "Katıl" (a lobby table) or "Bu masadayım" (`asMember`, a running table): the pending request's id.
export async function ask(p: Person, roomId: string, asMember = false): Promise<string> {
  const res = await rooms(p, { action: 'request-join', roomId, ...(asMember ? { asMember } : {}) });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as { requestId: string }).requestId;
}

export async function accept(owner: Person, requestId: string): Promise<void> {
  const res = await rooms(owner, { action: 'respond', requestId, accept: true });
  expect(res, JSON.stringify(res.body)).toEqual({ status: 200, body: { ok: true } });
}

// A person sitting down at the owner's table: "Katıl" in the lobby, "Bu masadayım" otherwise.
export async function sit(p: Person, owner: Person, roomId: string): Promise<void> {
  const [row] = await sql`select visibility from public.rooms where id = ${roomId}`;
  await accept(owner, await ask(p, roomId, row?.visibility !== 'open'));
}

// An owner's table with these people sat down.
export async function tableWith(owner: Person, others: Person[], body = {}): Promise<string> {
  const roomId = await openTable(owner, body);
  for (const p of others) await sit(p, owner, roomId);
  return roomId;
}

export const leave = (p: Person, roomId: string) => rooms(p, { action: 'leave', roomId });

export async function roomRow(roomId: string) {
  const [row] = await sql`select * from public.rooms where id = ${roomId}`;
  if (!row) throw new Error('no room');
  return row;
}

// The people at the table now, in the order they sat down.
export async function seated(roomId: string) {
  return sql`
    select rm.session_id, rm.alias, rm.profiled, ts.user_id
    from public.room_members rm
    join public.table_sessions ts on ts.id = rm.session_id
    where rm.room_id = ${roomId} and rm.left_at is null
    order by rm.joined_at, rm.id
  `;
}

// As if everyone at the table had sat down `minutes` earlier (the 3-minute pair rule, K-66).
export async function backdate(roomId: string, minutes: number): Promise<void> {
  const by = `${minutes} minutes`;
  await sql`
    update public.room_members set joined_at = joined_at - ${by}::interval
    where room_id = ${roomId} and left_at is null
  `;
  await sql`
    update public.rooms set created_at = created_at - ${by}::interval,
      last_activity_at = last_activity_at - ${by}::interval
    where id = ${roomId}
  `;
}
