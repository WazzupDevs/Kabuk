import type { GiftPack, GiftTier } from '@shared/gifts.ts';
import { useEffect, useId, useState } from 'react';
import { Image, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  LinearGradient,
  Polygon,
  Polyline,
  Rect as SvgRect,
  Stop,
} from 'react-native-svg';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { FINGER, PACK_GLOW, RIP_EDGE } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { ICON } from '@/theme/tokens';

import { CARD_RATIO, PACK_ART, PACK_RATIO, TEAR_AT, cardArt } from './art';
import { Glow, type Rect, type Stage, centerOf } from './stage';

// The rip (Aura v134 PaketSecimGecis, PaketAcilis): the front pack zooms from the ring to the
// middle; its strip, above a jagged line at 8.5 % of its height, is torn left to right by the
// finger. The torn part lifts at the tear's end; the gap shows a shade and a white edge. Let go
// under 70 % it springs back; past it the strip flies off, the card rises out of the pack and the
// pack falls away. Atla is a rip past the line.
const PACK = { left: 65, top: 190, w: 260 };
const CARD_IN_PACK = { left: 30, top: 20, w: 200, radius: 12 };
const GLOWS = [
  { left: 35, top: 220, size: 320, opacity: 0.45 },
  { left: 135, top: 230, size: 220, opacity: 0.36 },
] as const;
const ZIG_POINTS = 31;
const ZIG = 3;
const LIFT_DEG = -16.5;
const SHADE = { h: 9, from: 0.55 };
const EDGE = { line: 2.2, under: 1 };
const FLY = { x: 96, y: -150, deg: -38 };
const CARD_RISE = -112;
const PACK_DROP = 40;
// The finger may start on the strip's left part only.
const START_SHARE = 0.45;
const START_BELOW = 80;
const P_FILL_MS = 150;
const FINGER_SIZE = 44;
const HINT_FROM_FOOT = 96;
const SKIP_FROM_FOOT = 44;

export function ripRects(stage: Stage): { pack: Rect; card: Rect } {
  const w = PACK.w * stage.s;
  const pack = { x: PACK.left * stage.s, y: stage.top(PACK.top), w, h: w / PACK_RATIO };
  const cw = CARD_IN_PACK.w * stage.s;
  return {
    pack,
    card: {
      x: pack.x + CARD_IN_PACK.left * stage.s,
      y: pack.y + (CARD_IN_PACK.top + CARD_RISE) * stage.s,
      w: cw,
      h: cw / CARD_RATIO,
    },
  };
}

function zigzag(w: number, y: number, s: number): string {
  return Array.from({ length: ZIG_POINTS }, (_, i) => {
    const x = (i * w) / (ZIG_POINTS - 1);
    return `${x.toFixed(2)},${(y + (i % 2 === 0 ? -ZIG : ZIG) * s).toFixed(2)}`;
  }).join(' ');
}

