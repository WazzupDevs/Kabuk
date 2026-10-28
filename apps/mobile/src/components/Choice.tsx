import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

import { Text } from './Text';

type Props = {
  label: string;
  hint?: string;
  // A small picture before the label (the table's face, the profile photo).
  picture?: ReactNode;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  // Cannot be chosen yet, and why (canvas: Faz 2 · 22.1 → "Profilimle" without a photo): a dashed
  // outline, and this in place of the hint, at full contrast; it may hold its own button.
  unavailable?: ReactNode;
  testID?: string;
};

const DOT = SPACING[5] + SPACING[0.5];

// One option of a single choice (canvas: Bileşenler): a card with the radio mark first; the
// selected one fills with the quiet colour, its outline in the accent, and lifts a little.
export function Choice({
  label,
  hint,
  picture,
  selected,
  onPress,
  disabled,
  unavailable,
  testID,
}: Props) {
  const { colors, shape, scheme } = useTheme();
  const frame = {
    flexDirection: 'row',
    alignItems: hint || unavailable ? 'flex-start' : 'center',
    gap: SPACING[3],
    // skall tuvali (skall.css → `.choice`): 56 high, 16 px corners, 1 px control; on, 2 px primary.
    minHeight: TOUCH.tab,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: shape.radius.md,
    borderWidth: 1,
  } as const;
  const title = (tone?: 'muted') => (
    <View className="flex-row items-center gap-2">
      {picture}
      <Text variant="bodyStrong" tone={tone} className="flex-1">
        {label}
      </Text>
    </View>
  );

  if (unavailable) {
    return (
      <View
        testID={testID}
        accessibilityRole="radio"
        accessibilityLabel={label}
        accessibilityState={{ selected: false, disabled: true }}
        style={{ ...frame, borderStyle: 'dashed', borderColor: colors.muted }}
      >
        <View
          style={{
            width: DOT,
            height: DOT,
            borderRadius: shape.radius.pill,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: colors.muted,
          }}
        />
        <View className="flex-1 gap-2">
          {title('muted')}
          {unavailable}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="radio"
      testID={testID}
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        if (!selected) haptic('selection');
        onPress();
      }}
      // docs/design/aura (CheckIn's rows): a glass row; chosen, ringed in the primary.
      style={{
        ...frame,
        ...gradientStyle(KIT[scheme].glass),
        borderRadius: KIT.size.glassRadiusSm,
        borderWidth: selected ? 2 : KIT.size.edge,
        borderColor: selected ? KIT.primary : KIT[scheme].glassEdge,
        boxShadow: selected
          ? `0px 0px 0px ${KIT.size.dotRing}px ${KIT.primaryRing}`
          : KIT[scheme].glassShadow,
        paddingHorizontal: selected ? SPACING[4] - 1 : SPACING[4],
        paddingVertical: selected ? SPACING[3] - 1 : SPACING[3],
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: DOT,
          height: DOT,
          borderRadius: shape.radius.pill,
          // skall.css → `.radio`: 2 px control; on, a 7 px primary ring.
          borderWidth: selected ? 7 : 2,
          borderColor: selected ? colors.primary : colors.control,
          backgroundColor: colors.surface,
        }}
      ></View>
      <View className="flex-1 gap-1">
        {title()}
        {hint ? <Text variant="fine">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}
