import type { GiftPackView, GiftState } from '@shared/api/gifts.ts';
import type { GiftTier } from '@shared/gifts.ts';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Round, T } from '@/aura/kit';
import { useLoaderHold } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { isShownPack, PACK_RATIO, type ShownPack } from '@/features/gifts/art';
import { packName, packsInOrder } from '@/features/gifts/model';
import { OddsSheet } from '@/features/gifts/OddsSheet';
import { openedCardWidth, OpenedCard } from '@/features/gifts/OpenedCard';
import {
  DOTS_END,
  frontRect,
  INFO_AT,
  PackRing,
  RING_FROM,
  RingDots,
  useRing,
} from '@/features/gifts/PackRing';
import { CardFace, GiftTopBar, LoginBar, SoonTag } from '@/features/gifts/parts';
import { CARD_RATIO } from '@/features/gifts/art';
import { FxMoves } from '@/components/FxSvg';
import { useGiftState, useOpenPack } from '@/features/gifts/queries';
import { Rip, ripRects, RipWarm } from '@/features/gifts/Rip';
import { type Rect, type Stage, useStage } from '@/features/gifts/stage';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { PACK_BUTTON } from '@/theme/gifts';
import { GIFT_MOTION } from '@/theme/giftMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// Hediye paketleri (docs/SPEC_V4.md §4.U; Aura v134 Paketler, PaketSecimDonme, PaketlerHal,
// PaketOranlar, PaketSecimGecis, PaketAcilis, PaketAcilisNadirlik, PaketKartEgme): the four packs
// on a ring, the front one's logins and buttons under it; Aç draws on the server, then the pack
// zooms to the middle, is torn open and its card is shown. Android's back closes the rip or the
// card first.
type Opening = {
  pack: ShownPack;
  accessory: { id: string; tier: GiftTier };
  from: Rect | null;
  card: Rect | null;
  phase: 'rip' | 'card';
};

export default function GiftsScreen() {
  const gifts = useGiftState();
  const hold = useLoaderHold(gifts.isPending);
  const back = () => router.back();
  const top = <GiftTopBar title={tr.gifts.title} onBack={back} />;

  if (gifts.isPending || hold) {
    return (
      <Screen top={top}>
        <Skeleton />
      </Screen>
    );
  }
  if (!gifts.data) {
    return (
      <Screen top={top}>
        <LoadError onRetry={() => void gifts.refetch()} retrying={gifts.isRefetching} />
      </Screen>
    );
  }
  return (
    <Packs
      state={gifts.data}
      onBack={back}
      onRetry={() => void gifts.refetch()}
      retrying={gifts.isRefetching}
    />
  );
}

