// A profile photo for a script's own test account (the E2E bot, `pnpm latency`), through the app's
// own path: an upload URL from profile/photo-upload-url, the upload, then profile/photo-commit.
// "Profilimle" needs a visible photo at the moment of the choice (docs/SPEC_V3.md §22.G, step 22.1).
// The image is scripts/e2e/fixtures/bot-photo.jpg. An account that already shows a photo keeps
// it; a hidden one is replaced. Only the public Edge Function API and the account's own session:
// no secret key.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  ProfileUploadUrl,
  ProfileView,
} from '../../supabase/functions/_shared/pure/api/profile.ts';
import { PHOTO_BUCKET } from '../../supabase/functions/_shared/pure/profile.ts';

// A real, decodable 256x256 abstract pattern (no person), JFIF only, no metadata. The app draws it,
// so the E2E screenshots show a photo, not an empty frame. Checked by profilePhoto.test.ts.
export const BOT_PHOTO_PATH = fileURLToPath(
  new URL('../e2e/fixtures/bot-photo.jpg', import.meta.url),
);

type Call = (fn: string, body: Record<string, unknown>) => Promise<unknown>;

export async function ensureProfilePhoto(
  client: SupabaseClient,
  call: Call,
): Promise<'kept' | 'uploaded'> {
  const { data, error } = await client.from('profiles').select('public_id').single();
  if (error) throw error;
  const own = (await call('profile', {
    action: 'get',
    publicId: (data as { public_id: string }).public_id,
  })) as ProfileView;
  if (own.photoUrl) return 'kept';
  const { path, token } = (await call('profile', {
    action: 'photo-upload-url',
  })) as ProfileUploadUrl;
  const uploaded = await client.storage
    .from(PHOTO_BUCKET)
    .uploadToSignedUrl(path, token, await readFile(BOT_PHOTO_PATH), { contentType: 'image/jpeg' });
  if (uploaded.error) throw uploaded.error;
  await call('profile', { action: 'photo-commit', path });
  return 'uploaded';
}
