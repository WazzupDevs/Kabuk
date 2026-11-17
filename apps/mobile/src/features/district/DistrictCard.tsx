import { secondsUntil } from '@shared/district.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { PICTURE_FILL } from '@/aura/RisoPicture';
import { Btn, PulseDot, T, useKit } from '@/aura/kit';
import { boxShadowParts, shadowParts } from '@/components/NativeShadow';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useNarrow } from '@/lib/useNarrow';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';
import { gradientStyle } from '@/theme/gradient';
import { SEMT } from '@/theme/semt';
import { useTheme } from '@/theme/ThemeProvider';

import { districtScreen, useEnterDistrict } from './flow';
import { RISO } from './parts';
import { DISTRICT_VISIBLE, useDistrictState } from './queries';

// The buddy standing beside the gate (assets/riso/buddies).
const BUDDY = require('../../../assets/riso/buddies/riso_1a80a9.webp') as ImageSourcePropType;

// Keşfet's Semte Git card (SemteGitKesfet, GaleriSemteGit; docs/SPEC_V4.md §4.V): the question
// waiting ([Semte Git]), Geçit closed for today (the locked door, the time to 00:00), in the room
// (the time left, [Odaya dön]), outside the districts (no button), loading and error. The screen's
// one featured card (docs/design/iskelet.md → 5.1; tuval Kesfet): the ink ground, the beating green
// dot, the gate a sticker turned a little with a buddy beside it, the prominent button.
export function DistrictCard() {
  const state = useDistrictState();
  const enter = useEnterDistrict({ replace: false });
  const now = useNow(30_000, DISTRICT_VISIBLE);
  const warn = useKit().c.warn;
  if (!DISTRICT_VISIBLE) return null;
  if (state.isPending) return <CardSkeleton />;
  if (!state.data) {
    return (
      <Frame door={RISO.door}>
        <Title>{tr.district.card.errorTitle}</Title>
        <Note>{tr.district.card.errorNote}</Note>
        <CardButton
          label={tr.common.retry}
          soft
          loading={state.isFetching}
          onPress={() => void state.refetch()}
        />
      </Frame>
    );
  }
  const s = state.data;
  const hm = (iso: string) => {
    const left = secondsUntil(iso, new Date(now));
    const minutes = Math.ceil(left / 60);
    return [Math.floor(minutes / 60), minutes % 60] as const;
  };
  if (s.session && s.district) {
    const grace = Date.parse(s.session.endsAt) <= now;
    const [h, m] = hm(s.session.endsAt);
    return (
      <Scene
        room
        title={tr.district.card.inRoom(s.district.name)}
        meta={grace ? tr.district.continueChip : tr.district.left(h, m)}
      >
        <CardButton
          label={tr.district.card.backToRoom}
          testID="district-card-room"
          onPress={() => router.push('/district/room')}
        />
      </Scene>
    );
  }
  if (s.located === 'outside') {
    return (
      <Frame door={RISO.doorLocked} still>
        <Title>{tr.district.card.outsideTitle}</Title>
        <Note>{tr.district.card.outsideNote}</Note>
      </Frame>
    );
  }
  if (s.gate === 'failed') {
    const [h, m] = hm(s.opensAt);
    return (
      <Frame door={RISO.doorLocked} still>
        <Title>{tr.district.card.closedTitle}</Title>
        <Note>{tr.district.card.closedNote}</Note>
        <Meta text={tr.district.card.opensIn(h, m)} />
      </Frame>
    );
  }
  return (
    <Scene title={tr.district.card.title(s.district?.name ?? null)} note={tr.district.card.note}>
      <CardButton
        label={tr.district.card.go}
        testID="district-card-go"
        loading={enter.isPending}
        onPress={() => {
          const to = districtScreen(s);
          if (to) router.push(to);
          else enter.mutate();
        }}
      />
      {enter.isError ? (
        <T v="fine" color={warn}>
          {errorMessage(enter.error)}
        </T>
      ) : null}
    </Scene>
  );
}

// The board's riso scenes under the card (Kesfet: the gate; KesfetSemtIcerde: the bench, in the
// room). In both schemes alike: the board draws the same picture on the dark side.
const SCENE = require('../../../assets/riso/semt/kesfet-semt.webp') as ImageSourcePropType;
const SCENE_ROOM = require('../../../assets/riso/semt/kesfet-semt-oda.webp') as ImageSourcePropType;

