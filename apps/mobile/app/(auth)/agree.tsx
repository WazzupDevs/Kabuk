import { CURRENT_KVKK_VERSION, CURRENT_TERMS_VERSION } from '@shared/consent.ts';
import { router } from 'expo-router';
import { useState } from 'react';

import { ConsentBoxes } from '@/features/onboarding/ConsentBoxes';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { tr } from '@/i18n/tr';

// "Başlamadan önce", step 1/7, before the phone (K-19, K-33): the two consents are kept on the
// phone and sent with the profile (account/complete-onboarding), as before. Back goes to the first
// screen.
export default function ConsentsStep() {
  const accepted = useOnboardingStore((s) => s.consented !== null);
  const [terms, setTerms] = useState(accepted);
  const [kvkk, setKvkk] = useState(accepted);

  return (
    <SignupStep
      step="consents"
      testID="signup-consents"
      title={tr.consents.title}
      body={tr.consents.body}
      onBack={() => router.back()}
      action={{
        testID: 'consents-accept',
        label: tr.consents.accept,
        disabled: !(terms && kvkk),
        onPress: () => {
          useOnboardingStore.setState({
            consented: { terms: CURRENT_TERMS_VERSION, kvkk: CURRENT_KVKK_VERSION },
          });
          router.push('/phone');
        },
      }}
    >
      <ConsentBoxes
        terms={terms}
        kvkk={kvkk}
        onTerms={() => setTerms((v) => !v)}
        onKvkk={() => setKvkk((v) => !v)}
      />
    </SignupStep>
  );
}
