// Bump a version when its text changes; users with an older accepted version are asked again.
// draft-1: Kabuk v1 (docs/SPEC_V3.md §3.3): birth date, required display name, venue chat.
// KVKK draft-2: the gender and its rule in the game flow (docs/SPEC_V3.md §23.D, §23.L).
export const CURRENT_TERMS_VERSION = 'draft-1';
export const CURRENT_KVKK_VERSION = 'draft-2';
// Explicit consent for location use at check-in (stored on the first check-in).
export const CURRENT_LOCATION_CONSENT_VERSION = 'draft-0';

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
