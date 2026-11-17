import { CURRENT_KVKK_VERSION, CURRENT_TERMS_VERSION } from '@shared/consent.ts';
import { router } from 'expo-router';
import { useState } from 'react';

import { ConsentBoxes } from '@/features/onboarding/ConsentBoxes';
import { SignupStep } from '@/features/onboarding/SignupStep';
import { useOnboardingStore } from '@/features/onboarding/store';
import { useGoOnce } from '@/features/onboarding/useGoOnce';
import { tr } from '@/i18n/tr';

// "Başlamadan önce", step 1/7, before the phone (K-19, K-33): the two consents are kept on the
// phone and sent with the profile (account/complete-onboarding), as before. The first step has no back button
// (KayitOnay); the system's back goes to the first screen.
export default function ConsentsStep() {
  // Always unticked: each person ticks the boxes for themselves.
  const [terms, setTerms] = useState(false);
  const [kvkk, setKvkk] = useState(false);
  const { go, going } = useGoOnce();
  const toggle = (set: (v: boolean) => void, now: boolean) => set(!now);

  return (
    <SignupStep
      step="consents"
      testID="signup-consents"
      title={tr.consents.title}
      body={tr.consents.body}
      footnote={tr.consents.both}
      action={{
        testID: 'consents-accept',
        label: tr.consents.accept,
        disabled: !(terms && kvkk),
        loading: going,
        onPress: () =>
          go(() => {
            useOnboardingStore.setState({
              consented: { terms: CURRENT_TERMS_VERSION, kvkk: CURRENT_KVKK_VERSION },
            });
            router.push('/phone');
          }),
      }}
    >
      <ConsentBoxes
        terms={terms}
        kvkk={kvkk}
        onTerms={() => toggle(setTerms, terms)}
        onKvkk={() => toggle(setKvkk, kvkk)}
      />
    </SignupStep>
  );
}
