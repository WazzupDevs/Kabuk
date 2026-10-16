// The table's end (docs/SPEC_V3.md §23.G; canvas: Faz 3 · 23.3 → masa sonu): one row per phone of
// the other side this phone sat with, and what its "Arkadaş ekle" says. Built on the phone from what
// it saw at the table and from its own history records; the server sends no profile after the close
// (rule 4).
// - 'add': a record and no press yet;
// - 'pressed': this phone pressed; nothing tells it whether the other one did (rule 5) until they
//   are friends;
// - 'friends': the two accounts are friends ("Arkadaş oldunuz · Mesajlaş");
// - 'short': no record, they sat together for less than ENCOUNTER_MIN_MINUTES (no button).
export type PairFriendState = 'add' | 'pressed' | 'friends' | 'short';

export type PairRecord = { friend_action_at: string | null };

export function pairFriendState(record: PairRecord | undefined, friends: boolean): PairFriendState {
  if (!record) return 'short';
  if (friends) return 'friends';
  return record.friend_action_at === null ? 'add' : 'pressed';
}

// Where a phone goes once it is no longer at a two-sided table: the table's end when it has
// something to show there. A phone that left on its own sees it only with at least one record
// (the owner's answer 3); a table that closed under it shows its end to every phone of a side that
// had the other side, records or not, since it says why there is no button.
export function showsTableEnd(input: {
  hadOtherSide: boolean;
  leftOnItsOwn: boolean;
  records: number;
}): boolean {
  if (!input.hadOtherSide) return false;
  return input.leftOnItsOwn ? input.records > 0 : true;
}
