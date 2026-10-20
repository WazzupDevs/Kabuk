// Check-in, the spot and "Mekandan ayrıl". The coordinates in a check-in request are used for the
// boundary or distance check only: they are never stored, logged or echoed back (MVP_SPEC §4.2,
// docs/SPEC_V3.md §4.2). Database errors are rethrown with their code only, so no request value can
// reach the logs. From step 4.5 a check-in is being at the venue (docs/SPEC_V4.md §4.E): it opens no
// table, asks no headcount and has no alias; a table and its name are rooms/create's.
import { type Db, requireUser, serviceClient } from '../_shared/auth.ts';
import { dbError as domainError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import type {
  ChangeSpotResponse,
  CheckInRequest,
  CheckInResponse,
  CheckinRequest,
  LeaveResponse,
  LocationModeResponse,
  SetIdentityResponse,
} from '../_shared/pure/api/checkin.ts';
import { BOUNDARY_TOLERANCE_M, CHECKIN_RADIUS_M } from '../_shared/pure/checkin.ts';
import {
  CURRENT_LOCATION_CONSENT_VERSION,
  needsConsent,
  needsProfile,
} from '../_shared/pure/consent.ts';
import { locationCheck } from '../_shared/pure/devProject.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { checkinIdentity } from '../_shared/pure/venueChat.ts';

const Body: z.ZodType<CheckinRequest> = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('check-in'),
    venueId: z.uuid(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().nonnegative().max(100_000).nullable(),
    // Today's app sends a headcount and `teams`; both are ignored.
    headcount: z.number().int().optional(),
    locationConsentVersion: z.string(),
    spotId: z.uuid().optional(),
    teams: z.boolean().optional(),
    requestId: z.uuid().optional(),
  }),
  z.object({ action: z.literal('change-spot'), spotId: z.uuid() }),
  z.object({ action: z.literal('reroll-alias') }),
  z.object({ action: z.literal('leave') }),
  z.object({ action: z.literal('location-mode') }),
  z.object({ action: z.literal('set-identity'), anonymous: z.boolean() }),
]);

// Two check-ins of one account at once: the second hits the one-active-check-in index and is tried
// once more. The same check-in sent twice finds the first copy's check-in by its key; a new one ends
// it, as a check-in ends the one before.
const UNIQUE_VIOLATION = '23505';

const db = serviceClient();

// CHECKIN_SKIP_LOCATION=1 on the dev project only (pure/devProject.ts): no boundary or 300 m check.
function currentLocationCheck() {
  return locationCheck(Deno.env.get('CHECKIN_SKIP_LOCATION'), Deno.env.get('SUPABASE_URL'));
}

function dbError(step: string, error: { code: string }): Error {
  return new Error(`${step} failed (${error.code})`);
}

// Consents and the v3 profile (name and birth date) before a table opens. Anonymous or with the
// profile is chosen per room from v3 on (docs/SPEC_V3.md §5.4), not here.
async function requireOnboarded(db: Db, userId: string): Promise<void> {
  const { data, error } = await db
    .from('profiles')
    .select('terms_version, kvkk_version, display_name, has_birth_date')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw dbError('profiles', error);
  if (!data || needsConsent(data)) {
    throw new AppError('onboarding_required', 'Complete onboarding first.');
  }
  // Sign-up = profile (docs/SPEC_V3.md §3): accounts from before v3 finish their profile first.
  if (needsProfile(data)) throw new AppError('profile_required', 'Complete your profile first.');
}

async function checkIn(userId: string, body: CheckInRequest): Promise<CheckInResponse> {
  await requireOnboarded(db, userId);
  if (body.locationConsentVersion !== CURRENT_LOCATION_CONSENT_VERSION) {
    throw new AppError('consent_outdated', 'Location consent is not the current version.');
  }

  // Inside the boundary (with its tolerance), or near the point of a venue without one.
  const inside = await db.rpc('venue_contains', {
    target_venue_id: body.venueId,
    lat: body.lat,
    lng: body.lng,
    tolerance_m: BOUNDARY_TOLERANCE_M,
    radius_m: CHECKIN_RADIUS_M,
  });
  if (inside.error) throw dbError('venue_contains', inside.error);
  if (inside.data === null) throw new AppError('venue_not_found', 'Venue not found.');
  // The log line never carries the position or the venue.
  const check = currentLocationCheck();
  if (check === 'skipped') {
    console.warn('checkin: CHECKIN_SKIP_LOCATION=1, location check skipped (dev only)');
  } else if (check === 'ignored') {
    console.error('checkin: CHECKIN_SKIP_LOCATION is set outside the dev project; ignored');
  }
  if (!inside.data && check !== 'skipped') {
    throw new AppError('too_far', 'You are too far from this venue.');
  }

  for (let attempt = 0; ; attempt++) {
    const { data, error } = await db.rpc('start_table_session', {
      target_user_id: userId,
      target_venue_id: body.venueId,
      consent_version: body.locationConsentVersion,
      accuracy_m: body.accuracyM ?? undefined,
      new_spot_id: body.spotId,
      // The same check-in sent again returns the check-in it made (20261102090000).
      new_checkin_key: body.requestId,
    });
    if (!error) {
      return {
        sessionId: data.id,
        alias: '',
        expiresAt: data.expires_at,
        identity: checkinIdentity(data),
      };
    }
    // spot_required and spot_invalid come from the database as domain errors.
    if (error.code !== UNIQUE_VIOLATION || attempt > 0) {
      throw domainError('start_table_session', error);
    }
  }
}

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<
      | CheckInResponse
      | ChangeSpotResponse
      | LeaveResponse
      | LocationModeResponse
      | SetIdentityResponse
    > => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);

      switch (body.action) {
        case 'check-in':
          return await checkIn(user.id, body);

        case 'change-spot': {
          const { error } = await db.rpc('change_table_spot', {
            target_user_id: user.id,
            target_spot_id: body.spotId,
          });
          if (error) throw domainError('change_table_spot', error);
          return { spotId: body.spotId };
        }

        // Today's app: a table's name is rooms/reroll-name's from step 4.5 on.
        case 'reroll-alias':
          throw new AppError('update_required', 'This version of the app is too old. Update it.');

        // The check-in screen asks before locating: on the dev project with the switch on, a
        // position outside the venue or no position at all does not stop the flow.
        case 'location-mode':
          return { skipLocation: currentLocationCheck() === 'skipped' };

        case 'leave': {
          const { error } = await db.rpc('end_table_session', { target_user_id: user.id });
          if (error) throw dbError('end_table_session', error);
          return { ok: true };
        }

        // docs/SPEC_V4.md §4.D: anonymous or profiled, once per check-in. Only the check-in is
        // locked (§4.K); no gender is needed (check-in and the venue chat do not ask for it).
        case 'set-identity': {
          const { data, error } = await db.rpc('set_checkin_identity', {
            target_user_id: user.id,
            new_mode: body.anonymous ? 'anonymous' : 'profiled',
          });
          if (error) throw domainError('set_checkin_identity', error);
          return { identity: checkinIdentity(data) };
        }
      }
    },
  ),
);
