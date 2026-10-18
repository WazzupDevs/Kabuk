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
      <View testID="under-age" collapsable={false} className="flex-1 justify-center gap-4">
        <Mark size={SPACING[16] + SPACING[5]} label={null} />
        <Text variant="display" accessibilityRole="header">
          {tr.underAge.title}
        </Text>
        <Text tone="muted">{tr.underAge.body}</Text>
      </View>
      <View className="pt-8">
        <Button
          variant="neutral"
          label={tr.common.close}
          onPress={() => useOnboardingStore.setState({ underAge: false })}
        />
      </View>
    </Screen>
  );
}
