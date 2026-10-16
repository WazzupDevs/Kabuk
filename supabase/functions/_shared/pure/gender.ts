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

// Why the server refuses a game-flow entry with this participation, or null. A profiled entry still
// needs a visible photo (photo_required, checked after this). An empty gender passes as before the
// rule until the app asks for it (step 23.2's client part).
export function participationError(
  gender: Gender | null,
  profiled: boolean,
): 'anonymous_not_allowed' | null {
  if (profiled || gender === null) return null;
  return mayStayAnonymous(gender) ? null : 'anonymous_not_allowed';
}
