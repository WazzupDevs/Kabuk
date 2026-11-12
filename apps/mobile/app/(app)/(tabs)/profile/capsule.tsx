import type { LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Btn, Chip, Round, T, useKit } from '@/aura/kit';
import { CachedSvg, readAhead } from '@/components/CachedSvg';
import { EmptyState } from '@/components/EmptyState';
import { FxMoves } from '@/components/FxSvg';
import { Loader } from '@/components/Loader';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useHideTabBar } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import { useSkiaKit } from '@/components/skiaInside';
import { CapsuleStage, type Play, readStageAhead } from '@/features/capsule/CapsuleStage';
import { accessories, bare, code, dice, type Look, parse } from '@/features/capsule/look';
import { FEELING_MOVES, JUMP, type Move, SHUFFLE } from '@/features/capsule/motion';
import {
  chosenIn,
  findChosen,
  type Option,
  shownIn,
  slotOptions,
} from '@/features/capsule/options';
import { stageAhead, tileOrder } from '@/features/capsule/readAhead';
import { dotAt, dotCount, packNames, packOptions } from '@/features/capsule/strip';
import { optionArt } from '@/features/capsule/tileArt';
import { TierTag } from '@/features/gifts/parts';
import { giftKeys, useGiftState } from '@/features/gifts/queries';
import { RisoPaper } from '@/features/profile/ProfileCover';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { giftsApi, profileApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useAskBeforeLeaving } from '@/lib/leaveGuard';
import { useAfterSlide } from '@/lib/useAfterSlide';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { FloatStage, SNAP_STRIP_HEIGHT, SnapStrip, Tap, Turn } from '@/motion';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { FEELINGS } from '@/theme/capsuleLook';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// v46 feel(): the feeling's face stays 1850 ms.
const FEELING_MS = 1850;
// Tiles read ahead in one idle turn.
const READ_AHEAD = 8;
const SLOTS = CAPSULE_CATALOG.slots.map((s) => ({ id: s.id as LookSlot, name: s.name }));
// The slots' chips' icons (the app's one icon family has no hat or mouth of its own).
const SLOT_ICON: Readonly<Record<LookSlot, CapIconName>> = {
  c: 'palette',
  e: 'eye',
  h: 'user',
  f: 'personCircle',
  m: 'chat',
  n: 'gift',
};

