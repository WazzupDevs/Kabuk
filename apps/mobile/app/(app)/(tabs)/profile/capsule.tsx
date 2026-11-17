import type { LookSlot } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Btn, useKit } from '@/aura/kit';
import { CachedSvg, readAhead } from '@/components/CachedSvg';
import { EmptyState } from '@/components/EmptyState';
import { FxMoves } from '@/components/FxSvg';
import { Loader } from '@/components/Loader';
import { shadowParts } from '@/components/NativeShadow';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { Toast, TOAST_TOP, type ToastMessage } from '@/components/Toast';
import { useHideTabBar } from '@/components/TabBar';
import { useProfile } from '@/features/account/useProfile';
import {
  type ArtNeed,
  capsuleArt,
  capsulePrep,
  keepTile,
  lastTile,
  makeArt,
  prepAhead,
  prepNow,
  useArt,
} from '@/capsule/useArt';
import { NEAR, REST } from '@/capsule/prepQueue';
import { tileShown } from '@/capsule/stageGate';
import { useSkiaKit, useWholeKit } from '@/components/skiaInside';
import {
  CapsuleStage,
  stageHeadroom,
  type Play,
  readStageAhead,
  neededBy,
  stageNeed,
} from '@/features/capsule/CapsuleStage';
import { useLookDraft } from '@/features/capsule/draft';
import {
  accessories,
  accessoryIn,
  bare,
  code,
  dice,
  type Look,
  parse,
  takeAccessoryOff,
} from '@/features/capsule/look';
import { FEELING_MOVES, JUMP, type Move, SHUFFLE } from '@/features/capsule/motion';
import { findChosen, type Option, shownIn, slotOptions } from '@/features/capsule/options';
import { stageAhead, tileOrder } from '@/features/capsule/readAhead';
import { saveNoticeShown } from '@/features/capsule/saveNotice';
import { SusleFilter } from '@/features/capsule/SusleFilter';
import { SusleTabs } from '@/features/capsule/SusleTabs';
import { packNames, packOptions } from '@/features/capsule/strip';
import { optionArt } from '@/features/capsule/tileArt';
import { tierName } from '@/features/gifts/model';
import { giftKeys, useGiftState } from '@/features/gifts/queries';
import { profileViewKeys, useProfileView } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { profileApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useAfterTransition } from '@/lib/afterTransition';
import { carouselWindow } from '@/lib/carouselWindow';
import { useLabOff } from '@/lib/drawLab';
import { useAskBeforeLeaving } from '@/lib/leaveGuard';
import { closeOverlay, confirm } from '@/lib/overlayStore';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { FloatStage, SNAP_STRIP_HEIGHT, SnapStrip, snapStripNameHeight } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';
import { TIER_COLOR } from '@/theme/gifts';
import { FEELINGS } from '@/theme/capsuleLook';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// v46 feel(): the feeling's face stays 1850 ms.
const FEELING_MS = 1850;
// The least of the scene's height a short screen leaves it (300 on the board).
const SCENE_MIN = 0.7;
// The tabs' names are the board's (the catalog calls Gövde "Boyun").
const SLOTS = CAPSULE_CATALOG.slots.map((s) => ({
  id: s.id as LookSlot,
  name: tr.capsule.slotNames[s.id as LookSlot] ?? s.name,
}));
// The slots' chips' icons (the app's one icon family has no hat or mouth of its own).
const SLOT_ICON: Readonly<Record<LookSlot, CapIconName>> = {
  c: 'palette',
  e: 'eye',
  h: 'user',
  f: 'personCircle',
  m: 'chat',
  n: 'gift',
};

// A look read ahead: its list of plans and pictures (made here, in its job), then each of them its
// own job in the same generation.
function aheadLook(need: ArtNeed, gen: number): void {
  makeArt(need);
  const needs = neededBy(capsuleArt.peek(need.key));
  if (needs) prepAhead(needs, NEAR, gen);
}

