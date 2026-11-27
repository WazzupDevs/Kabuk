// Semte Git and Geçit (docs/SPEC_V4.md §4.V, K-90). The district is found here from a coordinate
// that is used once and kept nowhere, not even in a log (rule 6): only the district is written
// (district_set). An open district (Skall Semti) needs no location at all. The day's questions are
// drawn from the pool in the database (gecit_state) and go out without their answer; the answer is
// checked in gecit_answer (rule 4). Placing a person in a room, the session's time and the extra time are the
// database's (district_enter, district_extend), under the locks of rule 10. No answer carries a
// room's head count.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type {
  DistrictAnswerResponse,
  DistrictLocateResponse,
  DistrictRef,
  DistrictRequest,
  DistrictSession,
  DistrictState,
  GecitStatus,
} from '../_shared/pure/api/district.ts';
import {
  locationCheck,
  refusesMockedPosition,
  testQuestionsAllowed,
} from '../_shared/pure/devProject.ts';
import {
  DISTRICT,
  type DistrictShape,
  istanbulDay,
  locate,
  nextIstanbulMidnight,
  parseRing,
} from '../_shared/pure/district.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { GECIT_SAMPLES } from '../_shared/pure/gecitSamples.ts';
import type { Database } from '../_shared/pure/database.ts';

type SessionRow = Database['public']['Tables']['district_sessions']['Row'];

const Body: z.ZodType<DistrictRequest> = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('state') }),
  z.strictObject({
    action: z.literal('locate'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    choice: z.string().max(40).optional(),
    mocked: z.boolean().optional(),
  }),
  z.strictObject({ action: z.literal('pick'), ref: z.string().max(40) }),
  z.strictObject({
    action: z.literal('answer'),
    day: z.iso.date(),
    choice: z
      .number()
      .int()
      .min(0)
      .max(DISTRICT.options - 1),
    slot: z.number().int().min(1).max(100).optional(),
  }),
  z.strictObject({ action: z.literal('enter'), ref: z.string().max(40).optional() }),
  z.strictObject({ action: z.literal('extend') }),
  z.strictObject({ action: z.literal('leave') }),
  z.strictObject({ action: z.literal('set-identity'), anonymous: z.boolean() }),
]);

const db = serviceClient();

function pickByHand(): boolean {
  return (
    locationCheck(Deno.env.get('CHECKIN_SKIP_LOCATION'), Deno.env.get('SUPABASE_URL')) === 'skipped'
  );
}

type DistrictRow = { id: string; ref: string; name: string; shape: DistrictShape };

// The districts a location can find: never an open one (it has no boundary).
async function activeDistricts(): Promise<DistrictRow[]> {
  const { data, error } = await db
    .from('districts')
    .select('id, ref, name, ring')
    .eq('is_active', true)
    .eq('open', false)
    .order('sort');
  if (error) throw dbError('districts', error);
  return data.flatMap((d) => {
    const ring = parseRing(d.ring);
    return ring
      ? [{ id: d.id, ref: d.ref, name: d.name, shape: { ref: d.ref, name: d.name, ring } }]
      : [];
  });
}

async function openDistricts(): Promise<(DistrictRef & { id: string })[]> {
  const { data, error } = await db
    .from('districts')
    .select('id, ref, name')
    .eq('is_active', true)
    .eq('open', true)
    .order('sort');
  if (error) throw dbError('districts', error);
  return data;
}

function toSession(s: SessionRow & { districts: DistrictRef | null }): DistrictSession {
  return {
    id: s.id,
    district: s.districts
      ? { ref: s.districts.ref, name: s.districts.name }
      : { ref: '', name: '' },
    roomId: s.room_id,
    phase: Date.parse(s.ends_at) <= Date.now() ? 'grace' : 'active',
    endsAt: s.ends_at,
    graceEndsAt: s.grace_ends_at,
    joinedAt: s.joined_at,
    identity: s.identity_mode === 'profiled' ? 'profiled' : 'anonymous',
    identitySwitchUsed: s.identity_switches > 0,
  };
}

// On the dev project an empty pool is filled with the sample questions (never on the pilot).
async function ensureSamplePool(): Promise<void> {
  if (!testQuestionsAllowed(Deno.env.get('SUPABASE_URL'))) return;
  const { count, error } = await db.from('gecit_pool').select('id', { count: 'exact', head: true });
  if (error) throw dbError('gecit_pool', error);
  if ((count ?? 0) > 0) return;
  const { error: insertError } = await db.from('gecit_pool').upsert(
    GECIT_SAMPLES.map((s) => ({ prompt: s.prompt, options: [...s.options], answer: s.answer })),
    { onConflict: 'prompt', ignoreDuplicates: true },
  );
  if (insertError) throw dbError('gecit_pool', insertError);
}

