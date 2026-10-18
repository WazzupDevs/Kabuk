import {
  CURRENT_KVKK_VERSION,
  CURRENT_TERMS_VERSION,
  needsConsent,
  needsProfile,
} from '@shared/consent.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Loader } from '@/components/Loader';
import { useProfile } from '@/features/account/useProfile';
import { ConsentBoxes } from '@/features/onboarding/ConsentBoxes';
import { nextAfterConsents } from '@/features/onboarding/next';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { useFriend } from '@/features/onboarding/useFriend';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { callAccount } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

// After the code: the consents given on "Başlamadan önce" (before the phone, K-33) carry on. A new
// account goes to the profile steps, which send them; an existing account whose texts changed sends
// them now, once. Without them (an app restart, or texts updated since) "Başlamadan önce" is asked
// here as before; then an account from before the gender step answers that once (§23.D).
export default function ConsentsAfterCode() {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const consented = useOnboardingStore((s) => s.consented);
  const current =
    consented?.terms === CURRENT_TERMS_VERSION && consented.kvkk === CURRENT_KVKK_VERSION;
  const [terms, setTerms] = useState(false);
  const [kvkk, setKvkk] = useState(false);
  const friend = useFriend();
  const toggle = (other: boolean, set: (v: boolean) => void, now: boolean) => {
    set(!now);
    friend.react(!now && other ? 'ok' : 'nod');
  };
  const hasProfile = !!profile.data && !needsProfile(profile.data);

  const reconsent = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () =>
      callAccount({
        action: 'complete-onboarding',
        termsVersion: CURRENT_TERMS_VERSION,
        kvkkVersion: CURRENT_KVKK_VERSION,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  // An existing account that accepted the current texts before the phone: send them once.
  const sent = useRef(false);
  const autoSend = current && hasProfile && !!profile.data && needsConsent(profile.data);
  useEffect(() => {
    if (!autoSend || sent.current) return;
    sent.current = true;
    reconsent.mutate();
  }, [autoSend, reconsent]);

  if (profile.data && !needsConsent(profile.data)) {
    return <Redirect href={nextAfterConsents(profile.data)} />;
  }
  if (current && !hasProfile) return <Redirect href="/name" />;
  if (autoSend && !reconsent.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Loader />
      </View>
    );
  }

  const accept = () => {
    useOnboardingStore.setState({
      consented: { terms: CURRENT_TERMS_VERSION, kvkk: CURRENT_KVKK_VERSION },
    });
    if (hasProfile) reconsent.mutate();
  };

  return (
    <SignupStep
      step={hasProfile ? undefined : 'consents'}
      testID="signup-consents"
      title={tr.consents.title}
      body={profile.data && hasProfile ? tr.consents.outdated : tr.consents.body}
      error={reconsent.isError ? errorMessage(reconsent.error) : null}
      friend={friend}
      action={{
        testID: 'consents-accept',
        label: tr.consents.accept,
        onPress: accept,
        disabled: !(terms && kvkk),
        loading: reconsent.isPending,
      }}
    >
      <ConsentBoxes
        terms={terms}
        kvkk={kvkk}
        onTerms={() => toggle(kvkk, setTerms, terms)}
        onKvkk={() => toggle(terms, setKvkk, kvkk)}
      />
    </SignupStep>
  );
}
