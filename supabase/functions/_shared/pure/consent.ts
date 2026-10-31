// Bump a version when its text changes; users with an older accepted version are asked again.
// draft-1: Kabuk v1 (docs/SPEC_V3.md §3.3): birth date, required display name, venue chat.
// KVKK draft-2: the gender and its rule in the game flow (docs/SPEC_V3.md §23.D, §23.L).
// KVKK draft-3: the capsule identity, table invites and the bell (docs/SPEC_V4.md §4.D, §4.G, §4.L);
// raised once, with the 4.5 client.
export const CURRENT_TERMS_VERSION = 'draft-1';
export const CURRENT_KVKK_VERSION = 'draft-3';
// Explicit consent for location use at check-in (stored on the first check-in).
// draft-0: the "açık rıza veriyorum" box of the check-in sheet.
// draft-1: no box; the text over "Konumumu kullan" says that pressing it is the consent (aura 31,
// docs/decisions/aura-31.md). An app from before still sends draft-0 for the box it showed.
export const CURRENT_LOCATION_CONSENT_VERSION = 'draft-1';
const ACCEPTED_LOCATION_CONSENT_VERSIONS: readonly string[] = ['draft-0', 'draft-1'];

export function acceptsLocationConsent(version: string): boolean {
  return ACCEPTED_LOCATION_CONSENT_VERSIONS.includes(version);
}

export type ConsentState = { terms_version: string; kvkk_version: string };

export function needsConsent(profile: ConsentState | null): boolean {
  return (
    profile === null ||
    profile.terms_version !== CURRENT_TERMS_VERSION ||
    profile.kvkk_version !== CURRENT_KVKK_VERSION
  );
}

// Sign-up = profile (docs/SPEC_V3.md §3): current consents, a display name, a birth date and the
// gender (§23.D). The client reads has_birth_date and has_gender, never the values themselves.
export type OnboardingState = ConsentState & {
  display_name: string | null;
  has_birth_date: boolean | null;
  has_gender: boolean | null;
};

export function needsProfile(
  profile: Pick<OnboardingState, 'display_name' | 'has_birth_date'>,
): boolean {
  return !profile.display_name || profile.has_birth_date !== true;
}

// An account from before the gender step: asked once, after the consents and the profile.
export function needsGender(profile: Pick<OnboardingState, 'has_gender'>): boolean {
  return profile.has_gender !== true;
}

export function needsOnboarding(profile: OnboardingState | null): boolean {
  return profile === null || needsConsent(profile) || needsProfile(profile) || needsGender(profile);
}
