import { composeBirthDate } from '@shared/age.ts';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { signupError, useCompleteSignup } from '@/features/onboarding/useCompleteSignup';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

// The birth date, step 5/7: never shown to anyone, the profile shows the age; it cannot be changed
// later (rule 11). The server decides under 18 when the profile is sent, after the gender step: it
// asks for the gender first (docs/DECISIONS.md → "Faz 4 adım 4.3b").
export default function BirthStep() {
  const profile = useProfile();
  const name = useOnboardingStore((s) => s.name);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = useCompleteSignup();
  const needsGender = profile.data?.has_gender !== true;

  if (!name) return <Redirect href="/name" />;
  if (profile.data?.has_birth_date === true) return <Redirect href="/gender" />;

  const filled = day !== '' && month !== '' && year.length === 4;
  const onContinue = () => {
    const birthDate = composeBirthDate(day, month, year);
    if (!birthDate) {
      setError(tr.signup.birthInvalid);
      return;
    }
    setError(null);
    useOnboardingStore.setState({ birthDate });
    if (needsGender) router.push('/gender');
    else submit.mutate(null);
  };

  return (
    <SignupStep
      step="birth"
      testID="signup-birth-step"
      title={tr.signup.birthTitle}
      body={tr.signup.birthBody}
      onBack={() => router.back()}
      error={submit.isError && signupError(submit.error) ? errorMessage(submit.error) : null}
      action={{
        testID: 'birth-continue',
        label: tr.signup.continue,
        disabled: !filled,
        loading: submit.isPending,
        onPress: onContinue,
      }}
    >
      <View className="gap-2">
        <View className="flex-row gap-2.5">
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
        {error ? (
          <Text variant="fine" tone="danger">
            {error}
          </Text>
        ) : null}
      </View>
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
  return (
    <View className={wide ? 'flex-[1.6] gap-1' : 'flex-1 gap-1'}>
      <Input
        testID={testID}
        accessibilityLabel={label}
        keyboardType="number-pad"
        maxLength={max}
        value={value}
        onChangeText={onChange}
        centered
      />
      <Text variant="fine" align="center">
        {label}
      </Text>
    </View>
  );
}
