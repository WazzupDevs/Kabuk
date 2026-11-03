import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Round } from '@/aura/kit';
import { springConfig } from '@/aura/motion';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

// A profile photo opened large (the owner's call, 28 Ekim; docs/design/aura → Profil fotoğrafı):
// over a dark ground, a card 22 from the sides, it pops in 300 ms after the ground; a tap anywhere,
// the close button at the top, a swipe down (as Telegram's photo viewer; the owner's report, 2
// Kasım, 18.3) or the back button closes it. The picture is rounded itself, so no ground shows at
// its edge (18.2).
export function PhotoPreview({
  url,
  visible,
  onClose,
}: {
  url: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [grow] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!visible) return undefined;
    if (reduce) {
      grow.setValue(1);
      return undefined;
    }
    grow.setValue(0);
    const anim = Animated.sequence([
      Animated.delay(MOTION.cardOpen.contentAfterMs),
      Animated.spring(grow, { ...springConfig(MOTION.springs.pop), toValue: 1 }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [visible, reduce, grow]);
  const insets = useSafeAreaInsets();
  // The swipe down: the card follows the finger; past a fifth of its side (or flung) it closes,
  // else it springs back.
  const [drag] = useState(() => new Animated.Value(0));
  const side = width - KIT.photoCard.side * 2;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          g.dy > SWIPE_START && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => drag.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_e, g) => {
          if (g.dy > side * SWIPE_CLOSE || g.vy > SWIPE_FLING) onClose();
          else Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [drag, side, onClose],
  );
  useEffect(() => {
    if (visible) drag.setValue(0);
  }, [visible, drag]);
  if (!url) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.common.close}
        onPress={onClose}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: KIT.photoScrim, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Animated.View
          {...pan.panHandlers}
          style={{
            width: side,
            height: side,
            borderRadius: KIT.photoCard.radius,
            boxShadow: KIT.photoCard.shadow,
            opacity: grow.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
            transform: [
              { translateY: drag },
              { scale: grow.interpolate({ inputRange: [0, 1], outputRange: [PREVIEW_FROM, 1] }) },
            ],
          }}
        >
          <Image
            source={{ uri: url }}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={{ width: side, height: side, borderRadius: KIT.photoCard.radius }}
          />
        </Animated.View>
      </Pressable>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + SPACING[2], right: KIT.size.side }}
      >
        <Round light icon="close" label={tr.common.close} onPress={onClose} />
      </View>
    </Modal>
  );
}
const PREVIEW_FROM = 0.6;
// The swipe: claimed after 8 dp down, closes past a fifth of the side or at 1 dp/ms.
const SWIPE_START = 8;
const SWIPE_CLOSE = 0.2;
const SWIPE_FLING = 1;
