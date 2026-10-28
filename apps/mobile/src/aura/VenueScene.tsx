import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { CachedSvg } from '@/components/CachedSvg';
import { useLoopActive } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import {
  type SceneBuddy,
  type SceneKind,
  type SceneMotion,
  type ScenePiece,
  type SceneScheme,
  VENUE_FRAME,
  VENUE_SCENES,
} from '@/theme/venueScene';

import { Buddy } from './Buddy';
import { ARRIVE_RN } from './motion';

// The venue page's scene (theme/venueScene.ts): the buddies at a table, busy with what the place
// is for, its small things moving on their own. `width` wide, anchored at its parent's bottom. The
// buddies arrive one after another from `delay`; the things fade in with them. Every motion loops
// on the native driver (loopGuard), only while the screen is on top and the app in front; still
// when motion is reduced.
export function VenueScene({
  kind,
  width,
  delay = 0,
}: {
  kind: SceneKind;
  width: number;
  delay?: number;
}) {
  const scene = VENUE_SCENES[kind];
  const k = width / VENUE_FRAME.width;
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const active = useLoopActive();
  const moving = active && !reduce;
  const [arrive] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return undefined;
    const anim = Animated.timing(arrive, {
      toValue: 1,
      duration: ARRIVE_MS,
      delay: delay + ARRIVE_AFTER_MS,
      easing: ARRIVE_RN,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduce, delay, arrive]);
  const things = {
    opacity: arrive,
    transform: [{ translateY: arrive.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
  const pieces = (list: ScenePiece[]) => (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, things]}>
      {list.map((p) => (
        <Piece key={p.id} piece={p} k={k} scheme={scheme} moving={moving} />
      ))}
    </Animated.View>
  );
  const buddies = (list: SceneBuddy[], from: number) =>
    list.map((b, i) => (
      <View key={b.look + i} style={{ position: 'absolute', left: b.x * k, bottom: b.bottom * k }}>
        <Buddy
          look={b.look}
          height={b.height * k}
          delay={delay + (from + i) * CAST_STEP}
          phase={(from + i) * 530}
        />
      </View>
    ));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces(scene.back)}
      {buddies(scene.rear, 0)}
      {pieces(scene.table)}
      {buddies(scene.side, scene.rear.length)}
      {pieces(scene.held)}
    </View>
  );
}

const CAST_STEP = 80;
const ARRIVE_AFTER_MS = 120;
const ARRIVE_MS = 420;

function Piece({
  piece,
  k,
  scheme,
  moving,
}: {
  piece: ScenePiece;
  k: number;
  scheme: SceneScheme;
  moving: boolean;
}) {
  const xml = useMemo(() => piece.xml(scheme), [piece, scheme]);
  const m = piece.motion;
  const [v] = useState(() => new Animated.Value(m ? rest(m) : 0));
  useEffect(() => {
    if (!m) return undefined;
    v.setValue(rest(m));
    if (!moving) return undefined;
    const anim = loop(m, v);
    const start = setTimeout(() => anim.start(), m.delay);
    return () => {
      clearTimeout(start);
      anim.stop();
    };
  }, [m, moving, v]);
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: piece.x * k,
          bottom: (VENUE_FRAME.height - piece.y - piece.h) * k,
          width: piece.w * k,
          height: piece.h * k,
        },
        m ? motionStyle(m, v, k) : null,
      ]}
    >
      <CachedSvg xml={xml} width={piece.w * k} height={piece.h * k} />
    </Animated.View>
  );
}

// Where a motion rests while it does not play (reduced motion, the screen under another): steam
// halfway up, so it still shows; the rest at its start.
function rest(m: SceneMotion): number {
  if (m.kind === 'steam') return STEAM_REST;
  if (m.kind === 'swing') return 0.5;
  if (m.kind === 'twinkle') return 1;
  return 0;
}
const STEAM_REST = 0.35;

const SINE = Easing.inOut(Easing.sin);
const t = (v: Animated.Value, toValue: number, duration: number, easing = SINE) =>
  Animated.timing(v, { toValue, duration, easing, useNativeDriver: true });

function loop(m: SceneMotion, v: Animated.Value): Animated.CompositeAnimation {
  switch (m.kind) {
    case 'steam':
      return Animated.loop(
        Animated.sequence([t(v, 0, 0), t(v, 1, m.ms, Easing.linear), t(v, 0, 0)]),
      );
    case 'bob':
      return Animated.loop(
        Animated.sequence([t(v, 1, m.ms / 2), t(v, 0, m.ms / 2), Animated.delay(m.rest)]),
      );
    case 'swing':
      return Animated.loop(
        Animated.sequence([t(v, 1, m.ms / 4), t(v, 0, m.ms / 2), t(v, 0.5, m.ms / 4)]),
      );
    case 'twinkle':
      return Animated.loop(Animated.sequence([t(v, 0, m.ms / 2), t(v, 1, m.ms / 2)]));
    case 'pop':
      return Animated.loop(
        Animated.sequence([
          t(v, 1, m.ms * 0.25, Easing.out(Easing.back(2))),
          Animated.delay(m.ms * 0.5),
          t(v, 0, m.ms * 0.25, Easing.in(Easing.quad)),
          Animated.delay(m.rest),
        ]),
      );
    case 'flip':
      return Animated.loop(
        Animated.sequence([
          t(v, 1, m.ms, Easing.inOut(Easing.quad)),
          Animated.delay(m.rest),
          t(v, 0, 0),
        ]),
      );
    case 'hop':
      return Animated.loop(
        Animated.sequence([t(v, 1, m.ms, Easing.linear), Animated.delay(m.rest), t(v, 0, 0)]),
      );
    case 'glide':
      return Animated.loop(
        Animated.sequence([t(v, 1, m.ms, Easing.linear), Animated.delay(m.rest), t(v, 0, 0)]),
      );
  }
}

const deg = (n: number) => `${n}deg`;

function motionStyle(m: SceneMotion, v: Animated.Value, k: number) {
  switch (m.kind) {
    case 'steam':
      return {
        opacity: v.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 0.6, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -m.rise * k] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) },
        ],
      };
    case 'bob':
      return {
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -m.y * k] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [deg(0), deg(m.turn)] }) },
        ],
      };
    case 'swing':
      return {
        transformOrigin: 'top' as const,
        transform: [
          {
            rotate: v.interpolate({ inputRange: [0, 1], outputRange: [deg(-m.turn), deg(m.turn)] }),
          },
        ],
      };
    case 'twinkle':
      return { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [m.low, 1] }) };
    case 'pop':
      return {
        transformOrigin: 'bottom' as const,
        opacity: v.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, 1, 1],
          extrapolate: 'clamp',
        }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
      };
    case 'flip':
      return {
        transformOrigin: 'left' as const,
        transform: [
          { perspective: PERSPECTIVE * k },
          { rotateY: v.interpolate({ inputRange: [0, 1], outputRange: [deg(0), deg(-180)] }) },
        ],
      };
    case 'hop':
      return {
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, -0.75 * m.y * k, -m.y * k, -0.75 * m.y * k, 0],
            }),
          },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [deg(0), deg(m.spin)] }) },
        ],
      };
    case 'glide':
      return {
        opacity: v.interpolate({ inputRange: [0, 0.06, 0.94, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, m.dx * k] }) },
          {
            translateY: v.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, -m.dy * k, 0, m.dy * k, 0],
            }),
          },
          {
            rotate: v.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [deg(0), deg(-6), deg(0), deg(6), deg(0)],
            }),
          },
        ],
      };
  }
}

// The page's turn seen from a little in front.
const PERSPECTIVE = 320;
