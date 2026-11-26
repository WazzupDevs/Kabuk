// The store review account (REVIEW_PHONE, pure/reviewAccount.ts; docs/SPEC_V4.md §4.Z). CI starts
// the main function server with REVIEW_PHONE=+905550000012 and sets REVIEW_ACCOUNT_TEST=1
// (.github/workflows/ci.yml); a local run without them skips this file:
//   echo REVIEW_PHONE=+905550000012 > /tmp/review.env && pnpm supabase functions serve --env-file /tmp/review.env
//   REVIEW_ACCOUNT_TEST=1 pnpm vitest run -c vitest.integration.config.ts supabase/tests/reviewAccount.test.ts
import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { CheckInRequest } from '../functions/_shared/pure/api/checkin.ts';
import {
  CURRENT_KVKK_VERSION,
  CURRENT_LOCATION_CONSENT_VERSION,
  CURRENT_TERMS_VERSION,
} from '../functions/_shared/pure/consent.ts';
import { ANCHOR, deleteFixtureVenues, insertFixtureVenues, offset } from './fixtures/venues.ts';
import { type Client, deleteUserByPhone, invoke, signIn, sql, userIdOf } from './local.ts';

const REVIEW = '+905550000012';
// Not the review account: every rule as before.
const OTHER = '+905550000011';
const running = process.env.REVIEW_ACCOUNT_TEST === '1';

let venue: Record<string, string> = {};

beforeAll(async () => {
  if (!running) return;
  await deleteFixtureVenues(sql);
  venue = await insertFixtureVenues(sql);
});

afterEach(async () => {
  if (!running) return;
  await deleteUserByPhone(REVIEW);
  await deleteUserByPhone(OTHER);
});

afterAll(async () => {
  if (running) await deleteFixtureVenues(sql);
  await sql.end();
});

async function onboarded(phone: string): Promise<Client> {
  const client = await signIn(phone);
  const res = await invoke(client, 'account', {
    action: 'complete-onboarding',
    termsVersion: CURRENT_TERMS_VERSION,
    kvkkVersion: CURRENT_KVKK_VERSION,
    displayName: 'Test Masa',
    birthDate: '2000-01-15',
    gender: 'male',
  });
  expect(res.status).toBe(200);
  return client;
}

// 5 km from the anchor: outside every fixture venue's 300 m.
const FAR = offset(ANCHOR, 5000, 90);

function checkInFar(client: Client, venueKey: string, mocked?: boolean): ReturnType<typeof invoke> {
  const body: CheckInRequest = {
    action: 'check-in',
    venueId: venue[venueKey] ?? '',
    lat: FAR.lat,
    lng: FAR.lng,
    accuracyM: null,
    ...(mocked === undefined ? {} : { mocked }),
    locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    requestId: randomUUID(),
  };
  return invoke(client, 'checkin', body);
}

const errorBody = (code: string) => ({ error: { code, message: expect.any(String) } });

describe.runIf(running)('the store review account (REVIEW_PHONE)', () => {
  it('checks in far from the venue and is told the check is off; the position is not stored', async () => {
    const client = await onboarded(REVIEW);
    expect(await invoke(client, 'checkin', { action: 'location-mode' })).toEqual({
      status: 200,
      body: { skipLocation: true },
    });
    const res = await checkInFar(client, 'at-anchor', true);
    expect(res.status).toBe(200);

    // Rule 6: still only the venue is stored, never the position.
    const id = await userIdOf(client);
    const [session] = await sql`
      select venue_id, row_to_json(t)::text as row
      from public.table_sessions t where user_id = ${id} and status = 'active'
    `;
    expect(session?.venue_id).toBe(venue['at-anchor']);
    for (const n of [FAR.lat, FAR.lng]) {
      expect(String(session?.row)).not.toContain(n.toFixed(4));
    }
  });

  it('still refuses an inactive or unknown venue', async () => {
    const client = await onboarded(REVIEW);
    expect(await checkInFar(client, 'inactive')).toEqual({
      status: 404,
      body: errorBody('venue_not_found'),
    });
  });

  it('changes nothing for any other account', async () => {
    const client = await onboarded(OTHER);
    expect(await invoke(client, 'checkin', { action: 'location-mode' })).toEqual({
      status: 200,
      body: { skipLocation: false },
    });
    expect(await checkInFar(client, 'at-anchor')).toEqual({
      status: 403,
      body: errorBody('too_far'),
    });
  });
});
