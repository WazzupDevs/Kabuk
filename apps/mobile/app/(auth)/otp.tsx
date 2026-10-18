import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { authErrorMessage } from '@/features/auth/authErrors';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { tr } from '@/i18n/tr';
import { supabase } from '@/lib/supabase';

// Matches [auth.sms] max_frequency.
const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;

// The code, step 3/7: six digits verify on their own; on success the session store updates and
// the root navigator moves on to the profile steps.
export default function OtpStep() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (!phone) return <Redirect href="/phone" />;

  async function verify(token: string) {
    if (!phone || token.length !== CODE_LENGTH) return;
    setError(null);
    setVerifying(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    setVerifying(false);
    if (verifyError) setError(authErrorMessage(verifyError));
  }

  async function resend() {
    if (!phone) return;
    setError(null);
    setSecondsLeft(RESEND_SECONDS);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
    if (otpError) setError(authErrorMessage(otpError));
  }

  function onChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) void verify(digits);
  }

  return (
    <SignupStep
      step="code"
      testID="signup-code"
      title={tr.auth.otpTitle}
      body={tr.auth.otpHint(phone)}
      onBack={() => router.back()}
      action={{
        label: tr.auth.verify,
        onPress: () => void verify(code),
        disabled: code.length !== CODE_LENGTH,
        loading: verifying,
      }}
    >
      <View className="gap-2">
        <CodeInput
          testID="otp-input"
          length={CODE_LENGTH}
          accessibilityLabel={tr.auth.otpTitle}
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          autoFocus
          value={code}
          onChangeText={onChange}
          error={error}
        />
        <View className="flex-row flex-wrap gap-x-4">
          <Button
            variant="ghost"
            flush
            label={secondsLeft > 0 ? tr.auth.resendIn(secondsLeft) : tr.auth.resend}
            onPress={() => void resend()}
            disabled={secondsLeft > 0}
          />
          <Button
            variant="ghost"
            flush
            label={tr.auth.changeNumber}
            onPress={() => router.back()}
          />
        </View>
      </View>
    </SignupStep>
  );
}
