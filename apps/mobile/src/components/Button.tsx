import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { Animated, Pressable, View, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { buttonFill, type ButtonVariant, isTextOnly } from '@/theme/buttonFill';
import { EASE_OUT } from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING, TOUCH, type TypeVariant } from '@/theme/tokens';

import { Loader } from './Loader';
import { usePressScale } from './motion';
import { Text } from './Text';

// The skall design system → Button: the roles and their fills are in theme/buttonFill.ts. No
// outlined, hard-shadowed "3D" face: pressed, a button shrinks to 97 %. Disabled, it takes a
// neutral fill instead of fading.
export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  // Busy: the label stays in place, invisible (the width does not change), and Buluş takes its
  // place; a second press does nothing.
  loading?: boolean;
  variant?: ButtonVariant;
  // skall tuvali (skall.css → "Düğme"): sm 36, md 44, lg 52; sm's touch area grows to 44.
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  // A drawing in the icon's place (the profile's "Arkadaşlar": the friends' photos).
  leading?: ReactNode;
  // A short addition after the label ("+1", "2 hak").
  detail?: string;
  accessibilityLabel?: string;
  testID?: string;
  // A text-only button that lines up with the content's left edge ("Tekrar gönder").
  flush?: boolean;
  // The detail under the label, for three buttons in a row (cooperative Tabu: "Doğru" over "+1").
  stack?: boolean;
  // Half a row ("Masanı lobiye aç" | "Masanla oyna"): tighter padding and the label kept on one line.
  tight?: boolean;
  // Only `icon`, in a round button as high as the size; the label is what screen readers say. For a
  // header button on a narrow screen ("Masayı bitir" at 320 dp).
  iconOnly?: boolean;
};

const SMALL_HEIGHT = SPACING[9];
const HEIGHT = { md: TOUCH.min, lg: SPACING[12] + SPACING[1] } as const;
// The busy mark per size (px) and its cross-fade with the label (hareket.md → "Düğmede bekleme").
const BUSY_MARK = { sm: 20, md: 24, lg: 28 } as const;
const LABEL_OUT_MS = 120;
const MARK_IN_MS = 160;
const MARK_IN_DELAY_MS = 60;
const LABEL_LIFT = SPACING[1];

// The label fades (and lifts a little) out and the busy mark fades in; with reduce motion only
// the fade.
function useBusy(loading: boolean) {
  const reduce = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(loading ? 1 : 0));
  useEffect(() => {
    const anim = loading
      ? Animated.timing(progress, {
          toValue: 1,
          duration: MARK_IN_DELAY_MS + MARK_IN_MS,
          easing: (u) => EASE_OUT(u),
          useNativeDriver: true,
        })
      : Animated.timing(progress, {
          toValue: 0,
          duration: LABEL_OUT_MS,
          easing: (u) => EASE_OUT(u),
          useNativeDriver: true,
        });
    anim.start();
    return () => anim.stop();
  }, [loading, progress]);
  const labelOut = LABEL_OUT_MS / (MARK_IN_DELAY_MS + MARK_IN_MS);
  const markIn = MARK_IN_DELAY_MS / (MARK_IN_DELAY_MS + MARK_IN_MS);
  return {
    label: {
      opacity: progress.interpolate({
        inputRange: [0, labelOut, 1],
        outputRange: [1, 0, 0],
      }),
      transform: reduce
        ? []
        : [
            {
              translateY: progress.interpolate({
                inputRange: [0, labelOut, 1],
                outputRange: [0, -LABEL_LIFT, -LABEL_LIFT],
              }),
            },
          ],
    },
    mark: {
      opacity: progress.interpolate({ inputRange: [0, markIn, 1], outputRange: [0, 0, 1] }),
    },
  };
}

