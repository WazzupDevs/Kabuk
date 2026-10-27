import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { Text } from './Text';

const SIZE = SPACING[5] + SPACING[0.5];

// skall.css → `.badge`: a count in a 22 high primary pill; over 99 it says 99+.
export function CountBadge({ count, testID }: { count: number; testID?: string }) {
  const { colors, shape } = useTheme();
  return (
    <View
      testID={testID}
      className="items-center justify-center"
      style={{
        minWidth: SIZE,
        height: SIZE,
        paddingHorizontal: SPACING[1.5],
        borderRadius: shape.radius.pill,
        backgroundColor: colors.primary,
      }}
    >
      <Text variant="tag" tone="onPrimary" tabular>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
}
