import type { GiftTier } from '@shared/gifts.ts';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Btn, T } from '@/aura/kit';
import { FxMoves } from '@/components/FxSvg';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { gradientStyle } from '@/theme/gradient';
import { CARD_LIGHT, TIER_COLOR, TIER_GLOW, TIER_SPARKLES } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { CARD_FRAME_CORNER, CARD_RATIO, CARD_SIDE } from './art';
import { accessoryById, tierName } from './model';
import { CardFace, TierTag } from './parts';
import { StarBursts } from './StarBurst';
import { useEquip } from './queries';
import { Glow, type Rect, type Stage, Sparkle, centerOf } from './stage';

// The opened card (Aura v134 PaketAcilisNadirlik, PaketKartEgme): the accessory's card in its
// tier's light, sparkles by tier (Efsanevi with the buddies too), its name and tier under it. A
// sideways drag turns it (0.3° a pixel, ±22° about Y and a twelfth of that about Z) and the holo
// and the band of light move with it; let go, it turns back. "Aksesuarı tak" wears it.
const CARD = { left: 79, top: 180, w: 232 };
// The card's width on this phone (Paketler draws its picture ahead, RipWarm).
export function openedCardWidth(s: number): number {
  return CARD.w * s;
}
const GLOWS = {
  normal: [
    { left: 35, top: 220, size: 320, opacity: 0.45 },
    { left: 135, top: 230, size: 220, opacity: 0.36 },
  ],
  efsanevi: [
    { left: -21, top: 164, size: 432, opacity: 0.45 },
    { left: 114, top: 209, size: 297, opacity: 0.36 },
  ],
} as const;
// left, top, size on the board; the first N for the tier.
const SPARKLES = [
  [16, 325, 12],
  [354, 415, 16],
  [76, 204, 12],
  [354, 451, 20],
  [60, 283, 20],
  [31, 569, 16],
  [84, 304, 16],
  [43, 594, 20],
  [29, 269, 16],
  [48, 318, 20],
  [74, 602, 20],
  [354, 429, 16],
  [16, 296, 26],
  [173, 215, 20],
] as const;
const HINT_AT = 612;
const BUTTONS_FOOT = 46;
// Each button as wide as its words, the room left shared; when the two do not fit side by side the
// second goes under the first. Neither shrinks its words, so the pair keeps one size (the owner's
// report, 10 Kasım: "Aksesuarı tak" with its icon shrank beside "Sonra").
const BUTTON_SIDE = { flexGrow: 1, flexBasis: 'auto' } as const;
const HOLO_BASE = 0.3;
const HOLO_PER = 40;
const BAND_PER = 2.2;
const HOLO_TURN = 6;
// Hidden under the rip but still drawn (Android skips a view that is fully clear).
const HIDDEN = 0.01;

