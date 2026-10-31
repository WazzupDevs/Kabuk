// Shared flows for integration tests: onboarding and check-in at fixture venues.
import { randomUUID } from 'node:crypto';

import { expect } from 'vitest';

import { ageOn, istanbulToday } from '../functions/_shared/pure/age.ts';
import type { ProfileUploadUrl } from '../functions/_shared/pure/api/profile.ts';
import {
  CURRENT_KVKK_VERSION,
  CURRENT_LOCATION_CONSENT_VERSION,
  CURRENT_TERMS_VERSION,
} from '../functions/_shared/pure/consent.ts';
import type { Gender } from '../functions/_shared/pure/gender.ts';
import { PHOTO_BUCKET } from '../functions/_shared/pure/profile.ts';
import { ANCHOR, FIXTURE_VENUES, offset } from './fixtures/venues.ts';
import { type Client, invoke, signIn, sql, userIdOf } from './local.ts';

export const PHONES = ['+905550000001', '+905550000002', '+905550000003'] as const;

// Sign-up = profile (docs/SPEC_V3.md §3): consents, a display name and an adult birth date.
export const TEST_DISPLAY_NAME = 'Test Masa';
export const TEST_BIRTH_DATE = '2000-01-15';
export const TEST_AGE = ageOn({ year: 2000, month: 1, day: 15 }, istanbulToday(new Date()));

// `gender` (docs/SPEC_V3.md §23.D): sign-up needs one; a woman unless the test says otherwise.
export async function onboarded(
  phone: string,
  profile: { displayName?: string; birthDate?: string; gender?: Gender } = {},
): Promise<Client> {
  const client = await signIn(phone);
  const res = await invoke(client, 'account', {
    action: 'complete-onboarding',
    termsVersion: CURRENT_TERMS_VERSION,
    kvkkVersion: CURRENT_KVKK_VERSION,
    displayName: profile.displayName ?? TEST_DISPLAY_NAME,
    birthDate: profile.birthDate ?? TEST_BIRTH_DATE,
    gender: profile.gender ?? 'female',
  });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return client;
}

// An account from before v3 had no display name; the v2 display_name_required paths still guard
// against it. Only the database can make one now.
export async function clearDisplayName(client: Client): Promise<void> {
  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error('not signed in');
  await sql`update public.profiles set display_name = null where id = ${data.user.id}`;
}

// An account from before the gender step (docs/SPEC_V3.md §23.D): sign-up asks for it now, so only
// the database can empty it.
export async function clearGender(client: Client): Promise<void> {
  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error('not signed in');
  await sql`update public.profiles set gender = null where id = ${data.user.id}`;
}

// Checks in standing right at the fixture venue (no headcount from step 4.5, docs/SPEC_V4.md §4.E).
export async function checkInAt(
  client: Client,
  venues: Record<string, string>,
  key: string,
): Promise<{ sessionId: string }> {
  const fixture = FIXTURE_VENUES.find((v) => v.key === key);
  const id = venues[key];
  if (!fixture || !id) throw new Error(`unknown fixture venue ${key}`);
  const here = offset(ANCHOR, fixture.distanceM, fixture.bearingDeg);
  const res = await invoke(client, 'checkin', {
    action: 'check-in',
    venueId: id,
    lat: here.lat,
    lng: here.lng,
    accuracyM: 10,
    locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    requestId: randomUUID(),
  });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as { sessionId: string };
}

// A profile photo through the app's own path (upload URL, then commit): a minimal JPEG without
// metadata. Returns the stored path.
const TEST_JPEG = new Uint8Array([
  0xff,
  0xd8,
  0xff,
  0xdb,
  0x00,
  0x43,
  0x00,
  ...Array.from({ length: 64 }, (_, i) => (i % 50) + 1),
  0xff,
  0xda,
  0x00,
  0x08,
  0x01,
  0x01,
  0x00,
  0x00,
  0x3f,
  0x00,
  0x12,
  0xff,
  0x00,
  0x34,
  0x56,
  0xff,
  0xd9,
]);

