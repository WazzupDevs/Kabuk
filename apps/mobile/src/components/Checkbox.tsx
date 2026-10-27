import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { Text } from './Text';

type Props = { label: string; checked: boolean; onToggle: () => void };

export function Checkbox({ label, checked, onToggle }: Props) {
  const { colors, shape } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        haptic('selection');
        onToggle();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[3],
        minHeight: TOUCH.button,
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          // skall tuvali (skall.css → `.check`): 22, 6 px corners, 2 px control; on, primary.
          width: SPACING[5] + SPACING[0.5],
          height: SPACING[5] + SPACING[0.5],
          borderRadius: shape.radius.xs,
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors.control,
          backgroundColor: checked ? colors.primary : colors.surface,
        }}
      >
        {checked ? <Ionicons name="checkmark" size={ICON.sm} color={colors.onPrimary} /> : null}
      </View>
      <Text variant="bodyStrong" className="flex-1">
        {label}
      </Text>
    </Pressable>
  );
}
