import {
  CURRENT_KVKK_VERSION,
  CURRENT_TERMS_VERSION,
  needsConsent,
  needsProfile,
} from '@shared/consent.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
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

// After the code: the consents given on "Başlamadan önce" (before the phone, K-33) carry on to a new
// account's profile steps, which send them. An existing account whose texts changed is asked again
// here, always ("Metinler güncellendi"), even if it ticked the boxes before the phone: the notice
// that the texts changed is the point. Without them (an app restart) "Başlamadan önce" is asked here
// as before; then an account from before the gender step answers that once (§23.D). The account is
// told apart only once its profile has loaded: a failed load is an error, not a new account.
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

  if (profile.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Loader />
      </View>
    );
  }
  if (profile.isError) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <EmptyState
            icon="cloud-offline-outline"
            body={errorMessage(profile.error)}
            action={{ label: tr.common.retry, onPress: () => void profile.refetch() }}
          />
        </View>
      </Screen>
    );
  }

  // null: a new account (no profile row yet).
  const row = profile.data;
  const hasProfile = row !== null && !needsProfile(row);
  if (row && !needsConsent(row)) return <Redirect href={nextAfterConsents(row)} />;
  if (current && !hasProfile) return <Redirect href="/name" />;

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
      body={hasProfile ? tr.consents.outdated : tr.consents.body}
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
