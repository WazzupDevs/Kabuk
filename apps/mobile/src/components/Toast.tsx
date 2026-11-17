import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';

import { T } from '@/aura/kit';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { EASE_BACK, TOAST } from '@/theme/gameMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// A notice: a new `id` shows it again, even with the same words.
export type ToastMessage = {
  id: number | string;
  title: string;
  // The line under the title, at 70 %.
  sub?: string;
  // The button at the end ("Tekrar dene"). With a button the notice stays until the caller clears
  // `message` or the button is pressed; without one it goes after TOAST.showMs.
  action?: { label: string; onPress: () => void; testID?: string };
  // Something before the words (an icon, 22).
  lead?: ReactNode;
  // Stays without a button too, until the caller clears or replaces it (a request waiting for its
  // answer, MasaIstekBekliyor).
  stay?: boolean;
};

type Props = {
  message: ToastMessage | null;
  // Where it floats from the top of its parent.
  top?: number;
  // Or from its parent's foot (Mekan's request notice over the tab bar, MasaIstekBekliyor `.snk`):
  // it then comes up into place rather than down.
  bottom?: number;
  testID?: string;
};

export const TOAST_TOP = SPACING[16] - SPACING[0.5];

// The top notice (yeni arayüz tuvali, 16 Kasım; ortak-temel-plan.md → A12, C4; the earlier game
// notice's motion): the ink with white words, turned over in the dark; 20 from the sides, 20
// round, title 14/600, a line under it, a 36 button at the end. It sits over the content and lets
// touches through except on its own button. Screen readers hear it once, announced. Its values
// are KIT.layer's.
export function Toast({ message, top = TOAST_TOP, bottom, testID }: Props) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const layer = KIT.layer[scheme];
  const size = KIT.layer.size;
  // The notice that was dismissed or timed out; a new id shows again.
  const [gone, setGone] = useState<ToastMessage['id'] | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const shown = message && message.id !== gone ? message : null;
  // Only a new id starts it again: a screen re-renders every second and may pass a new object
  // with the same id.
  const id = message?.id;
  const said = useRef('');
  const stays = useRef(false);
  useEffect(() => {
    said.current = message ? [message.title, message.sub].filter(Boolean).join('. ') : '';
    stays.current = !!message?.action || !!message?.stay;
  }, [message]);

  useEffect(() => {
    if (id === undefined) return undefined;
    // Said once per notice: a live region on a view mounted just now is not always read.
    AccessibilityInfo.announceForAccessibility(said.current);
    progress.setValue(reduce ? 1 : 0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: reduce ? 0 : TOAST.inMs,
      easing: (u) => EASE_BACK(u),
      useNativeDriver: true,
    });
    anim.start();
    const hide = stays.current ? null : setTimeout(() => setGone(id), TOAST.showMs);
    return () => {
      anim.stop();
      if (hide) clearTimeout(hide);
    };
  }, [id, progress, reduce]);

  if (!shown) return null;
  const { action, lead } = shown;
  return (
    <Animated.View
      pointerEvents={action ? 'box-none' : 'none'}
      testID={testID}
      style={{
        position: 'absolute',
        ...(bottom === undefined ? { top } : { bottom }),
        left: size.toastSide,
        right: size.toastSide,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [bottom === undefined ? TOAST.fromY : -TOAST.fromY, 0],
            }),
          },
          {
            scale: progress.interpolate({ inputRange: [0, 1], outputRange: [TOAST.fromScale, 1] }),
          },
        ],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: size.toastGap,
          paddingVertical: size.toastPad,
          paddingRight: size.toastPad,
          paddingLeft: size.toastPadLeft,
          borderRadius: size.toastRadius,
          backgroundColor: layer.toast,
          boxShadow: layer.toastShadow,
        }}
      >
        {lead}
        <View style={{ flex: 1 }}>
          <T v="toastTitle" color={layer.onToast}>
            {shown.title}
          </T>
          {shown.sub ? (
            <T v="toastSub" color={layer.onToast} style={{ opacity: size.toastSubOpacity }}>
              {shown.sub}
            </T>
          ) : null}
        </View>
        {action ? (
          <Pressable
            testID={action.testID}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => {
              setGone(shown.id);
              action.onPress();
            }}
            style={{
              height: size.toastButton,
              paddingHorizontal: size.toastButtonPadX,
              borderRadius: size.toastButton / 2,
              backgroundColor: layer.toastButton,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              maxFontSizeMultiplier={1.3}
              style={[KIT_TYPE.toastBtn, { color: layer.onToast }]}
            >
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
