import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../supabase/functions/_shared/pure/database.ts';
import { deleteProfilePhotos } from './photos.ts';

// The account function's `delete` action, step for step, with a secret-key (admin) client: used
// by `admin:delete` (a deletion request by e-mail) and by a ban after the phone hash is kept.
// Deleting the auth user cascades to every row of the account (account.test.ts checks the foreign
// keys). The PostHog person is queued (analytics_deletions): admin:delete and admin:ban delete it
// with the PostHog key of this machine and take it off the queue; without the key the account
// function deletes it with the next account deletion (_shared/posthog.ts → drainAnalyticsDeletions).
// Takes the account off the PostHog deletion queue once its person is deleted here.
export async function forgetAnalyticsDeletion(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { error } = await admin.from('analytics_deletions').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function deleteAccount(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  // End the table first so its rooms close or go back to waiting for the other table.
  const ended = await admin.rpc('end_table_session', { target_user_id: userId });
  if (ended.error) throw ended.error;

  // Photos before the account: the profile row names the files.
  await deleteProfilePhotos(admin, userId);

  const queued = await admin
    .from('analytics_deletions')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (queued.error) throw queued.error;

  const deletion = await admin.auth.admin.deleteUser(userId);
  if (deletion.error) throw deletion.error;
}
