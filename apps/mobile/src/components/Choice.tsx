import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

import { Text } from './Text';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from './NativeShadow';

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
  // The row's least height (56; the spot list 60).
  minHeight?: number;
};

const DOT = KIT.size.checkBox;

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
  minHeight = KIT.size.optMin,
}: Props) {
  const { colors, shape, scheme } = useTheme();
  const ring = scheme === 'dark' ? colors.accent : colors.primary;
  const shadowOff = useLabOff('golge');
  const frame = {
    flexDirection: 'row',
    alignItems: hint || unavailable ? 'flex-start' : 'center',
    gap: SPACING[3],
    // skall tuvali (skall.css → `.choice`, v71): 56 high, 10 / 16 in, the radio after the label.
    minHeight,
    paddingHorizontal: SPACING[4],
    paddingVertical: KIT.size.optPadY,
    borderRadius: shape.radius.md,
    borderWidth: 1,
  } as const;
  const title = (tone?: 'muted') => (
    // `.opt`: the picture 12 before the label.
    <View className="flex-row items-center" style={{ gap: SPACING[3] }}>
      {picture}
      <View className="flex-1">
        <T v="h3" color={tone ? colors.muted : colors.text}>
          {label}
        </T>
      </View>
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
        <View className="flex-1 gap-2">
          {title('muted')}
          {unavailable}
        </View>
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
      </View>
    );
  }

  // The soft row (`--soft-bg`, 1 px `--soft-line`, the soft shadow natively: NativeShadow.tsx);
  // chosen, a 2 px ring of the primary and no glow.
  const shadow = shadowParts(
    shadowOff,
    selected ? undefined : KIT[scheme].raisedShadow || undefined,
    undefined,
    KIT.size.glassRadiusSm,
    true,
    selected ? 2 : KIT.size.edge,
  );
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
      style={{
        ...frame,
        backgroundColor: KIT[scheme].raised,
        borderRadius: KIT.size.glassRadiusSm,
        borderWidth: selected ? 2 : KIT.size.edge,
        borderColor: selected ? ring : KIT[scheme].raisedEdge,
        boxShadow: shadow.boxShadow,
        paddingHorizontal: selected ? SPACING[4] - 1 : SPACING[4],
        paddingVertical: selected ? KIT.size.optPadY - 1 : KIT.size.optPadY,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {shadow.node}
      <View className="flex-1 gap-1">
        {title()}
        {hint ? <Text variant="fine">{hint}</Text> : null}
      </View>
      <View
        className="items-center justify-center"
        style={{
          width: DOT,
          height: DOT,
          borderRadius: shape.radius.pill,
          // skall.css → `.radio`: 2 px border on nothing; on, a 7 px primary ring (dark: accent).
          borderWidth: selected ? 7 : 2,
          borderColor: selected ? ring : colors.border,
        }}
      ></View>
    </Pressable>
  );
}
