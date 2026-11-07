import type { GiftPackView } from '@shared/api/gifts.ts';
import { useState } from 'react';
import { Animated, Image, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  type SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { gradientStyle } from '@/theme/gradient';
import { GIFT_FLOOR, PACK_DROP, PACK_GLOW } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';

import { PACK_ART, PACK_RATIO } from './art';
import { useFloat } from './loops';
import { packName } from './model';
import { BADGE, CanOpenBadge, SoonTag } from './parts';
import type { Rect, Stage } from './stage';

// Paketler's ring (Aura v134 Paketler, PaketSecimDonme): the four packs on a circle, Bronz in
// front, Gümüş at the right, Altın behind, Elmas at the left. A pack at angle θ (0 in front, +90 at
// the right) stands 122·sinθ from the middle, 142.9 + 45.1·cosθ wide, its middle 295.5 + 22.5·cosθ
// from the board's top, turned −7·sinθ°, lit 0.775 + 0.225·cosθ (a locked one greyer). The finger
// turns it 0.4° a pixel; let go, it settles on the nearest pack (a fling goes to the next), round
// and round. A tap on the front pack opens it.

// The ring's board lies from 128 (under the top bar and the page's first gap) to the dots at 506.
export const RING_FROM = 128;
const RING_TO = 500;
const DOTS_AT = 506;
export const INFO_AT = 532;
const FRONT_W = 188;
const FRONT_H = FRONT_W / PACK_RATIO;
const SIDE_W = 142.9;
const SWAY = 122;
const MID_Y = 295.5;
const RISE = 22.5;
const TURN = 7;
const LIGHT_LOW = 0.775;
const LOCKED_SATURATE = 0.75;
const FLOOR = { left: 92, top: 476, w: 207, h: 18 };
const GLOW = { left: 54, top: 177, size: 282, opacity: 0.4 };
const DOT = 6;
const DOT_ON = 18;
const BADGE_OUT = -9;
const SOON_AT = '9%';

// θ in (−180, 180] for pack `i` with the ring turned `turn` degrees.
function angleOf(i: number, turn: number): number {
  'worklet';
  const a = (((i * 90 - turn) % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

function frontOf(turn: number): number {
  'worklet';
  return ((Math.round(turn / 90) % 4) + 4) % 4;
}

// The front pack's place on the screen, for the zoom to the rip; `stageY` is the ring's top.
export function frontRect(stage: Stage, stageY: number): Rect {
  const w = FRONT_W * stage.s;
  const h = FRONT_H * stage.s;
  return {
    x: stage.width / 2 - w / 2,
    y: stageY + (MID_Y + RISE - RING_FROM) * stage.s - h / 2,
    w,
    h,
  };
}

export function useRing() {
  const turn = useSharedValue(0);
  const info = useSharedValue(1);
  const fade = useSharedValue(1);
  return { turn, info, fade };
}
export type Ring = ReturnType<typeof useRing>;

export function PackRing({
  packs,
  ring,
  stage,
  enabled,
  hideFront,
  onFront,
  onOpen,
}: {
  packs: GiftPackView[];
  ring: Ring;
  stage: Stage;
  enabled: boolean;
  hideFront: boolean;
  onFront: (index: number) => void;
  onOpen: () => void;
}) {
  const reduce = useReduceMotion();
  const { scheme } = useTheme();
  const [front, setFront] = useState(0);
  const { turn, info, fade } = ring;
  const start = useSharedValue(0);
  const { s, width } = stage;
  const { degPerPx, flingPxPerMs, settle } = GIFT_MOTION.ring;
  const { turningOpacity, inMs } = GIFT_MOTION.info;

  const setFrontBoth = (i: number) => {
    setFront(i);
    onFront(i);
  };
  useAnimatedReaction(
    () => frontOf(turn.get()),
    (now, before) => {
      if (now !== before) runOnJS(setFrontBoth)(now);
    },
  );

  const settled = () => {
    'worklet';
    info.set(withTiming(1, { duration: inMs }));
  };
  const goTo = (target: number) => {
    'worklet';
    if (reduce) {
      // The dissolve in place of the turn (hareketi azalt).
      fade.set(
        withTiming(0, { duration: MOTION.dissolve.outMs }, () => {
          turn.set(target);
          fade.set(withTiming(1, { duration: MOTION.dissolve.inMs }));
          settled();
        }),
      );
      return;
    }
    turn.set(
      withSpring(target, settle, (done) => {
        if (done) settled();
      }),
    );
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-16, 16])
    .onStart(() => {
      start.set(turn.get());
      info.set(withTiming(turningOpacity, { duration: inMs }));
    })
    .onUpdate((e) => {
      turn.set(start.get() - e.translationX * degPerPx);
    })
    .onEnd((e) => {
      const now = turn.get();
      // px/s from the gesture; the fling is in px/ms.
      const fling = Math.abs(e.velocityX) / 1000 >= flingPxPerMs;
      const target = fling
        ? e.velocityX < 0
          ? Math.floor(now / 90 + 1e-6) * 90 + 90
          : Math.ceil(now / 90 - 1e-6) * 90 - 90
        : Math.round(now / 90) * 90;
      goTo(target);
    });

  // A screen reader turns the ring by its actions.
  const step = (by: number) => {
    const target = (Math.round(turn.get() / 90) + by) * 90;
    info.set(turningOpacity);
    goTo(target);
  };

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const view = packs[front];

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={view ? tr.gifts.pack(packName(view.id)) : undefined}
        accessibilityActions={[
          {
            name: 'increment',
            label: tr.gifts.pack(packName(packs[(front + 1) % 4]?.id ?? 'bronz')),
          },
          {
            name: 'decrement',
            label: tr.gifts.pack(packName(packs[(front + 3) % 4]?.id ?? 'bronz')),
          },
          { name: 'activate' },
        ]}
        onAccessibilityAction={(e) => {
          if (!enabled) return;
          if (e.nativeEvent.actionName === 'increment') step(1);
          else if (e.nativeEvent.actionName === 'decrement') step(-1);
          else if (e.nativeEvent.actionName === 'activate') onOpen();
        }}
        style={{ height: (RING_TO - RING_FROM) * s }}
      >
        <Reanimated.View style={[{ flex: 1 }, fadeStyle]}>
          {packs.map((p, i) => (
            <RingGlow key={p.id} index={i} pack={p} turn={turn} s={s} />
          ))}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: width / 2 - (FLOOR.w * s) / 2,
              top: (FLOOR.top - RING_FROM) * s,
              width: FLOOR.w * s,
              height: FLOOR.h * s,
              ...gradientStyle(GIFT_FLOOR[scheme]),
            }}
          />
          {packs.map((p, i) => (
            <RingPack
              key={p.id}
              index={i}
              view={p}
              turn={turn}
              s={s}
              width={width}
              isFront={i === front}
              hidden={hideFront && i === front}
              onOpen={enabled ? onOpen : undefined}
            />
          ))}
        </Reanimated.View>
      </View>
    </GestureDetector>
  );
}

