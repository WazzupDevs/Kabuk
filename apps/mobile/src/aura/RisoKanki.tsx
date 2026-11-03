import { Image } from 'expo-image';
import { type ReactNode, useEffect } from 'react';
import { type ImageSourcePropType, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA } from '@/theme/aura';
import {
  KANKI_BEATS,
  KANKI_FRAME_WIDTH,
  KANKI_LOOP_S,
  KANKI_ORIGIN,
  KANKI_SHADOW,
  kankiFrame,
  type KankiId,
  type KankiPlace,
} from '@/theme/kankiMotion';
import { useTheme } from '@/theme/ThemeProvider';

// The riso buddies (assets/riso/buddies, 320x420), and the closed-eye picture of those that blink.
const OPEN: Record<KankiId, ImageSourcePropType> = {
  b83534: require('../../assets/riso/buddies/riso_b83534.webp'),
  '7d5ef2': require('../../assets/riso/buddies/riso_7d5ef2.webp'),
  '3c95b1': require('../../assets/riso/buddies/riso_3c95b1.webp'),
  '4957ac': require('../../assets/riso/buddies/riso_4957ac.webp'),
  '1a80a9': require('../../assets/riso/buddies/riso_1a80a9.webp'),
  '6f419d': require('../../assets/riso/buddies/riso_6f419d.webp'),
  f280a5: require('../../assets/riso/buddies/riso_f280a5.webp'),
  af811f: require('../../assets/riso/buddies/riso_af811f.webp'),
  '9c96bd': require('../../assets/riso/buddies/riso_9c96bd.webp'),
  c189a4: require('../../assets/riso/buddies/riso_c189a4.webp'),
  d2fbb5: require('../../assets/riso/buddies/riso_d2fbb5.webp'),
  'peek-1': require('../../assets/riso/peek-1.webp'),
  'peek-2': require('../../assets/riso/peek-2.webp'),
};
const CLOSED: Partial<Record<KankiId, ImageSourcePropType>> = {
  b83534: require('../../assets/riso/buddies/riso_b83534_c.webp'),
  '7d5ef2': require('../../assets/riso/buddies/riso_7d5ef2_c.webp'),
  '3c95b1': require('../../assets/riso/buddies/riso_3c95b1_c.webp'),
  '4957ac': require('../../assets/riso/buddies/riso_4957ac_c.webp'),
  '1a80a9': require('../../assets/riso/buddies/riso_1a80a9_c.webp'),
  '6f419d': require('../../assets/riso/buddies/riso_6f419d_c.webp'),
  f280a5: require('../../assets/riso/buddies/riso_f280a5_c.webp'),
};
// The sign-up scene (riso-kayit, 800x920).
const SIGNUP_GROUND = require('../../assets/riso/scene-signup.webp');
// Aura v75 KayitKoyu: the dark scheme's own scene (riso-kayit-koyu; 800x920, the @3x 978x1125).
const SIGNUP_GROUND_DARK = require('../../assets/riso/scene-signup-dark.webp');

