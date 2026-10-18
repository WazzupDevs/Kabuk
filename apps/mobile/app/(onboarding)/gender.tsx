import { needsProfile } from '@shared/consent.ts';
import type { Gender } from '@shared/gender.ts';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { GenderChoice, useSetGender } from '@/features/account/GenderChoice';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { signupError, useCompleteSignup } from '@/features/onboarding/useCompleteSignup';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

// The gender (docs/SPEC_V3.md §23.D), shown to nobody and set once (rule 12). At sign-up it is step
// 6/7 and sends the profile; for an account from before the gender step it is the one-time
// question after the new KVKK notice, never skipped (canvas: Faz 3 · 23.2), and saving opens the
// app.
export default function GenderStep() {
  const profile = useProfile();
  const signingUp = !profile.data || needsProfile(profile.data);
  const name = useOnboardingStore((s) => s.name);
  const [gender, setGender] = useState<Gender | null>(null);
  const submit = useCompleteSignup();
  const save = useSetGender();
  const pending = submit.isPending || save.isPending;

  if (signingUp && !name) return <Redirect href="/name" />;

  const error = signingUp
    ? submit.isError && signupError(submit.error)
      ? errorMessage(submit.error)
      : null
    : save.isError
      ? errorMessage(save.error)
      : null;

  return (
    <SignupStep
      step={signingUp ? 'gender' : undefined}
      testID="signup-gender-step"
      title={signingUp ? tr.signup.genderLabel : tr.signup.genderGateTitle}
      body={signingUp ? tr.signup.genderHint : tr.signup.genderGateBody}
      onBack={signingUp ? () => router.back() : undefined}
      error={error}
      action={{
        testID: signingUp ? 'gender-continue' : 'gender-save',
        label: signingUp ? tr.signup.continue : tr.signup.genderSave,
        disabled: gender === null,
        loading: pending,
        onPress: () => {
          if (!gender) return;
          if (signingUp) submit.mutate(gender);
          else save.mutate(gender);
        },
      }}
    >
      <GenderChoice value={gender} onChange={setGender} disabled={pending} bare={signingUp} />
    </SignupStep>
  );
}
