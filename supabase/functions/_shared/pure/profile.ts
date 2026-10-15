// Profile fields (docs/SPEC_V2.md §5.1). The same rules run on the phone (length) and in the
// profile function (length and profanity).
import { containsProfanity, type PreparedTerms } from './profanity.ts';

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;
export const BIO_MAX = 160;
export const PARTICIPATIONS = ['anonymous', 'profile'] as const;
export type Participation = (typeof PARTICIPATIONS)[number];

export type FieldCheck =
  { ok: true; value: string | null } | { ok: false; reason: 'length' | 'profanity' };

const length = (s: string) => [...s].length;

// Trimmed display name with inner whitespace collapsed; required (2–24 characters).
export function checkDisplayName(raw: string, terms: PreparedTerms): FieldCheck {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (length(value) < DISPLAY_NAME_MIN || length(value) > DISPLAY_NAME_MAX) {
    return { ok: false, reason: 'length' };
  }
  if (containsProfanity(value, terms)) return { ok: false, reason: 'profanity' };
  return { ok: true, value };
}

// Trimmed bio; empty clears it (null), otherwise at most 160 characters.
export function checkBio(raw: string, terms: PreparedTerms): FieldCheck {
  const value = raw.trim();
  if (value === '') return { ok: true, value: null };
  if (length(value) > BIO_MAX) return { ok: false, reason: 'length' };
  if (containsProfanity(value, terms)) return { ok: false, reason: 'profanity' };
  return { ok: true, value };
}

// Profile photos: p/{uuid}.jpg in the private profile-photos bucket, at most 300 KB. The path is
// random and carries nothing of the account: a signed URL shows its path, and a photo reaches
// people before friendship (venue chat, its profile, its friend requests), where the public_id must
// not (rule 4). The server issues the path (photo-upload-url) and keeps it as the account's pending
// upload; only that path can be committed. Photos from before this rule were {public_id}/{uuid}.jpg
// (legacy); `pnpm admin:move-photos` moves them.
export const PHOTO_BUCKET = 'profile-photos';
export const PHOTO_MAX_BYTES = 300 * 1024;
export const PHOTO_SIZE_PX = 512;
export const PHOTO_JPEG_QUALITY = 0.7;
export const PHOTO_URL_SECONDS = 3600;

export const PHOTO_FOLDER = 'p';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PHOTO_PATH = new RegExp(`^${PHOTO_FOLDER}/${UUID}\\.jpg$`);
const LEGACY_PHOTO_PATH = new RegExp(`^${UUID}/${UUID}\\.jpg$`);

// A new photo's path from a fresh random UUID.
export function newPhotoPath(uuid: string): string {
  if (!new RegExp(`^${UUID}$`).test(uuid)) throw new Error('not a uuid');
  return `${PHOTO_FOLDER}/${uuid}.jpg`;
}

export function isPhotoPath(path: string): boolean {
  return PHOTO_PATH.test(path);
}

// {public_id}/{uuid}.jpg: a photo uploaded before random paths.
export function isLegacyPhotoPath(path: string): boolean {
  return LEGACY_PHOTO_PATH.test(path);
}