export function OpenedCard({
  accessory,
  from,
  stage,
  onClose,
  ready = true,
}: {
  accessory: { id: string; tier: GiftTier };
  from: Rect | null;
  stage: Stage;
  onClose: () => void;
  // Mounted (and so drawn) under the rip, hidden; it arrives when the rip is done.
  ready?: boolean;
}) {
  const reduce = useReduceMotion();
  const { scheme, colors } = useTheme();
  const equip = useEquip();
  const [worn, setWorn] = useState(false);
  const { s } = stage;
  const tier = accessory.tier;
  const name = accessoryById(accessory.id)?.name ?? accessory.id;
  const w = CARD.w * s;
  const h = w / CARD_RATIO;
  const C: Rect = { x: CARD.left * s, y: stage.top(CARD.top), w, h };
  const side = w * CARD_SIDE[tier];
  const { degPerPx, max, zPer, perspective, back } = GIFT_MOTION.tilt;

  const morph = useSharedValue(reduce || !from ? 1 : 0);
  const shown = useSharedValue(0);
  const angle = useSharedValue(0);
  useEffect(() => {
    if (!ready) return;
    const arrive = Easing.bezier(...GIFT_MOTION.curves.arrive);
    const { chromeMs } = GIFT_MOTION.zoom;
    if (reduce || !from) {
      shown.set(withTiming(1, { duration: chromeMs, easing: arrive }));
      return;
    }
    morph.set(withSpring(1, GIFT_MOTION.open));
    shown.set(withDelay(chromeMs, withTiming(1, { duration: chromeMs, easing: arrive })));
  }, [morph, shown, reduce, from, ready]);

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .onUpdate((e) => {
      angle.set(Math.min(Math.max(e.translationX * degPerPx, -max), max));
    })
    .onFinalize(() => {
      angle.set(reduce ? 0 : withSpring(0, back));
    });

  const fromC = from ? centerOf(from) : null;
  const toC = centerOf(C);
  const moveStyle = useAnimatedStyle(() => {
    const m = morph.get();
    const k = from ? from.w / C.w : 1;
    return {
      opacity: reduce || !from ? shown.get() : 1,
      transform: fromC
        ? [
            { translateX: (fromC.cx - toC.cx) * (1 - m) },
            { translateY: (fromC.cy - toC.cy) * (1 - m) },
            { scale: k + (1 - k) * m },
          ]
        : [],
    };
  });
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective },
      { rotateY: `${angle.get()}deg` },
      { rotateZ: `${angle.get() / zPer}deg` },
    ],
  }));
  const diag = Math.hypot(w, h);
  const holoStyle = useAnimatedStyle(() => ({
    opacity: HOLO_BASE + Math.abs(angle.get()) / HOLO_PER,
    transform: [{ rotate: `${HOLO_TURN * angle.get()}deg` }],
  }));
  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (-BAND_PER * angle.get() * w) / 100 }],
  }));
  const shownStyle = useAnimatedStyle(() => ({ opacity: shown.get() }));

  const glows = tier === 'efsanevi' ? GLOWS.efsanevi : GLOWS.normal;
  const sparkColor = TIER_COLOR[scheme][tier];
  const wear = () =>
    equip.mutate(accessory.id, {
      onSuccess: () => setWorn(true),
    });

  return (
    <View
      pointerEvents={ready ? 'box-none' : 'none'}
      accessibilityElementsHidden={!ready}
      importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
      style={{ position: 'absolute', inset: 0, opacity: ready ? 1 : HIDDEN }}
    >
      <Reanimated.View
        pointerEvents="none"
        style={[{ position: 'absolute', inset: 0 }, shownStyle]}
      >
        {glows.map((g, i) => (
          <Glow
            key={i}
            x={g.left * s}
            y={stage.top(g.top)}
            size={g.size * s}
            color={TIER_GLOW[tier][i] ?? TIER_GLOW[tier][0]}
            opacity={g.opacity}
          />
        ))}
        {SPARKLES.slice(0, TIER_SPARKLES[tier]).map(([x, y, size], i) => (
          <Sparkle key={i} x={x * s} y={stage.top(y)} size={size * s} color={sparkColor} />
        ))}
        {tier === 'efsanevi' ? <StarBursts stage={stage} /> : null}
      </Reanimated.View>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: C.x, top: C.y, width: w, alignItems: 'center' }}
      >
        <GestureDetector gesture={pan}>
          <Reanimated.View
            accessible
            accessibilityRole="image"
            accessibilityLabel={tr.gifts.cardAlt(name, tierName(tier))}
            style={[{ width: w, height: h }, moveStyle]}
          >
            <Reanimated.View style={[{ width: w, height: h }, tiltStyle]}>
              {/* The card's own picture: its clear sides cut off, so its light stays on it. */}
              <View
                style={{
                  position: 'absolute',
                  left: side,
                  top: 0,
                  width: w - side * 2,
                  height: h,
                  borderRadius: w * CARD_FRAME_CORNER,
                  overflow: 'hidden',
                }}
              >
                <View style={{ position: 'absolute', left: -side, top: 0 }}>
                  <FxMoves>
                    <CardFace id={accessory.id} tier={tier} width={w} height={h} />
                  </FxMoves>
                </View>
                <Reanimated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: 'absolute',
                      left: (w - diag * 1.2) / 2 - side,
                      top: (h - diag * 1.2) / 2,
                      width: diag * 1.2,
                      height: diag * 1.2,
                      mixBlendMode: 'overlay',
                      ...gradientStyle(CARD_LIGHT.holo),
                    },
                    holoStyle,
                  ]}
                />
                <Reanimated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: 'absolute',
                      left: -side,
                      top: 0,
                      width: w,
                      height: h,
                      mixBlendMode: 'screen',
                      ...gradientStyle(CARD_LIGHT.band),
                    },
                    bandStyle,
                  ]}
                />
              </View>
            </Reanimated.View>
          </Reanimated.View>
        </GestureDetector>
        <Reanimated.View
          style={[{ marginTop: SPACING[2], alignItems: 'center', gap: SPACING[2] }, shownStyle]}
        >
          <T v="title" center>
            {name}
          </T>
          {/* The tag sets itself to the start; in its own box it sits in the middle (the owner's
              report, 8 Kasım). */}
          <View style={{ alignItems: 'center' }}>
            <TierTag tier={tier} />
          </View>
        </Reanimated.View>
      </View>
      <Reanimated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 20 * s, right: 20 * s, top: stage.top(HINT_AT) },
          shownStyle,
        ]}
      >
        <T v="fine" center>
          {tr.gifts.tiltHint}
        </T>
      </Reanimated.View>
      <Reanimated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: SPACING[5],
            right: SPACING[5],
            bottom: stage.foot(BUTTONS_FOOT),
            gap: SPACING[2],
          },
          shownStyle,
        ]}
      >
        {equip.isError ? (
          <T v="fine" center color={colors.danger}>
            {errorMessage(equip.error)}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3] }}>
          <Btn
            variant="glassy"
            label={worn ? tr.gifts.next : tr.gifts.later}
            onPress={onClose}
            style={BUTTON_SIDE}
          />
          {worn ? (
            <Btn icon="check" label={tr.gifts.worn} disabled style={BUTTON_SIDE} />
          ) : (
            <Btn
              icon="sparkles"
              label={tr.gifts.wear}
              onPress={wear}
              loading={equip.isPending}
              style={BUTTON_SIDE}
            />
          )}
        </View>
      </Reanimated.View>
    </View>
  );
}
