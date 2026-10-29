import type { BadgeId } from '../badges.ts';
import type { Gender } from '../gender.ts';

// `profile` Edge Function (docs/SPEC_V2.md §5), shared with the mobile app.
export type ProfileView = {
  publicId: string;
  displayName: string | null;
  bio: string | null;
  // Signed URL valid for an hour; null without a photo or when it is hidden.
  photoUrl: string | null;
  badges: BadgeId[];
  // Completed years (Istanbul day); the birth date itself goes to nobody else (rule 11).
  age: number | null;
  // Only on the caller's own profile; the gender goes to nobody else (rule 12).
  photoHidden?: boolean;
  birthDate?: string | null;
  gender?: Gender | null;
  // Only on the caller's own profile (docs/SPEC_V4.md §4.D, K-49): the anonymous nick and the
  // capsule look; nickRefreshAt is when the nick can be refreshed again, null when it can now.
  capsuleNick?: string | null;
  capsuleLook?: string | null;
  nickRefreshAt?: string | null;
};

// The profile behind a profiled venue chat message (docs/SPEC_V3.md §7.5): no public_id; it opens
// through the message only.
export type ChatProfileView = Omit<
  ProfileView,
  | 'publicId'
  | 'photoHidden'
  | 'birthDate'
  | 'gender'
  | 'capsuleNick'
  | 'capsuleLook'
  | 'nickRefreshAt'
> & {
  // Only when the sender is the viewer's friend (friends see each other's public_id, rule 4).
  friendPublicId?: string;
};

export type ProfileRequest =
  | { action: 'get'; publicId: string }
  // No live table at the venue, an anonymous, hidden or deleted message, a block either way and an
  // unknown id all answer not_found alike.
  | { action: 'get'; venueChatMessageId: string }
  | {
      action: 'update';
      displayName?: string;
      bio?: string;
      notifyDm?: boolean;
      notifyFriendRequests?: boolean;
      // "Masa davetleri" (docs/SPEC_V4.md §4.G, K-53, K-62).
      notifyInvites?: boolean;
      // Ayarlar → "Oyunlara katılım": the identity a check-in starts with (§4.D).
      defaultParticipation?: 'anonymous' | 'profile';
    }
  | { action: 'photo-upload-url' }
  | { action: 'photo-commit'; path: string }
  | { action: 'photo-remove' }
  // K-9: a new nick once in 30 days (nick_refresh_too_soon before); the old one is never given
  // again, and old messages keep it.
  | { action: 'refresh-nick' }
  // K-47 (step 4.4b): the decoration screen's Kaydet. The look is checked against the catalog (an
  // unknown part is dropped) and answered as written; the emotions stay on the phone (K-52). Old
  // messages and a running table's seat keep the look they were written with (K-10).
  | { action: 'set-look'; look: string };

export type ProfileUploadUrl = { path: string; token: string };
export type RefreshNickResponse = { capsuleNick: string; nickRefreshAt: string | null };
export type SetLookResponse = { capsuleLook: string };
export type ProfileResponse =
  | ProfileView
  | ChatProfileView
  | ProfileUploadUrl
  | RefreshNickResponse
  | SetLookResponse
  | { ok: true };