async function state(userId: string): Promise<DistrictState> {
  const now = new Date();
  const day = istanbulDay(now);
  await ensureSamplePool();
  const [ud, gecit, open, session] = await Promise.all([
    db
      .from('user_districts')
      .select('district_id, districts(ref, name, is_active)')
      .eq('user_id', userId)
      .maybeSingle(),
    // The person's gate and current question, never its answer.
    db.rpc('gecit_state', { target_user_id: userId, retry_minutes: DISTRICT.retryMinutes }),
    openDistricts(),
    db
      .from('district_sessions')
      .select('*, districts(ref, name)')
      .eq('user_id', userId)
      .eq('status', 'open')
      .eq('day', day)
      .gt('grace_ends_at', now.toISOString())
      .maybeSingle(),
  ]);
  if (ud.error) throw dbError('user_districts', ud.error);
  if (gecit.error) throw dbError('gecit_state', gecit.error);
  if (session.error) throw dbError('district_sessions', session.error);
  const g = gecit.data[0];

  const found = ud.data?.districts;
  const district: DistrictRef | null =
    ud.data?.district_id && found && found.is_active ? { ref: found.ref, name: found.name } : null;
  const gate: GecitStatus =
    g?.gate === 'question' && g.prompt && g.options && g.slot
      ? 'question'
      : g?.gate === 'failed'
        ? 'failed'
        : 'passed';
  return {
    district,
    located: !ud.data ? 'never' : district ? 'inside' : 'outside',
    gate,
    question:
      gate === 'question' && g?.prompt && g.options && g.slot
        ? { day: g.day, slot: g.slot, prompt: g.prompt, options: g.options }
        : null,
    opensAt: nextIstanbulMidnight(now).toISOString(),
    retryAt: gate === 'failed' && g?.retry_at ? g.retry_at : null,
    openDistricts: open.map((d) => ({ ref: d.ref, name: d.name })),
    session: session.data ? toSession(session.data) : null,
    pickByHand: pickByHand(),
  };
}

async function setDistrict(userId: string, districtId: string | null): Promise<void> {
  const { error } = await db.rpc('district_set', {
    target_user_id: userId,
    // null: outside every district; the generated argument type leaves out null.
    target_district_id: districtId as string,
  });
  if (error) throw dbError('district_set', error);
}

Deno.serve(
  handle(
    async (req, raw): Promise<DistrictState | DistrictLocateResponse | DistrictAnswerResponse> => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);

      if (body.action === 'state') return state(user.id);

      if (body.action === 'locate') {
        // The coordinate stays in this call: it is not logged, stored or answered (rule 6).
        // A mock location app's position is refused, as at check-in (audit SRV-1).
        const check = locationCheck(
          Deno.env.get('CHECKIN_SKIP_LOCATION'),
          Deno.env.get('SUPABASE_URL'),
        );
        if (refusesMockedPosition(body.mocked, check, Deno.env.get('SUPABASE_URL'))) {
          throw new AppError('location_mocked', 'The position comes from a mock location app.');
        }
        const districts = await activeDistricts();
        const found = locate(
          [body.lng, body.lat],
          districts.map((d) => d.shape),
        );
        if (found.kind === 'outside') {
          await setDistrict(user.id, null);
          return { state: await state(user.id), candidates: null };
        }
        const refs = found.kind === 'found' ? [found.ref] : found.refs;
        const chosen =
          refs.length === 1
            ? refs[0]
            : body.choice && refs.includes(body.choice)
              ? body.choice
              : null;
        if (!chosen) {
          return {
            state: await state(user.id),
            candidates: refs.flatMap((r) => {
              const d = districts.find((x) => x.ref === r);
              return d ? [{ ref: d.ref, name: d.name }] : [];
            }),
          };
        }
        const d = districts.find((x) => x.ref === chosen);
        if (!d) throw new AppError('internal', 'locate chose an unknown district.');
        await setDistrict(user.id, d.id);
        return { state: await state(user.id), candidates: null };
      }

      if (body.action === 'pick') {
        // Only where the location check is skipped (the dev project, the local stack).
        if (!pickByHand()) throw new AppError('bad_request', 'Picking by hand is off.');
        const d = (await activeDistricts()).find((x) => x.ref === body.ref);
        if (!d) throw new AppError('not_found', 'No such district.');
        await setDistrict(user.id, d.id);
        return state(user.id);
      }

      if (body.action === 'answer') {
        const { data, error } = await db.rpc('gecit_answer', {
          target_user_id: user.id,
          target_day: body.day,
          choice: body.choice,
          ...(body.slot === undefined ? {} : { target_slot: body.slot }),
          retry_minutes: DISTRICT.retryMinutes,
        });
        if (error) throw dbError('gecit_answer', error);
        return { correct: data[0]?.correct === true, state: await state(user.id) };
      }

      if (body.action === 'enter') {
        // An open district by its ref, or the person's own (the database checks which may be
        // entered: open, or the one they were found in).
        let target: string | undefined;
        if (body.ref !== undefined) {
          const { data, error } = await db
            .from('districts')
            .select('id')
            .eq('ref', body.ref)
            .eq('is_active', true)
            .maybeSingle();
          if (error) throw dbError('districts', error);
          if (!data) throw new AppError('not_found', 'No such district.');
          target = data.id;
        }
        const { error } = await db.rpc('district_enter', {
          target_user_id: user.id,
          capacity: DISTRICT.roomCapacity,
          session_minutes: DISTRICT.sessionMinutes,
          grace_minutes: DISTRICT.graceMinutes,
          ...(target === undefined ? {} : { target_district_id: target }),
        });
        if (error) throw dbError('district_enter', error);
        return state(user.id);
      }

      if (body.action === 'extend') {
        const { error } = await db.rpc('district_extend', {
          target_user_id: user.id,
          session_minutes: DISTRICT.sessionMinutes,
          grace_minutes: DISTRICT.graceMinutes,
        });
        if (error) throw dbError('district_extend', error);
        return state(user.id);
      }

      if (body.action === 'leave') {
        const { error } = await db.rpc('district_leave', { target_user_id: user.id });
        if (error) throw dbError('district_leave', error);
        return state(user.id);
      }

      const { error } = await db.rpc('district_set_identity', {
        target_user_id: user.id,
        anonymous: body.anonymous,
      });
      if (error) throw dbError('district_set_identity', error);
      return state(user.id);
    },
  ),
);
