import AsyncStorage from '@react-native-async-storage/async-storage';
import { dehydrate, hydrate, type Query, type QueryClient } from '@tanstack/react-query';

import { keptQuery } from './keptQuery';

// The reads a screen opens with, kept on the phone (the owner's call, 21 Kasım; docs/decisions/
// onbellek.md): a screen opens at once with what was last read and brings it up to date behind
// it, as Telegram Android opens from its own store; the loader shows only on a first opening with
// nothing kept. Only the queries listed here are kept, only for the signed-in account, under its
// own key; an account change and a sign-out wipe them (features/auth/session.ts, signOut.ts).
// Never kept: another person's profile (dropped as soon as no screen shows it, audit M10-02), a
// table, a game, the semt room, a chat's messages (the DM's own cache is dmCache.ts) and anything
// not listed. The phone's backup never holds them (app.json → android.allowBackup: false).

const PREFIX = 'skall.queries.v1.';
// Older than this, a kept read is not shown (the next read replaces it anyway).
export const KEPT_MAX_AGE_MS = 24 * 60 * 60_000;
const SAVE_AFTER_MS = 1000;

function storageKey(userId: string): string {
  return PREFIX + userId;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let unsubscribe: (() => void) | undefined;

// The own profile's public id, read from the account's profile query (['profile', userId]).
function ownPublicIdOf(client: QueryClient, userId: string): string | null {
  const own = client.getQueryData<{ public_id?: string | null }>(['profile', userId]);
  return own?.public_id ?? null;
}

// Puts the account's kept reads into memory (never over a newer one), then keeps saving them while
// the account is signed in. Called as an account signs in or the app starts signed in.
export async function startKeptQueries(client: QueryClient, userId: string): Promise<void> {
  stopKeptQueries();
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (raw) {
      const kept = JSON.parse(raw) as { at: number; state: Parameters<typeof hydrate>[1] };
      if (Date.now() - kept.at < KEPT_MAX_AGE_MS) hydrate(client, kept.state);
    }
  } catch {
    // Unreadable or storage away: the screens read from the network as before.
  }
  const save = () => {
    saveTimer = undefined;
    const own = ownPublicIdOf(client, userId);
    const state = dehydrate(client, {
      shouldDehydrateQuery: (q: Query) =>
        q.state.status === 'success' && keptQuery(q.queryKey, own),
    });
    void AsyncStorage.setItem(storageKey(userId), JSON.stringify({ at: Date.now(), state })).catch(
      () => undefined,
    );
  };
  unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    if (!keptQuery(event.query.queryKey, ownPublicIdOf(client, userId))) return;
    if (saveTimer === undefined) saveTimer = setTimeout(save, SAVE_AFTER_MS);
  });
}

export function stopKeptQueries(): void {
  unsubscribe?.();
  unsubscribe = undefined;
  if (saveTimer !== undefined) clearTimeout(saveTimer);
  saveTimer = undefined;
}

// Every account's kept reads off the phone: an account change, a sign-out, an account deleted.
export async function clearKeptQueries(): Promise<void> {
  stopKeptQueries();
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
  } catch {
    // Storage away: the next account's key carries its own id anyway.
  }
}
