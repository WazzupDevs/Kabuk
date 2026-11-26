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

import { useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { PACK_DROP } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';

import { PACK_ART, PACK_RATIO, type ShownPack } from './art';
import { useFloat } from './loops';
import { packName, type PackViewOf } from './model';
import { BADGE, CanOpenBadge, SoonTag } from './parts';
import type { Rect, Stage } from './stage';

// Paketler's ring (yeni tuval HediyePaket: a front pack 236 wide and its two neighbours 168 wide
// at the sides, 150 from the middle, turned 7° outward; the pack behind stands hidden under the
// front one): the four packs on a circle, Bronz in front, Gümüş at the right, Altın behind, Elmas
// at the left. A pack at angle θ (0 in front, +90 at the right) stands 150·sinθ from the middle,
// 168 + 68·cosθ wide, turned −7·sinθ°. The finger turns it 0.4° a pixel; let go, it settles on the
// nearest pack (a fling goes to the next), round and round. A tap on the front pack opens it.

// The ring's board lies from 128 (under the top bar and the page's first gap) to the dots at 548;
// the pack's middle is 337 from the board's top (132 + 410 / 2).
export const RING_FROM = 128;
// Room round a pack for its shadow (PACK_DROP: 10 down, blur up to 7: about 3 × 7 past it).
const SHADOW_ROOM = 32;
const RING_TO = 542;
const DOTS_AT = 548;
export const INFO_AT = 574;
const FRONT_W = 236;
const FRONT_H = FRONT_W / PACK_RATIO;
const SIDE_W = 168;
const SWAY = 150;
// The front pack's middle on the board (its backdrop's rays start there: PackBackdrop).
export const MID_Y = 337;
const TURN = 7;
const DOT = 6;
const DOT_ON = 20;
// The badge: 4 past the pack's right edge, 10 under its top (the panel's 26 badge, 98 right of the
// middle and 28 under the car's top).
const BADGE_RIGHT = -4;
const BADGE_TOP = 10;
// "Yakında" sits 86 % down the pack, as the panel's pill (300 and 338 on the 410 car).
const SOON_AT = '86%';
const SOON_H = 24;

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
    y: stageY + (MID_Y - RING_FROM) * stage.s - h / 2,
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
  packs: PackViewOf<ShownPack>[];
  ring: Ring;
  stage: Stage;
  enabled: boolean;
  hideFront: boolean;
  onFront: (index: number) => void;
  onOpen: () => void;
}) {
  const reduce = useReduceMotion();
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
  view: PackViewOf<ShownPack>;
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
  const style = useAnimatedStyle(() => {
    const th = (angleOf(index, turn.get()) * Math.PI) / 180;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const scale = (SIDE_W + (FRONT_W - SIDE_W) * cos) / FRONT_W;
    return {
      zIndex: Math.round(cos * 100) + 100,
      transform: [
        { translateX: width / 2 + SWAY * sin * s - w / 2 },
        { translateY: (MID_Y - RING_FROM) * s - h / 2 },
        { rotate: `${-TURN * sin}deg` },
        { scale },
      ],
    };
  });
  // The pill and the badge keep their own size and stand upright on a pack that turns and shrinks.
  const upright = useAnimatedStyle(() => {
    const th = (angleOf(index, turn.get()) * Math.PI) / 180;
    const cos = Math.cos(th);
    return {
      transform: [
        { rotate: `${TURN * Math.sin(th)}deg` },
        { scale: FRONT_W / (SIDE_W + (FRONT_W - SIDE_W) * cos) },
      ],
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
          {/* The light's layer reaches past the pack by the shadow's room: a filter cuts what lies
              past its view, and the shadow under the pack was cut square (the owner's report,
              8 Kasım). */}
          <View
            style={{
              position: 'absolute',
              left: -SHADOW_ROOM,
              right: -SHADOW_ROOM,
              top: -SHADOW_ROOM,
              bottom: -SHADOW_ROOM,
              padding: SHADOW_ROOM,
            }}
          >
            <View style={{ flex: 1, filter: [PACK_DROP[scheme]] }}>
              <Image
                source={PACK_ART[view.id]}
                accessibilityIgnoresInvertColors
                style={{ width: w, height: h }}
                resizeMode="contain"
              />
            </View>
          </View>
          {view.locked ? (
            <Reanimated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: SOON_AT,
                  marginTop: -SOON_H / 2,
                  alignItems: 'center',
                },
                upright,
              ]}
            >
              <SoonTag />
            </Reanimated.View>
          ) : view.unopened > 0 ? (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', right: BADGE_RIGHT, top: BADGE_TOP, width: BADGE }}
            >
              <CanOpenBadge count={view.unopened} />
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </Reanimated.View>
  );
}

// The dots under the ring: the front pack's long and in the ink, the others round on the track.
export function RingDots({ front, stage }: { front: number; stage: Stage }) {
  const { c } = useKit();
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
            backgroundColor: i === front ? c.ink : c.emptyMark,
          }}
        />
      ))}
    </View>
  );
}
export const DOTS_END = DOTS_AT + DOT;
