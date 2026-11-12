import { router } from 'expo-router';
import { Animated, Image, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, T } from '@/aura/kit';
import { boxShadowParts } from '@/components/NativeShadow';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { Tap } from '@/motion';
import { upperTr } from '@shared/trText.ts';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { GIFT_CARD, GIFT_STAGE } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { isShownPack, PACK_ART, PACK_RATIO } from './art';
import { useFloat } from './loops';
import { cardState, packName } from './model';
import { BADGE, CanOpenBadge, LoginBar } from './parts';
import { useGiftState } from './queries';

// Aktiviteler's gift card (docs/design/iskelet.md → 5.3): one dark layer (no glass round it), the
// three packs in the air standing out over its top edge at its right (Gümüş -12°, Altın 12°, Bronz
// in the middle, bigger), the words at its left and the clear "Paketlere bak" at its foot. Every
// state on the board's ground with the packs in colour (tuval Aktivite); a pack ready to open
// keeps the accent ring round the card.
const C = GIFT_CARD;

export function GiftCard() {
  const gifts = useGiftState();
  const { colors, scheme } = useTheme();
  // The board's deep green words on the light clear glass; the dark glass keeps its own ink.
  const buttonInk = scheme === 'light' ? C.buttonInk : KIT.button.dark.clear.ink;
  const shadowOff = useLabOff('golge');
  const open = () => router.push('/gifts');

  if (gifts.isPending) {
    return (
      <View style={{ paddingTop: C.overhang }}>
        <View
          accessibilityState={{ busy: true }}
          style={{ height: C.height, borderRadius: C.radius, backgroundColor: colors.track }}
        />
      </View>
    );
  }
  if (!gifts.data) {
    return (
      <View style={{ paddingTop: C.overhang }}>
        <Glass
          radius={C.radius}
          style={{
            minHeight: C.height,
            padding: C.pad,
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING[2],
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
        </Glass>
      </View>
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
  const shadow = boxShadowParts(
    shadowOff,
    ready ? `${C.shadow}, 0px 0px 0px ${C.ring}px ${colors.accent}` : C.shadow,
    C.radius,
  );

  return (
    <Tap
      testID="gift-card"
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={open}
      style={{ paddingTop: C.overhang }}
    >
      <View
        style={[
          { minHeight: C.height, borderRadius: C.radius, boxShadow: shadow.boxShadow },
          gradientStyle(C.ground),
        ]}
      >
        {shadow.node}
        {/* The words at its left, the button at its foot (tuval Aktivite). */}
        <View style={{ flexGrow: 1, padding: C.pad }}>
          <T v="giftEyebrow" color={C.eyebrow}>
            {upperTr(tr.gifts.eyebrow)}
          </T>
          {state.kind === 'ready' ? (
            <View style={{ width: C.textWidth, marginTop: C.titleTop }}>
              <T v="giftTitle" color={GIFT_STAGE.ink}>
                {tr.gifts.ready(packName(state.pack))}
              </T>
            </View>
          ) : state.kind === 'progress' ? (
            <View style={{ width: C.textWidth, marginTop: C.titleTop }}>
              <T v="giftTitle" color={GIFT_STAGE.ink}>
                {tr.gifts.loginsLeft(packName(state.pack), state.left)}
              </T>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING[2],
                  marginTop: SPACING[1],
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
            </View>
          ) : (
            <View style={{ width: C.textWidth, marginTop: C.titleTop }}>
              <T v="giftTitle" color={GIFT_STAGE.ink}>
                {tr.gifts.allOwned}
              </T>
            </View>
          )}
          {/* Clear, its words 14.5/800 in the deep green and its arrow after them. */}
          <View style={{ marginTop: 'auto', paddingTop: SPACING[2] }}>
            <Btn
              sm
              variant="glassy"
              label={tr.gifts.seePacks}
              onPress={open}
              tint={buttonInk}
              look={{ type: 'giftBtn', padLeft: C.button.padLeft, padRight: C.button.padRight }}
              trail={<CapIcon name="chevron" color={buttonInk} size={C.chevron} />}
            />
          </View>
        </View>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: C.height }}
        >
          {C.packs.map((p, i) => (
            <FloatingPack
              key={p.pack}
              index={i}
              {...p}
              badge={ready && p.pack === state.pack ? state.count : 0}
            />
          ))}
        </View>
      </View>
    </Tap>
  );
}

// A pack in the air: it floats ±3 over 2.6 s, each 0.65 s after the one before; still with reduce
// motion. Its drop shadow is the board's (CSS's blur is twice the deviation).
function FloatingPack({
  pack,
  right,
  top,
  width,
  turn,
  shadow,
  index,
  badge,
}: {
  pack: (typeof GIFT_CARD.packs)[number]['pack'];
  right: number;
  top: number;
  width: number;
  turn: string;
  shadow: { y: number; deviation: number; color: string };
  index: number;
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
        <View
          style={{
            filter: [
              {
                dropShadow: {
                  offsetX: 0,
                  offsetY: shadow.y,
                  standardDeviation: shadow.deviation,
                  color: shadow.color,
                },
              },
            ],
          }}
        >
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
