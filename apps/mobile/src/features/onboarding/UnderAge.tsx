import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Mark } from '@/components/Mark';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
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
        <Text variant="title" align="center" accessibilityRole="header">
          {tr.underAge.title}
        </Text>
        <Text variant="fine" align="center">
          {tr.underAge.body}
        </Text>
      </View>
      <View className="pt-8">
        <Button
          size="lg"
          variant="neutral"
          label={tr.common.close}
          onPress={() => useOnboardingStore.setState({ underAge: false })}
        />
      </View>
    </Screen>
  );
}
