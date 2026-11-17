import { useOnboardingStore } from '@/features/onboarding/store';
import { tr } from '@/i18n/tr';

import { SignupStep } from './SignupStep';

// Sign-up ended under 18 (KayitYasAlti): the account was deleted, nothing was kept. The title and
// the note stand at the top of the flat ground, the button at the foot; closing it goes back to the
// first screen.
export function UnderAge() {
  return (
    <SignupStep
      testID="under-age"
      title={tr.underAge.title}
      body={tr.underAge.body}
      action={{
        label: tr.common.close,
        onPress: () => useOnboardingStore.setState({ underAge: false }),
      }}
    />
  );
}
