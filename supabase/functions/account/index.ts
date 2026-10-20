import { requireUser, serviceClient } from '../_shared/auth.ts';
import { inBackground } from '../_shared/background.ts';
import { assignCapsuleIdentity } from '../_shared/capsule.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { deleteProfilePhotos } from '../_shared/photos.ts';
import { deletePosthogPerson } from '../_shared/posthog.ts';
import { checkBirthDate, isAdult, istanbulToday } from '../_shared/pure/age.ts';
import type {
  AccountRequest,
  AccountResponse,
  CompleteOnboardingRequest,
} from '../_shared/pure/api/account.ts';
import { CURRENT_KVKK_VERSION, CURRENT_TERMS_VERSION } from '../_shared/pure/consent.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { type Gender, GENDERS } from '../_shared/pure/gender.ts';
import { checkDisplayName } from '../_shared/pure/profile.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import { isExpoPushToken } from '../_shared/pure/push.ts';

const Body: z.ZodType<AccountRequest> = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('complete-onboarding'),
    termsVersion: z.string(),
    kvkkVersion: z.string(),
    displayName: z.string().max(200).optional(),
    birthDate: z.string().max(20).optional(),
    gender: z.enum(GENDERS).optional(),
  }),
  z.object({ action: z.literal('set-gender'), gender: z.enum(GENDERS) }),
  z.object({ action: z.literal('delete') }),
  z.object({
    action: z.literal('register-push'),
    token: z.string().max(200).refine(isExpoPushToken).nullable(),
  }),
  z.object({ action: z.literal('notifications-seen') }),
]);

const db = serviceClient();

// "Hesabımı sil", and sign-up under 18: end the table, delete the photos, delete the account (the
// rest goes by cascade), then the PostHog person.
async function deleteAccount(userId: string): Promise<void> {
  // End the table first so its rooms close or go back to waiting for the other table.
  const ended = await db.rpc('end_table_session', { target_user_id: userId });
  if (ended.error) throw dbError('end_table_session', ended.error);
  // Photos before the account: the profile row names the files.
  await deleteProfilePhotos(db, userId);
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw error;
  inBackground(deletePosthogPerson(userId));
}

// Consents and the profile in one write (docs/SPEC_V3.md §3), then the capsule identity. The age is
// checked before anything is written: under 18 the account is deleted and nothing about the person
// is kept.
async function completeOnboarding(userId: string, body: CompleteOnboardingRequest): Promise<void> {
  if (body.termsVersion !== CURRENT_TERMS_VERSION || body.kvkkVersion !== CURRENT_KVKK_VERSION) {
    throw new AppError('consent_outdated', 'Accepted texts are not the current versions.');
  }
  const existing = await db
    .from('profiles')
    .select('display_name, birth_date, gender')
    .eq('id', userId)
    .maybeSingle();
  if (existing.error) throw dbError('profiles', existing.error);

  // Set once, like the birth date (docs/SPEC_V3.md §23.D); a correction goes through
  // admin:set-gender. Sign-up (the profile is not complete yet) asks for it, checked before the age
  // so a refused call writes and deletes nothing. A complete profile only re-consents here; an
  // empty gender from before the step is asked once by set-gender, after the new KVKK notice.
  const gender = (existing.data?.gender ?? null) as Gender | null;
  const signingUp = !existing.data?.display_name || !existing.data?.birth_date;
  if (signingUp && gender === null && body.gender === undefined) {
    throw new AppError('bad_request', 'The gender is required.');
  }
  if (gender !== null && body.gender !== undefined && body.gender !== gender) {
    throw new AppError('bad_request', 'The gender cannot be changed.');
  }

  let birthDate = existing.data?.birth_date ?? null;
  if (birthDate === null) {
    if (body.birthDate === undefined) {
      throw new AppError('profile_required', 'A birth date is required.');
    }
    const checked = checkBirthDate(body.birthDate, istanbulToday(new Date()));
    if (!checked.ok) throw new AppError('birth_date_invalid', 'Invalid birth date.');
    if (!isAdult(checked.age)) {
      await deleteAccount(userId);
      throw new AppError('under_age', 'Kabuk is for 18 and over.');
    }
    birthDate = checked.value;
  } else if (body.birthDate !== undefined && body.birthDate !== birthDate) {
    // Set once; a correction goes through admin:set-birth-date.
    throw new AppError('birth_date_invalid', 'The birth date cannot be changed.');
  }

  let displayName = existing.data?.display_name ?? null;
  if (body.displayName !== undefined) {
    const checked = checkDisplayName(body.displayName, await loadProfanity(db));
    if (!checked.ok && checked.reason === 'contact') {
      // K-34: a phone, an e-mail, a username or a link.
      throw new AppError('contact_not_allowed', 'Contact details are not allowed.');
    }
    if (!checked.ok || checked.value === null) {
      throw new AppError('display_name_invalid', 'Invalid display name.');
    }
    displayName = checked.value;
  }
  if (displayName === null) throw new AppError('profile_required', 'A display name is required.');

  const now = new Date().toISOString();
  const { error } = await db.from('profiles').upsert({
    id: userId,
    age_confirmed_at: now,
    terms_accepted_at: now,
    terms_version: body.termsVersion,
    kvkk_accepted_at: now,
    kvkk_version: body.kvkkVersion,
    display_name: displayName,
    birth_date: birthDate,
    gender: gender ?? body.gender ?? null,
  });
  if (error) throw dbError('profiles', error);
  // The nick and the start look (docs/SPEC_V4.md §4.D), once and only after the age check: under
  // 18 nothing was written, not even a nick (rule 11). A re-consent keeps the ones it has.
  await assignCapsuleIdentity(db, userId);
}

// The one-time gender question for an account from before the gender step (docs/SPEC_V3.md §23.D):
// only while the profile's gender is empty. The update itself checks it, so two answers cannot both
// land.
async function setGender(userId: string, gender: Gender): Promise<void> {
  const existing = await db.from('profiles').select('gender').eq('id', userId).maybeSingle();
  if (existing.error) throw dbError('profiles', existing.error);
  if (!existing.data) throw new AppError('onboarding_required', 'Complete onboarding first.');
  const { data, error } = await db
    .from('profiles')
    .update({ gender })
    .eq('id', userId)
    .is('gender', null)
    .select('id');
  if (error) throw dbError('profiles', error);
  if (data.length === 0) throw new AppError('bad_request', 'The gender is already set.');
}

Deno.serve(
  handle(async (req, raw): Promise<AccountResponse> => {
    const body = Body.parse(raw);

    switch (body.action) {
      case 'complete-onboarding': {
        const user = await requireUser(req, db);
        await completeOnboarding(user.id, body);
        return { ok: true };
      }

      case 'set-gender': {
        const user = await requireUser(req, db);
        await setGender(user.id, body.gender);
        return { ok: true };
      }

      case 'delete': {
        const user = await requireUser(req, db);
        await deleteAccount(user.id);
        return { ok: true };
      }

      case 'register-push': {
        const user = await requireUser(req, db);
        const { error } = await db
          .from('profiles')
          .update({ push_token: body.token })
          .eq('id', user.id);
        if (error) throw dbError('profiles', error);
        return { ok: true };
      }

      // The bell's list was opened (docs/SPEC_V4.md §4.G): the badge counts what comes after.
      case 'notifications-seen': {
        const user = await requireUser(req, db);
        const { error } = await db
          .from('profiles')
          .update({ notifications_seen_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw dbError('profiles', error);
        return { ok: true };
      }
    }
  }),
);
