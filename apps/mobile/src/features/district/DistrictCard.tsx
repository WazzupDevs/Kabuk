import { secondsUntil } from '@shared/district.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
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
        meta={grace ? tr.district.continueChip : tr.district.leftAmount(h, m)}
        metaWord={grace ? undefined : tr.district.leftWord}
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
    <Scene
      title={tr.district.card.title(s.district?.name ?? null).replace("'", '’')}
      note={tr.district.card.note}
    >
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

// The card's small strip once it has scrolled under the pinned head (KesfetKaydir `.ssm`): the
// same scene, its eyebrow and the district's name over the button. Only where the card has the
// button to give (Semte git, Odaya dön); shut, outside and unread draw none.
export function DistrictStrip() {
  const state = useDistrictState();
  const enter = useEnterDistrict({ replace: false });
  if (!DISTRICT_VISIBLE || !state.data) return null;
  const s = state.data;
  if (s.session && s.district) {
    return (
      <StripFace
        room
        title={tr.district.card.inRoom(s.district.name)}
        label={tr.district.card.backToRoom}
        testID="district-strip-room"
        onPress={() => router.push('/district/room')}
      />
    );
  }
  if (s.located === 'outside' || s.gate === 'failed') return null;
  return (
    <StripFace
      title={
        s.district ? tr.district.card.stripTitle(s.district.name) : tr.district.card.stripTitleNone
      }
      label={tr.district.card.go}
      testID="district-strip-go"
      loading={enter.isPending}
      onPress={() => {
        const to = districtScreen(s);
        if (to) router.push(to);
        else enter.mutate();
      }}
    />
  );
}

function StripFace({
  room,
  title,
  label,
  testID,
  loading,
  onPress,
}: {
  room?: boolean;
  title: string;
  label: string;
  testID: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const k = EXPLORE.scene;
  const g = EXPLORE.sticky;
  const [width, setWidth] = useState(0);
  // The scene covers the strip with its top 12 % kept (`object-position: 0% 12%`).
  const pictureHeight = (width * 600) / 1050;
  const eyebrow = room ? k.roomEyebrow : k.eyebrow;
  return (
    <View
      testID="district-strip"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height: g.stripHeight,
        borderRadius: g.stripRadius,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        gap: g.stripGapIn,
        paddingLeft: g.stripPadLeft,
        paddingRight: g.stripPadRight,
      }}
    >
      <Image
        source={room ? SCENE_ROOM : SCENE}
        fadeDuration={0}
        resizeMode="cover"
        accessible={false}
        style={{
          position: 'absolute',
          left: 0,
          top: Math.min(0, (g.stripHeight - pictureHeight) * g.stripPicturePos),
          width,
          height: Math.max(pictureHeight, g.stripHeight),
        }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: k.eyebrowGap }}>
          <View
            style={{
              width: g.stripDot,
              height: g.stripDot,
              borderRadius: g.stripDot / 2,
              backgroundColor: room ? k.roomDot : k.eyebrow,
            }}
          />
          <T v="mapLegend" color={eyebrow} style={{ letterSpacing: 0.24 }}>
            {upperTr(room ? tr.district.card.roomEyebrow : tr.district.card.sceneEyebrow)}
          </T>
        </View>
        {/* KesfetKaydir `.ssm b`: the strip's title bold. */}
        <T v="rowTitle" color={k.title}>
          {title}
        </T>
      </View>
      <View style={{ alignSelf: 'center' }}>
        <Btn
          sm
          variant="primary"
          label={label}
          testID={testID}
          loading={loading}
          onPress={onPress}
          look={{ padLeft: g.stripButtonPadX, padRight: g.stripButtonPadX }}
        />
      </View>
    </View>
  );
}

// The board's riso scenes under the card (Kesfet: the gate; KesfetSemtIcerde: the bench, in the
// room). In both schemes alike: the board draws the same picture on the dark side. Outside the room
// the gate's New Year scene (the owner's ask, 23 Kasım: a new flat picture, not riso, the buddies
// before the lit gate on the snow; the riso one stays beside it, kesfet-semt.webp). Each with its
// frosted copy (blurred once, small) for the words' pane.
const SCENE = require('../../../assets/riso/semt/kesfet-semt-yilbasi.webp') as ImageSourcePropType;
const SCENE_ROOM = require('../../../assets/riso/semt/kesfet-semt-oda.webp') as ImageSourcePropType;
const SCENE_FROST =
  require('../../../assets/riso/semt/kesfet-semt-buz.webp') as ImageSourcePropType;
const SCENE_ROOM_FROST =
  require('../../../assets/riso/semt/kesfet-semt-oda-buz.webp') as ImageSourcePropType;

// `.semt` (Kesfet, KesfetSemtIcerde): the riso scene filling the card, the words in its left 58 %
// over it: the beating dot and the eyebrow, the title, the note or the time left, the button at the
// foot. In the room the eyebrow and its dot are pink.
function Scene({
  room,
  title,
  note,
  meta,
  metaWord,
  children,
}: {
  room?: boolean;
  title: string;
  note?: string;
  // The time in bold, then its word (KesfetSemtIcerde `.tm`: `<b>1 sa 24 dk</b> kaldı`).
  meta?: string;
  metaWord?: string;
  children: ReactNode;
}) {
  const k = EXPLORE.scene;
  const f = k.frost;
  const eyebrow = room ? k.roomEyebrow : k.eyebrow;
  const [box, setBox] = useState({ w: 0, h: 0 });
  // The pane behind the words (the owner's ask, 23 Kasım): the scene's blurred copy laid exactly
  // over the scene (the same cover), seen only through the pane; nothing blurs while drawing.
  const words = (box.w - 2 * k.pad) * k.wordsShare;
  return (
    <View
      testID="district-card"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{ minHeight: k.minHeight, borderRadius: k.radius, overflow: 'hidden' }}
    >
      <Image
        source={room ? SCENE_ROOM : SCENE}
        fadeDuration={0}
        resizeMode="cover"
        accessible={false}
        style={PICTURE_FILL}
      />
      {box.w > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: f.inset,
            top: f.inset,
            bottom: f.inset,
            width: k.pad - f.inset + words + f.over,
            borderRadius: f.radius,
            borderWidth: 1,
            borderColor: f.edge,
            overflow: 'hidden',
          }}
        >
          <Image
            source={room ? SCENE_ROOM_FROST : SCENE_FROST}
            fadeDuration={0}
            resizeMode="cover"
            accessible={false}
            style={{
              position: 'absolute',
              left: -f.inset - 1,
              top: -f.inset - 1,
              width: box.w,
              height: box.h,
            }}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: f.fill }]} />
        </View>
      ) : null}
      <View style={{ flex: 1, padding: k.pad }}>
        <View style={{ flex: 1, width: k.words, alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: k.eyebrowGap }}>
            <PulseDot
              color={room ? k.roomDot : k.eyebrow}
              ring={room ? k.roomDotRing : undefined}
              darkRing
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
              <T v="semtMeta" strong={metaWord !== undefined} color={metaWord ? k.title : k.meta}>
                {meta}
              </T>
              {metaWord ? (
                <T v="semtMeta" color={k.meta}>
                  {metaWord}
                </T>
              ) : null}
            </View>
          ) : null}
          <View style={{ flexGrow: 1 }} />
          {children}
        </View>
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
        look={{ padLeft: EXPLORE.scene.buttonPadX, padRight: EXPLORE.scene.buttonPadX }}
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
