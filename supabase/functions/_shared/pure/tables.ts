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

// The table invite (docs/SPEC_V4.md §4.G): valid this long; an owner sends at most this many in an
// hour (more write nothing, and answer the same: rule 5's silence).
export const TABLE_INVITE_TTL_SECONDS = 120;
export const MAX_TABLE_INVITES_PER_HOUR = 30;

const ICON_IDS: ReadonlySet<string> = new Set(TABLE_ICONS.map((icon) => icon.id));

export function isTableIcon(value: unknown): value is string {
  return typeof value === 'string' && ICON_IDS.has(value);
}