// The feeling shown (its place in FEELINGS), else the last one shown (-1: none yet).
function feelingIndex(feeling: { id: string } | null, last: number): number {
  return feeling ? FEELINGS.findIndex(([id]) => id === feeling.id) : last;
}

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
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const queryClient = useQueryClient();
  // What the saved look wears keeps a part that became a pack accessory on offer (§4.U).
  const kept = useMemo(() => parse(saved), [saved]);
  // The look being tried on is the draft Tüm aksesuarlar shares (features/capsule/draft.ts); until
  // something is tried, the saved look. It is dropped when Süsle is left.
  const draft = useLookDraft((d) => d.look);
  const setLook = useLookDraft((d) => d.set);
  const clearDraft = useLookDraft((d) => d.clear);
  const look: Look = draft ?? kept;
  useEffect(() => clearDraft, [clearDraft]);
  // The look last shown, to tell a change made in the catalog on the way back (hareket 6.2).
  const seen = useRef(code(look));
  // The failed save's one notice: the dialog's when "Kaydet ve çık" started it (saveNotice.ts).
  const [viaDialog, setViaDialog] = useState(false);
  const [slot, setSlot] = useState<LookSlot>('h');
  // The theme pack the strip shows (null: Tümü).
  const [pack, setPack] = useState<string | null>(null);
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
    // The parts and the worn set in one atomic write (`profile/save-look`).
    mutationFn: () => profileApi.saveLook(now, accessories(look)),
    onSuccess: () => {
      haptic('accountReady');
      // The button ends with the answer; the two re-reads run on their own.
      void queryClient.invalidateQueries({ queryKey: profileViewKeys.view(publicId) });
      void queryClient.invalidateQueries({ queryKey: giftKeys.state });
    },
  });
  const dirty = changed && !save.isSuccess;
  const failed: ToastMessage | null = saveNoticeShown({
    failed: save.isError,
    fromDialog: viaDialog,
  })
    ? {
        id: save.submittedAt,
        title: tr.capsule.saveFailed,
        sub: errorMessage(save.error),
        action: {
          label: tr.common.retry,
          testID: 'capsule-save-retry',
          onPress: () => save.mutate(),
        },
      }
    : null;
  // Saving, the dialog stays; a failed save keeps it open and says so in the top notice over it,
  // "Tekrar dene" saving again (Ortak kurallar C4, SusleKaydedilemedi).
  const askToLeave = useCallback(() => {
    const id = confirm({
      title: tr.capsule.unsavedTitle,
      note: tr.capsule.unsavedBody,
      tone: 'plain',
      confirmLabel: tr.capsule.saveAndLeave,
      cancelLabel: tr.common.cancel,
      testID: 'capsule-leave-save',
      errorTitle: tr.capsule.saveFailed,
      onConfirm: async () => {
        setViaDialog(true);
        await save.mutateAsync();
        router.back();
      },
      children: (
        <Btn
          block
          variant="glassy"
          testID="capsule-leave-discard"
          label={tr.capsule.leaveUnsaved}
          onPress={() => {
            closeOverlay(id, false);
            router.back();
          }}
        />
      ),
    });
  }, [save, setViaDialog]);
  const leave = useCallback(() => {
    if (changed && !save.isSuccess) askToLeave();
    else router.back();
  }, [changed, save.isSuccess, askToLeave]);
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
    seen.current = code(next);
    setLook(next);
    if (move) setPlay({ move, key: Date.now() });
    else setDrop(Date.now());
  };
  // A piece put on in Tüm aksesuarlar plays the drop on the way back (hareket 6.2).
  useFocusEffect(
    useCallback(() => {
      if (seen.current === now) return;
      seen.current = now;
      setFeeling(null);
      setPlay({ move: JUMP, key: Date.now() });
    }, [now]),
  );
  // A tap on the capsule (v46 feel()): the next feeling for a moment; it is never saved.
  const feel = () => {
    haptic('selection');
    const at = feelingIndex(feeling, feelingAt.current);
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

  const ready = useAfterTransition();
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
  const chosen = findChosen(slot, look, shown);
  const stageSize = KIT.size.capsuleStage - KIT.size.capsuleRing * 2;
  // Skia's own reading ahead while it draws the big capsule (components/skiaInside.ts: the same
  // one load as the stage's).
  const prepare = useSkiaKit()?.prepare;
  // While the whole capsule is Skia's (useWholeKit): what its canvas needs for a look, and the
  // strips' tiles as ready pictures (FxSkia.tsx → lookNeed, tileNeed).
  const wholeKit = useWholeKit();
  const needOf = wholeKit?.lookNeed;
  const tilesOff = useLabOff('karo');
  const tileNeed = tilesOff ? undefined : wholeKit?.tileNeed;
  // Read ahead, a few at a time, one resource a job, in idle time (capsule/prepQueue.ts): the look
  // shown and the tiles on the screen ask for theirs first (CapsuleStage, OptionArt); then the big
  // capsule as the options next to the chosen one (and the next feeling) would draw it, so that
  // choosing one draws with nothing left to read (the owner's report, 11 Kasım: a suit's first
  // choice stalled); then every option's tile, the open slot's from the chosen one outwards. A new
  // choice drops what the last one read ahead and has not reached yet.
  useEffect(() => {
    if (!ready) return undefined;
    const gen = capsulePrep.next();
    const moving = !reduce;
    const at = Math.max(chosen, 0);
    const near = stageAhead(shown.length, at).flatMap((i) => {
      const o = shown[i];
      return o ? [code(o.apply(look))] : [];
    });
    // A look's own job finds what it needs (its list, kept in the store: read once) and queues each
    // of its plans and pictures; the views' way reads it all at once (once a look).
    for (const next of near) {
      capsulePrep.ahead(
        `ahead|${needOf ? 'whole' : 'views'}|${moving ? 1 : 0}|${stageSize}|${next}`,
        () => {
          if (needOf) aheadLook(stageNeed(next, stageSize, moving, needOf), gen);
          else readStageAhead(next, stageSize, moving, prepare);
        },
        NEAR,
        gen,
        !needOf,
      );
    }
    const rows = options.map((s) => ({ id: s.id, flat: s.flat.map((o) => ({ slot: s.id, o })) }));
    const open = rows.find((r) => r.id === slot);
    const from = open ? open.flat.findIndex((t) => t.o === shown[at]) : 0;
    for (const t of tileOrder(rows, slot, Math.max(from, 0))) {
      // The tile's text is made in its job too: a slot's options are many.
      capsulePrep.ahead(
        `tile|${t.slot}|${t.o.key}|${color ?? ''}|${tileNeed ? 'png' : 'svg'}`,
        () => {
          const xml = optionArt(t.slot, t.o, color);
          if (!xml) return;
          if (tileNeed) makeArt(tileNeed(xml, KIT.size.stripArt));
          else readAhead(xml);
        },
        REST,
        gen,
        true,
      );
    }
  }, [
    ready,
    options,
    shown,
    chosen,
    slot,
    look,
    color,
    stageSize,
    reduce,
    prepare,
    needOf,
    tileNeed,
  ]);
  // Leaving Süsle drops what is still queued (a new choice does it in the effect above: once).
  useEffect(
    () => () => {
      capsulePrep.next();
    },
    [],
  );
  // The feeling a tap on the capsule shows next, in the same generation (dropped with it).
  useEffect(() => {
    if (!ready || !needOf || reduce) return;
    const after = FEELINGS[(feelingIndex(feeling, feelingAt.current) + 1) % FEELINGS.length];
    if (!after) return;
    const gen = capsulePrep.generation;
    capsulePrep.ahead(
      `ahead|feeling|${after[0]}|${now}`,
      () => aheadLook(stageNeed(now, stageSize, true, needOf, after[0]), gen),
      NEAR,
      gen,
    );
  }, [ready, needOf, reduce, feeling, now, stageSize]);

  // The tiles on the screen once the strip is on the chosen option (the strip follows a choice made
  // elsewhere): the stage's new look waits for their pictures too (CapsuleStage → tiles).
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const w = carouselWindow(
    Math.max(chosen, 0) * KIT.size.stripStep,
    KIT.size.stripStep,
    shown.length,
    screenWidth,
    0,
  );
  const screenTiles = useMemo(() => {
    if (!tileNeed) return null;
    const out: ArtNeed[] = [];
    for (let i = w.from; i <= w.to; i++) {
      const o = shown[i];
      const xml = o ? optionArt(slot, o, color) : null;
      if (xml) out.push(tileNeed(xml, KIT.size.stripArt));
    }
    return out;
  }, [tileNeed, w.from, w.to, shown, slot, color]);

  const E = CAPSULE_EDIT;
  const k = E[scheme];
  // The capsule as the board stands it: its shadow's top `shadowTop` down the scene, the capsule
  // its drawing's gap over it.
  const stageGap = SPACING[2];
  // The stage keeps room over its circle (the hats'): the circle, not that room, stands over the
  // shadow, or the capsule comes down over the two buttons (the owner's report, 17 Kasım).
  const stageTop = E.scene.shadowTop - stageGap - stageSize - stageHeadroom(stageSize);
  // A screen shorter than the board's (844): the scene gives its height to the tray, so that the
  // tray's last button stands over the screen's foot; never under SCENE_MIN of its height.
  const frame = useSafeAreaFrame();
  const sceneRef = useRef<View>(null);
  const [sceneY, setSceneY] = useState<number | null>(null);
  const [trayHeight, setTrayHeight] = useState<number | null>(null);
  const room =
    sceneY === null || trayHeight === null
      ? E.scene.height
      : frame.height -
        sceneY -
        E.panel.top -
        E.panel.padTop -
        trayHeight -
        E.padBottom -
        insets.bottom;
  const sceneScale = Math.min(1, Math.max(SCENE_MIN, room / E.scene.height));
  const panelShadow = shadowParts(
    useLabOff('golge'),
    k.panel.shadow || undefined,
    k.panel.inset || undefined,
    [E.panel.radius, E.panel.radius, 0, 0],
  );
  // The accessory worn in the open slot (the strip's chosen option is it): "Aksesuarı çıkar".
  const wornHere = accessoryIn(look, slot);
  const tabs = options.map((s) => ({
    id: s.id,
    name: s.name,
    icon: SLOT_ICON[s.id],
    label: shownIn(s.id, look) !== shownIn(s.id, kept) ? tr.capsule.slotChanged(s.name) : s.name,
  }));

  return (
    <>
      <Screen
        // yeni arayüz tuvali, KapsulSusle `.ptb`: the back button, the title beside it and Kaydet
        // on one 48 row. The page runs from edge to edge and to the screen's foot: the tray reaches
        // it.
        edges={['top', 'left', 'right']}
        side={0}
        barSide={E.barSide}
        padTop={E.padTop}
        top={
          <PageTop
            title={tr.capsule.title}
            onBack={leave}
            inline={{ row: E.bar.row, back: KIT.size.round, gap: E.bar.gap }}
            trailing={
              // SusleKaydetPasif, SusleKaydediliyor: the solid Kaydet, flat and quiet with nothing
              // to save, the ring turning in place of its words while it saves.
              <Btn
                bar={KIT.size.round}
                testID="capsule-save"
                label={save.isSuccess ? tr.capsule.savedShort : tr.capsule.save}
                disabled={!dirty && !save.isPending}
                loading={save.isPending}
                onPress={() => {
                  if (dirty && !save.isPending) {
                    setViaDialog(false);
                    save.mutate();
                  }
                }}
                style={{ minWidth: KIT.saveMinWidth }}
              />
            }
          />
        }
      >
        {/* The scene on the page's ground: the riso disc, the capsule over its breathing shadow;
        "Hepsini çıkar" and "Rastgele" side by side at its foot. */}
        <View
          ref={sceneRef}
          onLayout={() =>
            sceneRef.current?.measureInWindow((_x, y) => {
              if (Number.isFinite(y)) setSceneY(Math.round(y));
            })
          }
          style={{ height: E.scene.height * sceneScale }}
        >
          <View
            pointerEvents="none"
            style={{ ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' }}
          >
            <RisoDisc side={Math.round(E.scene.disc * sceneScale)} look={k.disc} />
          </View>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: stageTop * sceneScale,
              alignItems: 'center',
              transformOrigin: 'top',
              transform: [{ scale: sceneScale }],
            }}
          >
            <FloatStage
              drop={drop}
              dropPx={KIT.size.capsuleDrop}
              shadow={{
                width: E.shadow.width,
                height: E.shadow.height,
                color: k.shadow,
                gap: stageGap,
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
                  tiles={screenTiles}
                />
              </FxMoves>
            </FloatStage>
          </View>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: E.actions.gap,
            }}
          >
            <Btn
              sm
              variant="glassy"
              icon="reply"
              look={{
                type: 'coverBtn',
                padLeft: E.clear.padLeft,
                padRight: E.clear.padRight,
                gap: E.clear.gap,
                icon: E.clear.icon,
              }}
              label={tr.capsule.clearAll}
              onPress={() => put(bare(look))}
            />
            <Btn
              sm
              variant="glassy"
              icon="shuffle"
              testID="capsule-shuffle"
              look={{
                type: 'coverBtn',
                padLeft: E.clear.padLeft,
                padRight: E.clear.padRight,
                gap: E.clear.gap,
                icon: E.clear.icon,
              }}
              label={tr.capsule.shuffleShort}
              onPress={() => put(dice(Math.floor(Math.random() * 2 ** 32), owned, kept), SHUFFLE)}
            />
          </View>
        </View>
        {/* The tray to the screen's foot: the six tabs, the packs and "Tümüne bak", the trying
        strip, the chosen option's name and, with an accessory on, "Aksesuarı çıkar". */}
        <View
          style={{
            flexGrow: 1,
            marginTop: E.panel.top,
            // The fixed page's own foot (Screen: 32 under a fixed page) is the panel's.
            marginBottom: -SPACING[8],
            paddingTop: E.panel.padTop,
            paddingBottom: E.padBottom + insets.bottom,
            borderTopLeftRadius: E.panel.radius,
            borderTopRightRadius: E.panel.radius,
            backgroundColor: k.panel.fill,
            boxShadow: panelShadow.boxShadow,
          }}
        >
          {panelShadow.node}
          <View onLayout={(e) => setTrayHeight(Math.round(e.nativeEvent.layout.height))}>
            <SusleTabs
              tabs={tabs}
              open={slot}
              onPick={(id) => setSlot(id as LookSlot)}
              accessibilityLabel={tr.capsule.slots}
            />
            <SusleFilter
              packs={packs}
              open={openPack}
              onPick={setPack}
              onViewAll={() => router.push('/profile/accessories')}
            />
            {/* The trying strip, from one edge of the panel to the other; a new slot or pack opens on
          the chosen option without motion. The options' middle where the board has it. */}
            <View
              style={{
                height: SNAP_STRIP_HEIGHT + snapStripNameHeight(fontScale),
                marginTop: E.strip.top + KIT.size.stripItem / 2 - SNAP_STRIP_HEIGHT / 2,
                marginBottom: E.strip.bottom,
              }}
            >
              {ready ? (
                <SnapStrip
                  key={`${slot}|${openPack ?? ''}`}
                  count={shown.length}
                  chosen={chosen}
                  keyOf={(i) => shown[i]?.key ?? String(i)}
                  labelOf={(i) => shown[i]?.name ?? ''}
                  renderItem={(i) => (
                    <OptionArt
                      slot={slot}
                      option={shown[i]}
                      color={color}
                      tileNeed={tileNeed}
                      ground={k.tile}
                      visible={i >= w.from && i <= w.to}
                    />
                  )}
                  onPick={(i) => {
                    const o = shown[i];
                    if (o) put(o.apply(look), null);
                  }}
                  label={current?.name ?? ''}
                  reduce={reduce}
                  ground={k.tile}
                  ringColor={KIT.pink}
                />
              ) : null}
            </View>
            {/* Its room stays with nothing worn: the tray, and the scene over it, never change
          height as an accessory goes on and off. */}
            <View
              style={{
                alignItems: 'center',
                marginTop: E.actions.top,
                minHeight: KIT.size.btn,
                paddingHorizontal: E.panel.side,
              }}
            >
              {wornHere ? (
                <Btn
                  icon="block"
                  testID="capsule-remove-accessory"
                  label={tr.capsule.removeAccessory}
                  onPress={() => put(takeAccessoryOff(look, wornHere))}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Screen>
      {/* SusleKaydedilemedi (79): the failed save in the top notice, "Tekrar dene" saving again. */}
      <Toast message={failed} top={insets.top + TOAST_TOP} testID="capsule-save-failed" />
    </>
  );
}

type OptionArtProps = {
  slot: LookSlot;
  option: Option | undefined;
  color: string | undefined;
  tileNeed: ((xml: string, size: number) => ArtNeed) | undefined;
  ground: string;
  visible: boolean;
};

// An option in the strip: its art alone (tileArt.ts), "boş" a crossed circle.
function OptionArt(props: OptionArtProps) {
  const { option, ground } = props;
  const { scheme } = useTheme();
  const D = CAPSULE_EDIT.tierDot;
  const tier = option?.tier ?? null;
  const dot = tier !== null && D.tiers.some((t) => t === tier) ? TIER_COLOR[scheme][tier] : null;
  return (
    <>
      <OptionPicture {...props} />
      {dot ? (
        <View
          pointerEvents="none"
          accessibilityLabel={tier ? tierName(tier) : undefined}
          style={{
            position: 'absolute',
            top: D.inset - D.ring,
            right: D.inset - D.ring,
            padding: D.ring,
            borderRadius: D.radius + D.ring,
            backgroundColor: ground,
            transform: [{ rotate: '45deg' }],
          }}
        >
          <View
            style={{ width: D.size, height: D.size, borderRadius: D.radius, backgroundColor: dot }}
          />
        </View>
      ) : null}
    </>
  );
}

function OptionPicture({
  slot,
  option,
  color,
  tileNeed,
  ground,
  visible,
}: {
  slot: LookSlot;
  option: Option | undefined;
  color: string | undefined;
  tileNeed: ((xml: string, size: number) => ArtNeed) | undefined;
  // The option's circle (the rarity dot's ring is cut from it).
  ground: string;
  // On the screen (not one of the few bound either side of it).
  visible: boolean;
}) {
  const { c } = useKit();
  const xml = option ? optionArt(slot, option, color) : null;
  // The tile's picture once it is made (asked for first while it is on the screen); the SVG only
  // when no picture can be made, and off the screen before it ever had one.
  const need = useMemo(
    () => (xml && tileNeed ? tileNeed(xml, KIT.size.stripArt) : null),
    [xml, tileNeed],
  );
  const art = useArt(need);
  // Until the new picture is made (another colour) the last one this option showed stays, also in
  // a strip opened again (another slot): no SVG, nothing empty (capsule/useArt.ts → lastTile).
  const made = art?.kind === 'uri' ? art.uri : null;
  const id = option ? `${slot}|${option.key}` : '';
  const last = lastTile(id);
  useLayoutEffect(() => {
    if (made) keepTile(id, made);
  }, [id, made]);
  // On the screen with no picture ever: made here, before the frame (as the stage's canvas does);
  // this commit is not on the screen. Off the screen (bound either side) it waits in the queue.
  const waiting = visible && need !== null && art === undefined && last === null;
  const [, again] = useState(0);
  useLayoutEffect(() => {
    if (!waiting || !need) return undefined;
    const off = capsuleArt.watch([need.key], () => again((n) => n + 1));
    prepNow([need]);
    return off;
  }, [waiting, need]);
  if (!xml) return <CapIcon name="block" color={c.muted} />;
  const uri = tileShown(made, last);
  if (waiting && !uri)
    return <View style={{ width: KIT.size.stripArt, height: KIT.size.stripArt }} />;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        fadeDuration={0}
        accessible={false}
        style={{ width: KIT.size.stripArt, height: KIT.size.stripArt }}
      />
    );
  }
  return (
    <View style={{ width: KIT.size.stripArt, height: KIT.size.stripArt }}>
      <CachedSvg xml={xml} width="100%" height="100%" />
    </View>
  );
}