export function Rip({
  pack,
  accessory,
  from,
  stage,
  onDone,
}: {
  pack: GiftPack;
  accessory: { id: string; tier: GiftTier };
  from: Rect | null;
  stage: Stage;
  onDone: (card: Rect) => void;
}) {
  const reduce = useReduceMotion();
  const { s } = stage;
  const rects = ripRects(stage);
  const R = rects.pack;
  const tearY = TEAR_AT * R.h;
  const stripH = tearY + (ZIG + 2) * s;
  const zig = zigzag(R.w, tearY, s);
  const ids = useId().replace(/[^A-Za-z0-9]/g, '');
  const [skipping, setSkipping] = useState(false);

  // 0 at the ring, 1 here.
  const zoom = useSharedValue(reduce || !from ? 1 : 0);
  const chrome = useSharedValue(0);
  const p = useSharedValue(0);
  const touched = useSharedValue(0);
  const allowed = useSharedValue(0);
  const done = useSharedValue(0);
  const fly = useSharedValue(0);
  const rise = useSharedValue(0);
  const drop = useSharedValue(0);

  useEffect(() => {
    const { spring, chromeMs } = GIFT_MOTION.zoom;
    const arrive = Easing.bezier(...GIFT_MOTION.curves.arrive);
    chrome.set(withTiming(1, { duration: chromeMs, easing: arrive }));
    if (!reduce && from) zoom.set(withSpring(1, spring));
  }, [chrome, zoom, reduce, from]);

  const card = rects.card;
  const finish = () => {
    'worklet';
    if (done.get()) return;
    done.set(1);
    const { stripMs, cardMs, packMs } = GIFT_MOTION.rip;
    const leave = Easing.bezier(...GIFT_MOTION.curves.leave);
    const arrive = Easing.bezier(...GIFT_MOTION.curves.arrive);
    if (reduce) {
      runOnJS(onDone)(card);
      return;
    }
    p.set(withTiming(1, { duration: P_FILL_MS }));
    fly.set(withTiming(1, { duration: stripMs, easing: leave }));
    rise.set(withTiming(1, { duration: cardMs, easing: arrive }));
    drop.set(
      withDelay(
        cardMs,
        withTiming(1, { duration: packMs, easing: leave }, (ok) => {
          if (ok) runOnJS(onDone)(card);
        }),
      ),
    );
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      allowed.set(e.x < R.w * START_SHARE && e.y < tearY + START_BELOW * s && !done.get() ? 1 : 0);
      if (allowed.get()) touched.set(1);
    })
    .onUpdate((e) => {
      if (!allowed.get() || done.get()) return;
      p.set(Math.min(Math.max(e.x / R.w, 0), 1));
    })
    .onFinalize(() => {
      if (!allowed.get() || done.get()) return;
      allowed.set(0);
      if (p.get() >= GIFT_MOTION.rip.threshold) finish();
      else if (reduce) p.set(0);
      else p.set(withSpring(0, GIFT_MOTION.rip.back));
    });

  const skip = () => {
    setSkipping(true);
    if (reduce) {
      done.set(1);
      onDone(card);
      return;
    }
    finish();
  };

  const fromC = from ? centerOf(from) : null;
  const toC = centerOf(R);
  const packStyle = useAnimatedStyle(() => {
    const z = zoom.get();
    const k = from ? from.w / R.w : 1;
    return {
      opacity: reduce ? chrome.get() : 1,
      transform: fromC
        ? [
            { translateX: (fromC.cx - toC.cx) * (1 - z) },
            { translateY: (fromC.cy - toC.cy) * (1 - z) },
            { scale: k + (1 - k) * z },
          ]
        : [],
    };
  });
  const chromeStyle = useAnimatedStyle(() => ({ opacity: chrome.get() * (1 - done.get()) }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: chrome.get() }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: CARD_RISE * s * rise.get() }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: 1 - drop.get(),
    transform: [{ translateY: PACK_DROP * s * drop.get() }],
  }));
  // The torn (left) part: a box ending at the tear, its picture held still inside it.
  const tornBox = useAnimatedStyle(() => {
    const at = p.get() * R.w;
    const f = fly.get();
    return {
      opacity: 1 - f,
      transform: [
        { translateX: at - R.w + FLY.x * s * f },
        { translateY: FLY.y * s * f },
        { rotate: `${(reduce ? 0 : LIFT_DEG * p.get()) + FLY.deg * f}deg` },
      ],
    };
  });
  // The gap's box: the same edge, never lifting.
  const gapBox = useAnimatedStyle(() => ({
    transform: [{ translateX: p.get() * R.w - R.w }],
  }));
  const tornInner = useAnimatedStyle(() => ({
    transform: [{ translateX: R.w - p.get() * R.w }],
  }));
  // The whole (right) part: a box starting at the tear.
  const wholeBox = useAnimatedStyle(() => ({
    transform: [{ translateX: p.get() * R.w }],
  }));
  const wholeInner = useAnimatedStyle(() => ({
    transform: [{ translateX: -p.get() * R.w }],
  }));
  const fingerStyle = useAnimatedStyle(() => ({
    opacity: touched.get() || p.get() > 0 ? 0 : 1,
  }));

  const strip = (
    <Svg width={R.w} height={stripH}>
      <Defs>
        <ClipPath id={`${ids}s`}>
          <Polygon points={`0,0 ${R.w},0 ${zig.split(' ').reverse().join(' ')}`} />
        </ClipPath>
      </Defs>
      <SvgImage
        href={PACK_ART[pack]}
        width={R.w}
        height={R.h}
        preserveAspectRatio="xMidYMid meet"
        clipPath={`url(#${ids}s)`}
      />
    </Svg>
  );

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
      <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0 }, glowStyle]}>
        {GLOWS.map((g, i) => (
          <Glow
            key={i}
            x={g.left * s}
            y={stage.top(g.top)}
            size={g.size * s}
            color={PACK_GLOW[pack][i] ?? PACK_GLOW[pack][0]}
            opacity={g.opacity}
          />
        ))}
      </Reanimated.View>
      <GestureDetector gesture={pan}>
        <Reanimated.View
          style={[
            { position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h },
            packStyle,
          ]}
        >
          <Reanimated.View
            style={[
              {
                position: 'absolute',
                left: CARD_IN_PACK.left * s,
                top: CARD_IN_PACK.top * s,
                width: CARD_IN_PACK.w * s,
                height: (CARD_IN_PACK.w * s) / CARD_RATIO,
                borderRadius: CARD_IN_PACK.radius * s,
                overflow: 'hidden',
              },
              cardStyle,
            ]}
          >
            <Image
              source={cardArt(accessory.id, accessory.tier)}
              accessibilityIgnoresInvertColors
              style={{ width: CARD_IN_PACK.w * s, height: (CARD_IN_PACK.w * s) / CARD_RATIO }}
            />
          </Reanimated.View>
          <Reanimated.View style={[{ position: 'absolute', inset: 0 }, bodyStyle]}>
            <Svg width={R.w} height={R.h}>
              <Defs>
                <ClipPath id={`${ids}b`}>
                  <Polygon points={`${zig} ${R.w},${R.h} 0,${R.h}`} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={PACK_ART[pack]}
                width={R.w}
                height={R.h}
                preserveAspectRatio="xMidYMid meet"
                clipPath={`url(#${ids}b)`}
              />
            </Svg>
            {/* The gap's shade and edge, shown as far as the tear has gone. */}
            <Reanimated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: R.w,
                  height: tearY + (ZIG + SHADE.h + 2) * s,
                  overflow: 'hidden',
                },
                gapBox,
              ]}
            >
              <Reanimated.View style={tornInner}>
                <Svg width={R.w} height={tearY + (ZIG + SHADE.h + 2) * s}>
                  <Defs>
                    <LinearGradient id={`${ids}g`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={RIP_EDGE.shade} stopOpacity={SHADE.from} />
                      <Stop offset="1" stopColor={RIP_EDGE.shade} stopOpacity={0} />
                    </LinearGradient>
                  </Defs>
                  <SvgRect
                    x={0}
                    y={tearY - ZIG * s}
                    width={R.w}
                    height={(SHADE.h + ZIG * 2) * s}
                    fill={`url(#${ids}g)`}
                  />
                  <Polyline
                    points={zigzag(R.w, tearY + EDGE.line * s * 0.8, s)}
                    fill="none"
                    stroke={RIP_EDGE.under}
                    strokeWidth={EDGE.under * s}
                  />
                  <Polyline
                    points={zig}
                    fill="none"
                    stroke={RIP_EDGE.line}
                    strokeWidth={EDGE.line * s}
                    strokeLinejoin="round"
                  />
                </Svg>
              </Reanimated.View>
            </Reanimated.View>
            {/* The strip's whole part, right of the tear. */}
            <Reanimated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: R.w,
                  height: stripH,
                  overflow: 'hidden',
                },
                wholeBox,
              ]}
            >
              <Reanimated.View style={wholeInner}>{strip}</Reanimated.View>
            </Reanimated.View>
          </Reanimated.View>
          {/* The torn part, lifting about the tear's end; it flies off past the line. */}
          <Reanimated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: R.w,
                height: stripH,
                overflow: 'hidden',
                transformOrigin: [R.w, tearY, 0],
              },
              tornBox,
            ]}
          >
            <Reanimated.View style={tornInner}>{strip}</Reanimated.View>
          </Reanimated.View>
          <Reanimated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: -FINGER_SIZE / 4,
                top: tearY - FINGER_SIZE / 2,
                width: FINGER_SIZE,
                height: FINGER_SIZE,
                borderRadius: FINGER_SIZE / 2,
                backgroundColor: FINGER.fill,
                borderWidth: 2,
                borderColor: FINGER.ring,
                alignItems: 'center',
                justifyContent: 'center',
              },
              fingerStyle,
            ]}
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <CapIcon name="back" color={FINGER.arrow} size={ICON.md} />
            </View>
          </Reanimated.View>
        </Reanimated.View>
      </GestureDetector>
      <Reanimated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
          },
          chromeStyle,
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 20 * s,
            right: 20 * s,
            bottom: stage.foot(HINT_FROM_FOOT),
          }}
        >
          <T v="fine" center>
            {tr.gifts.ripHint}
          </T>
        </View>
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: stage.foot(SKIP_FROM_FOOT),
            alignItems: 'center',
          }}
        >
          <Btn variant="glassy" sm label={tr.gifts.skip} onPress={skip} disabled={skipping} />
        </View>
      </Reanimated.View>
    </View>
  );
}
