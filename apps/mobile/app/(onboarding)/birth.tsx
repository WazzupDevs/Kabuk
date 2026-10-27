import { checkBirthDate, composeBirthDate, istanbulToday, parseIsoDate } from '@shared/age.ts';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { useFriend, useJumpWhen, useShakeOnError } from '@/features/onboarding/useFriend';
import { useGoOnce } from '@/features/onboarding/useGoOnce';
import { signupError, useCompleteSignup } from '@/features/onboarding/useCompleteSignup';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

// The birth date, step 5/7: never shown to anyone, the profile shows the age; it cannot be changed
// later (rule 11). "Devam" asks once more in a sheet with the age and the date (K-55, K-63; v46
// §6): Onayla goes on, Düzelt stays. The server decides under 18 when the profile is sent, after
// the gender step: it asks for the gender first (docs/DECISIONS.md → "Faz 4 adım 4.3b").
export default function BirthStep() {
  const profile = useProfile();
  const name = useOnboardingStore((s) => s.name);
  const extrasPending = useOnboardingStore((s) => s.extrasPending);
  const { go, going } = useGoOnce();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  // The date waiting for Onayla, with the age it gives today.
  const [confirm, setConfirm] = useState<{ birthDate: string; age: number } | null>(null);
  const submit = useCompleteSignup();
  const needsGender = profile.data?.has_gender !== true;
  const friend = useFriend();
  // The date set: the friend jumps and throws a little burst (v45 §3).
  useJumpWhen(composeBirthDate(day, month, year) !== null, () => {
    friend.react('ok');
    friend.puff();
  });
  useShakeOnError(error, () => friend.react('err'));

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
    setConfirm({ birthDate, age: check.age });
  };
  const onConfirm = () => {
    if (!confirm) return;
    setConfirm(null);
    useOnboardingStore.setState({ birthDate: confirm.birthDate });
    if (needsGender) go(() => router.push('/gender'));
    else submit.mutate(null);
  };
  const confirmed = confirm ? parseIsoDate(confirm.birthDate) : null;

  return (
    <SignupStep
      step="birth"
      testID="signup-birth-step"
      title={tr.signup.birthTitle}
      body={tr.signup.birthBody}
      onBack={() => router.back()}
      friend={friend}
      error={submit.isError && signupError(submit.error) ? errorMessage(submit.error) : null}
      action={{
        testID: 'birth-continue',
        label: tr.signup.continue,
        disabled: !filled,
        loading: submit.isPending || going,
        onPress: onContinue,
      }}
    >
      <View className="gap-2">
        <View className="flex-row gap-2.5">
          <Field
            testID="birth-day"
            label={tr.signup.day}
            value={day}
            onChange={setDay}
            max={2}
            friend={friend}
          />
          <Field
            friend={friend}
            testID="birth-month"
            label={tr.signup.month}
            value={month}
            onChange={setMonth}
            max={2}
          />
          <Field
            friend={friend}
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
      <Sheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title={tr.signup.birthConfirmTitle(confirm?.age ?? 0)}
      >
        <Text variant="fine">{confirmed ? tr.signup.birthConfirmBody(confirmed) : ''}</Text>
        <View className="gap-2.5">
          <Button
            size="lg"
            testID="birth-confirm"
            label={tr.signup.birthConfirm}
            onPress={onConfirm}
          />
          <Button
            size="lg"
            variant="neutral"
            testID="birth-confirm-fix"
            label={tr.signup.birthFix}
            onPress={() => setConfirm(null)}
          />
        </View>
      </Sheet>
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
  friend,
}: {
  testID: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  wide?: boolean;
  friend: { onFocus: () => void; onBlur: () => void };
}) {
  return (
    // skall tuvali (KayitDogum): the label over a 16-cornered box.
    <View className={wide ? 'flex-[1.6] gap-2' : 'flex-1 gap-2'}>
      <Text variant="label">{label}</Text>
      <Input
        box
        testID={testID}
        accessibilityLabel={label}
        keyboardType="number-pad"
        maxLength={max}
        value={value}
        onChangeText={onChange}
        onFocus={friend.onFocus}
        onBlur={friend.onBlur}
        centered
      />
    </View>
  );
}
