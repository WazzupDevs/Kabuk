import { toTrMobileE164 } from '@shared/phone.ts';
import { AuthError } from '@supabase/supabase-js';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { authErrorMessage } from '@/features/auth/authErrors';
import { InfoRows } from '@/features/onboarding/InfoRows';
import { SignupField } from '@/features/onboarding/SignupField';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { tr } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';
import { SIGNUP } from '@/theme/signup';

// The phone, step 2/7 (v45 §1): after "Başlamadan önce" (K-33). The code goes by SMS.
export default function PhoneStep() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const consented = useOnboardingStore((s) => s.consented !== null);

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
      picture="phone"
      testID="signup-phone"
      title={tr.auth.phoneTitle}
      onBack={() => router.back()}
      action={{
        label: tr.auth.sendCode,
        onPress: () => void sendCode(),
        loading: sending,
      }}
    >
      <View style={{ marginTop: SIGNUP.fieldTop }}>
        <SignupField
          testID="phone-input"
          prefix={tr.auth.phonePrefix}
          tag={tr.auth.phoneCountry}
          accessibilityLabel={tr.auth.phoneTitle}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          placeholder={tr.auth.phonePlaceholder}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => void sendCode()}
          maxLength={16}
          error={error}
        />
      </View>
      <InfoRows
        items={[
          { icon: 'chat', text: tr.auth.phoneInfoSms },
          { icon: 'eyeOff', text: tr.auth.phoneInfoPrivate },
        ]}
      />
    </SignupStep>
  );
}