function Packs({
  state,
  onBack,
  onRetry,
  retrying,
}: {
  state: GiftState;
  onBack: () => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const stage = useStage();
  const insets = useSafeAreaInsets();
  const ring = useRing();
  const openPack = useOpenPack();
  const packs = packsInOrder(state, isShownPack);
  const [front, setFront] = useState(0);
  const [odds, setOdds] = useState(false);
  const [opening, setOpening] = useState<Opening | null>(null);
  // The drawn accessory's card, drawn hidden before the pack moves (RipWarm).
  const [warmCard, setWarmCard] = useState<{ id: string; tier: GiftTier } | null>(null);
  const stageRef = useRef<View>(null);
  const rootRef = useRef<View>(null);
  const away = useSharedValue(0);
  const view = packs[front];
  // Set from Aç to the rip's start: a second tap in that window opens no second pack.
  const starting = useRef(false);
  // Closes the rip or the card; the hidden warm card goes with it (its motion stops).
  const close = () => {
    setOpening(null);
    setWarmCard(null);
  };

  useEffect(() => {
    const { otherMs } = GIFT_MOTION.zoom;
    away.set(
      withTiming(opening ? 1 : 0, {
        duration: otherMs,
        easing: opening
          ? Easing.bezier(...GIFT_MOTION.curves.leave)
          : Easing.bezier(...GIFT_MOTION.curves.arrive),
      }),
    );
  }, [opening, away]);

  // Android's back: the rip or the card back to the ring (the odds sheet closes itself).
  useEffect(() => {
    if (!opening) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpening(null);
      setWarmCard(null);
      return true;
    });
    return () => sub.remove();
  }, [opening]);

  const open = () => {
    if (
      !view ||
      view.locked ||
      view.unopened === 0 ||
      openPack.isPending ||
      opening ||
      starting.current
    )
      return;
    starting.current = true;
    const pack = view.id;
    openPack.mutate(pack, {
      onError: () => {
        starting.current = false;
      },
      onSuccess: (res) => {
        const begin = (from: Rect | null) => {
          starting.current = false;
          setOpening({ pack, accessory: res.accessory, from, card: null, phase: 'rip' });
        };
        // The card is drawn first, hidden; the pack moves two frames later, with it ready.
        setWarmCard(res.accessory);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const node = stageRef.current;
            const root = rootRef.current;
            if (!node || !root) {
              begin(null);
              return;
            }
            root.measureInWindow((_rx, ry) => {
              node.measureInWindow((_x, y) => begin(frontRect(stage, y - ry)));
            });
          }),
        );
      },
    });
  };

  const awayStyle = useAnimatedStyle(() => ({ opacity: 1 - away.get() }));
  const infoStyle = useAnimatedStyle(() => ({ opacity: ring.info.get() }));
  const chromeStyle = useAnimatedStyle(() => ({ opacity: away.get() }));

  const top = (
    <Reanimated.View style={awayStyle} pointerEvents={opening ? 'none' : 'auto'}>
      <GiftTopBar title={tr.gifts.title} onBack={onBack} />
    </Reanimated.View>
  );

  const rip = ripRects(stage).card;
  const openedW = openedCardWidth(stage.s);
  return (
    <View ref={rootRef} style={{ flex: 1 }}>
      <RipWarm
        packs={packs.map((p) => p.id)}
        stage={stage}
        card={
          warmCard ? (
            <>
              <CardFace id={warmCard.id} tier={warmCard.tier} width={rip.w} height={rip.h} />
              <FxMoves>
                <CardFace
                  id={warmCard.id}
                  tier={warmCard.tier}
                  width={openedW}
                  height={openedW / CARD_RATIO}
                />
              </FxMoves>
            </>
          ) : null
        }
      />
      <Screen top={top}>
        <Reanimated.View
          style={awayStyle}
          pointerEvents={opening ? 'none' : 'box-none'}
          accessibilityElementsHidden={!!opening}
          importantForAccessibility={opening ? 'no-hide-descendants' : 'auto'}
        >
          <View ref={stageRef} collapsable={false} style={{ marginHorizontal: -SPACING[5] }}>
            <PackRing
              packs={packs}
              ring={ring}
              stage={stage}
              enabled={!opening && !openPack.isPending}
              hideFront={!!opening}
              onFront={(i) => {
                setFront(i);
                openPack.reset();
              }}
              onOpen={open}
            />
          </View>
          <RingDots front={front} stage={stage} />
          {view ? (
            <Reanimated.View
              style={[
                {
                  marginTop: (INFO_AT - DOTS_END) * stage.s,
                  alignItems: 'center',
                  gap: SPACING[1.5],
                },
                infoStyle,
              ]}
            >
              <Info
                view={view}
                state={state}
                pending={openPack.isPending}
                onOpen={open}
                onOdds={() => setOdds(true)}
              />
              {openPack.isError ? <OpenError error={openPack.error} /> : null}
            </Reanimated.View>
          ) : null}
        </Reanimated.View>
      </Screen>
      {opening ? (
        <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
          {/* The result is mounted (and drawn) under the rip, hidden until the rip is done. */}
          <OpenedCard
            accessory={opening.accessory}
            from={opening.card ?? rip}
            stage={stage}
            ready={opening.phase === 'card'}
            onClose={close}
          />
          {opening.phase === 'rip' ? (
            <Rip
              pack={opening.pack}
              accessory={opening.accessory}
              from={opening.from}
              stage={stage}
              onDone={(card) => setOpening((o) => (o ? { ...o, card, phase: 'card' } : o))}
            />
          ) : null}
          <Reanimated.View
            pointerEvents="box-none"
            style={[{ position: 'absolute', inset: 0 }, chromeStyle]}
          >
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, right: 0, top: stage.top(60) }}
            >
              <T v="eyebrow" center>
                {tr.gifts.pack(packName(opening.pack))}
              </T>
            </View>
            <View style={{ position: 'absolute', right: SPACING[5], top: insets.top }}>
              <Round icon="close" label={tr.gifts.close} onPress={close} />
            </View>
          </Reanimated.View>
        </View>
      ) : null}
      {view ? (
        <OddsSheet
          pack={view.id}
          visible={odds}
          onClose={() => setOdds(false)}
          state={state}
          loading={false}
          onRetry={onRetry}
          retrying={retrying}
        />
      ) : null}
    </View>
  );
}