// The scene's riso disc (tuval Kapsul2): its pink light from the middle fading out at its edge, the
// halftone dots over the whole disc.
function RisoDisc({
  side,
  look,
}: {
  side: number;
  look: { mid: string; edge: string; dots: string };
}) {
  const E = CAPSULE_EDIT;
  const r = side / 2;
  const cell = E.dot.cell;
  return (
    <Svg width={side} height={side} importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient id="capsule-disc-light" cx={r} cy={r} r={r} gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={look.mid} />
          <Stop offset={E.discMid} stopColor={look.edge} />
          <Stop offset="100%" stopColor={look.edge} stopOpacity={0} />
        </RadialGradient>
        <Pattern id="capsule-disc-dots" width={cell} height={cell} patternUnits="userSpaceOnUse">
          <Circle cx={cell / 4} cy={cell / 4} r={E.dot.r} fill={look.dots} />
          <Circle cx={(3 * cell) / 4} cy={(3 * cell) / 4} r={E.dot.r} fill={look.dots} />
        </Pattern>
        <ClipPath id="capsule-disc-clip">
          <Circle cx={r} cy={r} r={r} />
        </ClipPath>
      </Defs>
      <Circle cx={r} cy={r} r={r} fill="url(#capsule-disc-light)" />
      <Rect
        x={0}
        y={0}
        width={side}
        height={side}
        fill="url(#capsule-disc-dots)"
        clipPath="url(#capsule-disc-clip)"
      />
    </Svg>
  );
}