export async function setTestPhoto(client: Client): Promise<string> {
  const res = await invoke(client, 'profile', { action: 'photo-upload-url' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  const { path, token } = res.body as ProfileUploadUrl;
  const { error } = await client.storage
    .from(PHOTO_BUCKET)
    .uploadToSignedUrl(path, token, TEST_JPEG, { contentType: 'image/jpeg' });
  expect(error).toBeNull();
  const commit = await invoke(client, 'profile', { action: 'photo-commit', path });
  expect(commit, JSON.stringify(commit.body)).toEqual({ status: 200, body: { ok: true } });
  return path;
}

// "Profilimle" (a profiled room, request or venue chat mode) needs a visible profile photo at the
// moment of the choice, and only then (docs/SPEC_V3.md §22.G, step 22.1). Tests written before
// that rule whose account has no photo make the choice through this: a temporary photo before it,
// removed right after, so what they expect of a profile without a photo stays the same. An account
// that already has a visible photo keeps it.
export async function withPhotoForChoice<T>(client: Client, choose: () => Promise<T>): Promise<T> {
  const [row] = await sql`
    select photo_path is not null and photo_hidden_at is null as visible
    from public.profiles where id = ${await userIdOf(client)}
  `;
  if (row?.visible) return choose();
  await setTestPhoto(client);
  try {
    return await choose();
  } finally {
    const removed = await invoke(client, 'profile', { action: 'photo-remove' });
    expect(removed, JSON.stringify(removed.body)).toEqual({ status: 200, body: { ok: true } });
  }
}

// The check-in's identity for a venue chat message (docs/SPEC_V4.md §4.D): a profiled one is
// chosen with checkin/set-identity (a temporary photo, if the account has none). Returns what the
// message names.
export async function venueChatIdentity(
  client: Client,
  profiled: boolean,
): Promise<'anonymous' | 'profiled'> {
  const identity = profiled ? 'profiled' : 'anonymous';
  const [row] = await sql`
    select identity_mode from public.table_sessions
    where user_id = ${await userIdOf(client)} and status = 'active'
  `;
  if (row && row.identity_mode !== identity) {
    const set = await withPhotoForChoice(client, () =>
      invoke(client, 'checkin', { action: 'set-identity', anonymous: !profiled }),
    );
    expect(set.status, JSON.stringify(set.body)).toBe(200);
  }
  return identity;
}

export function errorBody(code: string) {
  return { error: { code, message: expect.any(String) } };
}

// Resolves when the event arrives on the channel, rejects after the timeout.
export function waitForBroadcast(
  client: Client,
  topic: string,
  event: string,
  timeoutMs = 8000,
): { subscribed: Promise<void>; received: Promise<void>; close: () => Promise<void> } {
  const channel = client.channel(topic, { config: { private: true } });
  let resolveReceived: () => void = () => {};
  const received = new Promise<void>((resolve, reject) => {
    resolveReceived = resolve;
    setTimeout(() => reject(new Error(`no ${event} on ${topic}`)), timeoutMs);
  });
  const subscribed = new Promise<void>((resolve, reject) => {
    channel
      .on('broadcast', { event }, () => resolveReceived())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(status));
      });
  });
  return { subscribed, received, close: async () => void (await client.removeChannel(channel)) };
}

// Waits until `count` other connections' statements running `fn` wait on a lock (tests of lock
// order).
export async function waitUntilBlocked(fn: string, count = 1): Promise<void> {
  for (let i = 0; i < 50; i++) {
    const [row] = await sql`
      select count(*)::int as n from pg_stat_activity
      where wait_event_type = 'Lock' and query like ${`%${fn}%`} and pid <> pg_backend_pid()
    `;
    if ((row?.n ?? 0) >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${fn} never waited on a lock`);
}
