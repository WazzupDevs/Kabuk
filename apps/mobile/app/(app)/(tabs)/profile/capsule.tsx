import type { LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { FxMoves } from '@/components/FxSvg';
import { Loader } from '@/components/Loader';
import { LookAvatar, readLookAhead } from '@/components/LookAvatar';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useHideTabBar } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import { CapsuleStage, type Play } from '@/features/capsule/CapsuleStage';
import {
  accessories,
  bare,
  code,
  type Look,
  parse,
  shuffle,
  wearPack,
} from '@/features/capsule/look';
import { FEELING_MOVES, JUMP, type Move, SHUFFLE } from '@/features/capsule/motion';
import { OptionCarousel } from '@/features/capsule/OptionCarousel';
import { chosenIn, shownIn, slotOptions } from '@/features/capsule/options';
import { OptionsSheet } from '@/features/capsule/OptionsSheet';
import { TierTag } from '@/features/gifts/parts';
import { giftKeys, useGiftState } from '@/features/gifts/queries';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { giftsApi, profileApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useAskBeforeLeaving } from '@/lib/leaveGuard';
import { useAfterSlide } from '@/lib/useAfterSlide';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { KIT } from '@/theme/auraKit';
import { FEELINGS } from '@/theme/capsuleLook';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// v46 feel(): the feeling's face stays 1850 ms.
const FEELING_MS = 1850;
// The top bar 56.
const BAR = 56;
// The options' row: the centred option and its ring.
const CAROUSEL_H = KIT.size.carouselItem + (KIT.size.boxRing + KIT.size.boxRingGap) * 2;
// "Karıştır": the arrows turn once round and swell a little.
const SHUFFLE_TURN_MS = 520;
const SHUFFLE_SWELL = 1.18;
// Tiles read ahead in one idle turn.
const READ_AHEAD = 8;
const SLOTS = CAPSULE_CATALOG.slots.map((s) => ({ id: s.id as LookSlot, name: s.name }));

// Kapsülün (docs/SPEC_V4.md §4.D, K-46; the owner's call, 8 Kasım): the bar stays at the top; the
// capsule large on its floor (a tap on it shows the next feeling, v46), the chosen option's name
// (and an accessory's tier) under it, then the slot's options in a snapping row (the centred one
// is worn) and "Hepsini gör", which opens the slot's options pack by pack ("Paketi tak"). At the
// foot the six slots' buttons, "Hepsini çıkar" and "Kaydet". Nothing is saved until Kaydet; leaving
// with changes asks first.
export default function CapsuleScreen() {
  // Editing, the tab bar is out of sight (the owner's call, 2 Kasım, 11.5, 12.2).
  useHideTabBar();
  const own = useProfile();
  const view = useProfileView(own.data?.public_id);
  const saved = view.data?.capsuleLook ?? null;
  if (view.isPending || own.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <Loader />
      </SafeAreaView>
    );
  }
  if (!saved) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-canvas p-4">
        <EmptyState
          kind="error"
          body={errorMessage(view.error)}
          action={{ label: tr.common.retry, onPress: () => void view.refetch() }}
        />
      </SafeAreaView>
    );
  }
  return <Editor saved={saved} publicId={own.data?.public_id ?? ''} />;
}

