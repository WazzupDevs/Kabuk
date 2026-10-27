// Profiles (docs/SPEC_V2.md §5). `get` returns a profile only to the owner, friends and current
// room members of a table that joined with its profile; every other case answers exactly like an
// unknown public_id. Photos are re-encoded and stripped of metadata on the phone and checked here
// again before they count (rule 6). A photo's path is random (p/{uuid}.jpg) and carries nothing of the
// account (rule 4); the path photo-upload-url issued is kept as the pending upload, and only that
// one can be committed.
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { assignCapsuleIdentity, refreshCapsuleNick } from '../_shared/capsule.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { reachablePhotoUrl } from '../_shared/photos.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import type {
  ChatProfileView,
  ProfileRequest,
  ProfileResponse,
  ProfileView,
} from '../_shared/pure/api/profile.ts';
import { ageOn, istanbulToday, parseIsoDate } from '../_shared/pure/age.ts';
import { earnedBadges } from '../_shared/pure/badges.ts';
import { LOOK_MAX_LENGTH, nickRefreshAt, normalizeLook } from '../_shared/pure/capsule.ts';
import type { Gender } from '../_shared/pure/gender.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { inspectJpeg } from '../_shared/pure/jpegMetadata.ts';
import {
  checkBio,
  checkDisplayName,
  isPhotoPath,
  newPhotoPath,
  PHOTO_BUCKET,
  PHOTO_MAX_BYTES,
  PHOTO_URL_SECONDS,
} from '../_shared/pure/profile.ts';

const Body: z.ZodType<ProfileRequest> = z.union([
  z.strictObject({ action: z.literal('get'), publicId: z.uuid() }),
  z.strictObject({ action: z.literal('get'), venueChatMessageId: z.uuid() }),
  z.object({
    action: z.literal('update'),
    displayName: z.string().max(200).optional(),
    bio: z.string().max(2000).optional(),
    notifyDm: z.boolean().optional(),
    notifyFriendRequests: z.boolean().optional(),
    notifyInvites: z.boolean().optional(),
    defaultParticipation: z.enum(['anonymous', 'profile']).optional(),
  }),
  z.object({ action: z.literal('photo-upload-url') }),
  z.object({ action: z.literal('photo-commit'), path: z.string().max(200) }),
  z.object({ action: z.literal('photo-remove') }),
  z.object({ action: z.literal('refresh-nick') }),
  // Only the look: no account and no emotion goes with it (K-47, K-52).
  z.strictObject({ action: z.literal('set-look'), look: z.string().max(LOOK_MAX_LENGTH) }),
]);

const db = serviceClient();
const photos = () => db.storage.from(PHOTO_BUCKET);

// K-34: a phone, an e-mail, a username or a link in a display name or a bio.
function contactError(): AppError {
  return new AppError('contact_not_allowed', 'Contact details are not allowed.');
}

async function ownProfile(userId: string) {
  const { data, error } = await db
    .from('profiles')
    .select('public_id, display_name, bio, photo_path, photo_pending_path')
    .eq('id', userId)
    .single();
  if (error) throw dbError('profiles', error);
  return data;
}

function requireName(displayName: string | null): void {
  if (!displayName) throw new AppError('display_name_required', 'Choose a display name first.');
}

async function ageAndBadges(userId: string) {
  const [stats, birth] = await Promise.all([
    db.rpc('user_stats', { target_user_id: userId }),
    db.from('profiles').select('birth_date').eq('id', userId).single(),
  ]);
  if (stats.error) throw dbError('user_stats', stats.error);
  if (birth.error) throw dbError('profiles', birth.error);
  const counts = stats.data[0];
  const born = birth.data.birth_date ? parseIsoDate(birth.data.birth_date) : null;
  return {
    age: born ? ageOn(born, istanbulToday(new Date())) : null,
    badges: earnedBadges({
      games: counts?.games ?? 0,
      voiceTabuWins: counts?.voice_tabu_wins ?? 0,
      distinctTables: counts?.distinct_tables ?? 0,
    }),
  };
}

