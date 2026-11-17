import { Pressable, View } from 'react-native';

import { T } from '@/aura/kit';
import { haptic } from '@/lib/haptics';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { Text } from './Text';
import { AppIcon } from './AppIcon';

type Props = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  // Aura v71 (EngelleOnay, "Şikayet de et"): the box in a glass row, 56 at least, the label `h3`.
  boxed?: boolean;
};

// The box alone (yeni arayüz tuvali `.cb`: KayitOnay, EngelleOnay): 24, 7 round; empty a 2 line
// of the ink at 28 % on nothing; filled the ink with an 18 white check, in the dark the 94 % white
// with the dark ink.
export function CheckMark({ checked }: { checked: boolean }) {
  const { scheme } = useTheme();
  const c = KIT[scheme];
  return (
    <View
      className="items-center justify-center"
      style={{
        width: KIT.size.checkBox,
        height: KIT.size.checkBox,
        borderRadius: KIT.size.checkRadius,
        borderWidth: checked ? 0 : KIT.size.markLine,
        borderColor: c.markLine,
        backgroundColor: checked ? c.markOn : 'transparent',
      }}
    >
      {checked ? <AppIcon name="checkmark" size={KIT.size.checkTick} color={c.onMarkOn} /> : null}
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
