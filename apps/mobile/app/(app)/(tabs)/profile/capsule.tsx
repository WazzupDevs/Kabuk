import type { LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground, AuraBand } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Round, T, Tag, useKit } from '@/aura/kit';
import { SceneGround } from '@/aura/Scene';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { Sheet } from '@/components/Sheet';
import { useTabBarSpace } from '@/components/TabBar';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import {
  bare,
  code,
  colors as colorItems,
  type Item,
  type Look,
  packItems,
  packsFor,
  parse,
  type RackId,
  shuffle,
  takeOff,
  wear,
  wearPack,
  worn,
} from '@/features/capsule/look';
import { CapsuleStage, type Play } from '@/features/capsule/CapsuleStage';
import { FEELING_MOVES, JUMP, type Move, SHUFFLE } from '@/features/capsule/motion';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useAskBeforeLeaving } from '@/lib/leaveGuard';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useAfterSlide } from '@/lib/useAfterSlide';
import { useCollapseOnScroll } from '@/lib/useCollapseOnScroll';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { profileApi } from '@/lib/api';
import { FEELINGS } from '@/theme/capsuleLook';
import { packTone } from '@/theme/capsulePacks';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { GlassTarget } from '@/ui/LiquidGlass';

const PREVIEW = SPACING[16] * 2 + SPACING[1];
// docs/design/aura → Kapsül, made low (the owner's call, 28 Ekim): the scene's height under the
// status bar, how far its parts stand above its bottom, the worn parts' tags beside the capsule.
const CAPSULE_SCENE = 236;
const SCENE_FOOT = 14;
const WORN_TAG = 28;
const WORN_ICON = 12;
// The soft edge under the fixed head and over the fixed buttons.
const BAND_FADE = SPACING[6];
// v46 feel(): the feeling's face stays 1850 ms.
const FEELING_MS = 1850;
// The colours four to a row, a pack's parts three (the owner's call, 27 Ekim: larger, in order).
const COLOR_COLUMNS = 4;
const PACK_COLUMNS = 3;
// The capsule's share of a tile, and a pressed tile's size.
const AVATAR_SHARE = 0.7;
const TILE_PRESSED = 0.96;
// "Karıştır": the arrows turn once round and swell a little.
const SHUFFLE_TURN_MS = 520;
const SHUFFLE_SWELL = 1.18;

// Kapsülün (skall tuvali: KapsulSusle, KapsulSusleIlk, KapsulSusleDegisti, KapsulSusleCikis;
// docs/SPEC_V4.md §4.D, K-46): the capsule large (a tap on it shows the next feeling, v46),
// what is worn as chips that take it off, then the racks (Şık, Karakter, Tema), the slots, the
// slot's packs ("Paketi tak") and their parts; "Karıştır", "Hepsini çıkar" and "Kaydet". Leaving
// with changes asks first. The capsule and what is worn stay at the top and "Hepsini çıkar" and
// "Kaydet" above the tab bar; the racks and parts scroll under both, seen through a simple glass
// (the owner's call, 27 Ekim). Each pack is a block in its own quiet colour, three parts a row.
export default function CapsuleScreen() {
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
  return (
    <Editor
      saved={saved}
      nick={view.data?.capsuleNick ?? ''}
      publicId={own.data?.public_id ?? ''}
    />
  );
}

