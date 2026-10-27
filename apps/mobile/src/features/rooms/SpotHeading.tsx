import { View } from 'react-native';

import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';

// A spot's heading over its rooms at a venue with spots (docs/SPEC_V3.md §4.3).
export function SpotHeading({
  spotId,
  spotName,
  mine,
}: {
  spotId: string | null;
  spotName: string | null;
  mine: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View className="mt-1 flex-row items-center gap-2">
      <AppIcon name="location-outline" size={ICON.md} color={colors.text} />
      <Text variant="heading" accessibilityRole="header" className="flex-1">
        {spotId === null ? tr.rooms.noSpot : mine ? tr.rooms.mySpot(spotName ?? '') : spotName}
      </Text>
    </View>
  );
}