// `.semt` (Kesfet, KesfetSemtIcerde): the riso scene filling the card, the words in its left 58 %
// over it: the beating dot and the eyebrow, the title, the note or the time left, the button at the
// foot. In the room the eyebrow and its dot are pink.
function Scene({
  room,
  title,
  note,
  meta,
  children,
}: {
  room?: boolean;
  title: string;
  note?: string;
  meta?: string;
  children: ReactNode;
}) {
  const k = EXPLORE.scene;
  const eyebrow = room ? k.roomEyebrow : k.eyebrow;
  return (
    <View
      testID="district-card"
      style={{ minHeight: k.minHeight, borderRadius: k.radius, overflow: 'hidden' }}
    >
      <Image
        source={room ? SCENE_ROOM : SCENE}
        fadeDuration={0}
        resizeMode="cover"
        accessible={false}
        style={PICTURE_FILL}
      />
      <View style={{ flex: 1, width: k.words, padding: k.pad, alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: k.eyebrowGap }}>
          <PulseDot
            color={room ? k.roomDot : k.eyebrow}
            ring={room ? k.roomDotRing : undefined}
            size={k.dot}
          />
          <T v="kesfetEyebrow" color={eyebrow}>
            {upperTr(room ? tr.district.card.roomEyebrow : tr.district.card.sceneEyebrow)}
          </T>
        </View>
        <View style={{ marginTop: k.titleTop }}>
          <T v="semtTitle" color={k.title}>
            {title}
          </T>
        </View>
        {note ? (
          <View style={{ marginTop: k.noteTop }}>
            <T v="semtNote" color={k.note}>
              {note}
            </T>
          </View>
        ) : null}
        {meta ? (
          <View
            style={{
              marginTop: k.metaTop,
              flexDirection: 'row',
              alignItems: 'center',
              gap: k.metaGap,
            }}
          >
            <CapIcon name="clock" color={k.eyebrow} size={k.metaIcon} />
            <T v="semtMeta" color={k.meta}>
              {meta}
            </T>
          </View>
        ) : null}
        <View style={{ flexGrow: 1 }} />
        {children}
      </View>
    </View>
  );
}

// The card's inks: the board's on the ink ground (tuval Kesfet), the theme's feature card in the
// dark scheme (not drawn on the board).
function useCardInk(): { eyebrow: string; title: string; note: string } {
  const { scheme } = useKit();
  const { colors } = useTheme();
  const d = EXPLORE[scheme].district;
  return d
    ? { eyebrow: d.eyebrow, title: d.title, note: d.note }
    : { eyebrow: SEMT.eyebrow.light, title: colors.onFeature, note: colors.featureMuted };
}

function Title({ children }: { children: ReactNode }) {
  return (
    <T v="districtTitle" color={useCardInk().title}>
      {children}
    </T>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <T v="districtNote" color={useCardInk().note}>
      {children}
    </T>
  );
}

// The card's ground: the board's deep green to the ink with its glow at the top right, its shadow
// and top light; the dark scheme's feature colour.
function Ground({ children, testID }: { children: ReactNode; testID: string }) {
  const { scheme } = useKit();
  const { colors } = useTheme();
  const d = EXPLORE[scheme].district;
  const c = EXPLORE.district;
  const shadow = shadowParts(useLabOff('golge'), d?.shadow, d?.inset, c.radius);
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: c.gap,
        padding: c.pad,
        borderRadius: c.radius,
        boxShadow: shadow.boxShadow,
        ...(d ? gradientStyle(d.ground) : { backgroundColor: colors.feature }),
      }}
    >
      {shadow.node}
      {d ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: c.radius, overflow: 'hidden' },
            gradientStyle(d.glow),
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

// `.sg-card` on the ink: the words on the left, the gate and its buddy on the right. `still`: the
// gate is shut (outside the districts, Geçit closed), the dot does not beat.
function Frame({
  door,
  still,
  children,
}: {
  door: ImageSourcePropType;
  still?: boolean;
  children: ReactNode;
}) {
  const ink = useCardInk();
  const c = EXPLORE.district;
  return (
    <Ground testID="district-card">
      <View style={{ flex: 1, minWidth: 0, gap: c.lineGap }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: c.eyebrowGap }}>
          {still ? null : <PulseDot color={ink.eyebrow} size={c.dot} />}
          <T v="districtEyebrow" color={ink.eyebrow}>
            {upperTr(tr.district.eyebrow)}
          </T>
        </View>
        {children}
      </View>
      <Sticker source={door} />
    </Ground>
  );
}

