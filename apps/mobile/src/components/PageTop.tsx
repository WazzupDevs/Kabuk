import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { tr } from '@/i18n/tr';
import { SPACING, TOUCH } from '@/theme/tokens';

import { IconButton } from './IconButton';
import { Text } from './Text';

// A page's top (skall tuvali: Bildirim ayarları, Gizlilik, Hesap…): the round back button and the
// title on one line, something on the right. It goes in Screen → `top`: it stays while the page
// scrolls under it (the owner's report, 2 Kasım, B2).
export function PageTop({
  title,
  sub,
  onBack,
  trailing,
}: {
  title: string;
  // Under the title, quieter (skall tuvali, Arkadaslar: "4 arkadaş").
  sub?: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: SPACING[3], minHeight: TOUCH.min }}>
      <IconButton
        round
        icon="chevron-back"
        label={tr.common.back}
        onPress={onBack ?? (() => router.back())}
      />
      <View className="flex-1">
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {sub ? <Text variant="fine">{sub}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}
