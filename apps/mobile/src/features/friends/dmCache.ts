import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DmPageRow } from '@shared/dmInbox.ts';

// A conversation's newest page kept on the phone (Telegram Android opens a chat from its own
// database at once, then brings it up to date; the owner's call, 29 Ekim): opened again, even after
// the app was closed, a DM shows its messages at once and reads the server behind them. Only the
// signed-in account's own conversations, under its id; signing out (or another account) removes
// them all (features/auth/session.ts).
const PREFIX = 'skall.dm.v1:';
// The newest page (DM_PAGE_SIZE).
const KEEP = 50;
const WRITE_MS = 800;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

function key(userId: string, threadId: string): string {
  return `${PREFIX}${userId}:${threadId}`;
}

function isRows(value: unknown): value is DmPageRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as DmPageRow).id === 'string' &&
        typeof (m as DmPageRow).created_at === 'string',
    )
  );
}

export async function readDmCache(userId: string, threadId: string): Promise<DmPageRow[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key(userId, threadId));
    if (!raw) return null;
    const rows: unknown = JSON.parse(raw);
    return isRows(rows) ? rows : null;
  } catch {
    return null;
  }
}

// Written a moment after the page settles (a burst of ticks writes once).
export function writeDmCache(userId: string, threadId: string, rows: readonly DmPageRow[]): void {
  const k = key(userId, threadId);
  const pending = timers.get(k);
  if (pending) clearTimeout(pending);
  timers.set(
    k,
    setTimeout(() => {
      timers.delete(k);
      void AsyncStorage.setItem(k, JSON.stringify(rows.slice(0, KEEP))).catch(() => undefined);
    }, WRITE_MS),
  );
}

// The copies of conversations that are no longer the account's (a friendship ended, a block): the
// privacy policy says a DM goes when the friendship does, the phone's copy with it. `keep` is every
// thread the inbox has (it lists them all).
export async function pruneDmCache(userId: string, keep: ReadonlySet<string>): Promise<void> {
  const mine = `${PREFIX}${userId}:`;
  try {
    const gone = (await AsyncStorage.getAllKeys()).filter(
      (k) => k.startsWith(mine) && !keep.has(k.slice(mine.length)),
    );
    for (const k of gone) {
      const pending = timers.get(k);
      if (pending) clearTimeout(pending);
      timers.delete(k);
    }
    if (gone.length > 0) await AsyncStorage.multiRemove(gone);
  } catch {
    // Storage away: the next inbox read tries again.
  }
}

export async function clearDmCache(): Promise<void> {
  timers.forEach(clearTimeout);
  timers.clear();
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
  } catch {
    // Nothing to clear, or storage away: the next account's keys carry its own id anyway.
  }
}
