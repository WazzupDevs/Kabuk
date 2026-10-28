import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { springConfig } from '@/aura/motion';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';

// A profile photo opened large (the owner's call, 28 Ekim): over a dark ground, as wide as the
// screen within its sides, it grows in from smaller; a tap anywhere or the back button closes it.
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
    const anim = Animated.spring(grow, { ...springConfig(MOTION.springs.pop), toValue: 1 });
    anim.start();
    return () => anim.stop();
  }, [visible, reduce, grow]);
  const side = width - KIT.size.side * 2;
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
          style={{
            opacity: grow.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
            transform: [
              { scale: grow.interpolate({ inputRange: [0, 1], outputRange: [PREVIEW_FROM, 1] }) },
            ],
          }}
        >
          <Image
            source={{ uri: url }}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={{ width: side, height: side, borderRadius: KIT.size.glassRadius }}
          />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
const PREVIEW_FROM = 0.6;
