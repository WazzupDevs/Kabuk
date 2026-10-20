// Aktiviteler → Geçmiş (docs/SPEC_V4.md §4.C, K-15; v44: .hlist): the caller's play history under
// day headings, each record with the result of its game.

// The heading of a record, by calendar day in the phone's time zone (as Mesajlar's stamps): today,
// yesterday, the rest of the last seven days, then everything earlier.
export type HistoryDay = 'today' | 'yesterday' | 'week' | 'earlier';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;

function startOfDay(t: Date): number {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}

export function historyDay(iso: string, now: Date): HistoryDay {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < WEEK_DAYS) return 'week';
  return 'earlier';
}

// Newest-first records under their headings, in the same order; a day with nothing has no heading.
export function groupHistory<T extends { played_at: string }>(
  rows: readonly T[],
  now: Date,
): { day: HistoryDay; rows: T[] }[] {
  const groups: { day: HistoryDay; rows: T[] }[] = [];
  for (const row of rows) {
    const day = historyDay(row.played_at, now);
    const last = groups.at(-1);
    if (last?.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  }
  return groups;
}

// The chip of a record (v43's words; the 4.6 games bring "Buldun" and "2. oldun"): the caller's
// last result of the record's game in that room (game_results: own rows only), or "Bitti" for
// Sohbet kartları, which has no winner. A chat, a game without a winner or a record without a room
// has none.
export type HistoryResult = 'won' | 'lost' | 'done';

export function historyResult(
  record: { room_id: string | null; concept: string },
  results: readonly {
    room_id: string | null;
    concept: string;
    won: boolean | null;
    completed_at: string;
  }[],
): HistoryResult | null {
  if (record.concept === 'sohbet') return 'done';
  if (record.room_id === null) return null;
  let last: { won: boolean | null; at: number } | null = null;
  for (const r of results) {
    if (r.room_id !== record.room_id || r.concept !== record.concept) continue;
    const at = Date.parse(r.completed_at);
    if (last === null || at > last.at) last = { won: r.won, at };
  }
  if (last === null || last.won === null) return null;
  return last.won ? 'won' : 'lost';
}
