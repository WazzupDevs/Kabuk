// A profile photo for a script's own test account (the E2E bot, `pnpm latency`), through the app's
// own path: an upload URL from profile/photo-upload-url, the upload, then profile/photo-commit.
// "Profilimle" needs a visible photo at the moment of the choice (docs/SPEC_V3.md §22.G, step 22.1).
// The image is a minimal JPEG without metadata, the same bytes as the integration tests' photo
// (supabase/tests/helpers.ts). An account that already shows a photo keeps it; a hidden one is
// replaced. Only the public Edge Function API and the account's own session: no secret key.
import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  ProfileUploadUrl,
  ProfileView,
} from '../../supabase/functions/_shared/pure/api/profile.ts';
import { PHOTO_BUCKET } from '../../supabase/functions/_shared/pure/profile.ts';

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
    .uploadToSignedUrl(path, token, TEST_JPEG, { contentType: 'image/jpeg' });
  if (uploaded.error) throw uploaded.error;
  await call('profile', { action: 'photo-commit', path });
  return 'uploaded';
}
