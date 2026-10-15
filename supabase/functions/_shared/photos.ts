import type { Db } from './auth.ts';
import { cachedUrl, type PhotoUrlCache, remember, SERVER_REUSE_MS } from './pure/photoUrlCache.ts';
import { PHOTO_BUCKET, PHOTO_URL_SECONDS } from './pure/profile.ts';

// Deletes every profile photo of an account (account deletion and ban): the current one, an
// upload that was never committed, and anything left in the folder of photos from before random
// paths ({public_id}/). Storage objects are not removed by foreign keys, so they go explicitly,
// before the account (the profile row names the files).
export async function deleteProfilePhotos(db: Db, userId: string): Promise<void> {
  const { data: p, error } = await db
    .from('profiles')
    .select('public_id, photo_path, photo_pending_path')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`profiles read failed (${error.code})`);
  if (!p) return;
  const bucket = db.storage.from(PHOTO_BUCKET);
  const legacy = await bucket.list(p.public_id, { limit: 1000 });
  if (legacy.error) throw new Error(`storage list failed (${legacy.error.message})`);
  const files = [
    p.photo_path,
    p.photo_pending_path,
    ...legacy.data.map((f) => `${p.public_id}/${f.name}`),
  ].filter((f): f is string => !!f);
  if (files.length === 0) return;
  const removed = await bucket.remove(files);
  if (removed.error) throw new Error(`storage remove failed (${removed.error.message})`);
}

// A reported photo as hex bytea for the report row (docs/SPEC_V2.md §5.3: the copy lives in
// reports.photo_copy and goes with the row after 30 days). undefined if it cannot be read.
export async function photoCopyHex(db: Db, path: string | null): Promise<string | undefined> {
  if (!path) return undefined;
  const file = await db.storage.from(PHOTO_BUCKET).download(path);
  if (file.error) return undefined;
  let hex = '\\x';
  for (const b of new Uint8Array(await file.data.arrayBuffer())) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

// Profile photo URLs for the given paths, signed for an hour (photos are private; only Edge
// Functions sign them). Keyed by path. A path signed in this isolate during the last half hour is
// answered with the same URL (pure/photoUrlCache.ts): no Storage call, and the phone does not
// download the photo again. The caller has already decided that the reader may see each path.
const signedUrls: PhotoUrlCache = new Map();

export async function signPhotos(db: Db, paths: readonly string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const now = Date.now();
  const missing: string[] = [];
  for (const path of new Set(paths)) {
    const hit = cachedUrl(signedUrls, path, now);
    if (hit) urls.set(path, hit);
    else missing.push(path);
  }
  if (missing.length === 0) return urls;
  const signed = await db.storage.from(PHOTO_BUCKET).createSignedUrls(missing, PHOTO_URL_SECONDS);
  if (signed.error) throw new Error(`storage sign failed (${signed.error.message})`);
  for (const s of signed.data) {
    if (!s.path || !s.signedUrl) continue;
    urls.set(s.path, s.signedUrl);
    remember(signedUrls, s.path, s.signedUrl, now, SERVER_REUSE_MS);
  }
  return urls;
}