function Editor({ saved, publicId }: { saved: string; publicId: string }) {
  const { shape, scheme, colors } = useTheme();
  const { c } = useKit();
  const reduce = useReduceMotion();
  const queryClient = useQueryClient();
  const [look, setLook] = useState<Look>(() => parse(saved));
  // What the saved look wears keeps a part that became a pack accessory on offer (§4.U).
  const kept = useMemo(() => parse(saved), [saved]);
  const [turn, setTurn] = useState(0);
  const [slot, setSlot] = useState<LookSlot>('h');
  const [leaving, setLeaving] = useState(false);
  const [all, setAll] = useState(false);
  const feelingAt = useRef(-1);
  const now = code(look);
  const changed = now !== code(parse(saved));
  // The owned pack accessories, each offered in its slots (KapsulHediye; §4.U).
  const gifts = useGiftState();
  const owned = useMemo(() => new Set((gifts.data?.owned ?? []).map((o) => o.id)), [gifts.data]);

  // The parts with set-look (the server keeps the accessories through it), then the worn set with
  // gifts/wear when it changed.
  const save = useMutation({
    meta: FEEL_ERROR,
    mutationFn: async () => {
      await profileApi.setLook(now);
      const ids = accessories(look);
      if (ids.join(' ') !== accessories(kept).join(' ')) await giftsApi.wear(ids);
    },
    onSuccess: () => {
      haptic('accountReady');
      // The button ends with the answer; the two re-reads run on their own.
      void queryClient.invalidateQueries({ queryKey: profileViewKeys.view(publicId) });
      void queryClient.invalidateQueries({ queryKey: giftKeys.state });
    },
  });
  const leave = useCallback(() => {
    if (changed && !save.isSuccess) setLeaving(true);
    else router.back();
  }, [changed, save.isSuccess]);
  const askToLeave = useCallback(() => setLeaving(true), []);
  useAskBeforeLeaving(changed && !save.isSuccess, askToLeave);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        leave();
        return true;
      });
      return () => sub.remove();
    }, [leave]),
  );
  // What the stage plays: a jump for a part, a wobble for "Karıştır", a feeling for a tap.
  const [play, setPlay] = useState<Play | null>(null);
  const [beat, setBeat] = useState(0);
  const [feeling, setFeeling] = useState<{ id: string; name: string; key: number } | null>(null);
  useEffect(() => {
    if (!feeling) return undefined;
    const timer = setTimeout(() => setFeeling(null), FEELING_MS);
    return () => clearTimeout(timer);
  }, [feeling]);
  const put = (next: Look, move: Move = JUMP) => {
    haptic('selection');
    save.reset();
    setFeeling(null);
    setLook(next);
    setPlay({ move, key: Date.now() });
  };
  // A tap on the capsule (v46 feel()): the next feeling for a moment; it is never saved.
  const feel = () => {
    haptic('selection');
    const at = feeling ? FEELINGS.findIndex(([id]) => id === feeling.id) : feelingAt.current;
    const next = FEELINGS[(at + 1) % FEELINGS.length];
    if (!next) return;
    feelingAt.current = (at + 1) % FEELINGS.length;
    const [id, name] = next;
    const key = Date.now();
    setFeeling({ id, name, key });
    setBeat(key);
    const move = FEELING_MOVES[id];
    if (move) setPlay({ move, key });
  };

  const ready = useAfterSlide();
  // Every slot's options, their sade tiles made from the colour alone (options.ts): a part put on
  // in one slot draws no tile again.
  const color = look.c;
  const options = useMemo(
    () =>
      SLOTS.map((s) => ({
        ...s,
        ...slotOptions(s.id, color, kept, owned, tr.capsule.empty(s.name)),
      })),
    [color, kept, owned],
  );
  const current = options.find((s) => s.id === slot) ?? options[0];
  const flat = current?.flat ?? [];
  const chosen = chosenIn(slot, look, flat);
  const chosenOption = flat[chosen] ?? null;
  // Every tile read ahead in idle time, a few at a time, so that a slot opens with nothing left to
  // read (the owner's report, 7 Kasım: Kapsülünü süsle stuttered).
  useEffect(() => {
    if (!ready) return undefined;
    const looks = options.flatMap((s) => s.flat.map((o) => o.tile));
    let at = 0;
    let handle = 0;
    const step = () => {
      for (const end = Math.min(at + READ_AHEAD, looks.length); at < end; at++) {
        const next = looks[at];
        if (next) readLookAhead(next);
      }
      if (at < looks.length) handle = requestIdleCallback(step);
    };
    handle = requestIdleCallback(step);
    return () => cancelIdleCallback(handle);
  }, [ready, options]);
  const ringColor = scheme === 'dark' ? c.glass : colors.surface;
  const stage = KIT.size.capsuleStage;
  const floorBlur = KIT.size.capsuleFloorBlur;

  return (
    <>
      <Screen
        top={
          <View className="flex-row items-center justify-between" style={{ height: BAR }}>
            <Round icon="back" label={tr.common.back} onPress={leave} />
            <T v="title" ink accessibilityRole="header">
              {tr.capsule.title}
            </T>
            <Round
              testID="capsule-shuffle"
              label={tr.capsule.shuffle}
              onPress={() => {
                setTurn((n) => n + 1);
                put(shuffle(Math.random, look), SHUFFLE);
              }}
            >
              <ShuffleGlyph turn={turn} />
            </Round>
          </View>
        }
        footer={
          <>
            {/* The six slots, each a small capsule wearing what is in it now (the owner's call, 8
            Kasım): the current one ringed in the accent, a changed one with a pink dot. */}
            <View className="flex-row" accessibilityRole="tablist">
              {options.map((s) => {
                const shown = s.flat[chosenIn(s.id, look, s.flat)] ?? null;
                return (
                  <SlotButton
                    key={s.id}
                    name={s.name}
                    tile={shown?.tile ?? ''}
                    value={shown?.name ?? ''}
                    on={s.id === slot}
                    changed={shownIn(s.id, look) !== shownIn(s.id, kept)}
                    onPress={() => setSlot(s.id)}
                  />
                );
              })}
            </View>
            {/* docs/design/aura → Kapsülün: two equal buttons, 12 apart. */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Btn
                  block
                  variant="glassy"
                  label={tr.capsule.clearAll}
                  onPress={() => put(bare(look))}
                />
              </View>
              <View className="flex-1">
                <Btn
                  block
                  icon="check"
                  testID="capsule-save"
                  label={tr.capsule.save}
                  disabled={!changed || save.isSuccess}
                  loading={save.isPending}
                  onPress={() => save.mutate()}
                />
              </View>
            </View>
            {/* aura v50 (Kapsul): the button stays "Kaydet", off; the saved note is a line under it. */}
            {save.isSuccess && !changed ? (
              <View
                accessibilityLiveRegion="polite"
                style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.tagGap * 2 }}
              >
                <CapIcon name="check" color={KIT.success} size={KIT.size.iconSm} />
                <T v="fine" ink style={{ flex: 1 }}>
                  {tr.capsule.saved}
                </T>
              </View>
            ) : null}
            {save.isError ? (
              <T v="fine" color={c.warn}>
                {errorMessage(save.error)}
              </T>
            ) : null}
          </>
        }
      >
        <View style={{ alignItems: 'center' }}>
          <FxMoves>
            <CapsuleStage
              testID="capsule-preview"
              look={now}
              feeling={feeling}
              play={play}
              beat={beat}
              size={stage - KIT.size.capsuleRing * 2}
              ring={KIT.size.capsuleRing}
              ringColor={ringColor}
              label={tr.capsule.tapHead}
              hint={null}
              onPress={feel}
            />
          </FxMoves>
          {/* The soft floor the capsule stands on. */}
          <View
            pointerEvents="none"
            style={{
              marginTop: SPACING[2],
              width: stage * KIT.size.capsuleFloorW,
              height: KIT.size.capsuleFloorH,
              borderRadius: KIT.size.capsuleFloorH / 2,
              backgroundColor: c.capsuleFloor,
              boxShadow: `0px 0px ${floorBlur}px ${floorBlur / 2}px ${c.capsuleFloor}`,
            }}
          />
        </View>
        {/* The chosen option's name; a pack accessory's tier under it, its room kept for every
        option so that the row under it never moves. */}
        <View style={{ alignItems: 'center', gap: SPACING[1] }} accessibilityLiveRegion="polite">
          <T v="h3" ink center>
            {chosenOption?.name ?? ''}
          </T>
          <View
            style={{ opacity: chosenOption?.tier ? 1 : 0 }}
            importantForAccessibility={chosenOption?.tier ? 'auto' : 'no-hide-descendants'}
            accessibilityElementsHidden={!chosenOption?.tier}
          >
            <TierTag tier={chosenOption?.tier ?? 'siradan'} />
          </View>
        </View>
        {/* The row runs from one edge of the screen to the other. */}
        <View style={{ marginHorizontal: -shape.screenPadding, height: CAROUSEL_H }}>
          {ready ? (
            <OptionCarousel
              key={slot}
              options={flat}
              chosen={chosen}
              reduce={reduce}
              label={current?.name ?? ''}
              onPick={(i) => {
                const o = flat[i];
                if (o) put(o.apply(look));
              }}
            />
          ) : null}
        </View>
        <View style={{ alignItems: 'center' }}>
          <Btn sm variant="glassy" label={tr.capsule.seeAll} onPress={() => setAll(true)} />
        </View>
      </Screen>
      <OptionsSheet
        visible={all}
        onClose={() => setAll(false)}
        title={tr.capsule.allTitle(current?.name ?? '')}
        groups={current?.groups ?? []}
        chosenKey={chosenOption?.key ?? null}
        onPick={(o) => {
          setAll(false);
          put(o.apply(look));
        }}
        onWearPack={(g) => {
          setAll(false);
          if (g.rack && g.pack) put(wearPack(look, g.rack, g.pack, kept));
        }}
      />
      {/* Saving, the sheet stays; a failed save says so here, over the bar (audit PRO-3). */}
      <Sheet
        visible={leaving}
        onClose={() => {
          if (!save.isPending) setLeaving(false);
        }}
        title={tr.capsule.unsavedTitle}
      >
        <T v="fine">{tr.capsule.unsavedBody}</T>
        {save.isError ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(save.error)}
          </T>
        ) : null}
        <Btn
          block
          label={tr.capsule.saveAndLeave}
          loading={save.isPending}
          onPress={() =>
            save.mutate(undefined, {
              onSuccess: () => {
                setLeaving(false);
                router.back();
              },
            })
          }
        />
        <Btn
          block
          variant="glassy"
          label={tr.capsule.leaveUnsaved}
          onPress={() => {
            setLeaving(false);
            router.back();
          }}
        />
      </Sheet>
    </>
  );
}

