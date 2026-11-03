import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { BRAND } from '@/theme/brand';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import type { IconName } from './Button';
import { usePressScale } from './motion';
import { AppIcon } from './AppIcon';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from './NativeShadow';
import { Frost } from '@/components/LiquidGlass';
import { useFrost } from '@/aura/kit';

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
  const { colors, shape, scheme } = useTheme();
  const pressScale = usePressScale();
  const shadowOff = useLabOff('golge');
  const frosted = useFrost() && !!round && !danger;
  const shadow =
    round && !danger
      ? shadowParts(
          shadowOff,
          KIT[scheme].raisedShadow || undefined,
          undefined,
          TOUCH.min / 2,
          true,
          KIT.size.edge,
        )
      : null;
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
            // docs/design/aura (`.round.glassy`): a raised white circle with a white edge.
            round && danger
              ? { backgroundColor: colors.dangerSoft }
              : round
                ? {
                    backgroundColor: frosted ? undefined : KIT[scheme].raisedRound,
                    borderWidth: KIT.size.edge,
                    borderColor: KIT[scheme].raisedEdge,
                    boxShadow: shadow?.boxShadow,
                  }
                : null,
            // A bare icon sinks when pressed, as a round one does (no fill: a fill from an earlier
            // look showed as a box behind the chat's "more" in the dark, the owner's report, 30
            // Ekim).
            pressScale(pressed && !disabled),
          ]}
        >
          {shadow?.node}
          {/* Frosted (the owner's call, 30 Ekim: every clear button). */}
          {frosted ? (
            <Frost
              radius={TOUCH.min / 2}
              ground={AURA[scheme].ground}
              fill={KIT[scheme].raisedRound}
            />
          ) : null}
          {glyph ?? <AppIcon name={icon} size={ICON.lg} color={colors.text} />}
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