// Kapsülün (docs/SPEC_V4.md §4.D, K-46; docs/design/iskelet.md → 5.10): the `sayfa` bar with the back
// button and Kaydet (clear, as Profili düzenle's). The capsule large on a riso scene, floating over
// its breathing shadow (a tap on it shows the next feeling, v46); "Hepsini çıkar" and the die at the
// scene's foot. Over the slots' chips the theme packs; under them the trying strip, the centred
// option worn at once; its name and the dots under it. Nothing is saved until Kaydet; leaving with
// changes asks first.
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
  // The theme pack the strip shows (null: Tümü).
  const [pack, setPack] = useState<string | null>(null);
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
    onSuccess: () => {
      haptic('accountReady');
      // The button ends with the answer; the two re-reads run on their own.
      void queryClient.invalidateQueries({ queryKey: profileViewKeys.view(publicId) });
      void queryClient.invalidateQueries({ queryKey: giftKeys.state });
    },
  });
  const dirty = changed && !save.isSuccess;
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
  // What the stage plays: a jump for "Hepsini çıkar", a wobble for the die, a feeling for a tap; a
  // part from the strip drops the capsule onto its feet instead (FloatStage).
  const [play, setPlay] = useState<Play | null>(null);
  const [beat, setBeat] = useState(0);
  const [drop, setDrop] = useState(0);
  const [feeling, setFeeling] = useState<{ id: string; name: string; key: number } | null>(null);
  useEffect(() => {
    if (!feeling) return undefined;
    const timer = setTimeout(() => setFeeling(null), FEELING_MS);
    return () => clearTimeout(timer);
  }, [feeling]);
  const put = (next: Look, move: Move | null = JUMP) => {
    haptic('selection');
    save.reset();
    setFeeling(null);
    setLook(next);
    if (move) setPlay({ move, key: Date.now() });
    else setDrop(Date.now());
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
  // Every slot's options (options.ts); the open slot's theme packs and the options the strip shows.
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
  const groups = useMemo(() => current?.groups ?? [], [current]);
  const packs = useMemo(() => packNames(groups), [groups]);
  // A pack the open slot has nothing of shows Tümü.
  const openPack = pack !== null && packs.includes(pack) ? pack : null;
  const shown = useMemo(() => packOptions(groups, openPack), [groups, openPack]);
  const flat = current?.flat ?? [];
  const chosenOption = flat[chosenIn(slot, look, flat)] ?? null;
  const chosen = findChosen(slot, look, shown);
  const stageSize = KIT.size.capsuleStage - KIT.size.capsuleRing * 2;
  // Skia's own reading ahead while it draws the big capsule (components/skiaInside.ts: the same
  // one load as the stage's).
  const prepare = useSkiaKit()?.prepare;
  // Read ahead in idle time, a few at a time, while the idle turn lasts: first the big capsule as
  // the options next to the chosen one would draw it (its layers, and Skia's plan and SVGs), so that
  // choosing one draws with nothing left to read (the owner's report, 11 Kasım: a suit's first
  // choice stalled); then every option's art, the open slot's from the chosen one outwards. An idle
  // call's handle is an object here: only one that was set is cancelled (#570).
  useEffect(() => {
    if (!ready) return undefined;
    const at = Math.max(chosen, 0);
    const near = stageAhead(shown.length, at).flatMap((i) => {
      const o = shown[i];
      return o ? [code(o.apply(look))] : [];
    });
    const rows = options.map((s) => ({ id: s.id, flat: s.flat.map((o) => ({ slot: s.id, o })) }));
    const open = rows.find((r) => r.id === slot);
    const from = open ? open.flat.findIndex((t) => t.o === shown[at]) : 0;
    const jobs: (() => void)[] = [
      ...near.map((next) => () => readStageAhead(next, stageSize, !reduce, prepare)),
      ...tileOrder(rows, slot, Math.max(from, 0)).map((t) => () => {
        const xml = optionArt(t.slot, t.o, color);
        if (xml) readAhead(xml);
      }),
    ];
    let next = 0;
    let handle: ReturnType<typeof requestIdleCallback> | null = null;
    const step = (deadline: IdleDeadline) => {
      handle = null;
      const end = Math.min(next + READ_AHEAD, jobs.length);
      do {
        jobs[next]?.();
        next++;
      } while (next < end && deadline.timeRemaining() > 0);
      if (next < jobs.length) handle = requestIdleCallback(step);
    };
    handle = requestIdleCallback(step);
    return () => {
      if (handle !== null) cancelIdleCallback(handle);
    };
  }, [ready, options, shown, chosen, slot, look, color, stageSize, reduce, prepare]);

  const shadowColor = AURA.scene[scheme].shadow;
  const lit = dotAt(shown.length, chosen, KIT.size.stripDots);

  return (
    <>
      <Screen
        // iskelet.md → 3.1 (`sayfa`) and 2.1: the back button and Kaydet on the bar, clear glass,
        // the same Kaydet as Profili düzenle's.
        top={
          <PageTop
            title={tr.capsule.title}
            onBack={leave}
            trailing={
              <Btn
                variant="glassy"
                bar={KIT.size.topBtn}
                testID="capsule-save"
                label={save.isSuccess ? tr.capsule.savedShort : tr.capsule.save}
                tint={dirty || save.isSuccess ? KIT.primary : KIT.saveIdle}
                strong={dirty || save.isSuccess}
                loading={save.isPending}
                onPress={() => {
                  if (dirty && !save.isPending) save.mutate();
                }}
                style={{ minWidth: KIT.saveMinWidth }}
              />
            }
          />
        }
      >
        {save.isError ? (
          <T v="fine" color={c.warn}>
            {errorMessage(save.error)}
          </T>
        ) : null}
        {/* The riso scene, no ring round the capsule; "Hepsini çıkar" and the die at its foot. */}
        <View
          style={{
            borderRadius: KIT.size.glassRadius,
            overflow: 'hidden',
            paddingTop: SPACING[4],
            paddingBottom: SPACING[3],
            paddingHorizontal: SPACING[3],
            gap: SPACING[2],
          }}
        >
          <RisoPaper />
          <FloatStage
            drop={drop}
            dropPx={KIT.size.capsuleDrop}
            shadow={{
              width: KIT.size.capsuleStage * KIT.size.capsuleShadowW,
              height: KIT.size.capsuleShadowH,
              color: shadowColor,
              gap: SPACING[2],
            }}
          >
            <FxMoves>
              <CapsuleStage
                testID="capsule-preview"
                look={now}
                feeling={feeling}
                play={play}
                beat={beat}
                size={stageSize}
                ring={0}
                label={tr.capsule.tapHead}
                hint={null}
                onPress={feel}
                warm={ready}
              />
            </FxMoves>
          </FloatStage>
          <View className="flex-row items-center justify-between">
            <Btn sm variant="glassy" label={tr.capsule.clearAll} onPress={() => put(bare(look))} />
            <Round
              testID="capsule-shuffle"
              label={tr.capsule.shuffle}
              glass="clear"
              onPress={() => {
                setTurn((n) => n + 1);
                put(dice(Math.floor(Math.random() * 2 ** 32), owned, kept), SHUFFLE);
              }}
            >
              <Turn turn={turn}>
                <CapIcon name="shuffle" color={c.ink} />
              </Turn>
            </Round>
          </View>
        </View>
        {/* The theme packs' thin row over the slots' chips; both scroll sideways, fading at the
        ends, from one edge of the panel to the other. */}
        <View style={{ gap: SPACING[2] }}>
          <ScrollView
            horizontal
            accessibilityLabel={tr.capsule.packs}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            fadingEdgeLength={{ start: KIT.size.stripFade, end: KIT.size.stripFade }}
            style={{ marginHorizontal: -shape.screenPadding, flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: shape.screenPadding, gap: SPACING[4] }}
          >
            {[null, ...packs].map((p) => (
              <PackTab
                key={p ?? ''}
                name={p ?? tr.capsule.allPacks}
                on={p === openPack}
                onPress={() => setPack(p)}
              />
            ))}
          </ScrollView>
          <ScrollView
            horizontal
            accessibilityRole="tablist"
            accessibilityLabel={tr.capsule.slots}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            fadingEdgeLength={{ start: KIT.size.stripFade, end: KIT.size.stripFade }}
            style={{ marginHorizontal: -shape.screenPadding, flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: shape.screenPadding, gap: SPACING[2] }}
          >
            {options.map((s) => (
              <Chip
                key={s.id}
                lg
                icon={SLOT_ICON[s.id]}
                label={s.name}
                on={s.id === slot}
                accessibilityLabel={
                  shownIn(s.id, look) !== shownIn(s.id, kept)
                    ? tr.capsule.slotChanged(s.name)
                    : s.name
                }
                onPress={() => setSlot(s.id)}
              />
            ))}
          </ScrollView>
        </View>
        {/* The trying strip, from one edge of the panel to the other; a new slot or pack opens on
        the chosen option without motion. */}
        <View style={{ marginHorizontal: -shape.screenPadding, height: SNAP_STRIP_HEIGHT }}>
          {ready ? (
            <SnapStrip
              key={`${slot}|${openPack ?? ''}`}
              count={shown.length}
              chosen={chosen}
              keyOf={(i) => shown[i]?.key ?? String(i)}
              labelOf={(i) => shown[i]?.name ?? ''}
              renderItem={(i) => <OptionArt slot={slot} option={shown[i]} color={color} />}
              onPick={(i) => {
                const o = shown[i];
                if (o) put(o.apply(look), null);
              }}
              label={current?.name ?? ''}
              reduce={reduce}
              ground={colors.surface}
            />
          ) : null}
        </View>
        {/* The chosen option's name (an accessory's tier beside it) and the dots for its place. */}
        <View style={{ alignItems: 'center', gap: SPACING[2] }} accessibilityLiveRegion="polite">
          <View className="flex-row items-center" style={{ gap: SPACING[2] }}>
            <T v="h3" ink center>
              {chosenOption?.name ?? ''}
            </T>
            {chosenOption?.tier ? <TierTag tier={chosenOption.tier} /> : null}
          </View>
          <View
            className="flex-row items-center"
            style={{ gap: SPACING[1.5] }}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {Array.from({ length: dotCount(shown.length, KIT.size.stripDots) }, (_, i) => (
              <View
                key={i}
                style={{
                  width: i === lit ? SPACING[4] : SPACING[1.5],
                  height: SPACING[1.5],
                  borderRadius: SPACING[1.5] / 2,
                  backgroundColor: i === lit ? colors.accent : c.hair,
                }}
              />
            ))}
          </View>
        </View>
      </Screen>
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

// An option in the strip: its art alone (tileArt.ts), "boş" a crossed circle.
function OptionArt({
  slot,
  option,
  color,
}: {
  slot: LookSlot;
  option: Option | undefined;
  color: string | undefined;
}) {
  const { c } = useKit();
  const xml = option ? optionArt(slot, option, color) : null;
  if (!xml) return <CapIcon name="block" color={c.muted} />;
  return (
    <View style={{ width: KIT.size.stripArt, height: KIT.size.stripArt }}>
      <CachedSvg xml={xml} width="100%" height="100%" />
    </View>
  );
}

// A theme pack in the thin row over the slots: its name, the open one in ink and bold.
function PackTab({ name, on, onPress }: { name: string; on: boolean; onPress: () => void }) {
  return (
    <Tap
      sink={false}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={name}
      feel="selection"
      onPress={onPress}
      style={{ paddingVertical: SPACING[1] }}
    >
      <T v="fine" ink={on} strong={on}>
        {name}
      </T>
    </Tap>
  );
}
