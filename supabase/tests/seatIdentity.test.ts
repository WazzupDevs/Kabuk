// From step 4.5 a seat takes the check-in's identity (docs/SPEC_V4.md §4.D, §4.E); its photo is
// checked when the identity is chosen (identity.test.ts). The old app's profiled field of a room or
// a request changes nothing and asks no photo.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { deleteFixtureVenues, insertFixtureVenues } from './fixtures/venues.ts';
import { checkInAt, onboarded, PHONES } from './helpers.ts';
import { type Client, deleteUserByPhone, invoke, sql } from './local.ts';

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

async function atVenue(phone: string, name: string): Promise<Client> {
  const client = (await onboarded(phone, { displayName: name })) as Client;
  await checkInAt(client, venue, V);
  return client;
}

describe('a seat is the check-in identity', () => {
  it("ignores a room's and a request's profiled choice: the seat is the check-in identity", async () => {
    const a = await atVenue(PHONES[0], 'Ayşe');
    const b = await atVenue(PHONES[1], 'Burak');
    const created = await invoke(a, 'rooms', { action: 'create', profiled: true });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const roomId = (created.body as { roomId: string }).roomId;
    const asked = await invoke(b, 'rooms', { action: 'request-join', roomId, profiled: true });
    expect(asked.status, JSON.stringify(asked.body)).toBe(200);
    expect(await sql`select profiled from public.room_members where room_id = ${roomId}`).toEqual([
      { profiled: false },
    ]);
    expect(
      await sql`select requester_profiled from public.join_requests where room_id = ${roomId}`,
    ).toEqual([{ requester_profiled: false }]);
  });
});
