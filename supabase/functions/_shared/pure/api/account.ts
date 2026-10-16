import type { Gender } from '../gender.ts';

// Request and response shapes of the `account` Edge Function, shared with the mobile app.
// Consents and the profile in one call (docs/SPEC_V3.md §3.1). The display name and the birth date
// may be left out only when the profile already has them (re-consent after a text change); a set
// birth date cannot be changed. Under 18 the account is deleted and the answer is under_age.
// `gender` (docs/SPEC_V3.md §23.D) is written once like the birth date; until the app asks for it
// (step 23.2's client part) it may be left out.
export type CompleteOnboardingRequest = {
  action: 'complete-onboarding';
  termsVersion: string;
  kvkkVersion: string;
  displayName?: string;
  birthDate?: string;
  gender?: Gender;
};

// The one-time question for an account from before the gender step: written only while it is empty;
// a set gender is changed only by pnpm admin:set-gender.
export type SetGenderRequest = { action: 'set-gender'; gender: Gender };

export type DeleteAccountRequest = { action: 'delete' };

// null clears the token (sign-out).
export type RegisterPushRequest = { action: 'register-push'; token: string | null };

export type AccountRequest =
  CompleteOnboardingRequest | SetGenderRequest | DeleteAccountRequest | RegisterPushRequest;

export type AccountResponse = { ok: true };