export function Button({
  label,
  onPress,
  disabled,
  loading = false,
  variant = 'primary',
  size = 'md',
  icon,
  leading,
  detail,
  accessibilityLabel,
  testID,
  flush,
  stack,
  tight,
  iconOnly,
}: Props) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  const busy = useBusy(loading);
  const inactive = disabled || loading;

  const textOnly = isTextOnly(variant);
  const fill = buttonFill(variant, !!disabled);
  const bg = fill.bg ? colors[fill.bg] : 'transparent';
  const fg = colors[fill.fg];
  // The raised capsules carry an outline: they sit on the canvas, on cards and on fills alike.
  // Disabled, every filled role is the same neutral fill, without one.
  const edge: ViewStyle | null =
    !disabled && variant === 'secondary'
      ? { borderWidth: shape.stroke.hairline * 1.5, borderColor: colors.control }
      : null;
  const small = size === 'sm';
  const labelVariant: TypeVariant = small
    ? 'buttonSmall'
    : size === 'lg'
      ? 'buttonLarge'
      : 'button';
  // The busy mark: one colour on a filled button, the logo's colours on a raised or clear one.
  const filled = !textOnly && !edge;

  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    // With a detail ("Doğru +1" in half a row) the label needs the room more than the padding.
    gap: detail || small ? SPACING[1.5] : SPACING[2],
    paddingHorizontal: flush
      ? 0
      : small
        ? SPACING[3] + SPACING[0.5]
        : detail || tight
          ? SPACING[3]
          : size === 'lg'
            ? SPACING[6]
            : SPACING[5],
    justifyContent: flush ? 'flex-start' : 'center',
    paddingVertical: small ? SPACING[1] : SPACING[2],
    minHeight: small ? SMALL_HEIGHT : HEIGHT[size],
    borderRadius: shape.radius.pill,
    backgroundColor: bg,
  };
  const pressedFill: ViewStyle | null =
    variant === 'primary' && !disabled
      ? { backgroundColor: colors.primaryPressed }
      : variant === 'secondary' && !disabled
        ? { backgroundColor: colors.surface2 }
        : null;
  if (iconOnly) {
    style.width = style.minHeight;
    style.paddingHorizontal = 0;
  }

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? (detail ? `${label} ${detail}` : label)}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      // The small button's face is 36 high; its touch area is 44.
      hitSlop={small ? (TOUCH.min - SMALL_HEIGHT) / 2 : undefined}
    >
      {({ pressed }) => (
        <View
          style={[
            style,
            edge,
            textOnly && pressed ? { opacity: OPACITY.pressed } : null,
            pressed && !inactive ? pressedFill : null,
            pressScale(pressed && !inactive),
          ]}
        >
          <Animated.View
            style={[{ flexDirection: 'row', alignItems: 'center', gap: style.gap }, busy.label]}
            className="shrink"
          >
            {iconOnly && icon ? (
              <Ionicons name={icon} size={ICON.md} color={fg} />
            ) : (
              <>
                {leading ?? (icon ? <Ionicons name={icon} size={ICON.md} color={fg} /> : null)}
                {stack ? (
                  <View className="shrink items-center">
                    <Label variant={labelVariant} color={fg}>
                      {label}
                    </Label>
                    {detail ? (
                      <Label variant="buttonDetail" color={fg}>
                        {detail}
                      </Label>
                    ) : null}
                  </View>
                ) : (
                  // The detail on the same line is part of the label's text, so a label that
                  // does not fit shrinks with its detail ("Pas 3 hak"), never alone.
                  <Label variant={labelVariant} color={fg}>
                    {label}
                    {detail ? (
                      <Text variant="buttonDetail" color={fg}>
                        {` ${detail}`}
                      </Text>
                    ) : null}
                  </Label>
                )}
              </>
            )}
          </Animated.View>
          {loading ? (
            <Animated.View
              pointerEvents="none"
              className="absolute inset-0 items-center justify-center"
              style={busy.mark}
            >
              <Loader
                kind="meet"
                size={BUSY_MARK[size]}
                delay={0}
                label={null}
                mono={filled ? { color: fg, ground: bg } : undefined}
              />
            </Animated.View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

// One line, always (CLAUDE.md → Ekran davranışı): a label that does not fit shrinks rather than
// breaking onto a second line ("Şimdi değil", "Sağında").
function Label({
  variant,
  color,
  children,
}: {
  variant: TypeVariant;
  color: string;
  children: ReactNode;
}) {
  return (
    <Text
      variant={variant}
      color={color}
      align="center"
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
      className="shrink"
    >
      {children}
    </Text>
  );
}
