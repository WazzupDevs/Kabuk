// Rooms with teams (docs/SPEC_V3.md §22) for the Faz 2 tests from step 22.3 on: up to 8 phones at
// the fixture venue, each with `teams: true` unless told otherwise, and the paths that seat them on a
// side. teams.test.ts (step 22.2) keeps its own copy of these helpers: existing tests do not change
// (§22.M).
import { expect } from 'vitest';

import { CURRENT_LOCATION_CONSENT_VERSION } from '../functions/_shared/pure/consent.ts';
import { ANCHOR, FIXTURE_VENUES, offset } from './fixtures/venues.ts';
import { onboarded, PHONES } from './helpers.ts';
import { type Client, invoke, sql, userIdOf } from './local.ts';

// A full room: two sides of 4 phones ([auth.sms.test_otp] in config.toml).
export const TEAM_PHONES = [
  ...PHONES,
  '+905550000004',
  '+905550000005',
  '+905550000006',
  '+905550000007',
  '+905550000008',
] as const;

export const FIXTURE_VENUE = 'at-anchor';

export type Phone = { client: Client; sessionId: string; alias: string; userId: string };

// Checks phone n in at the venue (venue ids from insertFixtureVenues); `teams: true` unless told
// otherwise (an old app sends nothing). Headcount 2 unless given.
export async function table(
  venue: Record<string, string>,
  n: number,
  opts: { teams?: boolean; headcount?: number } = {},
): Promise<Phone> {
  const phone = TEAM_PHONES[n];
  if (!phone) throw new Error(`no test phone ${n}`);
  const client = await onboarded(phone, { displayName: `Kişi ${n}` });
  const fixture = FIXTURE_VENUES.find((v) => v.key === FIXTURE_VENUE);
  if (!fixture) throw new Error('no fixture');
  const here = offset(ANCHOR, fixture.distanceM, fixture.bearingDeg);
  const res = await invoke(client, 'checkin', {
    action: 'check-in',
    venueId: venue[FIXTURE_VENUE],
    lat: here.lat,
    lng: here.lng,
    accuracyM: 10,
    headcount: opts.headcount ?? 2,
    locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    ...(opts.teams === false ? {} : { teams: true }),
  });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  const { sessionId, alias } = res.body as { sessionId: string; alias: string };
  return { client, sessionId, alias, userId: await userIdOf(client) };
}

export const rooms = (p: Phone, body: Record<string, unknown>) => invoke(p.client, 'rooms', body);

export async function createRoom(owner: Phone): Promise<string> {
  const res = await rooms(owner, { action: 'create', profiled: false });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return (res.body as { roomId: string }).roomId;
}

// "Katıl" (side omitted) or "Bu masadayım" (side given), and the side's leader accepting it.
export async function join(p: Phone, leader: Phone, roomId: string, side?: 'owner' | 'guest') {
  const asked = await rooms(p, {
    action: 'request-join',
    roomId,
    profiled: false,
    ...(side ? { side } : {}),
  });
  expect(asked.status, JSON.stringify(asked.body)).toBe(200);
  const [request] = await sql`
    select id from public.join_requests
    where room_id = ${roomId} and requester_session_id = ${p.sessionId} and status = 'pending'
  `;
  if (!request) throw new Error('no pending request');
  const answered = await rooms(leader, { action: 'respond', requestId: request.id, accept: true });
  expect(answered, JSON.stringify(answered.body)).toEqual({ status: 200, body: { ok: true } });
}

// An owner with a guest's side ("Katıl"), then members on the given sides.
export async function teamRoom(
  owner: Phone,
  guest: Phone | null,
  members: { owner?: Phone[]; guest?: Phone[] } = {},
): Promise<string> {
  const roomId = await createRoom(owner);
  if (guest) await join(guest, owner, roomId);
  for (const m of members.owner ?? []) await join(m, owner, roomId, 'owner');
  for (const m of members.guest ?? []) await join(m, guest ?? owner, roomId, 'guest');
  return roomId;
}

export const leave = (p: Phone, roomId: string) => rooms(p, { action: 'leave', roomId });

export async function roomRow(roomId: string) {
  const [row] = await sql`select * from public.rooms where id = ${roomId}`;
  if (!row) throw new Error('no room');
  return row;
}