// "Karıştır" (the owner's call, 27 Ekim): the set's die, which turns once round and swells a little
// with each shuffle (it says "random", as the four squares did not); still with reduce motion.
function ShuffleGlyph({ turn }: { turn: number }) {
  const { c } = useKit();
  const reduce = useReduceMotion();
  const spin = useSharedValue(0);
  const swell = useSharedValue(1);
  useEffect(() => {
    if (turn === 0 || reduce) return;
    spin.set(0);
    spin.set(withTiming(1, { duration: SHUFFLE_TURN_MS, easing: Easing.out(Easing.back(1.4)) }));
    swell.set(
      withSequence(
        withTiming(SHUFFLE_SWELL, { duration: SHUFFLE_TURN_MS / 2 }),
        withTiming(1, { duration: SHUFFLE_TURN_MS / 2 }),
      ),
    );
  }, [turn, reduce, spin, swell]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }, { scale: swell.value }],
  }));
  return (
    <Animated.View style={style}>
      <CapIcon name="shuffle" color={c.ink} />
    </Animated.View>
  );
}

// A slot's button (the owner's call, 8 Kasım): a 36 capsule wearing what is in the slot now, its
// name under it; the current slot ringed in the accent, one changed from the saved look with a pink
// dot.
function SlotButton({
  name,
  tile,
  value,
  on,
  changed,
  onPress,
}: {
  name: string;
  tile: string;
  value: string;
  on: boolean;
  changed: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const size = KIT.size.slotButton;
  const out = KIT.size.boxRing + KIT.size.boxRingGap;
  const box = size + out * 2;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={tr.capsule.slotLabel(name, value, changed)}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', gap: SPACING[1] }}
    >
      <View style={{ width: box, height: box, padding: out }}>
        <LookAvatar look={tile} size={size} />
        {on ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: box / 2,
              borderWidth: KIT.size.boxRing,
              borderColor: colors.accent,
            }}
          />
        ) : null}
        {changed ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: KIT.size.slotDot,
              height: KIT.size.slotDot,
              borderRadius: KIT.size.slotDot / 2,
              backgroundColor: KIT.pink,
            }}
          />
        ) : null}
      </View>
      <T v="fine" ink={on} center>
        {name}
      </T>
    </Pressable>
  );
}
