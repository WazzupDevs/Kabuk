import { checkBirthDate, composeBirthDate, istanbulToday, parseIsoDate } from '@shared/age.ts';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useProfile } from '@/features/account/useProfile';
import { ErrorLine } from '@/features/onboarding/ErrorLine';
import { InfoRows } from '@/features/onboarding/InfoRows';
import { SignupField } from '@/features/onboarding/SignupField';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { SIGNUP_FONT_SCALE, useSignupLook } from '@/features/onboarding/look';
import { useGoOnce } from '@/features/onboarding/useGoOnce';
import { signupError, useCompleteSignup } from '@/features/onboarding/useCompleteSignup';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { confirm } from '@/lib/overlayStore';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

// The birth date, step 5/7: never shown to anyone, the profile shows the age; it cannot be changed
// later (rule 11). "Devam" asks once more in a dialog with the age and the date (K-55, K-63; v46
// §6): Onayla goes on, Düzelt stays. The server decides under 18 when the profile is sent, after
// the gender step: it asks for the gender first (docs/arsiv/DECISIONS.md → "Faz 4 adım 4.3b").
export default function BirthStep() {
  const profile = useProfile();
  const name = useOnboardingStore((s) => s.name);
  const extrasPending = useOnboardingStore((s) => s.extrasPending);
  const { go, going } = useGoOnce();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = useCompleteSignup();
  const needsGender = profile.data?.has_gender !== true;

  // The profile went (Android's back from the photo step): the photo step is the only way on. Not
  // while this step sends it: its own success opens the photo step.
  if (extrasPending && submit.isIdle) return <Redirect href="/extras" />;
  if (!name) return <Redirect href="/name" />;
  if (profile.data?.has_birth_date === true) return <Redirect href="/gender" />;

  const filled = day !== '' && month !== '' && year.length === 4;
  const onContinue = () => {
    const birthDate = composeBirthDate(day, month, year);
    // A day after today or more than MAX_AGE years ago is not a birth date either (the server
    // refuses both); under 18 is asked like any date, the server decides it.
    const check = birthDate ? checkBirthDate(birthDate, istanbulToday(new Date())) : null;
    if (!birthDate || !check?.ok) {
      setError(tr.signup.birthInvalid);
      return;
    }
    setError(null);
    const date = parseIsoDate(birthDate);
    confirm({
      title: date ? tr.signup.birthConfirmTitle(date) : '',
      note: tr.signup.birthConfirmBody(check.age),
      tone: 'plain',
      confirmLabel: tr.signup.birthConfirm,
      cancelLabel: tr.signup.birthFix,
      testID: 'birth-confirm',
      onConfirm: () => {
        useOnboardingStore.setState({ birthDate });
        if (needsGender) go(() => router.push('/gender'));
        else submit.mutate(null);
      },
    });
  };

  return (
    <SignupStep
      step="birth"
      picture="birth"
      testID="signup-birth-step"
      title={tr.signup.birthTitle}
      onBack={() => router.back()}
      error={submit.isError && signupError(submit.error) ? errorMessage(submit.error) : null}
      action={{
        testID: 'birth-continue',
        label: tr.signup.continue,
        disabled: !filled,
        loading: submit.isPending || going,
        onPress: onContinue,
      }}
    >
      {/* KayitDogum `.fr3`: the day, the month and the year, 1 : 1 : 1.5, 10 apart. */}
      <View style={{ flexDirection: 'row', gap: SIGNUP.field.gap }}>
        <Field testID="birth-day" label={tr.signup.day} value={day} onChange={setDay} max={2} />
        <Field
          testID="birth-month"
          label={tr.signup.month}
          value={month}
          onChange={setMonth}
          max={2}
        />
        <Field
          testID="birth-year"
          label={tr.signup.year}
          value={year}
          onChange={setYear}
          max={4}
          wide
        />
      </View>
      {error ? <ErrorLine text={error} /> : null}
      <InfoRows
        items={[
          { icon: 'eyeOff', text: tr.signup.birthPrivate, sub: tr.signup.birthPrivateSub },
          { icon: 'lock', text: tr.signup.birthLocked },
          { icon: 'user', text: tr.signup.adultsOnly },
        ]}
      />
    </SignupStep>
  );
}

function Field({
  testID,
  label,
  value,
  onChange,
  max,
  wide = false,
}: {
  testID: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  wide?: boolean;
}) {
  const look = useSignupLook();
  return (
    // KayitDogum: the label over the field (13 / 600, 24 over it, 8 under).
    <View style={{ flex: wide ? 1.5 : 1 }}>
      <Text
        maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
        style={[
          SIGNUP_TYPE.label,
          { color: look.muted, marginTop: SIGNUP.labelTop, marginBottom: SIGNUP.labelGap },
        ]}
      >
        {label}
      </Text>
      <SignupField
        testID={testID}
        accessibilityLabel={label}
        keyboardType="number-pad"
        maxLength={max}
        value={value}
        onChangeText={onChange}
        centered
      />
    </View>
  );
}
