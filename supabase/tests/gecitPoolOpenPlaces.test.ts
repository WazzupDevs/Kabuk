// Geçit's pool, Skall Semti and Skall Üniversitesi (docs/SPEC_V4.md §4.V, §4.AA;
// docs/decisions/gecit-havuz-acik-yerler.md). The day's questions are drawn from the pool, the same
// for everyone, never with their answer (rule 4); a wrong answer gives the next question an hour
// later; drawing goes one at a time (rule 10). Skall Semti needs no location and no location closes
// it; Skall Üniversitesi is checked in to with no position at all (rule 6).
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import type {
  DistrictAnswerResponse,
  DistrictState,
} from '../functions/_shared/pure/api/district.ts';
import { CURRENT_LOCATION_CONSENT_VERSION } from '../functions/_shared/pure/consent.ts';
import { errorBody, onboarded, waitUntilBlocked } from './helpers.ts';
import { TABLE_PHONES } from './people.ts';
import { type Client, dbUrl, deleteUserByPhone, invoke, sql, userIdOf } from './local.ts';

const AVCILAR = { lat: 40.985, lng: 28.725 };
const KADIKOY = { lat: 40.99, lng: 29.03 };

afterEach(async () => {
  for (const phone of TABLE_PHONES) await deleteUserByPhone(phone);
  await sql`delete from public.district_rooms`;
  await sql`delete from public.gecit_questions`;
  await sql`delete from public.gecit_pool`;
});

afterAll(async () => {
  await sql.end();
});

const district = (c: Client, body: Record<string, unknown>) => invoke(c, 'district', body);

async function stateOf(c: Client): Promise<DistrictState> {
  const res = await district(c, { action: 'state' });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as DistrictState;
}

// Pool questions whose right option is the index given.
async function pool(...answers: number[]): Promise<void> {
  for (const [i, answer] of answers.entries()) {
    await sql`
      insert into public.gecit_pool (prompt, options, answer)
      values (${`Havuz sorusu ${i + 1}?`}, array['A', 'B', 'C', 'D'], ${answer})
    `;
  }
}

// The hour after a wrong answer has passed.
async function hourLater(userId: string): Promise<void> {
  await sql`
    update public.gecit_answers set created_at = created_at - interval '61 minutes'
    where user_id = ${userId}
  `;
}

