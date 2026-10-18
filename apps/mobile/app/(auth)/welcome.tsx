import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { useOnboardingStore } from '@/features/onboarding/store';
import { UnderAge } from '@/features/onboarding/UnderAge';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

// The first screen (docs/SPEC_V4.md §4.C; v45 §2): the logo, "Aynı mekanda, aynı masada.", what
// the app does and "Başla", which opens "Başlamadan önce", the first of the seven steps (K-26).
// The intro scene arrives with its own step of 4.3; until then the space above the words is the
// logo's.
export default function WelcomeScreen() {
  // Set when sign-up ended under 18: the account was deleted, nothing was kept.
  const underAge = useOnboardingStore((s) => s.underAge);
  if (underAge) return <UnderAge />;

  return (
    <Screen>
      <View testID="welcome" collapsable={false} className="flex-1">
        <View className="mt-2">
          <Wordmark height={SPACING[6]} />
        </View>
        <View className="flex-1 justify-end gap-3 pt-8">
          <Text variant="display" accessibilityRole="header">
            {tr.signup.welcomeTitle}
          </Text>
          <Text tone="muted">{tr.signup.welcomeBody}</Text>
        </View>
        <View className="gap-3 pt-8">
          <Button
            testID="welcome-start"
            label={tr.signup.start}
            onPress={() => router.push('/agree')}
          />
          <Text variant="fine" tone="muted" align="center">
            {tr.signup.adultsOnly}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
