import { needsGender, needsProfile, type OnboardingState } from '@shared/consent.ts';

// Where a signed-in account goes after its consents: the profile steps (name, birth date, gender)
// for a new account, the one-time gender question for an account from before the gender step,
// else the photo step (docs/SPEC_V3.md §3, §23.D; v45 §1).
export function nextAfterConsents(
  profile: Pick<OnboardingState, 'display_name' | 'has_birth_date' | 'has_gender'>,
): '/name' | '/gender' | '/extras' {
  if (needsProfile(profile)) return '/name';
  if (needsGender(profile)) return '/gender';
  return '/extras';
}
