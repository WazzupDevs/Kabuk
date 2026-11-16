// DM yönetimi (docs/SPEC_V4.md §4.X): pinning, archiving, clearing a conversation and editing
// one's own message. The SQL functions (dm_thread_pref, dm_edit) apply the same limits, passed in
// by the dm function; the integration tests (supabase/tests/dmManage.test.ts) check that both agree.

// At most this many pinned conversations per account; one more answers pin_limit.
export const DM_PIN_MAX = 5;

// One's own message can be edited this long after it was sent, by the server's clock; later
// answers edit_expired.
export const DM_EDIT_WINDOW_MS = 15 * 60 * 1000;

// Whether the edit window of a message sent at `sentAt` is still open at `now` (for the app's
// menu; the server decides with its own clock).
export function canEditDm(sentAt: string, now: number): boolean {
  const at = Date.parse(sentAt);
  return Number.isFinite(at) && now - at <= DM_EDIT_WINDOW_MS;
}

// Edits per account per window (dm_edit_rate_hit, asked before dm_edit; over it: rate_limited).
export const DM_EDIT_RATE = { windowSeconds: 60, windowMax: 10 } as const;

// The pinned conversations first, the last pinned on top (the project owner's decision, 16 Kasım);
// the rest
// keep the order they came in (newest conversation first). An archived conversation is never
// pinned (dm_thread_prefs' check), so its pinnedAt is null.
export function pinnedFirst<T extends { pinnedAt: string | null }>(threads: readonly T[]): T[] {
  const pinned = threads
    .filter((t) => t.pinnedAt !== null)
    .sort((a, b) => Date.parse(b.pinnedAt ?? '') - Date.parse(a.pinnedAt ?? ''));
  return [...pinned, ...threads.filter((t) => t.pinnedAt === null)];
}

// The Arşivlenenler row's count: every unread message in the archived conversations.
export function archivedUnread(
  threads: readonly { archived: boolean; unreadCount: number }[],
): number {
  return threads.reduce((sum, t) => sum + (t.archived ? Math.max(0, t.unreadCount) : 0), 0);
}
