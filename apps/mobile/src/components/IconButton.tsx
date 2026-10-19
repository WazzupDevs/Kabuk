import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import type { IconName } from './Button';
import { usePressScale } from './motion';

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  testID?: string;
  // A drawing in place of the icon (the chat's "more": MoreDots).
  glyph?: ReactNode;
  // A raised circle on a hairline (v45: .round.back, .dmore) instead of a bare icon.
  round?: boolean;
  // With `round`: the soft red disc without a hairline ("Mekandan ayrıl", v45: .round.leave).
  danger?: boolean;
  disabled?: boolean;
};

// A 44 × 44 icon-only button; the label is for screen readers.
export function IconButton({
  icon,
  label,
  onPress,
  testID,
  glyph,
  round,
  danger = false,
  disabled = false,
}: Props) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              width: TOUCH.min,
              height: TOUCH.min,
              borderRadius: shape.radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
            },
            round && danger
              ? { backgroundColor: colors.dangerSoft }
              : round
                ? {
                    backgroundColor: colors.surface,
                    borderWidth: shape.stroke.hairline,
                    borderColor: colors.divider,
                  }
                : { backgroundColor: pressed ? colors.surface2 : 'transparent' },
            round ? pressScale(pressed && !disabled) : null,
          ]}
        >
          {glyph ?? <Ionicons name={icon} size={ICON.lg} color={colors.text} />}
        </View>
      )}
    </Pressable>
  );
}

const DOT = SPACING[1] + SPACING[0.5] / 2;
const DOTS = [BRAND.purple, BRAND.pink, BRAND.orange] as const;

// The chat's "more" (v45: .dmore): three dots one under the other in the mark's colours.
export function MoreDots() {
  const { shape } = useTheme();
  return (
    <View style={{ gap: SPACING[0.5] }}>
      {DOTS.map((color) => (
        <View
          key={color}
          style={{
            width: DOT,
            height: DOT,
            borderRadius: shape.radius.pill,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

// The profile's settings (v45: .pset .sl-ic): two slider tracks, their knobs in the mark's purple and
// pink.
export function SlidersGlyph() {
  const { colors } = useTheme();
  return (
    <Svg width={ICON.lg - 2} height={ICON.lg - 2} viewBox="0 0 24 24">
      <Rect x={3} y={6.8} width={18} height={2.6} rx={1.3} fill={colors.divider} />
      <Rect x={3} y={14.6} width={18} height={2.6} rx={1.3} fill={colors.divider} />
      <Rect x={13} y={3.6} width={5} height={9} rx={2.5} fill={BRAND.purple} />
      <Rect x={6} y={11.4} width={5} height={9} rx={2.5} fill={BRAND.pink} />
    </Svg>
  );
}
