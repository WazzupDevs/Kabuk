// Older messages of a chat, page by page (the table chat and the venue chat; the DM keeps its own
// pages in its infinite query, src/features/friends/queries.ts → useDmMessages). The newest page
// stays the chat's live query (read again on every broadcast); the older pages are the screen's
// alone: read once when the list reaches its top (ChatList → onReachOld), never read again, and
// gone with the screen.
//
// Both lists are oldest first. A page shorter than the page size is the chat's first message.

export type Dated = { id: string; at: string };

// The rows the screen draws: the older pages, then the newest page, each message once. `until`: the
// moment the first older page was read before (the oldest message of the newest page then); the
// newest page only moves forward, so once a full newest page starts after it, what lies between is
// unknown (`gap`: more than a page came between two reads) and the screen drops its older pages
// rather than show a hole.
export function mergeOlder<T>(
  newest: readonly T[],
  older: readonly T[],
  until: string | null,
  dated: (item: T) => Dated,
  pageSize: number,
): { rows: T[]; gap: boolean } {
  if (until === null) return { rows: [...newest], gap: false };
  const first = newest[0];
  const gap = first !== undefined && newest.length >= pageSize && dated(first).at > until;
  if (gap) return { rows: [...newest], gap };
  const seen = new Set(newest.map((m) => dated(m).id));
  return { rows: [...older.filter((m) => !seen.has(dated(m).id)), ...newest], gap };
}

// Where the next older page starts: before the oldest message the screen has, or nothing to read
// when the chat's first message is in already.
export function olderBefore<T>(
  newest: readonly T[],
  older: readonly T[],
  dated: (item: T) => Dated,
  pageSize: number,
  done: boolean,
): string | null {
  if (done) return null;
  if (older.length === 0 && newest.length < pageSize) return null;
  const oldest = older[0] ?? newest[0];
  return oldest === undefined ? null : dated(oldest).at;
}

// The older pages read again (a reaction moved on them, or a sender deleted one of them): page by
// page from `until` back to the oldest message the screen had (`oldestAt`), or to the chat's first
// message. What is no longer there (deleted, or gone after a day) falls out; nothing older than
// `oldestAt` is added beyond the last page read.
export async function rereadOlder<T>(
  read: (before: string) => Promise<T[]>,
  until: string,
  oldestAt: string,
  dated: (item: T) => Dated,
  pageSize: number,
): Promise<{ older: T[]; done: boolean }> {
  let older: T[] = [];
  let before = until;
  for (;;) {
    const page = await read(before);
    older = [...page, ...older];
    const first = page[0];
    if (page.length < pageSize || first === undefined) return { older, done: true };
    if (dated(first).at <= oldestAt) return { older, done: false };
    before = dated(first).at;
  }
}
