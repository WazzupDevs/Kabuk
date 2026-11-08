import type { LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text as RNText,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuraFadeX } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { LookAvatar, readLookAhead } from '@/components/LookAvatar';
import { HidingHeadScreen } from '@/components/HidingHeadScreen';
import { useHideTabBar } from '@/components/TabBar';
import { Sheet } from '@/components/Sheet';
import { useProfile } from '@/features/account/useProfile';
import {
  accessories,
  accessoryIn,
  accessoryItems,
  bare,
  code,
  colors as colorItems,
  type Item,
  type Look,
  packItems,
  packsFor,
  parse,
  type RackId,
  showsPart,
  shuffle,
  takeAccessoryOff,
  takeOff,
  wear,
  wearAccessory,
  wearPack,
  worn,
} from '@/features/capsule/look';
import { TierGems } from '@/features/gifts/parts';
import { giftKeys, useGiftState } from '@/features/gifts/queries';
import { accessoryById } from '@/features/gifts/model';
import { FxMoves } from '@/components/FxSvg';
import { CapsuleStage, type Play } from '@/features/capsule/CapsuleStage';
import { FEELING_MOVES, JUMP, type Move, SHUFFLE } from '@/features/capsule/motion';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useAskBeforeLeaving } from '@/lib/leaveGuard';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useAfterSlide } from '@/lib/useAfterSlide';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { giftsApi, profileApi } from '@/lib/api';
import { FEELINGS } from '@/theme/capsuleLook';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// docs/design/aura → Kapsülün (U35): no purple head. The bar stays; scrolling the parts up, the
// capsule rises a little and stays in sight while the chips, the categories and the foot go
// (HidingHeadScreen; the owner's call, 2 Kasım, 11.5). The capsule 160 with a 4 ring, the worn parts' chips under it, the categories' chips,
// then the options and the packs.
// v46 feel(): the feeling's face stays 1850 ms.
const FEELING_MS = 1850;
// The top bar 56; the capsule 8 under it, the worn chips 16, the categories 20, the options 16.
const BAR = 56;
const HERO_TOP = SPACING[2];
const WORN_TOP = SPACING[4];
const CATS_TOP = SPACING[5];
const BODY_TOP = SPACING[4];
// How far the capsule rises while the head gives way.
const HERO_LIFT = SPACING[6];
const PACK_GAP = SPACING[4];
// The pressed box's size.
const TILE_PRESSED = 0.96;
// "Karıştır": the arrows turn once round and swell a little.
const SHUFFLE_TURN_MS = 520;
const SHUFFLE_SWELL = 1.18;

