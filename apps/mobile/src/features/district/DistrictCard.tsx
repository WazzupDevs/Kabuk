import { secondsUntil } from '@shared/district.ts';
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, Glass, T, useKit } from '@/aura/kit';
import { boxShadowParts } from '@/components/NativeShadow';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useNow } from '@/lib/useNow';
import { SEMT } from '@/theme/semt';

import { districtScreen, useEnterDistrict } from './flow';
import { RISO } from './parts';
import { DISTRICT_VISIBLE, useDistrictState } from './queries';

// Keşfet's Semte Git card (SemteGitKesfet, GaleriSemteGit; docs/SPEC_V4.md §4.V): the question
// waiting ([Semte Git]), Geçit closed for today (the locked door, the time to 00:00), in the room
// (the time left, [Odaya dön]), outside the districts (no button), loading and error.
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
        <T v="h3">{tr.district.card.errorTitle}</T>
        <T v="fine">{tr.district.card.errorNote}</T>
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
        <T v="h3">{tr.district.card.inRoom(s.district.name)}</T>
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
      <Frame door={RISO.doorLocked}>
        <T v="h3">{tr.district.card.outsideTitle}</T>
        <T v="fine">{tr.district.card.outsideNote}</T>
      </Frame>
    );
  }
  if (s.gate === 'failed') {
    const [h, m] = hm(s.opensAt);
    return (
      <Frame door={RISO.doorLocked}>
        <T v="h3">{tr.district.card.closedTitle}</T>
        <T v="fine">{tr.district.card.closedNote}</T>
        <Meta text={tr.district.card.opensIn(h, m)} />
      </Frame>
    );
  }
  return (
    <Frame door={RISO.door}>
      <T v="h3">{tr.district.card.title(s.district?.name ?? null)}</T>
      <T v="fine">{tr.district.card.note}</T>
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

// `.glass.sg-card`: the words on the left, the door on the right.
function Frame({ door, children }: { door: ImageSourcePropType; children: ReactNode }) {
  const { scheme } = useKit();
  const c = SEMT.card;
  return (
    <Glass
      testID="district-card"
      radius={c.radius}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: c.gap,
        padding: c.pad,
        borderRadius: c.radius,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: c.lineGap }}>
        <T v="eyebrow" color={SEMT.eyebrow[scheme]}>
          {upperTr(tr.district.eyebrow)}
        </T>
        {children}
      </View>
      <Door source={door} />
    </Glass>
  );
}

function Door({ source }: { source: ImageSourcePropType }) {
  const { scheme } = useKit();
  const d = SEMT.card.door;
  const shadow = boxShadowParts(
    useLabOff('golge'),
    scheme === 'light' ? d.shadow : undefined,
    d.radius,
  );
  return (
    <View
      accessible={false}
      style={{
        width: d.width,
        height: d.height,
        borderRadius: d.radius,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <View
        style={{ width: d.width, height: d.height, borderRadius: d.radius, overflow: 'hidden' }}
      >
        <Image
          source={source}
          fadeDuration={0}
          resizeMode="cover"
          style={{ width: d.width, height: d.height }}
        />
      </View>
    </View>
  );
}

// `.sg-meta`: the clock and the time.
function Meta({ text }: { text: string }) {
  const { scheme } = useKit();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SEMT.card.meta.gap,
        marginTop: SEMT.card.lineGap,
      }}
    >
      <CapIcon name="clock" color={SEMT.eyebrow[scheme]} size={SEMT.card.meta.icon} />
      <T v="fine" strong>
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

// "Kart · yükleniyor": the bars where the words go, the door's place.
function CardSkeleton() {
  const { scheme } = useKit();
  const c = SEMT.card;
  const sk = SEMT.skeleton[scheme];
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
    <Glass
      testID="district-card-loading"
      radius={c.radius}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: c.gap,
        padding: c.pad,
        borderRadius: c.radius,
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
    </Glass>
  );
}
