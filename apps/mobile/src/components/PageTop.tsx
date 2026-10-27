import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { tr } from '@/i18n/tr';
import { SPACING, TOUCH } from '@/theme/tokens';

import { IconButton } from './IconButton';
import { Text } from './Text';

// A page's top (skall tuvali: Bildirim ayarları, Gizlilik, Hesap…): the round back button and the
// title on one line, something on the right.
export function PageTop({
  title,
  onBack,
  trailing,
}: {
  title: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <View
      className="flex-row items-center"
      style={{ gap: SPACING[3], minHeight: TOUCH.min, marginBottom: SPACING[3] }}
    >
      <IconButton
        round
        icon="chevron-back"
        label={tr.common.back}
        onPress={onBack ?? (() => router.back())}
      />
      <Text variant="heading" accessibilityRole="header" className="flex-1">
        {title}
      </Text>
      {trailing}
    </View>
  );
}
