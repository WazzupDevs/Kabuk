// Teams (docs/SPEC_V3.md §22.B): a room has two sides, each its leader and up to 3 members. The SQL
// functions have their own copies of these numbers (private.max_side_phones,
// private.side_headcount); supabase/tests/teams.test.ts checks that they agree.
export const SIDES = ['owner', 'guest'] as const;
export type Side = (typeof SIDES)[number];

export const MAX_SIDE_PHONES = 4;

// A side's headcount: what the side declared at check-in (its first leader's table; a new leader
// keeps it) or its phones, whichever is larger. Tabu's mode and Sahtekar's seats come from it
// (step 22.3).
export function sideHeadcount(declared: number, phones: number): number {
  return Math.max(declared, phones);
}