// The gate as a sticker (a white edge, turned a little) and a buddy standing over its lower left.
// At 320 dp or the largest text the gate is drawn smaller, so the words keep their room.
function Sticker({ source }: { source: ImageSourcePropType }) {
  const { scheme } = useKit();
  const k = useNarrow() ? EXPLORE.district.narrowArt : 1;
  const c = EXPLORE.district;
  const d = {
    ...c.door,
    width: c.door.width * k,
    height: c.door.height * k,
    radius: c.door.radius * k,
  };
  const shadow = boxShadowParts(
    useLabOff('golge'),
    EXPLORE[scheme].district?.doorShadow ?? SEMT.card.door.shadow,
    d.radius,
  );
  return (
    <View accessible={false} style={{ width: c.art.width * k, height: c.art.height * k }}>
      <View
        style={{
          width: d.width,
          height: d.height,
          borderRadius: d.radius,
          borderWidth: d.edge,
          borderColor: SEMT.card.stickerEdge,
          backgroundColor: SEMT.card.stickerEdge,
          boxShadow: shadow.boxShadow,
          transform: [{ rotate: d.tilt }],
        }}
      >
        {shadow.node}
        <View style={{ flex: 1, borderRadius: d.radius - d.edge, overflow: 'hidden' }}>
          <Image
            source={source}
            fadeDuration={0}
            resizeMode="cover"
            style={{ width: d.width - d.edge * 2, height: d.height - d.edge * 2 }}
          />
        </View>
      </View>
      <Image
        source={BUDDY}
        fadeDuration={0}
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: c.buddy.left * k,
          bottom: c.buddy.bottom * k,
          width: c.buddy.width * k,
          height: c.buddy.height * k,
        }}
      />
    </View>
  );
}

// `.sg-meta`: the clock and the time.
function Meta({ text }: { text: string }) {
  const ink = useCardInk();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SEMT.card.meta.gap,
      }}
    >
      <CapIcon name="clock" color={ink.eyebrow} size={SEMT.card.meta.icon} />
      <T v="fine" strong color={ink.title}>
        {text}
      </T>
    </View>
  );
}

function CardButton({
  label,
  onPress,
  loading,
  soft,
  testID,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  soft?: boolean;
  testID?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', marginTop: EXPLORE.district.buttonTop }}>
      <Btn
        sm
        variant={soft ? 'glassy' : 'primary'}
        label={label}
        loading={loading}
        testID={testID}
        onPress={onPress}
        trail={
          soft ? undefined : (
            <CapIcon name="forward" color={KIT.onPrimary} size={EXPLORE.district.chevron} />
          )
        }
      />
    </View>
  );
}

// "Kart · yükleniyor": the bars where the words go, the gate's place, on the card's own ground.
function CardSkeleton() {
  const { scheme } = useKit();
  const c = SEMT.card;
  const sk = SEMT.skeleton[scheme === 'light' ? 'dark' : 'light'];
  const art = EXPLORE.district;
  const bar = (width: number | `${number}%`, height: number, radius?: number) => ({
    width,
    height,
    borderRadius: radius ?? c.skeleton.radius,
    backgroundColor: sk.ground,
    borderWidth: 1,
    borderColor: sk.edge,
  });
  return (
    <Ground testID="district-card-loading">
      <View
        accessible
        accessibilityLabel={tr.district.card.loading}
        style={{ flex: 1, gap: c.skeleton.gap }}
      >
        <View style={bar(c.skeleton.eyebrow.width, c.skeleton.eyebrow.height)} />
        <View style={bar(c.skeleton.title.width, c.skeleton.title.height)} />
        <View style={bar(c.skeleton.line.width, c.skeleton.line.height)} />
        <View
          style={[
            bar(c.skeleton.button.width, c.skeleton.button.height, c.skeleton.button.height / 2),
            { marginTop: art.buttonTop },
          ]}
        />
      </View>
      <View style={bar(art.door.width, art.door.height, art.door.radius)} />
    </Ground>
  );
}
