import type { Participation } from '@shared/profile.ts';

import { tr } from '@/i18n/tr';

// The hint under "Anonim" / "Profilimle", chosen for each room (docs/SPEC_V3.md §5.4). `member`:
// "Bu masadayım" with this table's alias, where the room's phones see this phone (§22.C).
export function participationHint(
  mode: Participation,
  hasName: boolean,
  member?: { alias: string },
): string {
  if (mode === 'anonymous') {
    return member
      ? tr.participation.memberAnonymousHint(member.alias)
      : tr.participation.anonymousHint;
  }
  if (!hasName) return tr.participation.profileNeedsName;
  return member ? tr.participation.memberProfileHint : tr.participation.profileHint;
}
