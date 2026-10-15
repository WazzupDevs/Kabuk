// `reveal` Edge Function, shared with the mobile app. The two-phone result reaches both phones
// through rooms.reveal_result and rooms.reveal_token, the same for both; with teams each phone reads
// its own matches with `matches` (docs/SPEC_V3.md §22.F).
export type RevealRequest =
  | { action: 'decide'; roomId: string; wantsMeet: boolean }
  | { action: 'finalize'; roomId: string }
  | { action: 'matches'; roomId: string };
export type RevealResponse = { ok: true };

// A phone this phone matched: its table session id, alias, the pair's emoji and, when it joined
// with its profile, the profile (no public_id).
export type RevealMatch = {
  sessionId: string;
  alias: string;
  emoji: string;
  profile: { displayName: string; age: number | null; photoUrl: string | null } | null;
};

// color: the room's, only with at least one match. unmatched: null during the window; from
// reveal_ends_at on, the other side's phones this phone did not match ("eşleşmedi", no reason).
export type RevealMatchesResponse = {
  color: string | null;
  matches: RevealMatch[];
  unmatched: { sessionId: string; alias: string }[] | null;
};
