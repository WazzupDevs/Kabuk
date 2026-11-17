import { Image } from 'expo-image';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  type ImageSourcePropType,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Reanimated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import {
  buddyFrame,
  groundFrame,
  INTRO_LOOPS,
  INTRO_PLACES,
  INTRO_STAGE,
  type RiseFrame,
  type StageBox,
  stageScale,
  tableFrame,
} from '@/theme/introScene';

// The first screen's riso scene (yeni arayüz tuvali, pano 47 KayitAcilis; assets/riso/acilis).
const GROUND = require('../../assets/riso/acilis/zemin.webp');
const LAMP = require('../../assets/riso/acilis/lamba.webp');
const TABLE = require('../../assets/riso/acilis/masa.webp');
const BUDDIES: readonly ImageSourcePropType[] = [
  require('../../assets/riso/acilis/kanki-1.webp'),
  require('../../assets/riso/acilis/kanki-2.webp'),
  require('../../assets/riso/acilis/kanki-3.webp'),
  require('../../assets/riso/acilis/kanki-4.webp'),
];
const STARS: readonly ImageSourcePropType[] = [
  require('../../assets/riso/acilis/yildiz-1.webp'),
  require('../../assets/riso/acilis/yildiz-2.webp'),
  require('../../assets/riso/acilis/yildiz-3.webp'),
];

const [c1, c2, c3, c4] = INTRO_LOOPS.curve;
const LOOP_EASING = Easing.bezier(c1, c2, c3, c4);

// One of the board's endless loops (bob, swing, tw): 0 → 1 → 0 over `ms`, ease-in-out each way,
// after `delay`, on the native driver (loopGuard.test.ts). Off, it rests at 0 and the caller draws
// the part at rest.
function useLoop(on: boolean, ms: number, delay: number): Animated.Value {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    v.setValue(0);
    if (!on) return undefined;
    const half = { duration: ms / 2, easing: LOOP_EASING, useNativeDriver: true };
    const run = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { ...half, toValue: 1 }),
          Animated.timing(v, { ...half, toValue: 0 }),
        ]),
      ),
    ]);
    run.start();
    return () => run.stop();
  }, [on, ms, delay, v]);
  return v;
}

const place = (b: StageBox, k: number): ViewStyle => ({
  position: 'absolute' as const,
  left: b.left * k,
  top: b.top * k,
  width: b.width * k,
  height: b.height * k,
});

// An entrance on the UI thread, from the scene's clock: attached only while the scene plays. Still,
// it is a plain view at rest, so the first drawn value React keeps is never a hidden one
// (docs/decisions/m15-22-acilis-olcegi.md).
function Enter({
  t,
  frame,
  k,
  still,
  style,
  children,
}: {
  t: SharedValue<number>;
  frame: (t: number) => RiseFrame;
  k: number;
  still: boolean;
  style: ViewStyle;
  children: ReactNode;
}) {
  const motion = useAnimatedStyle(() => {
    const f = frame(t.value);
    return { opacity: f.opacity, transform: [{ translateY: f.dy * k }] };
  });
  return <Reanimated.View style={[style, still ? null : motion]}>{children}</Reanimated.View>;
}

function Picture({ source }: { source: ImageSourcePropType }) {
  return <Image source={source} style={StyleSheet.absoluteFill} contentFit="contain" />;
}

function Buddy({
  i,
  t,
  k,
  still,
  loops,
}: {
  i: number;
  t: SharedValue<number>;
  k: number;
  still: boolean;
  loops: boolean;
}) {
  const b = INTRO_PLACES.buddies[i]!;
  const v = useLoop(loops, INTRO_LOOPS.bob.ms, INTRO_LOOPS.bob.delays[i] ?? 0);
  const bob = {
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -INTRO_LOOPS.bob.px * k],
        }),
      },
      {
        rotate: v.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${INTRO_LOOPS.bob.deg[i] ?? 0}deg`],
        }),
      },
    ],
  };
  const frame = (time: number) => {
    'worklet';
    return buddyFrame(i, time);
  };
  return (
    <Enter t={t} frame={frame} k={k} still={still} style={place(b, k)}>
      <Animated.View style={[StyleSheet.absoluteFill, loops ? bob : null]}>
        <Picture source={BUDDIES[i]!} />
      </Animated.View>
    </Enter>
  );
}

function Star({ i, k, loops }: { i: number; k: number; loops: boolean }) {
  const { twinkle } = INTRO_LOOPS;
  const v = useLoop(loops, twinkle.ms, twinkle.delays[i] ?? 0);
  const tw = {
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [...twinkle.opacity] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [...twinkle.scale] }) }],
  };
  return (
    <Animated.View style={[place(INTRO_PLACES.stars[i]!, k), loops ? tw : null]}>
      <Picture source={STARS[i]!} />
    </Animated.View>
  );
}

function Lamp({ k, loops }: { k: number; loops: boolean }) {
  const { swing } = INTRO_LOOPS;
  const b = INTRO_PLACES.lamp;
  const v = useLoop(loops, swing.ms, swing.delay);
  const sway = {
    transform: [
      {
        rotate: v.interpolate({
          inputRange: [0, 1],
          outputRange: [`${-swing.deg}deg`, `${swing.deg}deg`],
        }),
      },
    ],
  };
  return (
    <Animated.View
      style={[
        place(b, k),
        { transformOrigin: `${(swing.originX / b.width) * 100}% 0%` },
        loops ? sway : null,
      ]}
    >
      <Picture source={LAMP} />
    </Animated.View>
  );
}

// The stage in a `width` x `height` box: as wide as the box (smaller when it is short), its bottom on
// the box's bottom. `t` is the scene's clock (introScene.ts → INTRO); `still` once its entrances are
// over (or never played); `loops` while the board's loops may run (not with reduce motion, only on
// top with the app in front).
export function IntroStage({
  width,
  height,
  t,
  still,
  loops,
}: {
  width: number;
  height: number;
  t: SharedValue<number>;
  still: boolean;
  loops: boolean;
}) {
  const k = stageScale(width, height);
  if (!(k > 0)) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: (width - INTRO_STAGE.width * k) / 2,
        width: INTRO_STAGE.width * k,
        height: INTRO_STAGE.height * k,
      }}
    >
      <Enter t={t} frame={groundFrame} k={k} still={still} style={place(INTRO_PLACES.ground, k)}>
        <Picture source={GROUND} />
      </Enter>
      <Lamp k={k} loops={loops} />
      {STARS.map((_, i) => (
        <Star key={i} i={i} k={k} loops={loops} />
      ))}
      <View style={[styles.clip, { height: INTRO_STAGE.clip * k }]}>
        {BUDDIES.map((_, i) => (
          <Buddy key={i} i={i} t={t} k={k} still={still} loops={loops} />
        ))}
      </View>
      <Enter t={t} frame={tableFrame} k={k} still={still} style={place(INTRO_PLACES.table, k)}>
        <Picture source={TABLE} />
      </Enter>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
});