function Editor({ saved, nick, publicId }: { saved: string; nick: string; publicId: string }) {
  const { shape, scheme } = useTheme();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [look, setLook] = useState<Look>(() => parse(saved));
  const [slot, setSlot] = useState<LookSlot>('h');
  const [leaving, setLeaving] = useState(false);
  const feelingAt = useRef(-1);
  const now = code(look);
  const changed = now !== code(parse(saved));

  const save = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => profileApi.setLook(now),
    onSuccess: async () => {
      haptic('accountReady');
      await queryClient.invalidateQueries({ queryKey: profileViewKeys.view(publicId) });
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

  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  // Scrolling the parts on folds the head to the capsule and takes the buttons away; scrolling
  // back brings them (the owner's call, 29 Ekim).
  const [folded, setFolded] = useState(false);
  // Only the progress goes into the worklets: the whole result would take the scroll handler
  // with it, which cannot be copied to the UI thread (Sentry MASA-6, the screen crashed).
  const { progress: fold, onScroll } = useCollapseOnScroll(setFolded);
  const chipsHeight = useSharedValue(0);
  const barHeight = useSharedValue(0);
  const fadeAway = useAnimatedStyle(() => ({ opacity: 1 - fold.value }));
  const chipsAway = useAnimatedStyle(() => ({
    opacity: 1 - fold.value,
    transform: [{ translateY: -chipsHeight.value * fold.value }],
  }));
  const barAway = useAnimatedStyle(() => ({
    opacity: 1 - fold.value,
    transform: [{ translateY: barHeight.value * fold.value }],
  }));
  const topBandAway = useAnimatedStyle(() => ({
    transform: [{ translateY: -(chipsHeight.value + SPACING[3]) * fold.value }],
  }));
  const listId = useId();
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [turn, setTurn] = useState(0);
  const side = shape.screenPadding;
  const content = width - side * 2;
  const colorTile = (content - SPACING[2] * (COLOR_COLUMNS - 1)) / COLOR_COLUMNS;
  const packTile = (content - SPACING[3] * 2 - SPACING[2] * (PACK_COLUMNS - 1)) / PACK_COLUMNS;
  // The parts' tiles (dozens of drawings) come right after the screen's slide, so the slide and
  // the capsule draw at once (the owner's report, 27 Ekim: a white screen, then a stutter).
  const ready = useAfterSlide();
  // Every rack's packs for the slot, one list (the racks' tabs went, the owner's call, 28 Ekim).
  const items: { rack: RackId | null; pack: string | null; items: Item[] }[] =
    slot === 'c'
      ? [{ rack: null, pack: null, items: colorItems() }]
      : CAPSULE_CATALOG.racks.flatMap((r) =>
          packsFor(r.id, slot).map((g) => ({ rack: r.id, pack: g.pack, items: g.items })),
        );
  const { height: screen } = useWindowDimensions();
  const [bar, setBar] = useState({ y: 0, height: 0 });
  const wornList = worn(look);
  const wornLeft = wornList.filter((_, i) => i % 2 === 0);
  const wornRight = wornList.filter((_, i) => i % 2 === 1);
  // Beside the capsule, never over it: a column each side of it.
  const wornWidth = (width - PREVIEW) / 2 - (KIT.size.side - SPACING[1]) - SPACING[2];
  const slotName = CAPSULE_CATALOG.slots.find((s) => s.id === slot)?.name ?? '';

  return (
    <View className="flex-1" style={{ backgroundColor: AURA[scheme].ground }}>
      {/* The colour clouds (docs/design/aura → Kapsülün). */}
      <AuraBackground />
      <GlassTarget targetId={listId} style={StyleSheet.absoluteFill}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: top + BAND_FADE,
            paddingBottom: bottom + BAND_FADE,
            paddingHorizontal: side,
            gap: SPACING[4],
          }}
        >
          {slot !== 'c' && slot !== 'e' ? (
            <View className="flex-row">
              <Tile
                size={packTile}
                look={code(wear(look, slot, null))}
                label={tr.capsule.empty(slotName)}
                on={!look[slot]}
                onPress={() => put(wear(look, slot, null))}
              />
            </View>
          ) : null}
          {(ready ? items : []).map((group, index) =>
            group.pack && group.rack ? (
              <View
                key={`${group.rack}-${group.pack}`}
                style={{
                  gap: SPACING[3],
                  padding: SPACING[3],
                  borderRadius: shape.radius.lg,
                  backgroundColor: packTone(group.pack, index, scheme),
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <T v="h3">{tr.capsule.pack(group.pack)}</T>
                    <T v="fine">{tr.capsule.packSlots(packItems(group.rack, group.pack).length)}</T>
                  </View>
                  <Btn
                    sm
                    variant="glassy"
                    label={tr.capsule.wearPack}
                    onPress={() =>
                      group.pack && group.rack && put(wearPack(look, group.rack, group.pack))
                    }
                  />
                </View>
                <View className="flex-row flex-wrap" style={{ gap: SPACING[2] }}>
                  {group.items.map((item) => (
                    <Tile
                      key={item.id}
                      size={packTile}
                      look={code(wear(look, item.slot, item.id))}
                      label={item.name}
                      on={look[item.slot] === item.id}
                      onPress={() => put(wear(look, item.slot, item.id))}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View key="colors" className="flex-row flex-wrap" style={{ gap: SPACING[2] }}>
                {group.items.map((item) => (
                  <Tile
                    key={item.id}
                    size={colorTile}
                    look={code(wear(look, item.slot, item.id))}
                    label={item.name}
                    on={look[item.slot] === item.id}
                    onPress={() => put(wear(look, item.slot, item.id))}
                  />
                ))}
              </View>
            ),
          )}
        </Animated.ScrollView>
        {/* The fixed head's and buttons' ground: what scrolls hides under them, with a soft edge
            (the owner's report, 28 Ekim: a pack's name read through the buttons). */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, topBandAway]}>
          <AuraBand top={0} height={top} fade={BAND_FADE} direction="down" />
        </Animated.View>
        {bar.height > 0 ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, barAway]}>
            <AuraBand top={bar.y} height={screen - bar.y} fade={BAND_FADE} direction="up" />
          </Animated.View>
        ) : null}
      </GlassTarget>

      {/* docs/design/aura → Kapsül: the capsule on a low scene under the status bar, what is worn
          on glass tags beside it, never over it; back, the title and "Karıştır" over it. The
          slots' chips under it stay with it (the owner's call, 28 Ekim). */}
      <View
        onLayout={(e) => setTop(e.nativeEvent.layout.height)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, gap: SPACING[3] }}
      >
        <View
          style={{
            height: CAPSULE_SCENE + insets.top,
            borderBottomLeftRadius: KIT.stage.radius,
            borderBottomRightRadius: KIT.stage.radius,
            overflow: 'hidden',
          }}
        >
          <SceneGround top={0} bottom={KIT.stage.radius} />
          <View
            className="flex-row items-center justify-between"
            style={{ paddingHorizontal: side, paddingTop: insets.top + SPACING[3] }}
          >
            <Round icon="back" label={tr.common.back} onPress={leave} />
            <T v="h3" accessibilityRole="header">
              {tr.capsule.title}
            </T>
            <Round
              testID="capsule-shuffle"
              label={tr.capsule.shuffle}
              onPress={() => {
                setTurn((n) => n + 1);
                put(shuffle(Math.random), SHUFFLE);
              }}
            >
              <ShuffleGlyph turn={turn} />
            </Round>
          </View>
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: SCENE_FOOT,
              alignItems: 'center',
            }}
          >
            <CapsuleStage
              testID="capsule-preview"
              look={now}
              feeling={feeling}
              play={play}
              beat={beat}
              size={PREVIEW}
              label={tr.capsule.tapHead}
              hint={null}
              onPress={feel}
            />
          </View>
          <Animated.View
            pointerEvents={folded ? 'none' : 'box-none'}
            style={[StyleSheet.absoluteFill, fadeAway]}
          >
            <WornColumn
              items={wornLeft}
              width={wornWidth}
              side="left"
              onTakeOff={(slot) => put(takeOff(look, slot))}
            />
            <WornColumn
              items={wornRight}
              width={wornWidth}
              side="right"
              onTakeOff={(slot) => put(takeOff(look, slot))}
            />
          </Animated.View>
        </View>
        <Animated.View
          pointerEvents={folded ? 'none' : 'auto'}
          style={chipsAway}
          onLayout={(e) => {
            chipsHeight.value = e.nativeEvent.layout.height;
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: side, gap: KIT.size.chipsGap }}
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
        </Animated.View>
      </View>

      <Animated.View
        pointerEvents={folded ? 'none' : 'box-none'}
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          setBottom(height);
          setBar({ y, height });
          barHeight.value = height;
        }}
        style={[
          barAway,
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingTop: SPACING[2],
            paddingHorizontal: side,
            paddingBottom: Math.max(tabSpace - SPACING[2], insets.bottom + SPACING[3]),
            gap: SPACING[2],
          },
        ]}
      >
        {/* Small buttons (the owner's call, 28 Ekim). */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Btn
              sm
              block
              variant="glassy"
              label={tr.capsule.clearAll}
              onPress={() => put(bare(look))}
            />
          </View>
          <View className="flex-1">
            <Btn
              sm
              block
              icon="check"
              testID="capsule-save"
              label={save.isSuccess && !changed ? tr.capsule.saved : tr.capsule.save}
              disabled={!changed || save.isSuccess}
              loading={save.isPending}
              onPress={() => save.mutate()}
            />
          </View>
        </View>
        {save.isError ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(save.error)}
          </T>
        ) : null}
      </Animated.View>
      {/* Saving, the sheet stays; a failed save says so here, over the bar (audit PRO-3). */}
      <Sheet
        visible={leaving}
        onClose={() => {
          if (!save.isPending) setLeaving(false);
        }}
        title={tr.capsule.unsavedTitle}
      >
        <Text variant="fine">{tr.capsule.unsavedBody}</Text>
        {save.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(save.error)}
          </Text>
        ) : null}
        <Button
          size="lg"
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
        <Button
          size="lg"
          variant="neutral"
          label={tr.capsule.leaveUnsaved}
          onPress={() => {
            setLeaving(false);
            router.back();
          }}
        />
      </Sheet>
    </View>
  );
}

