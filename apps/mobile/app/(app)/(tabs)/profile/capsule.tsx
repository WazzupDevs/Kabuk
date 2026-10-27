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
import { create } from 'zustand';

import { Button } from '@/components/Button';
import { CanvasBar } from '@/components/CanvasIcon';
import { Chips } from '@/components/Chips';
import { EmptyState } from '@/components/EmptyState';
import { GlassPanel } from '@/components/GlassPanel';
import { IconButton } from '@/components/IconButton';
import { Loader } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { Segmented } from '@/components/Segmented';
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
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useAfterSlide } from '@/lib/useAfterSlide';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { profileApi } from '@/lib/api';
import { FEELINGS } from '@/theme/capsuleLook';
import { packTone } from '@/theme/capsulePacks';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';
import { GlassTarget } from '@/ui/LiquidGlass';

// "Kafama dokun" shows until the first tap on the capsule, while the app runs.
const useHint = create<{ seen: boolean }>(() => ({ seen: false }));

const PREVIEW = SPACING[16] * 2 + SPACING[8];
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
  const { colors, shape, scheme } = useTheme();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [look, setLook] = useState<Look>(() => parse(saved));
  const [rack, setRack] = useState<RackId>('tema');
  const [slot, setSlot] = useState<LookSlot>('h');
  const [leaving, setLeaving] = useState(false);
  const hintSeen = useHint((s) => s.seen);
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
    useHint.setState({ seen: true });
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
  const items: { pack: string | null; items: Item[] }[] =
    slot === 'c' ? [{ pack: null, items: colorItems() }] : packsFor(rack, slot);
  const slotName = CAPSULE_CATALOG.slots.find((s) => s.id === slot)?.name ?? '';

  return (
    <View className="flex-1" style={{ backgroundColor: colors.canvas }}>
      <GlassTarget targetId={listId} style={StyleSheet.absoluteFill}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: top + SPACING[3],
            paddingBottom: bottom + SPACING[4],
            paddingHorizontal: side,
            gap: SPACING[4],
          }}
          scrollIndicatorInsets={{ top, bottom }}
        >
          <Segmented<RackId>
            fill
            value={rack}
            onChange={setRack}
            accessibilityLabel={tr.capsule.edit}
            options={CAPSULE_CATALOG.racks.map((r) => ({ value: r.id, label: r.name }))}
          />
          <Chips<LookSlot>
            bleed={side}
            value={slot}
            onChange={setSlot}
            accessibilityLabel={tr.capsule.edit}
            options={CAPSULE_CATALOG.slots.map((s) => ({
              value: s.id as LookSlot,
              label: s.name,
            }))}
          />
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
            group.pack ? (
              <View
                key={group.pack}
                style={{
                  gap: SPACING[3],
                  padding: SPACING[3],
                  borderRadius: shape.radius.lg,
                  backgroundColor: packTone(group.pack, index, scheme),
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text variant="heading">{tr.capsule.pack(group.pack)}</Text>
                    <Text variant="fine">
                      {tr.capsule.packSlots(packItems(rack, group.pack).length)}
                    </Text>
                  </View>
                  <Button
                    size="sm"
                    variant="secondary"
                    label={tr.capsule.wearPack}
                    onPress={() => group.pack && put(wearPack(look, rack, group.pack))}
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
        </ScrollView>
      </GlassTarget>

      <View
        onLayout={(e) => setTop(e.nativeEvent.layout.height)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top }}
      >
        <GlassPanel targetId={listId} edge="bottom" />
        <View
          className="flex-row items-center gap-3"
          style={{ paddingHorizontal: side, paddingVertical: SPACING[2] }}
        >
          <IconButton round icon="chevron-back" label={tr.common.back} onPress={leave} />
          <View className="flex-1">
            <Text variant="heading" accessibilityRole="header">
              {tr.capsule.title}
            </Text>
            <Text variant="fine">{nick}</Text>
          </View>
          <IconButton
            round
            icon="shuffle"
            testID="capsule-shuffle"
            label={tr.capsule.shuffle}
            glyph={<ShuffleGlyph turn={turn} />}
            onPress={() => {
              setTurn((n) => n + 1);
              put(shuffle(Math.random), SHUFFLE);
            }}
          />
        </View>
        <View style={{ paddingHorizontal: side, paddingBottom: SPACING[3], gap: SPACING[2] }}>
          <CapsuleStage
            testID="capsule-preview"
            look={now}
            feeling={feeling}
            play={play}
            beat={beat}
            size={PREVIEW}
            label={tr.capsule.tapHead}
            hint={hintSeen ? null : tr.capsule.tapHead}
            onPress={feel}
          />
          <View className="flex-row flex-wrap justify-center" style={{ gap: SPACING[2] }}>
            {worn(look).map((w) => (
              <Pressable
                key={w.slot}
                accessibilityRole="button"
                accessibilityLabel={tr.capsule.remove(w.name)}
                onPress={() => put(takeOff(look, w.slot))}
                className="flex-row items-center"
                style={{
                  gap: SPACING[2],
                  height: SPACING[9],
                  paddingHorizontal: SPACING[3],
                  borderRadius: shape.radius.pill,
                  borderWidth: shape.stroke.control,
                  borderColor: colors.control,
                  backgroundColor: colors.surface,
                }}
              >
                <Text variant="label">{w.name}</Text>
                <AppIcon name="close" size={ICON.sm} color={colors.text} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View
        onLayout={(e) => setBottom(e.nativeEvent.layout.height)}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: SPACING[3],
          paddingHorizontal: side,
          paddingBottom: Math.max(tabSpace - SPACING[2], insets.bottom + SPACING[3]),
          gap: SPACING[2],
        }}
      >
        <GlassPanel targetId={listId} edge="top" />
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Button
              size="lg"
              variant="secondary"
              label={tr.capsule.clearAll}
              onPress={() => put(bare(look))}
            />
          </View>
          <View className="flex-1">
            <Button
              size="lg"
              testID="capsule-save"
              label={save.isSuccess && !changed ? tr.capsule.saved : tr.capsule.save}
              disabled={!changed || save.isSuccess}
              loading={save.isPending}
              onPress={() => save.mutate()}
            />
          </View>
        </View>
        {save.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(save.error)}
          </Text>
        ) : null}
      </View>
      <Sheet visible={leaving} onClose={() => setLeaving(false)} title={tr.capsule.unsavedTitle}>
        <Text variant="fine">{tr.capsule.unsavedBody}</Text>
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

// "Karıştır" (the owner's call, 27 Ekim): the family's crossing arrows, which turn once round and
// swell a little with each shuffle; still with reduce motion.
function ShuffleGlyph({ turn }: { turn: number }) {
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
      <CanvasBar name="shuffle" size={ICON.md} />
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
  const { colors, shape } = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        width: size,
        alignItems: 'center',
        gap: SPACING[1],
        paddingVertical: SPACING[2],
        paddingHorizontal: SPACING[1],
        borderRadius: shape.radius.md,
        borderWidth: on ? SPACING[0.5] : shape.stroke.hairline,
        borderColor: on ? colors.primary : colors.cardLine,
        backgroundColor: colors.surface,
        transform: [{ scale: pressed ? TILE_PRESSED : 1 }],
      }}
    >
      <LookAvatar look={look} size={size * AVATAR_SHARE} />
      <Text variant="caption" align="center">
        {label}
      </Text>
    </Pressable>
  );
}
