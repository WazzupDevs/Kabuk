import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

import { Text } from './Text';

type Props = {
  label: string;
  hint?: string;
  // A small picture before the label (the table's snail, the profile photo).
  picture?: ReactNode;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  // Cannot be chosen yet, and why (canvas: Faz 2 · 22.1 → "Profilimle" without a photo): a dashed
  // outline, and this in place of the hint, at full contrast; it may hold its own button.
  unavailable?: ReactNode;
  testID?: string;
};

const DOT = SPACING[6];

// One option of a single choice (canvas: Bileşenler): a card with the radio mark first; the
// selected one fills with the quiet colour and lifts on the theme's hard shadow.
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
  const { colors, shape } = useTheme();
  const frame = {
    flexDirection: 'row',
    alignItems: hint || unavailable ? 'flex-start' : 'center',
    gap: SPACING[3],
    minHeight: TOUCH.tab,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3] + SPACING[0.5],
    borderRadius: shape.radius.md,
    borderWidth: Math.max(shape.stroke.control, 1),
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
      onPress={onPress}
      style={{
        ...frame,
        backgroundColor: selected ? colors.surface2 : colors.surface,
        borderColor: colors.border,
        boxShadow: selected ? shape.shadow.raised : undefined,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: DOT,
          height: DOT,
          borderRadius: shape.radius.pill,
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        {selected ? (
          <View
            style={{
              width: DOT / 2,
              height: DOT / 2,
              borderRadius: shape.radius.pill,
              backgroundColor: colors.accent,
            }}
          />
        ) : null}
      </View>
      <View className="flex-1 gap-1">
        {title()}
        {hint ? <Text variant="fine">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}
