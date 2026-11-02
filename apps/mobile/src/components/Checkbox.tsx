import { Pressable, View } from 'react-native';

import { T } from '@/aura/kit';
import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import { Text } from './Text';
import { AppIcon } from './AppIcon';

type Props = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  // Aura v71 (EngelleOnay, "Şikayet de et"): the box in a glass row, 56 at least, the label `h3`.
  boxed?: boolean;
};

// The box alone (skall.css `.check`): 24, 8 round; empty a 2 px border line on nothing; filled the
// primary with a 16 check, and in the dark the accent with the kit's dark ink.
export function CheckMark({ checked }: { checked: boolean }) {
  const { colors, scheme } = useTheme();
  const dark = scheme === 'dark';
  const fill = dark ? colors.accent : colors.primary;
  return (
    <View
      className="items-center justify-center"
      style={{
        width: KIT.size.checkBox,
        height: KIT.size.checkBox,
        borderRadius: KIT.size.checkRadius,
        borderWidth: 2,
        borderColor: checked ? fill : colors.border,
        backgroundColor: checked ? fill : 'transparent',
      }}
    >
      {checked ? (
        <AppIcon name="checkmark" size={ICON.sm} color={dark ? KIT.checkInk : colors.onPrimary} />
      ) : null}
    </View>
  );
}

export function Checkbox({ label, checked, onToggle, boxed }: Props) {
  const { scheme } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        haptic('selection');
        onToggle();
      }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING[3],
          minHeight: boxed ? KIT.size.optMin : TOUCH.button,
        },
        boxed
          ? {
              ...gradientStyle(KIT[scheme].glass),
              borderRadius: KIT.size.glassRadiusSm,
              borderWidth: KIT.size.edge,
              borderColor: KIT[scheme].glassEdge,
              paddingVertical: KIT.size.optPadY,
              paddingHorizontal: KIT.size.liPadX,
            }
          : null,
      ]}
    >
      <CheckMark checked={checked} />
      <View className="flex-1">
        {boxed ? <T v="h3">{label}</T> : <Text variant="bodyStrong">{label}</Text>}
      </View>
    </Pressable>
  );
}
