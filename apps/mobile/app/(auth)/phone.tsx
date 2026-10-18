import { toTrMobileE164 } from '@shared/phone.ts';
import { AuthError } from '@supabase/supabase-js';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { Input } from '@/components/Input';
import { authErrorMessage } from '@/features/auth/authErrors';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { useFriend, useJumpWhen, useShakeOnError } from '@/features/onboarding/useFriend';
import { tr } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';

// The phone, step 2/7 (v45 §1): after "Başlamadan önce" (K-33). The code goes by SMS.
export default function PhoneStep() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const consented = useOnboardingStore((s) => s.consented !== null);
  const friend = useFriend();
  useJumpWhen(toTrMobileE164(input) !== null, () => friend.react('ok'));
  useShakeOnError(error, () => friend.react('err'));

  // The consents come first; an app restart or a deep link starts over there.
  if (!consented) return <Redirect href="/agree" />;

  async function sendCode() {
    const phone = toTrMobileE164(input);
    if (!phone) {
      setError(tr.auth.errors.invalidPhone);
      return;
    }
    setError(null);
    useOnboardingStore.setState({ underAge: false });
    setSending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
    setSending(false);
    if (otpError) {
      setError(otpError instanceof AuthError ? authErrorMessage(otpError) : tr.common.genericError);
      return;
    }
    router.push({ pathname: '/otp', params: { phone } });
  }

  return (
    <SignupStep
      step="phone"
      testID="signup-phone"
      title={tr.auth.phoneTitle}
      body={tr.auth.phoneHint}
      onBack={() => router.back()}
      friend={friend}
      action={{ label: tr.auth.sendCode, onPress: () => void sendCode(), loading: sending }}
    >
      <Input
        testID="phone-input"
        prefix={tr.auth.phonePrefix}
        accessibilityLabel={tr.auth.phoneTitle}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        placeholder={tr.auth.phonePlaceholder}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => void sendCode()}
        onFocus={friend.onFocus}
        onBlur={friend.onBlur}
        maxLength={16}
        error={error}
      />
    </SignupStep>
  );
}
