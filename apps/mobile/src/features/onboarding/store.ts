import type { Gender } from '@shared/gender.ts';
import { create } from 'zustand';

// Sign-up = profile (docs/SPEC_V3.md §3), state that lives only on the phone:
// - consented: the terms and KVKK versions accepted on "Başlamadan önce", the first step, before
//   the phone (K-33). They are sent with the profile (account/complete-onboarding) as before; after
//   an app restart they are asked again after the code. The first screen clears them whenever it
//   comes into view.
// - name, birthDate: the profile steps' answers; the gender step sends them all in one call.
// - nameError: the server turned the display name down when the profile was sent; the name step
//   says why until the name changes.
// - extrasPending: complete-onboarding succeeded and the optional photo step is still open, so the
//   gate keeps the onboarding screens until it is done. After an app restart the step is skipped.
// - underAge: the server deleted the account (under 18); the first screen says why once.
// - gender: the answer just given at sign-up, for the photo step's note (docs/SPEC_V3.md §23.D);
//   never sent anywhere else.
export type OnboardingState = {
  consented: { terms: string; kvkk: string } | null;
  name: string;
  birthDate: string | null;
  nameError: string | null;
  extrasPending: boolean;
  underAge: boolean;
  gender: Gender | null;
};

const EMPTY: Omit<OnboardingState, 'underAge'> = {
  consented: null,
  name: '',
  birthDate: null,
  nameError: null,
  extrasPending: false,
  gender: null,
};

export const useOnboardingStore = create<OnboardingState>(() => ({ ...EMPTY, underAge: false }));

// Signing out (or the session dropping) and the end of sign-up clear everything the steps kept, so
// nothing carries over to the next account on this phone: above all not the consents, which the
// next person gives for themselves. underAge stays: it is set just before the under-18 sign-out and
// the first screen still has to say why.
export function resetOnboarding(): void {
  useOnboardingStore.setState((s) => ({ ...EMPTY, underAge: s.underAge }));
}
