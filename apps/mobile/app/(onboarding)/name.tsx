import { containsContact } from '@shared/profanity.ts';
import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { router } from 'expo-router';
import { useState } from 'react';

import { Input } from '@/components/Input';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { useFriend } from '@/features/onboarding/useFriend';
import { tr } from '@/i18n/tr';
import { greeting } from '@/lib/signupFriend';

// The display name, step 4/7. Kept on the phone until the gender step sends the profile.
export default function NameStep() {
  const profile = useProfile();
  const [name, setName] = useState(
    () => useOnboardingStore.getState().name || profile.data?.display_name || '',
  );
  const length = [...name.trim()].length;
  // K-34: no phone, e-mail, username or link; the server checks the same.
  const contact = containsContact(name);
  const valid = length >= DISPLAY_NAME_MIN && length <= DISPLAY_NAME_MAX && !contact;
  const friend = useFriend();
  const bubble = greeting(name, valid, { named: tr.signup.hello, plain: tr.signup.helloPlain });

  return (
    <SignupStep
      step="name"
      testID="signup-name-step"
      title={tr.signup.nameTitle}
      body={tr.signup.nameBody}
      friend={{ ...friend, bubble }}
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
        error={contact ? tr.errors.contact_not_allowed : null}
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
