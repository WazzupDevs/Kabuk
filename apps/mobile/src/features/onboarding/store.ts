import type { Gender } from '@shared/gender.ts';
import { create } from 'zustand';

// Sign-up = profile (docs/SPEC_V3.md §3), state that lives only on the phone:
// - consented: the terms and KVKK versions accepted on "Başlamadan önce", the first step, before
//   the phone (K-33). They are sent with the profile (account/complete-onboarding) as before; after
//   an app restart they are asked again after the code.
// - name, birthDate: the profile steps' answers; the gender step sends them all in one call, they
//   are cleared when the photo step ends.
// - extrasPending: complete-onboarding succeeded and the optional photo step is still open, so the
//   gate keeps the onboarding screens until it is done. After an app restart the step is skipped.
// - underAge: the server deleted the account (under 18); the first screen says why once.
// - gender: the answer just given at sign-up, for the photo step's note (docs/SPEC_V3.md §23.D);
//   never sent anywhere else.
type OnboardingState = {
  consented: { terms: string; kvkk: string } | null;
  name: string;
  birthDate: string | null;
  extrasPending: boolean;
  underAge: boolean;
  gender: Gender | null;
};

export const useOnboardingStore = create<OnboardingState>(() => ({
  consented: null,
  name: '',
  birthDate: null,
  extrasPending: false,
  underAge: false,
  gender: null,
}));
