import { sideOf, type VampirRole } from '@shared/vampir.ts';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CachedSvg } from '@/components/CachedSvg';
import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { gradientStyle } from '@/theme/gradient';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { PEEK_SVG, VAMPIR_LOOK as L } from '@/theme/vampir';

import { type Faces, Face, nameOf } from './VampirParts';

// The role pictures (the owner's file: one scene a role, and the back every card shares).
export const ROLE_ART: Record<VampirRole | 'arka', ImageSourcePropType> = {
  arka: require('../../../../assets/vampir/arka.webp'),
  vampir: require('../../../../assets/vampir/vampir.webp'),
  doktor: require('../../../../assets/vampir/doktor.webp'),
  gozcu: require('../../../../assets/vampir/gozcu.webp'),
  koylu: require('../../../../assets/vampir/koylu.webp'),
  soytari: require('../../../../assets/vampir/soytari.webp'),
};

const MAX_FONT = 1.3;

// The role card (.sgc): the back while not held; held, it turns over to the role's scene, its
// name, side and what it does, and a vampire's mates. Only the person holding the phone sees it.
export function RoleCard({
  role,
  mates,
  faces,
}: {
  role: VampirRole;
  mates: readonly string[];
  faces: Faces;
}) {
  const { height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [turn] = useState(() => new Animated.Value(0));
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const anim = Animated.timing(turn, {
      toValue: open ? 1 : 0,
      duration: reduce ? 0 : L.motion.flipMs,
      easing: Easing.bezier(...L.motion.flip),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [open, turn, reduce]);
  // The file: min(50vh, 380), three by four.
  const cardHeight = Math.min(height * CARD_SHARE, CARD_MAX);
  const cardWidth = (cardHeight * 3) / 4;
  const face = (side: 'back' | 'front') => ({
    position: 'absolute' as const,
    width: cardWidth,
    height: cardHeight,
    borderRadius: L.size.roleCard,
    borderWidth: L.size.roleEdge,
    borderColor: L.tileOn,
    overflow: 'hidden' as const,
    backgroundColor: L.dark,
    backfaceVisibility: 'hidden' as const,
    boxShadow: L.shadow.roleCard,
    transform: [
      { perspective: PERSPECTIVE },
      {
        rotateY: turn.interpolate({
          inputRange: [0, 1],
          outputRange: side === 'back' ? ['0deg', '180deg'] : ['180deg', '360deg'],
        }),
      },
    ],
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr.vampir.cardLabel}
      onPressIn={() => {
        setOpen(true);
        haptic('selection');
      }}
      onPressOut={() => setOpen(false)}
      style={{ width: cardWidth, height: cardHeight, alignSelf: 'center' }}
    >
      <Animated.View style={face('back')}>
        <Image source={ROLE_ART.arka} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.foot}>
          <View style={styles.shade} />
          <Text maxFontSizeMultiplier={MAX_FONT} style={[KIT_TYPE.h3, styles.white]}>
            {tr.vampir.holdTitle}
          </Text>
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[KIT_TYPE.fine, KIT_TYPE.strong, styles.white]}
          >
            {tr.vampir.holdNote}
          </Text>
        </View>
      </Animated.View>
      <Animated.View style={face('front')}>
        <Image source={ROLE_ART[role]} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.label}>
          <Text maxFontSizeMultiplier={1} style={[KIT_TYPE.eyebrow, styles.white]}>
            {tr.vampir.yourRole}
          </Text>
        </View>
        <View style={styles.foot}>
          <View style={styles.shade} />
          <Text maxFontSizeMultiplier={MAX_FONT} style={[KIT_TYPE.displaySm, styles.white]}>
            {tr.vampir.roles[role].name}
          </Text>
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.team }]}
          >
            {tr.vampir.teams[sideOf(role)]}
          </Text>
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[KIT_TYPE.fine, styles.white, styles.center]}
          >
            {tr.vampir.roles[role].about}
          </Text>
          {mates.length > 0 ? (
            <View style={styles.mates}>
              {mates.map((m) => (
                <View key={m} style={styles.mate}>
                  <Face faces={faces} sid={m} size="sm" />
                  <Text
                    maxFontSizeMultiplier={1}
                    style={[KIT_TYPE.fine, KIT_TYPE.strong, styles.white]}
                  >
                    {nameOf(faces, m)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}
const CARD_SHARE = 0.5;
const CARD_MAX = 380;
const PERSPECTIVE = 1000;

// "Rolüm" at the top right: a round like the game's close (the owner's call, 29 Ekim), the card's
// back in it; held, a small card with the role's picture, name and side.
export function PeekRole({ role }: { role: VampirRole }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.vampir.myRoleLabel}
        onPressIn={() => {
          setOpen(true);
          haptic('selection');
        }}
        onPressOut={() => setOpen(false)}
        hitSlop={4}
        testID="vampir-peek"
        style={[styles.peek, open ? styles.peekOn : null]}
      >
        <CachedSvg xml={PEEK_SVG} width={PEEK_ICON} height={PEEK_ICON} />
      </Pressable>
      {open ? (
        <View pointerEvents="none" style={styles.pop}>
          <Image source={ROLE_ART[role]} style={styles.popArt} resizeMode="cover" />
          <View>
            <Text maxFontSizeMultiplier={MAX_FONT} style={[KIT_TYPE.h3, { color: L.dark }]}>
              {tr.vampir.roles[role].name}
            </Text>
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.muted }]}
            >
              {tr.vampir.teams[sideOf(role)]}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
const PEEK_ICON = 24;

const styles = StyleSheet.create({
  white: { color: L.ink },
  center: { textAlign: 'center' },
  foot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 4,
    paddingTop: 28,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    ...gradientStyle(L.capShade),
  },
  label: {
    position: 'absolute',
    top: 10,
    left: 10,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: L.label,
  },
  mates: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  mate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingLeft: 3,
    paddingRight: 8,
    borderRadius: 14,
    backgroundColor: L.chip,
  },
  peek: {
    width: KIT.size.round,
    height: KIT.size.round,
    borderRadius: KIT.size.round / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: L.chip,
  },
  peekOn: { backgroundColor: L.chipOn },
  pop: {
    position: 'absolute',
    right: 0,
    top: KIT.size.round + 8,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: L.tileOn,
    boxShadow: L.shadow.pop,
  },
  popArt: { width: L.size.popArt * 0.75, height: L.size.popArt, borderRadius: 8 },
});
