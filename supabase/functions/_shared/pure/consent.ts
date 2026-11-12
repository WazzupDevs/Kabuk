// Bump a version when its text changes; users with an older accepted version are asked again.
// draft-1: Kabuk v1 (docs/SPEC_V3.md §3.3): birth date, required display name, venue chat.
// KVKK draft-2: the gender and its rule in the game flow (docs/SPEC_V3.md §23.D, §23.L).
// KVKK draft-3: the capsule identity, table invites and the bell (docs/SPEC_V4.md §4.D, §4.G, §4.L);
// raised once, with the 4.5 client.
// 2026-11: the full texts (docs/legal/, docs/decisions/yasal-metinler.md): the terms with the
// community rules; the KVKK notice with every legal ground named and none of them consent.
export const CURRENT_TERMS_VERSION = '2026-11';
export const CURRENT_KVKK_VERSION = '2026-11';
// The location notice at check-in (which text the person was shown; stored on the first check-in).
// draft-0: the "açık rıza veriyorum" box of the check-in sheet.
// draft-1: no box; the text over "Konumumu kullan" (aura 31, docs/decisions/aura-31.md). An app
// from before still sends draft-0 for the box it showed. Since 12 Kasım the text is a notice and
// not a consent: the location is needed for the check-in itself (KVKK m. 5/2-c, the owner's call,
// docs/decisions/yasal-metinler.md).
// 2026-11: that notice. The record says which text the person saw; the older values are still
// taken from installed apps.
export const CURRENT_LOCATION_CONSENT_VERSION = '2026-11';
const ACCEPTED_LOCATION_CONSENT_VERSIONS: readonly string[] = ['draft-0', 'draft-1', '2026-11'];

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
