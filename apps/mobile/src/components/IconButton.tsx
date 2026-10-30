import { type ReactNode, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
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

// The profile's settings (skall tuvali: `settings`; v46: .pset .sl-ic): two slider tracks, their
// knobs in the mark's purple and pink. Each new `go` slides the knobs apart and back (v46: `.pset.go`
// moves .k1 6 left and .k2 6 right for 450 ms, transform .45s cubic-bezier(.34,1.56,.64,1)); none
// with reduce motion.
const KNOB_SLIDE = 6;
const KNOB_MS = 450;
const KNOB_EASE = Easing.bezier(0.34, 1.56, 0.64, 1);
// The knobs slide as views over the drawn tracks (the owner's report, 29 Ekim: react-native-svg
// draws again on the main thread on every frame an animated prop moves); the same rounded rects.
const KNOB = { width: 5, height: 9, radius: 2.5 } as const;

export function SlidersGlyph({ go = 0 }: { go?: number }) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const shift = useSharedValue(0);
  useEffect(() => {
    if (go === 0 || reduce) return;
    shift.set(
      withSequence(
        withTiming(1, { duration: KNOB_MS, easing: KNOB_EASE }),
        withTiming(0, { duration: KNOB_MS, easing: KNOB_EASE }),
      ),
    );
  }, [go, reduce, shift]);
  const side = ICON.lg - 2;
  // The drawing's 24 units in pixels.
  const u = side / 24;
  const k1 = useAnimatedStyle(() => ({
    transform: [{ translateX: -KNOB_SLIDE * u * shift.value }],
  }));
  const k2 = useAnimatedStyle(() => ({
    transform: [{ translateX: KNOB_SLIDE * u * shift.value }],
  }));
  const knob = (x: number, y: number, color: string) => ({
    position: 'absolute' as const,
    left: x * u,
    top: y * u,
    width: KNOB.width * u,
    height: KNOB.height * u,
    borderRadius: KNOB.radius * u,
    backgroundColor: color,
  });
  return (
    <View style={{ width: side, height: side }}>
      <Svg width={side} height={side} viewBox="0 0 24 24">
        <Rect x={3} y={6.8} width={18} height={2.6} rx={1.3} fill={colors.control} />
        <Rect x={3} y={14.6} width={18} height={2.6} rx={1.3} fill={colors.control} />
      </Svg>
      <Animated.View style={[knob(13, 3.6, BRAND.purple), k1]} />
      <Animated.View style={[knob(6, 11.4, BRAND.pink), k2]} />
    </View>
  );
}
