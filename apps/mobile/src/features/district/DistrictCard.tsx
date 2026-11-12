import { secondsUntil } from '@shared/district.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, PulseDot, T, useKit } from '@/aura/kit';
import { boxShadowParts } from '@/components/NativeShadow';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useNow } from '@/lib/useNow';
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
// one featured card (docs/design/iskelet.md → 5.1): the ink ground, the beating green dot, the gate
// a sticker turned a little with a buddy beside it, the prominent button.
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
      <Frame door={RISO.door}>
        <Title>{tr.district.card.inRoom(s.district.name)}</Title>
        <Meta text={grace ? tr.district.continueChip : tr.district.left(h, m)} />
        <CardButton
          label={tr.district.card.backToRoom}
          testID="district-card-room"
          onPress={() => router.push('/district/room')}
        />
      </Frame>
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
    <Frame door={RISO.door}>
      <Title>{tr.district.card.title(s.district?.name ?? null)}</Title>
      <Note>{tr.district.card.note}</Note>
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
    </Frame>
  );
}

// The green that reads on the card's ground: the dark scheme's on the ink, the light scheme's on
// the dark scheme's near-white card.
function useCardGreen(): string {
  const { scheme } = useKit();
  return SEMT.eyebrow[scheme === 'light' ? 'dark' : 'light'];
}

function Title({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <T v="h3" color={colors.onFeature}>
      {children}
    </T>
  );
}

function Note({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <T v="fine" color={colors.featureMuted}>
      {children}
    </T>
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
  const { colors } = useTheme();
  const green = useCardGreen();
  const c = SEMT.card;
  return (
    <View
      testID="district-card"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: c.gap,
        padding: c.pad,
        borderRadius: c.radius,
        backgroundColor: colors.feature,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: c.lineGap }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: c.eyebrowGap }}>
          {still ? null : <PulseDot color={green} />}
          <T v="eyebrow" color={green}>
            {upperTr(tr.district.eyebrow)}
          </T>
        </View>
        {children}
      </View>
      <Sticker source={door} />
    </View>
  );
}

// The gate as a sticker (a white edge, turned a little) and a buddy standing over its lower left.
function Sticker({ source }: { source: ImageSourcePropType }) {
  const d = SEMT.card.door;
  const a = SEMT.card.art;
  const shadow = boxShadowParts(useLabOff('golge'), d.shadow, d.radius);
  return (
    <View
      accessible={false}
      style={{ width: d.width + a.buddy.width - a.overlap, height: d.height + a.edge * 2 }}
    >
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: d.width,
          height: d.height,
          borderRadius: d.radius,
          borderWidth: a.edge,
          borderColor: SEMT.card.stickerEdge,
          backgroundColor: SEMT.card.stickerEdge,
          boxShadow: shadow.boxShadow,
          transform: [{ rotate: a.tilt }],
        }}
      >
        {shadow.node}
        <View style={{ flex: 1, borderRadius: d.radius - a.edge, overflow: 'hidden' }}>
          <Image
            source={source}
            fadeDuration={0}
            resizeMode="cover"
            style={{ width: d.width - a.edge * 2, height: d.height - a.edge * 2 }}
          />
        </View>
      </View>
      <Image
        source={BUDDY}
        fadeDuration={0}
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: a.buddy.width,
          height: a.buddy.height,
        }}
      />
    </View>
  );
}

// `.sg-meta`: the clock and the time.
function Meta({ text }: { text: string }) {
  const { colors } = useTheme();
  const green = useCardGreen();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SEMT.card.meta.gap,
        marginTop: SEMT.card.lineGap,
      }}
    >
      <CapIcon name="clock" color={green} size={SEMT.card.meta.icon} />
      <T v="fine" strong color={colors.onFeature}>
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
    <View style={{ flexDirection: 'row', marginTop: SEMT.card.buttonTop }}>
      <Btn
        sm
        variant={soft ? 'glassy' : 'primary'}
        label={label}
        loading={loading}
        testID={testID}
        onPress={onPress}
      />
    </View>
  );
}

// "Kart · yükleniyor": the bars where the words go, the gate's place, on the card's own ground.
function CardSkeleton() {
  const { scheme } = useKit();
  const { colors } = useTheme();
  const c = SEMT.card;
  const sk = SEMT.skeleton[scheme === 'light' ? 'dark' : 'light'];
  const bar = (
    width: number | `${number}%`,
    height: number,
    radius: number = c.skeleton.radius,
  ) => ({
    width,
    height,
    borderRadius: radius,
    backgroundColor: sk.ground,
    borderWidth: 1,
    borderColor: sk.edge,
  });
  return (
    <View
      testID="district-card-loading"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: c.gap,
        padding: c.pad,
        borderRadius: c.radius,
        backgroundColor: colors.feature,
      }}
    >
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
            { marginTop: c.lineGap },
          ]}
        />
      </View>
      <View style={bar(c.door.width, c.door.height, c.door.radius)} />
    </View>
  );
}
