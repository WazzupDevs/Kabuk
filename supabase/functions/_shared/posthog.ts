import type { Db } from './auth.ts';
import {
  POSTHOG_DEFAULT_API_HOST,
  posthogPersonDeleteUrl,
  posthogPersonIds,
  posthogPersonLookupUrl,
} from './pure/analytics.ts';

const ANALYTICS_DELETIONS_PER_CALL = 5;

// Deletes the PostHog person (and events) of a deleted account. Needs the function secrets
// POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID (POSTHOG_HOST optional); without them, nothing.
export async function deletePosthogPerson(userId: string): Promise<void> {
  const key = Deno.env.get('POSTHOG_PERSONAL_API_KEY');
  const projectId = Deno.env.get('POSTHOG_PROJECT_ID');
  if (!key || !projectId) return;
  const host = Deno.env.get('POSTHOG_HOST') ?? POSTHOG_DEFAULT_API_HOST;
  const headers = { authorization: `Bearer ${key}` };

  const lookup = await fetch(posthogPersonLookupUrl(host, projectId, userId), {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  if (!lookup.ok) throw new Error(`posthog lookup failed (${lookup.status})`);
  for (const personId of posthogPersonIds(await lookup.json())) {
    const res = await fetch(posthogPersonDeleteUrl(host, projectId, personId), {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`posthog delete failed (${res.status})`);
  }
}

// Tries a PostHog deletion a few times, a moment apart (B3: a single failure used to keep the
// person). Throws the last error.
async function deleteWithRetry(userId: string): Promise<void> {
  const waits = [1000, 3000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await deletePosthogPerson(userId);
    } catch (err) {
      const wait = waits[attempt];
      if (wait === undefined) throw err;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

// The queue of PostHog deletions (analytics_deletions): the deleted account's id first, then the
// oldest earlier ones that failed, at most `ANALYTICS_DELETIONS_PER_CALL` per call. A deletion that
// succeeds (or has nothing to do without the PostHog secrets) leaves the queue; one that fails stays
// for the next account deletion, at most 30 days (delete_old_analytics_deletions).
export async function drainAnalyticsDeletions(db: Db, userId: string): Promise<void> {
  const queued = await db
    .from('analytics_deletions')
    .select('user_id')
    .neq('user_id', userId)
    .order('created_at')
    .limit(ANALYTICS_DELETIONS_PER_CALL - 1);
  if (queued.error) throw new Error(`analytics_deletions read failed (${queued.error.code})`);
  let failed: unknown = null;
  for (const id of [userId, ...queued.data.map((r) => r.user_id)]) {
    try {
      await deleteWithRetry(id);
      await forgetAnalyticsDeletion(db, id);
    } catch (err) {
      failed ??= err;
    }
  }
  // The first failure goes to the function's error log; the rows stay queued.
  if (failed) throw failed;
}

export async function forgetAnalyticsDeletion(db: Db, userId: string): Promise<void> {
  const { error } = await db.from('analytics_deletions').delete().eq('user_id', userId);
  if (error) throw new Error(`analytics_deletions delete failed (${error.code})`);
}

// Puts the account on the deletion queue before it goes (the id is all that is kept).
export async function queueAnalyticsDeletion(db: Db, userId: string): Promise<void> {
  const { error } = await db
    .from('analytics_deletions')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) throw new Error(`analytics_deletions write failed (${error.code})`);
}
