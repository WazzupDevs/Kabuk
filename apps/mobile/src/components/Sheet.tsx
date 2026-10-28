import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { EASE_OUT } from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import type { IconName } from './Button';
import { Quiet } from './Quiet';
import { useSheetCloser } from './sheetCloser';
import { useSheetDrag } from './sheetDrag';
import { AppIcon } from './AppIcon';

// hareket.md → "Alt sayfa": in and out in 320 ms on the design system's ease out.
const SLIDE_MS = 320;
const ICON_DISC = 56;

type Props = {
  visible: boolean;
  // Without it the sheet can only be left through its own buttons (the join request).
  onClose?: () => void;
  // Unset: the content starts under the handle (a person's card opens with their face).
  title?: string;
  // Beside the title, small (skall tuvali, MasaKisiler: "Masadakiler 6 kişi").
  titleNote?: string;
  icon?: IconName;
  // Centered text for a single decision (the join request); menus stay left-aligned.
  centered?: boolean;
  children: ReactNode;
};

// A bottom sheet over a scrim: menus, confirmations and the join request. Always a trust surface
// (`Quiet`): hairlines, one clear action. It slides up and the scrim fades in; with reduce motion
// it appears at once. It closes the same way, then leaves the screen.
export function Sheet({ visible, onClose, title, titleNote, icon, centered, children }: Props) {
  const { colors, shape } = useTheme();
  const k = useKit();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  if (visible && !mounted) setMounted(true);
  // Pulled down, it closes like a tap outside (useSheetDrag); the next opening starts unpulled.
  const drag = useSheetDrag(onClose);
  const { reset } = drag;
  // closeAllSheets: an open sheet closes as if tapped outside.
  const round = useSheetCloser((s) => s.round);
  const handled = useRef(round);
  useEffect(() => {
    if (round === handled.current) return;
    handled.current = round;
    if (visible) onClose?.();
  }, [round, visible, onClose]);
  useEffect(() => {
    if (visible) reset();
  }, [visible, reset]);

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
          style={{ backgroundColor: k.c.scrim, opacity: progress }}
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
          // docs/design/aura (`.sheet`): a frosted card floating 10 from the edges, 36 round.
          style={{
            ...gradientStyle(k.c.sheet),
            marginHorizontal: KIT.size.sheetInset,
            marginBottom: KIT.size.sheetInset + insets.bottom,
            borderRadius: KIT.size.sheetRadius,
            borderWidth: KIT.size.edge,
            borderColor: k.c.glassEdge,
            boxShadow: k.c.glassShadow,
            paddingTop: KIT.size.sheetPadTop,
            paddingHorizontal: KIT.size.sheetPadX,
            paddingBottom: KIT.size.sheetPadBottom,
            maxHeight: '90%',
            transform: [
              {
                translateY: Animated.add(
                  progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
                  drag.offset,
                ),
              },
            ],
          }}
          {...drag.handlers}
        >
          <View
            className="self-center"
            style={{
              width: KIT.size.grabW,
              height: KIT.size.grabH,
              borderRadius: KIT.size.grabH,
              backgroundColor: k.c.grab,
              marginBottom: KIT.size.sheetGap,
            }}
          />
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            onScroll={drag.onScroll}
            scrollEventThrottle={16}
          >
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
                    <AppIcon name={icon} size={ICON.lg} color={colors.accent} />
                  </View>
                ) : null}
                {title ? (
                  <T v="title" center={centered} accessibilityRole="header">
                    {title}
                    {titleNote ? <T v="fine">{`  ${titleNote}`}</T> : null}
                  </T>
                ) : null}
              </View>
              <View
                style={{
                  marginTop: title || icon ? KIT.size.sheetGap : 0,
                  gap: KIT.size.rowGap,
                }}
              >
                {children}
              </View>
            </Quiet>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