// The sender of a profiled venue chat message, opened through the message (docs/SPEC_V3.md §7.5):
// name, age, photo unless hidden, bio and badges. No public_id, no table alias.
async function getChatProfile(viewer: string, messageId: string): Promise<ChatProfileView> {
  const owner = await db.rpc('venue_chat_profile_owner', {
    target_user_id: viewer,
    target_message_id: messageId,
  });
  if (owner.error) throw dbError('venue_chat_profile_owner', owner.error);
  if (!owner.data) throw new AppError('not_found', 'Profile not found.');
  const { data, error } = await db
    .from('profiles')
    .select('display_name, bio, photo_path, photo_hidden_at')
    .eq('id', owner.data)
    .single();
  if (error) throw dbError('profiles', error);
  let photoUrl: string | null = null;
  if (data.photo_path && !data.photo_hidden_at) {
    const signed = await photos().createSignedUrl(data.photo_path, PHOTO_URL_SECONDS);
    if (signed.error) throw new Error(`storage sign failed (${signed.error.message})`);
    photoUrl = reachablePhotoUrl(signed.data.signedUrl);
  }
  return {
    displayName: data.display_name,
    bio: data.bio,
    photoUrl,
    ...(await ageAndBadges(owner.data)),
  };
}

async function getProfile(viewer: string, publicId: string): Promise<ProfileView> {
  const { data, error } = await db.rpc('profile_view', {
    viewer,
    target_public_id: publicId,
  });
  if (error) throw dbError('profile_view', error);
  const row = data[0];
  // Unknown, blocked, or not allowed: the same answer on the same path.
  if (!row) throw new AppError('not_found', 'Profile not found.');
  // The own profile shows the nick: an account left without one gets it here (_shared/capsule.ts).
  if (row.is_self) await assignCapsuleIdentity(db, row.user_id);

  const [stats, birth] = await Promise.all([
    db.rpc('user_stats', { target_user_id: row.user_id }),
    db
      .from('profiles')
      .select('birth_date, gender, capsule_nick, capsule_look, capsule_nick_changed_at')
      .eq('id', row.user_id)
      .single(),
  ]);
  if (stats.error) throw dbError('user_stats', stats.error);
  if (birth.error) throw dbError('profiles', birth.error);
  const counts = stats.data[0];
  const born = birth.data.birth_date ? parseIsoDate(birth.data.birth_date) : null;
  const age = born ? ageOn(born, istanbulToday(new Date())) : null;

  let photoUrl: string | null = null;
  if (row.photo_path && !row.photo_hidden) {
    const signed = await photos().createSignedUrl(row.photo_path, PHOTO_URL_SECONDS);
    if (signed.error) throw new Error(`storage sign failed (${signed.error.message})`);
    photoUrl = reachablePhotoUrl(signed.data.signedUrl);
  }
  return {
    publicId: row.public_id,
    displayName: row.display_name,
    bio: row.bio,
    photoUrl,
    badges: earnedBadges({
      games: counts?.games ?? 0,
      voiceTabuWins: counts?.voice_tabu_wins ?? 0,
      distinctTables: counts?.distinct_tables ?? 0,
    }),
    age,
    // The owner sees their own birth date (Ayarlar → Hesap) and gender; nobody else does (rules 11
    // and 12). The capsule and the nick too: never on another's profile, a friend's included (K-49).
    ...(row.is_self
      ? {
          photoHidden: row.photo_hidden,
          birthDate: birth.data.birth_date,
          gender: birth.data.gender as Gender | null,
          capsuleNick: birth.data.capsule_nick,
          capsuleLook: birth.data.capsule_look,
          nickRefreshAt: nickRefreshAt(birth.data.capsule_nick_changed_at, new Date()),
        }
      : {}),
  };
}

