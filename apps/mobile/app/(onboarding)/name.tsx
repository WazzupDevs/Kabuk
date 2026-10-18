import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { router } from 'expo-router';
import { useState } from 'react';

import { Input } from '@/components/Input';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { tr } from '@/i18n/tr';

// The display name, step 4/7. Kept on the phone until the gender step sends the profile.
export default function NameStep() {
  const profile = useProfile();
  const [name, setName] = useState(
    () => useOnboardingStore.getState().name || profile.data?.display_name || '',
  );
  const length = [...name.trim()].length;
  const valid = length >= DISPLAY_NAME_MIN && length <= DISPLAY_NAME_MAX;

  return (
    <SignupStep
      step="name"
      testID="signup-name-step"
      title={tr.signup.nameTitle}
      body={tr.signup.nameBody}
      action={{
        testID: 'name-continue',
        label: tr.signup.continue,
        disabled: !valid,
        onPress: () => {
          useOnboardingStore.setState({ name: name.trim() });
          router.push('/birth');
        },
      }}
    >
      <Input
        testID="signup-name"
        label={tr.signup.nameLabel}
        hint={tr.signup.nameHint}
        placeholder={tr.signup.namePlaceholder}
        value={name}
        onChangeText={setName}
        maxLength={DISPLAY_NAME_MAX}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
      />
    </SignupStep>
  );
}
