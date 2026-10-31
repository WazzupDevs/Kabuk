import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InSheet, T, useKit } from '@/aura/kit';
import { Peek, type PeekKind } from '@/aura/Peek';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { EASE_OUT } from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import type { IconName } from './Button';
import { Quiet } from './Quiet';
import { useSheetCloser } from './sheetCloser';
import { SheetCard } from './SheetCard';
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
  // Buddies looking over the sheet's top edge (docs/design/aura → CheckIn, Bildirimler).
  peek?: PeekKind;
  // The title larger (Masa kur: 24).
  titleLarge?: boolean;
  // The sheet reaches this far from the screen's top whatever its content (Masa kur: 96), which
  // then fills it; a `flexGrow` spacer in it keeps the last button at its foot.
  top?: number;
  children: ReactNode;
};

// A bottom sheet over a scrim: menus, confirmations and the join request. Always a trust surface
// (`Quiet`): hairlines, one clear action. It slides up and the scrim fades in; with reduce motion
// it appears at once. It closes the same way, then leaves the screen.
export function Sheet({
  visible,
  onClose,
  title,
  titleNote,
  icon,
  centered,
  peek,
  titleLarge,
  top,
  children,
}: Props) {
  const { colors, shape } = useTheme();
  const k = useKit();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  if (visible && !mounted) setMounted(true);
  // closeAllSheets: an open sheet closes as if tapped outside.
  const round = useSheetCloser((s) => s.round);
  const handled = useRef(round);
  useEffect(() => {
    if (round === handled.current) return;
    handled.current = round;
    if (visible) onClose?.();
  }, [round, visible, onClose]);

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
      {/* A Modal is a window of its own: the sheet's pull needs its own gesture root there. */}
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
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
          // docs/design/aura (`.sheet`), down to the screen's foot as Telegram Android's sheets (the
          // owner's call, 30 Ekim). Pulled down, it closes like a tap outside (SheetCard).
          style={{
            ...(top !== undefined ? { height: height - top } : { maxHeight: '90%' }),
            transform: [
              {
                translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
              },
            ],
          }}
        >
          <SheetCard
            onClose={onClose}
            bottomInset={insets.bottom}
            above={peek ? <Peek kind={peek} /> : null}
            fill={top !== undefined}
          >
            <InSheet>
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
                    <T
                      v={titleLarge ? 'sheetTitleLg' : 'title'}
                      center={centered}
                      accessibilityRole="header"
                    >
                      {title}
                      {titleNote ? <T v="fine">{`  ${titleNote}`}</T> : null}
                    </T>
                  ) : null}
                </View>
                <View
                  style={{
                    marginTop: title || icon ? KIT.size.sheetGap : 0,
                    gap: KIT.size.rowGap,
                    flexGrow: top !== undefined ? 1 : undefined,
                  }}
                >
                  {children}
                </View>
              </Quiet>
            </InSheet>
          </SheetCard>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
