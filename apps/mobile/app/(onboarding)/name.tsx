import { containsContact } from '@shared/profanity.ts';
import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@shared/profile.ts';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useProfile } from '@/features/account/useProfile';
import { SignupField } from '@/features/onboarding/SignupField';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { SIGNUP_FONT_SCALE, useSignupLook } from '@/features/onboarding/look';
import { useGoOnce } from '@/features/onboarding/useGoOnce';
import { tr } from '@/i18n/tr';
import { maxLengthFor } from '@/lib/textLimit';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

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
  // K-34: no phone, e-mail, username or link; the server checks the same.
  const contact = containsContact(name);
  const valid = length >= DISPLAY_NAME_MIN && length <= DISPLAY_NAME_MAX && !contact;
  const look = useSignupLook();

  // The profile went: the photo step is the only way on.
  if (extrasPending) return <Redirect href="/extras" />;

  return (
    <SignupStep
      step="name"
      testID="signup-name-step"
      title={tr.signup.nameTitle}
      body={tr.signup.nameBody}
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
      <Text
        maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
        style={[
          SIGNUP_TYPE.label,
          { color: look.muted, marginTop: SIGNUP.labelTop, marginBottom: SIGNUP.labelGap },
        ]}
      >
        {tr.signup.nameLabel}
      </Text>
      <SignupField
        testID="signup-name"
        accessibilityLabel={tr.signup.nameLabel}
        placeholder={tr.signup.namePlaceholder}
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (nameError) useOnboardingStore.setState({ nameError: null });
        }}
        error={contact ? tr.errors.contact_not_allowed : null}
        counter={`${length}/${DISPLAY_NAME_MAX}`}
        maxLength={maxLengthFor(name, DISPLAY_NAME_MAX)}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
      />
      <View style={{ marginTop: SIGNUP.noteTop }}>
        <Text
          maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
          style={[SIGNUP_TYPE.note, { color: look.muted }]}
        >
          {tr.signup.nameHint}
        </Text>
      </View>
    </SignupStep>
  );
}