// What is worn, as tags that take it off, in a column beside the capsule (left or right), each
// tag kept within the column (its words shrink rather than run over the capsule).
function WornColumn({
  items,
  width,
  side,
  onTakeOff,
}: {
  items: { slot: LookSlot; name: string }[];
  width: number;
  side: 'left' | 'right';
  onTakeOff: (slot: LookSlot) => void;
}) {
  const { c } = useKit();
  if (items.length === 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        [side]: KIT.size.side - SPACING[1],
        bottom: SCENE_FOOT,
        width,
        gap: KIT.size.chipGap,
        alignItems: side === 'left' ? 'flex-start' : 'flex-end',
      }}
    >
      {items.map((w) => (
        <Pressable
          key={w.slot}
          accessibilityRole="button"
          accessibilityLabel={tr.capsule.remove(w.name)}
          onPress={() => onTakeOff(w.slot)}
          style={{ maxWidth: width }}
        >
          <Tag
            label={w.name}
            height={WORN_TAG}
            fit
            lead={<CapIcon name="close" color={c.ink} size={WORN_ICON} />}
          />
        </Pressable>
      ))}
    </View>
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
      <CapIcon name="shuffle" color={c.ink} />
    </Animated.View>
  );
}

// A part on the capsule as it would be (skall tuvali: `.kit` tiles), the chosen one outlined; a
// fixed width, so the rows line up (a style function on the press dropped the width: tiles as wide
// as their names, the owner's report, 27 Ekim).
function Tile({
  size,
  look,
  label,
  on,
  onPress,
}: {
  size: number;
  look: string;
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const [pressed, setPressed] = useState(false);
  const ground = AURA.scene[scheme];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ width: size, alignItems: 'center', gap: SPACING[1] }}
    >
      {/* docs/design/aura → Kapsül: each part on a little scene, the chosen one ringed. */}
      <View
        style={{
          ...gradientStyle(`linear-gradient(180deg, ${ground.top}, ${ground.bottom})`),
          width: size,
          height: size,
          borderRadius: KIT.size.glassRadiusSm,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: on ? `0px 0px 0px ${TILE_RING}px ${KIT.primary}` : undefined,
          transform: [{ scale: pressed ? TILE_PRESSED : 1 }],
        }}
      >
        <LookAvatar look={look} size={size * AVATAR_SHARE} />
      </View>
      <RNText
        numberOfLines={2}
        maxFontSizeMultiplier={TILE_SCALE}
        style={[KIT_TYPE.stamp, { color: c.ink, textAlign: 'center' }]}
      >
        {label}
      </RNText>
    </Pressable>
  );
}
const TILE_RING = 3;
const TILE_SCALE = 1.3;
