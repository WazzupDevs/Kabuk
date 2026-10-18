import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { Input } from '@/components/Input';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { useFriend } from '@/features/onboarding/useFriend';
import { useGoOnce } from '@/features/onboarding/useGoOnce';
import { tr } from '@/i18n/tr';
import { greeting } from '@/lib/signupFriend';

// The display name, step 4/7. Kept on the phone until the gender step sends the profile; if the
// server turns it down then, the phone comes back here and the step says why until it changes.
export default function NameStep() {
  const profile = useProfile();
  const extrasPending = useOnboardingStore((s) => s.extrasPending);
  const nameError = useOnboardingStore((s) => s.nameError);
  const { go, going } = useGoOnce();
  const [name, setName] = useState(
    () => useOnboardingStore.getState().name || profile.data?.display_name || '',
  );
  const length = [...name.trim()].length;
  const valid = length >= DISPLAY_NAME_MIN && length <= DISPLAY_NAME_MAX;
  const friend = useFriend();
  const bubble = greeting(name, valid, { named: tr.signup.hello, plain: tr.signup.helloPlain });

  // The profile went: the photo step is the only way on.
  if (extrasPending) return <Redirect href="/extras" />;

  return (
    <SignupStep
      step="name"
      testID="signup-name-step"
      title={tr.signup.nameTitle}
      body={tr.signup.nameBody}
      friend={{ ...friend, bubble }}
      error={nameError}
      action={{
        testID: 'name-continue',
        label: tr.signup.continue,
        disabled: !valid,
        loading: going,
        onPress: () =>
          go(() => {
            useOnboardingStore.setState({ name: name.trim() });
            router.push('/birth');
          }),
      }}
    >
      <Input
        testID="signup-name"
        label={tr.signup.nameLabel}
        hint={tr.signup.nameHint}
        placeholder={tr.signup.namePlaceholder}
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (nameError) useOnboardingStore.setState({ nameError: null });
        }}
        maxLength={DISPLAY_NAME_MAX}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
        onFocus={friend.onFocus}
        onBlur={friend.onBlur}
      />
    </SignupStep>
  );
}