Deno.serve(
  handle(async (req, raw): Promise<ProfileResponse> => {
    const body = Body.parse(raw);
    const user = await requireUser(req, db);

    switch (body.action) {
      case 'get':
        return 'venueChatMessageId' in body
          ? await getChatProfile(user.id, body.venueChatMessageId)
          : await getProfile(user.id, body.publicId);

      // K-9: once in 30 days; the look stays, only the nick changes.
      case 'refresh-nick': {
        const refreshed = await refreshCapsuleNick(db, user.id);
        return {
          capsuleNick: refreshed.nick,
          nickRefreshAt: nickRefreshAt(refreshed.changedAt, new Date()),
        };
      }

      // K-47: the caller's own look, as the catalog knows it (unknown parts dropped). Written now;
      // what was written before keeps its look (K-10).
      case 'set-look': {
        const look = normalizeLook(body.look);
        const { data, error } = await db
          .from('profiles')
          .update({ capsule_look: look })
          .eq('id', user.id)
          .select('id')
          .maybeSingle();
        if (error) throw dbError('profiles', error);
        if (!data) throw new AppError('onboarding_required', 'Complete onboarding first.');
        return { capsuleLook: look };
      }

      case 'update': {
        const me = await ownProfile(user.id);
        const terms = await loadProfanity(db);
        const changes: {
          display_name?: string;
          bio?: string | null;
          notify_dm?: boolean;
          notify_friend_requests?: boolean;
          notify_invites?: boolean;
          default_participation?: 'anonymous' | 'profile';
        } = {};
        let name = me.display_name;

        if (body.displayName !== undefined) {
          const checked = checkDisplayName(body.displayName, terms);
          if (!checked.ok && checked.reason === 'contact') throw contactError();
          if (!checked.ok || checked.value === null) {
            throw new AppError('display_name_invalid', 'Invalid display name.');
          }
          changes.display_name = checked.value;
          name = checked.value;
        }
        // An unchanged bio is not checked again: one from before the 80 limit stays until it is
        // edited (K-34).
        if (body.bio !== undefined && body.bio.trim() !== (me.bio ?? '')) {
          const checked = checkBio(body.bio, terms);
          if (!checked.ok && checked.reason === 'contact') throw contactError();
          if (!checked.ok) throw new AppError('bio_invalid', 'Invalid bio.');
          if (checked.value !== null) requireName(name);
          changes.bio = checked.value;
        }
        if (body.notifyDm !== undefined) changes.notify_dm = body.notifyDm;
        if (body.notifyFriendRequests !== undefined) {
          changes.notify_friend_requests = body.notifyFriendRequests;
        }
        if (body.notifyInvites !== undefined) changes.notify_invites = body.notifyInvites;
        // Ayarlar → "Oyunlara katılım": the identity each check-in starts with (start_table_session;
        // a profiled start needs a visible photo there). Rule 12 still decides the table seat.
        if (body.defaultParticipation !== undefined) {
          changes.default_participation = body.defaultParticipation;
        }

        if (Object.keys(changes).length === 0) return { ok: true };
        const { error } = await db.from('profiles').update(changes).eq('id', user.id);
        if (error) throw dbError('profiles', error);
        return { ok: true };
      }

      case 'photo-upload-url': {
        const me = await ownProfile(user.id);
        requireName(me.display_name);
        const path = newPhotoPath(crypto.randomUUID());
        const { data, error } = await photos().createSignedUploadUrl(path);
        if (error) throw new Error(`storage upload url failed (${error.message})`);
        const pending = await db
          .from('profiles')
          .update({ photo_pending_path: path })
          .eq('id', user.id);
        if (pending.error) throw dbError('profiles', pending.error);
        // One pending upload per account: an earlier one that was never committed goes.
        if (me.photo_pending_path) await photos().remove([me.photo_pending_path]);
        return { path, token: data.token };
      }

      case 'photo-commit': {
        const me = await ownProfile(user.id);
        requireName(me.display_name);
        // Only the path issued to this account (its pending upload). Re-committing the current path
        // would clear a hide after reports; only a new photo does.
        if (
          !isPhotoPath(body.path) ||
          body.path !== me.photo_pending_path ||
          body.path === me.photo_path
        ) {
          throw new AppError('photo_invalid', 'Not a new photo of yours.');
        }
        const file = await photos().download(body.path);
        if (file.error) throw new AppError('photo_invalid', 'Photo not uploaded.');
        const bytes = new Uint8Array(await file.data.arrayBuffer());
        if (bytes.length > PHOTO_MAX_BYTES || !inspectJpeg(bytes).ok) {
          await photos().remove([body.path]);
          const cleared = await db
            .from('profiles')
            .update({ photo_pending_path: null })
            .eq('id', user.id)
            .eq('photo_pending_path', body.path);
          if (cleared.error) throw dbError('profiles', cleared.error);
          throw new AppError('photo_invalid', 'Only JPEG without metadata is accepted.');
        }
        const { error } = await db
          .from('profiles')
          .update({ photo_path: body.path, photo_hidden_at: null, photo_pending_path: null })
          .eq('id', user.id);
        if (error) throw dbError('profiles', error);
        if (me.photo_path && me.photo_path !== body.path) await photos().remove([me.photo_path]);
        return { ok: true };
      }

      case 'photo-remove': {
        const me = await ownProfile(user.id);
        const files = [me.photo_path, me.photo_pending_path].filter((p): p is string => !!p);
        if (files.length > 0) await photos().remove(files);
        const { error } = await db
          .from('profiles')
          .update({ photo_path: null, photo_hidden_at: null, photo_pending_path: null })
          .eq('id', user.id);
        if (error) throw dbError('profiles', error);
        return { ok: true };
      }
    }
  }),
);
