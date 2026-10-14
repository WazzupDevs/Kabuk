import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../supabase/functions/_shared/pure/database.ts';
import {
  isLegacyPhotoPath,
  newPhotoPath,
  PHOTO_BUCKET,
} from '../../supabase/functions/_shared/pure/profile.ts';

type Admin = SupabaseClient<Database>;

// Every profile photo of an account: the current one, an upload that was never committed, and
// anything left in the folder of photos from before random paths ({public_id}/). Storage objects
// are not removed by foreign keys, so a ban deletes them explicitly (the account function does the
// same, _shared/photos.ts).
export async function deleteProfilePhotos(admin: Admin, userId: string): Promise<void> {
  const { data: p, error } = await admin
    .from('profiles')
    .select('public_id, photo_path, photo_pending_path')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!p) return;
  const bucket = admin.storage.from(PHOTO_BUCKET);
  const legacy = await bucket.list(p.public_id, { limit: 1000 });
  if (legacy.error) throw legacy.error;
  const files = [
    p.photo_path,
    p.photo_pending_path,
    ...legacy.data.map((f) => `${p.public_id}/${f.name}`),
  ].filter((f): f is string => !!f);
  if (files.length === 0) return;
  const removed = await bucket.remove(files);
  if (removed.error) throw removed.error;
}

// `pnpm admin:move-photos`, once per project after random photo paths were deployed: every photo
// stored at {public_id}/{uuid}.jpg moves to p/{random uuid}.jpg. Per photo: a Storage copy (the
// Storage API, never a SQL rename of storage.objects), then move_profile_photo (the profile and
// its report copies point at the new path), then the old file goes. Afterwards the files left in
// the old folders (uploads never committed) are removed. Safe to run again: a photo already moved
// is not legacy any more, and a failed step leaves the old file in place for the next run.
export async function moveLegacyPhotos(admin: Admin): Promise<{ moved: number; removed: number }> {
  const bucket = admin.storage.from(PHOTO_BUCKET);
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('photo_path')
    .not('photo_path', 'is', null)
    .not('photo_path', 'like', 'p/%');
  if (error) throw error;
  let moved = 0;
  for (const { photo_path: oldPath } of profiles) {
    if (!oldPath || !isLegacyPhotoPath(oldPath)) continue;
    const newPath = newPhotoPath(crypto.randomUUID());
    const copied = await bucket.copy(oldPath, newPath);
    if (copied.error) throw copied.error;
    const { data: changed, error: moveError } = await admin.rpc('move_profile_photo', {
      old_path: oldPath,
      new_path: newPath,
    });
    if (moveError) throw moveError;
    // The owner committed another photo meanwhile: the copy is not anyone's photo.
    const removed = await bucket.remove(changed > 0 ? [oldPath] : [newPath]);
    if (removed.error) throw removed.error;
    if (changed > 0) moved += 1;
  }

  let removed = 0;
  const { data: folders, error: listError } = await bucket.list('', { limit: 1000 });
  if (listError) throw listError;
  for (const folder of folders) {
    if (!/^[0-9a-f-]{36}$/.test(folder.name)) continue;
    const { data: files, error: filesError } = await bucket.list(folder.name, { limit: 1000 });
    if (filesError) throw filesError;
    const paths = files.map((f) => `${folder.name}/${f.name}`).filter(isLegacyPhotoPath);
    if (paths.length === 0) continue;
    const gone = await bucket.remove(paths);
    if (gone.error) throw gone.error;
    removed += paths.length;
  }
  return { moved, removed };
}

// `pnpm admin:remove-photo <publicId>` after a report review (docs/SPEC_V2.md §5.3): deletes the
// current photo and empties photo_path. Report copies stay until their 30 days end. Returns false
// if the profile had no photo.
export async function removeProfilePhoto(admin: Admin, publicId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('profiles')
    .select('photo_path')
    .eq('public_id', publicId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No profile with public id ${publicId}`);
  if (!data.photo_path) return false;

  const removed = await admin.storage.from(PHOTO_BUCKET).remove([data.photo_path]);
  if (removed.error) throw removed.error;
  // Only if the owner has not committed another photo meanwhile.
  const updated = await admin
    .from('profiles')
    .update({ photo_path: null, photo_hidden_at: null })
    .eq('public_id', publicId)
    .eq('photo_path', data.photo_path);
  if (updated.error) throw updated.error;
  return true;
}