// Kapsülün (skall tuvali: KapsulSusle, KapsulSusleIlk, KapsulSusleDegisti, KapsulSusleCikis;
// docs/SPEC_V4.md §4.D, K-46): the capsule large (a tap on it shows the next feeling, v46),
// what is worn as chips that take it off, then the racks (Şık, Karakter, Tema), the slots, the
// slot's packs ("Paketi tak") and their parts; "Karıştır", "Hepsini çıkar" and "Kaydet". Leaving
// with changes asks first. The title, the capsule and the parts scroll together; "Hepsini çıkar"
// and "Kaydet" stay at the foot (Screen footer).
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
  const side = shape.screenPadding;
  const queryClient = useQueryClient();
  const [look, setLook] = useState<Look>(() => parse(saved));
  // What the saved look wears keeps a part that became a pack accessory on offer (§4.U).
  const kept = useMemo(() => parse(saved), [saved]);
  const [turn, setTurn] = useState(0);
  const [slot, setSlot] = useState<LookSlot>('h');
  const [leaving, setLeaving] = useState(false);
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
    onSuccess: async () => {
      haptic('accountReady');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileViewKeys.view(publicId) }),
        queryClient.invalidateQueries({ queryKey: giftKeys.state }),
      ]);
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

  const { width } = useWindowDimensions();
  const ready = useAfterSlide();
  // Every rack's packs for the slot, one list (the racks' tabs went, the owner's call, 28 Ekim).
  const items: { rack: RackId | null; pack: string | null; items: Item[] }[] =
    slot === 'c'
      ? [{ rack: null, pack: null, items: colorItems() }]
      : CAPSULE_CATALOG.racks.flatMap((r) =>
          packsFor(r.id, slot, kept).map((g) => ({ rack: r.id, pack: g.pack, items: g.items })),
        );
  // The other tabs' options read ahead in idle time, a few at a time, so that a tab opens with
  // nothing left to read (the owner's report, 7 Kasım: Kapsülünü süsle stuttered).
  useEffect(() => {
    if (!ready) return undefined;
    const looks: string[] = [];
    for (const [other] of CAPSULE_CATALOG.slots.map((x) => [x.id as LookSlot] as const)) {
      if (other === slot) continue;
      const parts =
        other === 'c'
          ? colorItems()
          : CAPSULE_CATALOG.racks.flatMap((r) =>
              packsFor(r.id, other, kept).flatMap((g) => g.items),
            );
      for (const item of parts) looks.push(code(wear(look, item.slot, item.id)));
      for (const item of accessoryItems(other, owned))
        looks.push(code(wearAccessory(look, item.id)));
      if (other !== 'c' && other !== 'e') looks.push(code(wear(look, other, null)));
    }
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
  }, [ready, look, slot, kept, owned]);
  const wornList = worn(look);
  const slotAccessories = accessoryItems(slot, owned);
  const slotName = CAPSULE_CATALOG.slots.find((s) => s.id === slot)?.name ?? '';
  const ringColor = scheme === 'dark' ? c.glass : colors.surface;
  const catsRef = useRef<View>(null);
  const [cats, setCats] = useState({ top: 0, height: 0 });
  const catsFade = (width - side) * KIT.size.catsFade;

  return (
    <>
      <HidingHeadScreen
        lift={HERO_LIFT}
        gap={BODY_TOP}
        footer={
          <>
            {/* docs/design/aura → Kapsülün: two equal buttons, 12 apart, 12 above the tab bar. */}
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
        bar={
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
        stay={
          <View style={{ marginTop: HERO_TOP, alignItems: 'center' }}>
            <FxMoves>
              <CapsuleStage
                testID="capsule-preview"
                look={now}
                feeling={feeling}
                play={play}
                beat={beat}
                size={KIT.size.capsuleHero - KIT.size.capsuleRing * 2}
                ring={KIT.size.capsuleRing}
                ringColor={ringColor}
                label={tr.capsule.tapHead}
                hint={null}
                onPress={feel}
              />
            </FxMoves>
          </View>
        }
        hide={
          <>
            {wornList.length > 0 ? (
              <View
                style={{
                  marginTop: WORN_TOP,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: KIT.size.chipsGap,
                }}
              >
                {wornList.map((w) => (
                  <Chip
                    key={`${w.slot}-${w.id}`}
                    icon="closeSm"
                    label={w.name}
                    accessibilityLabel={tr.capsule.remove(w.name)}
                    onPress={() =>
                      put(w.accessory ? takeAccessoryOff(look, w.id) : takeOff(look, w.slot))
                    }
                  />
                ))}
              </View>
            ) : null}
            {/* The categories run to the screen's right edge and fade over its last fifth, into the
            ground's picture (11.4). */}
            <View
              ref={catsRef}
              onLayout={() =>
                catsRef.current?.measureInWindow((_x, y, _w, h) => setCats({ top: y, height: h }))
              }
              style={{
                marginTop: CATS_TOP,
                marginRight: -side,
                height: KIT.size.chip + KIT.size.edge * 2,
              }}
            >
              <ScrollView
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: KIT.size.chipsGap, paddingRight: side }}
              >
                {CAPSULE_CATALOG.slots.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    on={slot === s.id}
                    onPress={() => setSlot(s.id as LookSlot)}
                  />
                ))}
              </ScrollView>
              <AuraFadeX
                top={cats.top}
                left={width - catsFade}
                width={catsFade}
                height={cats.height}
              />
            </View>
          </>
        }
      >
        <View style={{ gap: PACK_GAP }}>
          {/* "boş", then the owned pack accessories of the slot, each with its tier (KapsulHediye). */}
          {(slot !== 'c' && slot !== 'e') || slotAccessories.length > 0 ? (
            <View className="flex-row flex-wrap" style={{ gap: KIT.size.optionGap }}>
              {slot !== 'c' && slot !== 'e' ? (
                <Box
                  kind="option"
                  look={code(wear(look, slot, null))}
                  label={tr.capsule.empty(slotName)}
                  on={!look[slot] && accessoryIn(look, slot) === null}
                  onPress={() => put(wear(look, slot, null))}
                />
              ) : null}
              {slotAccessories.map((item) => {
                const tier = accessoryById(item.id)?.tier;
                return (
                  <Box
                    key={item.id}
                    kind="option"
                    look={code(wearAccessory(look, item.id))}
                    label={item.name}
                    on={accessoryIn(look, slot) === item.id}
                    onPress={() => put(wearAccessory(look, item.id))}
                    under={tier ? <TierGems tier={tier} /> : null}
                  />
                );
              })}
            </View>
          ) : null}
          {(ready ? items : []).map((group) =>
            group.pack && group.rack ? (
              <Glass
                sm
                key={`${group.rack}-${group.pack}`}
                style={{ padding: KIT.size.packPad, gap: KIT.size.packGap }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="flex-1" style={{ gap: SPACING[0.5] }}>
                    <T v="h3" ink>
                      {tr.capsule.pack(group.pack)}
                    </T>
                    <T v="fine">
                      {tr.capsule.packCount(
                        packItems(group.rack, group.pack, kept).length,
                        group.items.length,
                      )}
                    </T>
                  </View>
                  <Btn
                    sm
                    variant="glassy"
                    label={tr.capsule.wearPack}
                    onPress={() =>
                      group.pack && group.rack && put(wearPack(look, group.rack, group.pack, kept))
                    }
                  />
                </View>
                <View className="flex-row flex-wrap" style={{ gap: KIT.size.partBoxGap }}>
                  {group.items.map((item) => (
                    <Box
                      key={item.id}
                      kind="part"
                      look={code(wear(look, item.slot, item.id))}
                      label={item.name}
                      on={showsPart(look, item.slot, item.id)}
                      onPress={() => put(wear(look, item.slot, item.id))}
                    />
                  ))}
                </View>
              </Glass>
            ) : (
              <View key="colors" className="flex-row flex-wrap" style={{ gap: KIT.size.optionGap }}>
                {group.items.map((item) => (
                  <Box
                    key={item.id}
                    kind="option"
                    look={code(wear(look, item.slot, item.id))}
                    label={item.name}
                    on={showsPart(look, item.slot, item.id)}
                    onPress={() => put(wear(look, item.slot, item.id))}
                  />
                ))}
              </View>
            ),
          )}
        </View>
      </HidingHeadScreen>
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

// "Karıştır" (the owner's call, 27 Ekim): the family's crossing arrows, which turn once round and
// swell a little with each shuffle; still with reduce motion.
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
      <CapIcon name="grid2x2" color={c.ink} />
    </Animated.View>
  );
}