// The loop's clock in seconds (0 → 6, again and again) while the screen is on top and the app in
// front; still at 0 with reduce motion (§13.1: everyone stands, eyes open).
export function useKankiClock(): SharedValue<number> {
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce || !active) {
      cancelAnimation(t);
      if (reduce) t.set(0);
      return undefined;
    }
    t.set(
      withRepeat(
        withTiming(KANKI_LOOP_S, { duration: KANKI_LOOP_S * 1000, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(t);
  }, [reduce, active, t]);
  return t;
}

// Where a buddy stands, scaled from the board's 350 wide frame to the scene's width.
function placeStyle(p: KankiPlace, k: number) {
  return {
    position: 'absolute' as const,
    width: p.width * k,
    height: p.height * k,
    ...(p.left !== undefined ? { left: p.left * k } : null),
    ...(p.right !== undefined ? { right: p.right * k } : null),
    ...(p.bottom !== undefined ? { bottom: p.bottom * k } : null),
    ...(p.top !== undefined ? { top: p.top * k } : null),
  };
}

// One riso buddy (`.stand`): its picture over a soft shadow at its feet. With `clock` it moves
// (§13.1); without it, or with reduce motion, it stands still with its eyes open. `shadow: false`
// for one that looks over a field (`.peek`, no shadow on the board).
export function RisoKanki({
  place,
  scale,
  clock,
  shadow = true,
  children,
}: {
  place: KankiPlace;
  scale: number;
  clock?: SharedValue<number>;
  shadow?: boolean;
  children?: ReactNode;
}) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const beat = KANKI_BEATS[place.id];
  const moving = !!clock && !!beat && !reduce;
  const closedSource = CLOSED[place.id];
  const body = useAnimatedStyle(() => {
    if (!moving || !clock || !beat) return {};
    const f = kankiFrame(beat, clock.value);
    return {
      transform: [
        { translateY: f.translateY * scale },
        { rotate: `${f.rotate}deg` },
        { scaleX: f.scaleX },
        { scaleY: f.scaleY },
      ],
    };
  });
  const open = useAnimatedStyle(() => {
    if (!moving || !clock || !beat) return { opacity: 1 };
    return { opacity: kankiFrame(beat, clock.value).closed ? 0 : 1 };
  });
  const closed = useAnimatedStyle(() => {
    if (!moving || !clock || !beat) return { opacity: 0 };
    return { opacity: kankiFrame(beat, clock.value).closed ? 1 : 0 };
  });
  const foot = useAnimatedStyle(() => {
    if (!moving || !clock || !beat) return {};
    const s = kankiFrame(beat, clock.value).shadow;
    return { opacity: s, transform: [{ scale: s }] };
  });
  const box = placeStyle(place, scale);
  return (
    <View pointerEvents="none" style={box}>
      {shadow ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: `${((1 - KANKI_SHADOW.width) / 2) * 100}%`,
              width: `${KANKI_SHADOW.width * 100}%`,
              bottom: `${KANKI_SHADOW.bottom * 100}%`,
              height: `${KANKI_SHADOW.height * 100}%`,
              borderRadius: box.width,
              backgroundColor: scheme === 'dark' ? KANKI_SHADOW.colorDark : KANKI_SHADOW.color,
              filter: [{ blur: KANKI_SHADOW.blur }],
            },
            foot,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transformOrigin: `${KANKI_ORIGIN.x * 100}% ${KANKI_ORIGIN.y * 100}%` },
          body,
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, open]}>
          <Image source={OPEN[place.id]} style={StyleSheet.absoluteFill} contentFit="contain" />
        </Animated.View>
        {moving && closedSource ? (
          <Animated.View style={[StyleSheet.absoluteFill, closed]}>
            <Image source={closedSource} style={StyleSheet.absoluteFill} contentFit="contain" />
          </Animated.View>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

// U39: the scene's 28 corners (ekran.css `.scene`, --r-xl).
const SIGNUP_SCENE_RADIUS = AURA.card.radius;

// The sign-up scene's box (`.scene` with riso-kayit): the picture covers it from the bottom, no floor
// glow, the light inner edge; the buddies placed in it at `width / 350`. It fills its parent.
export function SignupScene({
  width,
  children,
}: {
  width: number;
  children?: (scale: number) => ReactNode;
}) {
  const { scheme } = useTheme();
  const k = width / KANKI_FRAME_WIDTH;
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { borderRadius: SIGNUP_SCENE_RADIUS, overflow: 'hidden' }]}
    >
      <Image
        source={scheme === 'dark' ? SIGNUP_GROUND_DARK : SIGNUP_GROUND}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="bottom"
      />
      {width > 0 && children ? children(k) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: SIGNUP_SCENE_RADIUS,
            borderWidth: AURA.card.edgeWidth,
            borderColor: AURA.scene[scheme].edge,
          },
        ]}
      />
    </View>
  );
}
