import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { EASE_OUT } from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, OPACITY, SPACING } from '@/theme/tokens';

import type { IconName } from './Button';
import { Quiet } from './Quiet';
import { Text } from './Text';

// hareket.md → "Alt sayfa": in and out in 320 ms on the design system's ease out.
const SLIDE_MS = 320;
const HANDLE = { width: 40, height: 5 } as const;
const ICON_DISC = 56;

type Props = {
  visible: boolean;
  // Without it the sheet can only be left through its own buttons (the join request).
  onClose?: () => void;
  title: string;
  icon?: IconName;
  // Centered text for a single decision (the join request); menus stay left-aligned.
  centered?: boolean;
  children: ReactNode;
};

// A bottom sheet over a scrim: menus, confirmations and the join request. Always a trust surface
// (`Quiet`): hairlines, one clear action. It slides up and the scrim fades in; with reduce motion
// it appears at once. It closes the same way, then leaves the screen.
export function Sheet({ visible, onClose, title, icon, centered, children }: Props) {
  const { colors, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return undefined;
    const anim = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduce ? 0 : SLIDE_MS,
      easing: (u) => EASE_OUT(u),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => anim.stop();
  }, [visible, mounted, reduce, progress]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={onClose ?? (() => undefined)}
    >
      <View className="flex-1 justify-end">
        <Animated.View
          pointerEvents="box-none"
          className="absolute inset-0"
          style={{ backgroundColor: withAlpha(colors.scrim, OPACITY.scrim), opacity: progress }}
        />
        <Pressable
          accessibilityRole={onClose ? 'button' : undefined}
          accessibilityLabel={onClose ? tr.common.close : undefined}
          disabled={!onClose}
          onPress={onClose}
          className="absolute inset-0"
        />
        <Animated.View
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: shape.radius.xl,
            borderTopRightRadius: shape.radius.xl,
            boxShadow: shape.shadow.sheet,
            paddingTop: SPACING[2.5],
            paddingHorizontal: SPACING[5],
            paddingBottom: SPACING[6] + insets.bottom,
            maxHeight: '90%',
            transform: [
              {
                translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
              },
            ],
          }}
        >
          <View
            className="mb-2 self-center"
            style={{
              width: HANDLE.width,
              height: HANDLE.height,
              borderRadius: shape.radius.pill,
              backgroundColor: colors.divider,
            }}
          />
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            <Quiet value>
              <View className={`gap-3 ${centered ? 'items-center' : ''}`}>
                {icon ? (
                  <View
                    className="mt-2 items-center justify-center"
                    style={{
                      width: ICON_DISC,
                      height: ICON_DISC,
                      borderRadius: shape.radius.pill,
                      backgroundColor: colors.surface2,
                    }}
                  >
                    <Ionicons name={icon} size={ICON.lg} color={colors.accent} />
                  </View>
                ) : null}
                <Text
                  variant="title"
                  align={centered ? 'center' : undefined}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
              </View>
              <View className="mt-3 gap-3">{children}</View>
            </Quiet>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
