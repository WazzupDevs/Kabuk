import { router } from 'expo-router';
import { Animated, Image, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, T, useKit } from '@/aura/kit';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { upperTr } from '@shared/trText.ts';
import { gradientStyle } from '@/theme/gradient';
import { GIFT_STAGE } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { isShownPack, PACK_ART, PACK_RATIO } from './art';
import { useFloat } from './loops';
import { cardState, packName } from './model';
import { BADGE, CanOpenBadge, LoginBar } from './parts';
import { useGiftState } from './queries';

// AktivitelerHediye: the card over Etkinlikler/Geçmiş, 8 inside a glass card 30 round; the stage
// strip 150 high, 22 round; three packs in the air at the right, Bronz rising 22 over the card.
const STAGE_H = 150;
const STAGE_RADIUS = 22;
const CARD_RADIUS = 30;
const CARD_PAD = SPACING[2];
const ROUND = 28;
// The packs over the stage (right, top, width, turn): Gümüş, Altın, then Bronz in front.
const PACKS = [
  { pack: 'gumus', right: 86, top: 32, width: 60, turn: '-13deg' },
  { pack: 'altin', right: 8, top: 28, width: 60, turn: '11deg' },
  { pack: 'bronz', right: 34, top: -22, width: 92, turn: '-4deg' },
] as const;
// The stage's stars (as a share of the stage's width, top, size, opacity).
const STARS = [
  { x: 0.545, top: 18, size: 10, opacity: 0.9 },
  { x: 0.629, top: 112, size: 7, opacity: 0.7 },
  { x: 0.975, top: 120, size: 8, opacity: 0.8 },
  { x: 0.482, top: 70, size: 6, opacity: 0.5 },
] as const;
const STAR_PATH = 'M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z';
// Every accessory owned: the packs greyed (saturate .35, brightness .85).
const GREYED = [{ saturate: 0.35 }, { brightness: 0.85 }] as const;
// `drop-shadow(0 10px 12px …)`: CSS's blur is twice the deviation.
const PACK_SHADOW = {
  dropShadow: { offsetX: 0, offsetY: 10, standardDeviation: 6, color: GIFT_STAGE.packShadow },
};

