import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, useEffect, useState } from 'react';
import { Animated, Pressable, View, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { EASE_OUT } from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING, TOUCH } from '@/theme/tokens';

import { Loader } from './Loader';
import { usePressScale } from './motion';
import { Text } from './Text';

// Roles (the skall design system → Button): `primary` the one main action per screen, accent
// filled; `secondary` and `neutral` a raised capsule with an outline (every other action);
// `positive` green ("Doğru", "Arkadaşlar"); `danger` red ("Masayı bitir"). `ghost` (an accent link)
// and `dangerText` ("Hesabımı sil") are text only. No outlined, hard-shadowed "3D" face: pressed,
// a button shrinks to 97 %.
export type ButtonVariant =
  'primary' | 'secondary' | 'positive' | 'danger' | 'neutral' | 'ghost' | 'dangerText';
export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  // Busy: the label stays in place, invisible (the width does not change), and Buluş takes its
  // place; a second press does nothing.
  loading?: boolean;
  variant?: ButtonVariant;
  // sm: a header button ("Mekandan ayrıl"), 40 high with the touch area grown to 48.
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  // A short addition after the label ("+1", "2 hak").
  detail?: string;
  // Colours that are not theme tokens: only the reveal signal, filled or outlined.
  tint?: { background: string; foreground: string; outline?: boolean };
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

const SMALL_HEIGHT = SPACING[10];
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
  detail,
  tint,
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

  const fills: Record<ButtonVariant, { bg: string; fg: string }> = {
    primary: { bg: colors.accent, fg: colors.onAccent },
    secondary: { bg: colors.raised, fg: colors.text },
    positive: { bg: colors.success, fg: colors.onSuccess },
    danger: { bg: colors.danger, fg: colors.onDanger },
    neutral: { bg: colors.raised, fg: colors.text },
    ghost: { bg: 'transparent', fg: colors.accent },
    dangerText: { bg: 'transparent', fg: colors.danger },
  };
  const textOnly = variant === 'ghost' || variant === 'dangerText';
  let { bg, fg } = fills[variant];
  // The raised capsules carry an outline: they sit on the canvas, on cards and on fills alike.
  let edge: ViewStyle | null =
    variant === 'secondary' || variant === 'neutral'
      ? { borderWidth: shape.stroke.hairline * 1.5, borderColor: colors.border }
      : null;
  if (tint) {
    bg = tint.outline ? 'transparent' : tint.background;
    fg = tint.outline ? tint.background : tint.foreground;
    edge = tint.outline
      ? { borderWidth: shape.stroke.control, borderColor: tint.background }
      : null;
  }
  const small = size === 'sm';
  // The busy mark: one colour on a filled button, the logo's colours on a raised or clear one.
  const filled = !textOnly && !edge && !tint?.outline;

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
          : SPACING[5],
    justifyContent: flush ? 'flex-start' : 'center',
    paddingVertical: small ? SPACING[1] : SPACING[2],
    minHeight: small ? SMALL_HEIGHT : size === 'lg' ? TOUCH.large : TOUCH.button,
    borderRadius: shape.radius.pill,
    backgroundColor: bg,
  };
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
      // The small button's face is 40 high; its touch area is 48.
      hitSlop={small ? (TOUCH.button - SMALL_HEIGHT) / 2 : undefined}
    >
      {({ pressed }) => (
        <View
          style={[
            style,
            edge,
            disabled ? { opacity: OPACITY.disabled } : null,
            textOnly && pressed ? { opacity: OPACITY.pressed } : null,
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
                {icon ? <Ionicons name={icon} size={ICON.md} color={fg} /> : null}
                <View
                  className={stack ? 'shrink items-center' : 'shrink flex-row items-baseline gap-1'}
                >
                  <Text
                    variant={small ? 'buttonSmall' : size === 'lg' ? 'buttonLarge' : 'button'}
                    color={fg}
                    align="center"
                    // One line, always (CLAUDE.md → Ekran davranışı): a label that does not fit
                    // shrinks rather than breaking onto a second line ("Şimdi değil", "Sağında").
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    className="shrink"
                  >
                    {label}
                  </Text>
                  {detail ? (
                    <Text
                      variant="buttonDetail"
                      color={fg}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {detail}
                    </Text>
                  ) : null}
                </View>
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