describe('Geçit pool (rule 4)', () => {
  it('draws one question for everyone, never with its answer, and marks it asked', async () => {
    await pool(1, 1, 1);
    const a = await onboarded(TABLE_PHONES[0] as string);
    const b = await onboarded(TABLE_PHONES[1] as string);
    const [sa, sb] = await Promise.all([stateOf(a), stateOf(b)]);
    expect(sa.gate).toBe('question');
    expect(sa.question?.slot).toBe(1);
    expect(sb.question).toEqual(sa.question);
    expect(JSON.stringify(sa)).not.toMatch(/"answer"|last_asked|pool/);
    const asked =
      await sql`select count(*)::int as n from public.gecit_pool where last_asked_on is not null`;
    expect(asked[0]?.n).toBe(1);
    const drawn = await sql`select count(*)::int as n from public.gecit_questions`;
    expect(drawn[0]?.n).toBe(1);
  });

  it('gives the next question an hour after a wrong answer, and lets in on a right one', async () => {
    await pool(1, 2);
    const a = await onboarded(TABLE_PHONES[0] as string);
    const id = await userIdOf(a);
    const first = await stateOf(a);
    const day = first.question?.day as string;

    const wrong = await district(a, { action: 'answer', day, choice: 0, slot: 1 });
    const failed = (wrong.body as DistrictAnswerResponse).state;
    expect((wrong.body as DistrictAnswerResponse).correct).toBe(false);
    expect(failed).toMatchObject({ gate: 'failed', question: null });
    const wait = Date.parse(failed.retryAt as string) - Date.now();
    expect(wait).toBeGreaterThan(55 * 60_000);
    expect(wait).toBeLessThanOrEqual(60 * 60_000);
    // The same answer again: its first result. The next question before its time: closed.
    expect(
      (
        (await district(a, { action: 'answer', day, choice: 0, slot: 1 }))
          .body as DistrictAnswerResponse
      ).correct,
    ).toBe(false);
    expect(await district(a, { action: 'answer', day, choice: 1, slot: 2 })).toEqual({
      status: 403,
      body: errorBody('gate_closed'),
    });

    await hourLater(id);
    const second = await stateOf(a);
    expect(second.gate).toBe('question');
    expect(second.question?.slot).toBe(2);
    expect(second.question?.prompt).not.toBe(first.question?.prompt);
    // The old question is gone.
    expect(await district(a, { action: 'answer', day, choice: 1, slot: 1 })).toEqual({
      status: 409,
      body: errorBody('question_expired'),
    });
    const [q2] = await sql`
      select answer from public.gecit_questions where day = ${day}::date and slot = 2
    `;
    const right = await district(a, {
      action: 'answer',
      day,
      choice: q2?.answer as number,
      slot: 2,
    });
    expect(right.body as DistrictAnswerResponse).toMatchObject({
      correct: true,
      state: { gate: 'passed' },
    });
    const s = await district(a, { action: 'enter', ref: 'skall-semti' });
    expect(s.status, JSON.stringify(s.body)).toBe(200);
  });

  it('asks the longest ago again when every question was asked', async () => {
    await pool(1);
    await sql`update public.gecit_pool set last_asked_on = '2020-01-01'`;
    const a = await onboarded(TABLE_PHONES[0] as string);
    const s = await stateOf(a);
    expect(s.gate).toBe('question');
    const [p] = await sql`select last_asked_on::text as d from public.gecit_pool`;
    expect(p?.d).toBe(s.question?.day);
  });

  it('never asks a question twice in a day: with nothing left, the gate stays shut till midnight', async () => {
    await pool(1);
    const a = await onboarded(TABLE_PHONES[0] as string);
    const first = await stateOf(a);
    const day = first.question?.day as string;
    await district(a, { action: 'answer', day, choice: 0, slot: 1 });
    await hourLater(await userIdOf(a));
    const s = await stateOf(a);
    expect(s).toMatchObject({ gate: 'failed', question: null, retryAt: s.opensAt });
    expect(await district(a, { action: 'enter', ref: 'skall-semti' })).toEqual({
      status: 403,
      body: errorBody('gate_closed'),
    });
  });

  it('closes the gate to a crafted entry while the pool has questions and none was drawn', async () => {
    await pool(1);
    const a = await onboarded(TABLE_PHONES[0] as string);
    expect(await district(a, { action: 'enter', ref: 'skall-semti' })).toEqual({
      status: 403,
      body: errorBody('gate_closed'),
    });
  });

  // Two first calls of a day at the same time: one draws, the other waits and gets the same.
  it('draws a day’s question one at a time (rule 10)', async () => {
    await pool(1, 1, 1, 1);
    const holder = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const one = postgres(dbUrl, { max: 1, onnotice: () => {} });
    const two = postgres(dbUrl, { max: 1, onnotice: () => {} });
    try {
      let drawn: Promise<{ prompt: string }[]>[] = [];
      await holder.begin(async (tx) => {
        await tx`select private.lock_gecit_day(private.istanbul_today())`;
        drawn = [
          one<
            { prompt: string }[]
          >`select prompt from private.gecit_question(private.istanbul_today(), 1::smallint)`.execute(),
          two<
            { prompt: string }[]
          >`select prompt from private.gecit_question(private.istanbul_today(), 1::smallint)`.execute(),
        ];
        await waitUntilBlocked('gecit_question', 2);
      });
      const [x, y] = await Promise.all(drawn);
      expect(x?.[0]?.prompt).toBeTruthy();
      expect(y?.[0]?.prompt).toBe(x?.[0]?.prompt);
      const n =
        await sql`select count(*)::int as n from public.gecit_pool where last_asked_on is not null`;
      expect(n[0]?.n).toBe(1);
    } finally {
      await Promise.all([holder.end(), one.end(), two.end()]);
    }
  });
});