// Each pack's glow behind the ring, strongest when it is in front: the glow turns with the ring.
function RingGlow({
  index,
  pack,
  turn,
  s,
}: {
  index: number;
  pack: GiftPackView;
  turn: SharedValue<number>;
  s: number;
}) {
  const style = useAnimatedStyle(() => {
    const cos = Math.cos((angleOf(index, turn.get()) * Math.PI) / 180);
    const on = Math.max(cos, 0);
    return { opacity: GLOW.opacity * on * on };
  });
  const size = GLOW.size * s;
  const wide = size * 1.45;
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: GLOW.left * s - (wide - size) / 2,
          top: (GLOW.top - RING_FROM) * s - (wide - size) / 2,
          width: wide,
          height: wide,
          ...gradientStyle(
            `radial-gradient(closest-side, ${PACK_GLOW[pack.id][0]} 25%, ${PACK_GLOW[pack.id][0]}00 100%)`,
          ),
        },
        style,
      ]}
    />
  );
}

function RingPack({
  index,
  view,
  turn,
  s,
  width,
  isFront,
  hidden,
  onOpen,
}: {
  index: number;
  view: GiftPackView;
  turn: SharedValue<number>;
  s: number;
  width: number;
  isFront: boolean;
  hidden: boolean;
  onOpen?: () => void;
}) {
  const { scheme } = useTheme();
  const { px, ms, stepMs } = GIFT_MOTION.ringFloat;
  const float = useFloat(px, ms, index * stepMs);
  const w = FRONT_W * s;
  const h = FRONT_H * s;
  const locked = view.locked;
  const style = useAnimatedStyle(() => {
    const th = (angleOf(index, turn.get()) * Math.PI) / 180;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const scale = (SIDE_W + (FRONT_W - SIDE_W) * cos) / FRONT_W;
    const light = LIGHT_LOW + (1 - LIGHT_LOW) * cos;
    return {
      zIndex: Math.round(cos * 100) + 100,
      transform: [
        { translateX: width / 2 + SWAY * sin * s - w / 2 },
        { translateY: (MID_Y + RISE * cos - RING_FROM) * s - h / 2 },
        { rotate: `${-TURN * sin}deg` },
        { scale },
      ],
      filter: locked
        ? [{ brightness: light }, { saturate: LOCKED_SATURATE }]
        : [{ brightness: light }],
    };
  });
  return (
    <Reanimated.View
      style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, style]}
    >
      <Animated.View
        style={{ flex: 1, opacity: hidden ? 0 : 1, transform: [{ translateY: float }] }}
      >
        <Pressable
          disabled={!isFront || !onOpen}
          onPress={onOpen}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, filter: [PACK_DROP[scheme]] }}>
            <Image
              source={PACK_ART[view.id]}
              accessibilityIgnoresInvertColors
              style={{ width: w, height: h }}
              resizeMode="contain"
            />
          </View>
          {view.locked ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: SOON_AT,
                alignItems: 'center',
              }}
            >
              <SoonTag />
            </View>
          ) : view.unopened > 0 ? (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', right: BADGE_OUT, top: BADGE_OUT, width: BADGE }}
            >
              <CanOpenBadge count={view.unopened} />
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </Reanimated.View>
  );
}

// The dots under the ring: the front pack's long and green, the others round on the track.
export function RingDots({ front, stage }: { front: number; stage: Stage }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        marginTop: (DOTS_AT - RING_TO) * stage.s,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: DOT,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: i === front ? DOT_ON : DOT,
            height: DOT,
            borderRadius: DOT / 2,
            backgroundColor: i === front ? colors.primary : colors.track,
          }}
        />
      ))}
    </View>
  );
}
export const DOTS_END = DOTS_AT + DOT;