export function GiftCard() {
  const gifts = useGiftState();
  const { c } = useKit();
  const { colors } = useTheme();
  const open = () => router.push('/gifts');

  if (gifts.isPending) {
    return (
      <Glass radius={CARD_RADIUS} style={{ padding: CARD_PAD }}>
        <View
          accessibilityState={{ busy: true }}
          style={{ height: STAGE_H, borderRadius: STAGE_RADIUS, backgroundColor: colors.track }}
        />
      </Glass>
    );
  }
  if (!gifts.data) {
    return (
      <Glass radius={CARD_RADIUS} style={{ padding: CARD_PAD }}>
        <View
          style={{
            minHeight: STAGE_H,
            borderRadius: STAGE_RADIUS,
            padding: SPACING[4],
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING[2],
            backgroundColor: c.raisedChip,
          }}
        >
          <CapIcon name="warn" color={colors.danger} size={ICON.lg} />
          <T v="h3" center>
            {tr.gifts.cardError}
          </T>
          <T v="fine" center>
            {errorMessage(gifts.error)}
          </T>
          <Btn
            sm
            variant="glassy"
            icon="refresh"
            label={tr.common.retry}
            loading={gifts.isRefetching}
            onPress={() => void gifts.refetch()}
          />
        </View>
      </Glass>
    );
  }

  const state = cardState(gifts.data, isShownPack);
  const ready = state.kind === 'ready';
  const label =
    state.kind === 'ready'
      ? tr.gifts.cardLabelReady(packName(state.pack))
      : state.kind === 'progress'
        ? tr.gifts.cardLabelProgress(packName(state.pack), state.left, state.logins, state.per)
        : tr.gifts.cardLabelAllOwned;

  return (
    <Pressable
      testID="gift-card"
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={open}
    >
      <Glass
        radius={CARD_RADIUS}
        style={[
          { padding: CARD_PAD },
          // Ready: the accent ring round the card.
          ready ? { boxShadow: `0 0 0 2px ${colors.accent}` } : null,
        ]}
      >
        <View
          style={[
            {
              height: STAGE_H,
              borderRadius: STAGE_RADIUS,
              overflow: 'hidden',
            },
            gradientStyle(state.kind === 'allOwned' ? GIFT_STAGE.allOwned : GIFT_STAGE.ready),
          ]}
        >
          {state.kind !== 'allOwned' ? <StageLight /> : null}
          <View
            style={{
              position: 'absolute',
              left: SPACING[4],
              top: SPACING[4],
              bottom: 14,
              width: 150,
              gap: SPACING[1],
            }}
          >
            <T v="stamp" color={GIFT_STAGE.eyebrow} strong style={{ letterSpacing: 1.5 }}>
              {upperTr(tr.gifts.eyebrow)}
            </T>
            {state.kind === 'ready' ? (
              <>
                <T v="title" color={GIFT_STAGE.ink}>
                  {tr.gifts.ready(packName(state.pack))}
                </T>
                <Btn
                  sm
                  label={tr.gifts.open}
                  fill={GIFT_STAGE.button}
                  tint={GIFT_STAGE.buttonInk}
                  onPress={open}
                  style={{ marginTop: SPACING[2], alignSelf: 'flex-start' }}
                />
              </>
            ) : state.kind === 'progress' ? (
              <>
                <T v="h3" color={GIFT_STAGE.ink}>
                  {tr.gifts.loginsLeft(packName(state.pack), state.left)}
                </T>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING[2],
                    marginTop: SPACING[2],
                  }}
                >
                  <LoginBar
                    logins={state.logins}
                    per={state.per}
                    width={74}
                    on={GIFT_STAGE.ink}
                    off={GIFT_STAGE.barOff}
                  />
                  <T v="fine" strong color={GIFT_STAGE.ink}>
                    {tr.gifts.progress(state.logins, state.per)}
                  </T>
                </View>
              </>
            ) : (
              <T v="h3" color={GIFT_STAGE.ink}>
                {tr.gifts.allOwned}
              </T>
            )}
          </View>
          {!ready ? (
            <View
              style={{
                position: 'absolute',
                right: SPACING[3],
                bottom: SPACING[3],
                width: ROUND,
                height: ROUND,
                borderRadius: ROUND / 2,
                backgroundColor: GIFT_STAGE.round,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CapIcon name="chevron" color={GIFT_STAGE.ink} size={ICON.sm} />
            </View>
          ) : null}
        </View>
      </Glass>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: CARD_PAD,
          right: CARD_PAD,
          top: CARD_PAD,
          height: STAGE_H,
        }}
      >
        {PACKS.map((p, i) => (
          <FloatingPack
            key={p.pack}
            index={i}
            {...p}
            greyed={state.kind === 'allOwned'}
            badge={ready && p.pack === state.pack ? state.count : 0}
          />
        ))}
      </View>
    </Pressable>
  );
}

// The stage's warm light at the right and its stars.
function StageLight() {
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          { position: 'absolute', right: 20, top: 10, width: 170, height: 140 },
          gradientStyle(GIFT_STAGE.sun),
        ]}
      />
      {STARS.map((s) => (
        <Svg
          key={`${s.x}-${s.top}`}
          viewBox="0 0 10 10"
          width={s.size}
          height={s.size}
          style={{ position: 'absolute', left: `${s.x * 100}%`, top: s.top }}
        >
          <Path d={STAR_PATH} fill={GIFT_STAGE.star} opacity={s.opacity} />
        </Svg>
      ))}
    </>
  );
}

// A pack in the air: it floats ±3 over 2.6 s, each 0.65 s after the one before; still with reduce
// motion.
function FloatingPack({
  pack,
  right,
  top,
  width,
  turn,
  index,
  greyed,
  badge,
}: {
  pack: (typeof PACKS)[number]['pack'];
  right: number;
  top: number;
  width: number;
  turn: string;
  index: number;
  greyed: boolean;
  badge: number;
}) {
  const { px, ms, stepMs } = GIFT_MOTION.cardFloat;
  const y = useFloat(px, ms, index * stepMs);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        right,
        top,
        width,
        zIndex: pack === 'bronz' ? 2 : 1,
        transform: [{ translateY: y }],
      }}
    >
      <View style={{ transform: [{ rotate: turn }] }}>
        {/* The filter on the picture only: it cuts what lies past its view (Android), and the
            badge stands out over the corner (the owner's report, 7 Kasım). */}
        <View style={{ filter: greyed ? [...GREYED, PACK_SHADOW] : [PACK_SHADOW] }}>
          <Image
            source={PACK_ART[pack]}
            accessibilityIgnoresInvertColors
            style={{
              width,
              height: width / PACK_RATIO,
            }}
            resizeMode="contain"
          />
        </View>
        {badge > 0 ? (
          <View style={{ position: 'absolute', right: -BADGE / 2 + 3, top: -BADGE / 2 + 3 }}>
            <CanOpenBadge count={badge} />
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
