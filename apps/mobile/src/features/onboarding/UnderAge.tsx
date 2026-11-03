import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Mark } from '@/components/Mark';
import { Screen } from '@/components/Screen';
import { useOnboardingStore } from '@/features/onboarding/store';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

// Sign-up ended under 18 (canvas: 18 yaş sınırı; v45: the "minor" step): the account was deleted,
// nothing was kept. Closing it goes back to the first screen.
export function UnderAge() {
  return (
    <Screen>
      {/* skall tuvali (Kayit18Alti, `.hero-empty`): the mark, the title and the note centred. */}
      <View
        testID="under-age"
        collapsable={false}
        className="flex-1 items-center justify-center gap-2.5 px-6"
      >
        <View className="mb-1.5">
          <Mark size={SPACING[16] + SPACING[5]} label={null} />
        </View>
        <T v="title" center accessibilityRole="header">
          {tr.underAge.title}
        </T>
        <T v="fine" center>
          {tr.underAge.body}
        </T>
      </View>
      <View className="pt-8">
        <Btn
          block
          variant="glassy"
          label={tr.common.close}
          onPress={() => useOnboardingStore.setState({ underAge: false })}
        />
      </View>
    </Screen>
  );
}
