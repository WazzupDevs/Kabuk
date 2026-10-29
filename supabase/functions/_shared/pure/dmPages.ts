// A conversation's cached pages (newest first, DM_PAGE_SIZE a page) kept current one change at a
// time, as Telegram Android keeps its chat (the owner's call, 29 Ekim): a new message, a tick that
// moved or a reaction reads only the newest page and puts it in place of the newest rows; the older
// pages stay as they are, and a row that did not change stays the very same object, so its bubble
// is not drawn again.
import type { DmPageRow } from './dmInbox.ts';

export type DmPage = readonly DmPageRow[];

const RANK: Record<string, number> = { sent: 0, delivered: 1, read: 2 };

function newerFirst(a: DmPageRow, b: DmPageRow): number {
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

function same(a: DmPageRow, b: DmPageRow): boolean {
  return (
    a.id === b.id &&
    a.body === b.body &&
    a.created_at === b.created_at &&
    a.from_me === b.from_me &&
    a.status === b.status &&
    JSON.stringify(a.reply_to) === JSON.stringify(b.reply_to) &&
    JSON.stringify(a.reactions) === JSON.stringify(b.reactions)
  );
}

// The newest page as just read, put in place: its rows replace the cached ones with the same id
// (a row that did not change keeps the cached object). A cached row the fresh page does not have
// stays only when it is older than every fresh row, the fresh page is full (`pageSize` rows) and
// the two pages share a row: it lies between the fresh page and the next one. With nothing shared
// (a copy from long ago, many messages since) rows may be missing between them, and the cached
// ones go; anything else the server no longer has. Own
// messages older than the newest one the fresh page shows read (or delivered) are read (or
// delivered) too: a tick only moves forward, by the other member's read and delivery marks
// (private.dm_status).
export function withNewestPage(
  pages: readonly DmPage[],
  fresh: DmPage,
  pageSize: number,
): DmPageRow[][] {
  const cached = pages[0] ?? [];
  const byId = new Map(cached.map((m) => [m.id, m]));
  const freshIds = new Set(fresh.map((m) => m.id));
  const oldest = fresh.reduce<DmPageRow | null>(
    (o, m) => (o === null || newerFirst(m, o) > 0 ? m : o),
    null,
  );
  const joined = cached.some((m) => freshIds.has(m.id));
  const between =
    fresh.length >= pageSize && oldest !== null && joined
      ? cached.filter((m) => !freshIds.has(m.id) && newerFirst(m, oldest) > 0)
      : [];
  const first = [
    ...fresh.map((row) => {
      const old = byId.get(row.id);
      return old && same(old, row) ? old : row;
    }),
    ...between,
  ].sort(newerFirst);
  const floor = statusFloor(fresh);
  return [first, ...pages.slice(1).map((p) => [...p])].map((page) =>
    page.map((m) => lifted(m, floor)),
  );
}

// An older page read again: the fresh rows, a row that did not change the cached object.
export function withSamePage(cached: DmPage, fresh: DmPage): DmPageRow[] {
  const byId = new Map(cached.map((m) => [m.id, m]));
  return fresh.map((row) => {
    const old = byId.get(row.id);
    return old && same(old, row) ? old : row;
  });
}

type Floor = { read: string | null; delivered: string | null };

// The newest own message the fresh page shows read, and the newest it shows delivered or read.
function statusFloor(fresh: DmPage): Floor {
  let read: string | null = null;
  let delivered: string | null = null;
  for (const m of fresh) {
    if (!m.from_me) continue;
    const rank = RANK[m.status ?? ''] ?? 0;
    if (rank >= 2 && (read === null || m.created_at > read)) read = m.created_at;
    if (rank >= 1 && (delivered === null || m.created_at > delivered)) delivered = m.created_at;
  }
  return { read, delivered };
}

function lifted(m: DmPageRow, floor: Floor): DmPageRow {
  if (!m.from_me) return m;
  const rank = RANK[m.status ?? ''] ?? 0;
  if (rank < 2 && floor.read !== null && m.created_at <= floor.read) {
    return { ...m, status: 'read' };
  }
  if (rank < 1 && floor.delivered !== null && m.created_at <= floor.delivered) {
    return { ...m, status: 'delivered' };
  }
  return m;
}
