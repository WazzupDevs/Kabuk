// Usage: pnpm admin:move-photos
// Once per project, after the random photo paths (migration 20261023090000_photo_paths.sql and the
// profile function) are deployed: moves every photo stored at {public_id}/{uuid}.jpg to
// p/{random uuid}.jpg and removes what is left in the old folders. Safe to run again.
// Developer machine only. Needs SUPABASE_URL and SUPABASE_SECRET_KEY in the environment
// (Supabase dashboard → Settings → API Keys). The secret key never goes into the app.
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../supabase/functions/_shared/pure/database.ts';
import { moveLegacyPhotos } from './admin/photos.ts';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { moved, removed } = await moveLegacyPhotos(admin);
console.log(`Moved ${moved} photo(s); removed ${removed} file(s) left in old folders.`);