describe('Skall Semti (rule 6)', () => {
  it('lets in with no location, and no location closes it', async () => {
    const a = await onboarded(TABLE_PHONES[0] as string);
    const s = await stateOf(a);
    expect(s.located).toBe('never');
    expect(s.openDistricts).toEqual([{ ref: 'skall-semti', name: 'Skall Semti' }]);
    const entered = await district(a, { action: 'enter', ref: 'skall-semti' });
    expect(entered.status, JSON.stringify(entered.body)).toBe(200);
    expect((entered.body as DistrictState).session?.district).toEqual({
      ref: 'skall-semti',
      name: 'Skall Semti',
    });
    // Found outside every district, then in Avcılar: the Skall Semti session stays.
    for (const p of [KADIKOY, AVCILAR]) {
      const res = await district(a, { action: 'locate', ...p });
      expect(res.status).toBe(200);
      expect((res.body as { state: DistrictState }).state.session?.district.ref).toBe(
        'skall-semti',
      );
    }
  });

  it('is never found by a location, and another district’s room stays closed', async () => {
    const a = await onboarded(TABLE_PHONES[0] as string);
    const res = await district(a, { action: 'locate', ...AVCILAR });
    expect((res.body as { state: DistrictState }).state.district?.ref).toBe('avcilar');
    const other = await district(a, { action: 'enter', ref: 'beylikduzu' });
    expect(other.status).toBeGreaterThanOrEqual(400);
    expect((other.body as { error: { code: string } }).error.code).toBe('district_required');
    // Its own district by ref, and with no ref, as before.
    expect((await district(a, { action: 'enter', ref: 'avcilar' })).status).toBe(200);
  });
});

describe('Skall Üniversitesi (rule 6)', () => {
  async function openVenue(): Promise<string> {
    const [v] = await sql`
      select id from public.venues where source = 'skall' and source_ref = 'skall-universitesi'
    `;
    return v?.id as string;
  }

  it('checks in with no position and keeps no consent it was not given', async () => {
    const a = await onboarded(TABLE_PHONES[0] as string);
    const venueId = await openVenue();
    const res = await invoke(a, 'checkin', {
      action: 'check-in',
      venueId,
      accuracyM: null,
      requestId: randomUUID(),
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const id = await userIdOf(a);
    const [p] = await sql`select location_consent_version from public.profiles where id = ${id}`;
    expect(p?.location_consent_version).toBeNull();
    const [t] = await sql`
      select venue_id from public.table_sessions where user_id = ${id} and status = 'active'
    `;
    expect(t?.venue_id).toBe(venueId);
  });

  it('takes a far or mocked position without checking it, and lists the venue as open', async () => {
    const a = await onboarded(TABLE_PHONES[0] as string);
    const venueId = await openVenue();
    const res = await invoke(a, 'checkin', {
      action: 'check-in',
      venueId,
      ...KADIKOY,
      accuracyM: 20,
      mocked: true,
      locationConsentVersion: 'uydurma',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    // No consent was asked here: the one sent is not written.
    const [p] = await sql`
      select location_consent_version from public.profiles where id = ${await userIdOf(a)}
    `;
    expect(p?.location_consent_version).toBeNull();
    const { data, error } = await a.rpc('explore_venues');
    expect(error).toBeNull();
    const rows = data as { venue_id: string; open_checkin: boolean }[];
    expect(rows.find((r) => r.venue_id === venueId)?.open_checkin).toBe(true);
    expect(rows.filter((r) => r.open_checkin)).toHaveLength(1);
  });

  it('still needs a position everywhere else', async () => {
    const a = await onboarded(TABLE_PHONES[0] as string);
    const [other] = await sql`
      select id from public.venues where is_active and not open_checkin limit 1
    `;
    const res = await invoke(a, 'checkin', {
      action: 'check-in',
      venueId: other?.id as string,
      accuracyM: null,
      locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
    });
    expect(res.status).toBe(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('bad_request');
  });
});