// A box (docs/design/aura → Kapsül, bölüm 4): an option 96 with its name under it, a pack's part 64
// with the capsule on its foot and no name (the screen reader's only). The surface's colour
// (#1B211F in the dark); the chosen one ringed 2 in the accent, 2 out. A fixed width, so the rows
// line up.
// Options read ahead in one idle turn.
const READ_AHEAD = 8;

function Box({
  kind,
  look,
  label,
  on,
  onPress,
  under = null,
}: {
  kind: 'option' | 'part';
  look: string;
  label: string;
  on: boolean;
  onPress: () => void;
  // Under the name: an accessory's tier.
  under?: ReactNode;
}) {
  const { c } = useKit();
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const option = kind === 'option';
  const box = option ? KIT.size.optionBox : KIT.size.partBox;
  const image = option ? KIT.size.optionImage : KIT.size.partImage;
  const out = KIT.size.boxRing + KIT.size.boxRingGap;
  // Only the round capsule, no box round it; the chosen ring round the capsule (ui 8.1, the
  // owner's call, 3 Kasım).
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ width: box, alignItems: 'center', gap: TILE_LABEL_GAP }}
    >
      <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: image,
            height: image,
            transform: [{ scale: pressed ? TILE_PRESSED : 1 }],
          }}
        >
          <LookAvatar look={look} size={image} />
          {on ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -out,
                left: -out,
                right: -out,
                bottom: -out,
                borderRadius: image / 2 + out,
                borderWidth: KIT.size.boxRing,
                borderColor: colors.accent,
              }}
            />
          ) : null}
        </View>
      </View>
      {option ? (
        <RNText
          numberOfLines={2}
          maxFontSizeMultiplier={TILE_SCALE}
          style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: c.ink, textAlign: 'center' }]}
        >
          {label}
        </RNText>
      ) : null}
      {under}
    </Pressable>
  );
}
const TILE_LABEL_GAP = 6;
const TILE_SCALE = 1.3;
