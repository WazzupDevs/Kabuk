// Gender and the asymmetric anonymity rule (docs/SPEC_V3.md §23.D, rule 12). The gender is asked once
// at sign-up and shown to nobody; it only decides whether the game flow (a join request, "Masanı
// lobiye aç", "Bu masadayım") offers the anonymous choice, and what the server accepts. "Masanla oyna"
// is not the game flow, and the venue chat keeps its own choice for everyone.
export const GENDERS = ['female', 'male', 'unspecified'] as const;
export type Gender = (typeof GENDERS)[number];

// A woman chooses anonymous or with the profile; a man and "Belirtmek istemiyorum" always join with
// the profile.
export function mayStayAnonymous(gender: Gender): boolean {
  return gender === 'female';
}

// How the person sits at a table with the check-in's identity (docs/SPEC_V4.md §4.D, rules 4 and
// 12; the server's seat identity): a woman as her check-in chose, a man and "Belirtmek istemiyorum"
// always with the profile, whatever the check-in says. An unknown gender (undefined: the own profile
// on its way; null: an account from before the gender step) counts as with the profile, so a screen
// never promises an anonymity the server will not give (audit VEN-1, 28 Ekim).
export function seatsAnonymously(
  identity: 'anonymous' | 'profiled',
  gender: Gender | null | undefined,
): boolean {
  return identity === 'anonymous' && gender === 'female';
}

// Why the server refuses a game-flow entry with this participation, or null. An account from
// before the gender step answers the one-time question first (gender_required), whatever it chose. A
// profiled entry still needs a visible photo (photo_required, checked after this).
export function participationError(
  gender: Gender | null,
  profiled: boolean,
): 'gender_required' | 'anonymous_not_allowed' | null {
  if (gender === null) return 'gender_required';
  if (profiled) return null;
  return mayStayAnonymous(gender) ? null : 'anonymous_not_allowed';
}

// What a game-flow sheet shows (docs/SPEC_V3.md §23.D; canvas: Faz 3 · 23.2): a woman's choice, the
// profile that goes for a man and "Belirtmek istemiyorum", or the one-time gender question for an
// account from before the step. `gender` is undefined until the own profile answers: the choice
// stays, and the server's anonymous_not_allowed (`refused`) turns it into the profile, never into a
// profiled entry by itself. gender_required asks the question whatever the phone knew.
export type GameFlowView = 'choice' | 'profile' | 'gender';

export function gameFlowView(
  gender: Gender | null | undefined,
  refused: 'anonymous_not_allowed' | 'gender_required' | null,
): GameFlowView {
  if (refused === 'gender_required' || gender === null) return 'gender';
  if (refused === 'anonymous_not_allowed') return 'profile';
  if (gender === undefined) return 'choice';
  return mayStayAnonymous(gender) ? 'choice' : 'profile';
}
