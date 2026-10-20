// A table (docs/SPEC_V4.md §4.E): its icon (K-45) is one of the 100 of content/table-icons.json,
// generated into tableIcons.ts by `pnpm seed`; the server stores the id and checks it against the
// same list (public.table_icons).
import { ALIAS_REROLLS_PER_CHECKIN } from './rooms.ts';
import { TABLE_ICONS } from './tableIcons.ts';

// The owner draws a new table name this many times per table (today's check-in rule, per table).
export const TABLE_NAME_REROLLS = ALIAS_REROLLS_PER_CHECKIN;

// At most this many phones at a table (§4.E), whichever road they came by: a request whose phones
// would go over it is table_full, at the request and again at the accept. SQL: private.max_table_phones().
export const MAX_TABLE_PHONES = 12;

const ICON_IDS: ReadonlySet<string> = new Set(TABLE_ICONS.map((icon) => icon.id));

export function isTableIcon(value: unknown): value is string {
  return typeof value === 'string' && ICON_IDS.has(value);
}