// The front pack's name, what can be opened, the logins to the next and the buttons; a locked
// pack only its name, "Yakında" and the buttons.
function Info({
  view,
  state,
  pending,
  onOpen,
  onOdds,
}: {
  view: GiftPackView;
  state: GiftState;
  pending: boolean;
  onOpen: () => void;
  onOdds: () => void;
}) {
  const per = state.loginsPerPack;
  const logins = Math.min(state.logins, per);
  return (
    <>
      <T v="title" center accessibilityRole="header">
        {tr.gifts.pack(packName(view.id))}
      </T>
      {view.locked ? (
        <SoonTag />
      ) : (
        <>
          <T v="fine" strong center>
            {view.unopened > 0 ? tr.gifts.canOpen(view.unopened) : tr.gifts.nothingToOpen}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
            <LoginBar logins={logins} per={per} />
            <T v="fine">{tr.gifts.loginsOf(logins, per)}</T>
          </View>
          <T v="fine" center>
            {tr.gifts.howToEarn(per)}
          </T>
        </>
      )}
      {/* Two buttons of one size side by side; Aç in the pack's colour (the owner's call, 7 Kasım). */}
      <View
        style={{
          marginTop: SPACING[2],
          flexDirection: 'row',
          alignSelf: 'stretch',
          marginHorizontal: SPACING[6],
          gap: SPACING[3],
        }}
      >
        <Btn
          label={tr.gifts.open}
          onPress={onOpen}
          loading={pending}
          disabled={view.locked || view.unopened === 0}
          fill={PACK_BUTTON[view.id].fill}
          tint={PACK_BUTTON[view.id].ink}
          style={{
            flexGrow: 1,
            flexBasis: 0,
            boxShadow: `0 10px 22px ${PACK_BUTTON[view.id].shadow}`,
          }}
        />
        <Btn
          variant="glassy"
          icon="info"
          label={tr.gifts.odds}
          onPress={onOdds}
          style={{ flexGrow: 1, flexBasis: 0 }}
        />
      </View>
    </>
  );
}

function OpenError({ error }: { error: unknown }) {
  const { colors } = useTheme();
  return (
    <T v="fine" center color={colors.danger} accessibilityLiveRegion="polite">
      {errorMessage(error)}
    </T>
  );
}

// PaketlerHal's loading: the packs' places and three lines where the words come.
const SKELETON_PACKS = [
  { deg: 180, w: 97.8, opacity: 0.7 },
  { deg: 90, w: 142.9, opacity: 0.7 },
  { deg: -90, w: 142.9, opacity: 0.7 },
  { deg: 0, w: 188, opacity: 1 },
] as const;
const SKELETON_RADIUS = 18;
const SKELETON_LINES = [
  { w: 140, h: 22 },
  { w: 120, h: 14 },
  { w: 200, h: 14 },
] as const;
function Skeleton() {
  const stage = useStage();
  const { colors } = useTheme();
  return (
    <View accessibilityState={{ busy: true }}>
      <View style={{ marginHorizontal: -SPACING[5], height: (DOTS_END - 6 - RING_FROM) * stage.s }}>
        {SKELETON_PACKS.map((p) => (
          <SkeletonPack key={p.deg} stage={stage} {...p} color={colors.track} />
        ))}
      </View>
      <View
        style={{
          marginTop: (INFO_AT - DOTS_END + 12) * stage.s,
          alignItems: 'center',
          gap: SPACING[2],
        }}
      >
        {SKELETON_LINES.map((l, i) => (
          <View
            key={i}
            style={{
              width: l.w * stage.s,
              height: l.h,
              borderRadius: l.h / 2,
              backgroundColor: colors.track,
            }}
          />
        ))}
      </View>
    </View>
  );
}
function SkeletonPack({
  stage,
  deg,
  w: boardW,
  opacity,
  color,
}: {
  stage: Stage;
  deg: number;
  w: number;
  opacity: number;
  color: string;
}) {
  const rad = (deg * Math.PI) / 180;
  const w = boardW * stage.s;
  const h = w / PACK_RATIO;
  const cx = stage.width / 2 + 122 * Math.sin(rad) * stage.s;
  const cy = (295.5 + 22.5 * Math.cos(rad) - RING_FROM) * stage.s;
  return (
    <View
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: SKELETON_RADIUS * (boardW / 188) * stage.s,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

function LoadError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING[2] }}
      accessibilityLiveRegion="polite"
    >
      <CapIcon name="warn" color={colors.danger} size={ICON.lg * 1.6} />
      <T v="h3" center accessibilityRole="header">
        {tr.gifts.loadError}
      </T>
      <T v="fine" center>
        {tr.gifts.loadErrorHint}
      </T>
      <View style={{ marginTop: SPACING[2] }}>
        <Btn icon="refresh" label={tr.common.retry} onPress={onRetry} loading={retrying} />
      </View>
    </View>
  );
}
