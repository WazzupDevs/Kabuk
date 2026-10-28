import { JOIN_REQUEST_TTL_SECONDS } from '@shared/rooms.ts';
import { requestGone } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { Av, Btn, T, Tag, useKit } from '@/aura/kit';
import { Peek } from '@/aura/Peek';
import { PopIn } from '@/aura/PopIn';
import { AVATAR_SIZE } from '@/components/Avatar';
import { closeAllSheets } from '@/components/sheetCloser';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { useNowUntil } from '@/lib/useNow';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE, shadowList } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { roomKeys, useCurrentRoom, useIncomingRequests, useRequestProfile } from './queries';

// `ownerSessionId`: this person, when it owns the table; null otherwise (no requests to answer).
type Props = { roomId: string; ownerSessionId: string | null; phones: number; floating?: boolean };

// Whether the table screen is open: there the card sits in the screen (skall tuvali,
// MasaIstekGelsin); anywhere else it floats at the top.
export const useTableScreenOpen = create<{ open: number }>(() => ({ open: 0 }));
export function useMarkTableScreen() {
  useEffect(() => {
    useTableScreenOpen.setState((s) => ({ open: s.open + 1 }));
    return () => useTableScreenOpen.setState((s) => ({ open: s.open - 1 }));
  }, []);
}

// The owner's request card wherever the person is in the app (docs/SPEC_V4.md §4.E): whatever tab
// is open, the 60 seconds are not missed. Mounted once, in the app's layout; on the table screen
// the screen shows it.
export function IncomingRequestHost() {
  const table = useActiveTable();
  const sessionId = table.data?.id;
  const room = useCurrentRoom(sessionId).data;
  const onTable = useTableScreenOpen((s) => s.open > 0);
  const owns =
    !!room &&
    !!sessionId &&
    (room.status === 'waiting' || room.status === 'active') &&
    room.owner_session_id === sessionId;
  return room && owns && !onTable ? (
    <IncomingRequest
      floating
      roomId={room.id}
      ownerSessionId={sessionId ?? null}
      phones={room.phones}
    />
  ) : null;
}

// The owner's 60 second window (docs/SPEC_V4.md §4.E; skall tuvali: MasaIstekGelsin,
// MasaIstekAnonim, MasaIstekMasa, MasaIstekDolu, MasaIstekGeliyor): who asks, how (profiled,
// anonymous, a table of N with the one who asked) and the seconds left, then "Reddet" and "Kabul
// et". A table that would pass 12 people cannot be accepted. A "Kabul" that comes too late (the
// requester moved meanwhile) says "Bu masa artık müsait değil." with only "Kapat"; an accepted
// table says it is coming for a few seconds. A requester who asked with its profile shows its
// name, age and photo, read while the request waits (rule 4); the seconds and the buttons never
// wait for it.
export function IncomingRequest({ roomId, ownerSessionId, phones, floating }: Props) {
  const { shape } = useTheme();
  const k = useKit();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const requests = useIncomingRequests(roomId, ownerSessionId);
  // The clock runs only while a request's window is open (the latest one's end).
  const latest = (requests.data ?? []).reduce<string | null>(
    (last, r) =>
      last === null || Date.parse(r.expires_at) > Date.parse(last) ? r.expires_at : last,
    null,
  );
  const now = useNowUntil(latest, 1000);
  // Requests whose "Kabul" came too late, and the one whose card says so now.
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  const [gone, setGone] = useState<string | null>(null);
  const [coming, setComing] = useState<{ alias: string; phones: number } | null>(null);
  const request = requests.data?.find(
    (r) => (Date.parse(r.expires_at) > now || r.id === gone) && !closed.has(r.id),
  );
  const profile = useRequestProfile(request?.id, request?.requester_profiled === true);

  const respond = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, accept }: { id: string; accept: boolean; member: boolean }) =>
      roomsApi.respond(id, accept),
    onSuccess: (_data, { accept, member }) => {
      if (accept) {
        haptic('requestAccepted');
        track('join_accepted', { as_member: member });
        if (request && request.requester_phones > 1) {
          setComing({ alias: request.requester_alias, phones: request.requester_phones });
        }
      }
    },
    onError: (err, { id }) => {
      if (err instanceof ApiError && requestGone(err.code)) setGone(id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.incoming(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      // The table card's people.
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.people(roomId) });
    },
  });

  // A request coming in is felt once.
  const requestId = request?.id;
  const felt = useRef<string | null>(null);
  useEffect(() => {
    if (!requestId || felt.current === requestId) return;
    felt.current = requestId;
    haptic('incomingRequest');
    // No sheet over the card while its seconds run.
    closeAllSheets();
  }, [requestId]);
  useEffect(() => {
    if (!coming) return undefined;
    const timer = setTimeout(() => setComing(null), COMING_MS);
    return () => clearTimeout(timer);
  }, [coming]);

  const frame = (children: ReactNode, testID: string) => (
    <View
      testID={testID}
      pointerEvents="box-none"
      style={
        floating
          ? {
              position: 'absolute',
              left: shape.screenPadding,
              right: shape.screenPadding,
              top: insets.top + SPACING[2],
            }
          : // Room for the buddies over the card.
            { marginTop: AURA.peek.up }
      }
    >
      {/* It comes up with a bounce, a near-opaque glass pane (docs/design/aura → Gelen istek). */}
      <PopIn key={testID}>
        {/* docs/design/aura → MasaIstek: the table's buddies look over the card. */}
        {floating ? null : <Peek kind="request" />}
        <View
          style={{
            ...gradientStyle(k.c.sheet),
            gap: KIT.size.padLg - SPACING[1.5],
            padding: KIT.size.pad,
            borderRadius: KIT.size.glassRadius,
            borderWidth: KIT.size.edge,
            borderColor: k.c.glassEdge,
            boxShadow: shadowList(KIT.requestShadow, k.c.glassInset),
          }}
        >
          {children}
        </View>
      </PopIn>
    </View>
  );

  if (!request) {
    return coming
      ? frame(
          <View style={{ gap: KIT.size.tagGap }}>
            <T v="h3">{tr.rooms.comingTitle(coming.alias, coming.phones)}</T>
            <T v="fine">{tr.rooms.comingBody}</T>
          </View>,
          'request-coming',
        )
      : null;
  }
  const seconds = Math.max(0, Math.ceil((Date.parse(request.expires_at) - now) / 1000));
  const member = request.as_member;

  if (request.id === gone) {
    return frame(
      <>
        <T v="h3" testID="request-gone">
          {tr.rooms.requestGone}
        </T>
        <Btn
          block
          variant="glassy"
          label={tr.common.close}
          onPress={() => {
            setClosed((ids) => new Set([...ids, request.id]));
            setGone(null);
            respond.reset();
          }}
        />
      </>,
      'request-card',
    );
  }

  const profiled = request.requester_profiled;
  const person =
    profiled && profile.data
      ? tr.participation.previewName(
          profile.data.displayName ?? request.requester_alias,
          profile.data.age,
        )
      : null;
  const group = request.requester_phones > 1;
  const full = phones + request.requester_phones > MAX_TABLE_PHONES;
  const title = tr.rooms.wantsToJoin(
    group ? request.requester_alias : (person ?? request.requester_alias),
  );
  // How the person asks (docs/design/aura → MasaIstek: a purple tag), and the seconds left.
  const how = group
    ? tr.venue.people(request.requester_phones)
    : member
      ? tr.rooms.memberAsk
      : profiled
        ? tr.rooms.withProfile
        : tr.rooms.anonymous;
  const faceName = profile.data?.displayName ?? request.requester_alias;
  const face =
    profiled && profile.data ? (
      <Av size="row" name={faceName} photoUrl={profile.data.photoUrl} />
    ) : profiled && profile.isPending ? (
      <Placeholder round label={tr.rooms.requestProfileLoading} />
    ) : (
      <Av size="row" name={request.requester_alias} />
    );

  return frame(
    <>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.pad - SPACING[1] }}
        testID={profiled ? 'request-profile' : undefined}
      >
        <Countdown share={seconds / JOIN_REQUEST_TTL_SECONDS}>{face}</Countdown>
        <View style={{ flex: 1, gap: KIT.size.tagGap }}>
          <T v="h3" style={KIT_TYPE.requestTitle}>
            {title}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipGap }}>
            <Tag tone="purple" label={how} />
            {group ? (
              <Tag
                tone="purple"
                label={person ? tr.rooms.askedBy(person) : tr.rooms.askedByAnonymous}
              />
            ) : null}
            <Tag label={tr.rooms.secondsLeft(seconds)} />
          </View>
        </View>
      </View>
      {full ? (
        <T v="fine" color={KIT.danger}>
          {tr.rooms.tooMany}
        </T>
      ) : null}
      {respond.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(respond.error)}
        </T>
      ) : null}
      <View style={{ flexDirection: 'row', gap: KIT.size.chipGap + SPACING[1] }}>
        <Btn
          block
          variant="glassy"
          icon="close"
          label={tr.rooms.decline}
          accessibilityLabel={`${tr.rooms.decline}. ${member ? tr.rooms.declineMemberNote : tr.rooms.declineNote}`}
          onPress={() => respond.mutate({ id: request.id, accept: false, member })}
          disabled={respond.isPending}
          style={{ flex: 1 }}
        />
        <Btn
          block
          icon="check"
          testID="join-accept"
          label={tr.rooms.accept}
          onPress={() => respond.mutate({ id: request.id, accept: true, member })}
          loading={respond.isPending}
          disabled={full}
          style={{ flex: 1 }}
        />
      </View>
    </>,
    'request-card',
  );
}

// The face inside a ring that empties with the request's 60 seconds (MasaIstek).
function Countdown({ share, children }: { share: number; children: ReactNode }) {
  const { c } = useKit();
  const side = RING_SIDE;
  const r = (side - RING_STROKE) / 2;
  const around = 2 * Math.PI * r;
  const left = Math.max(0, Math.min(1, share));
  return (
    <View style={{ width: side, height: side, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={side} height={side} style={{ position: 'absolute' }}>
        <Circle
          cx={side / 2}
          cy={side / 2}
          r={r}
          stroke={c.hair}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={side / 2}
          cy={side / 2}
          r={r}
          stroke={KIT.primary}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${around * left} ${around}`}
          transform={`rotate(-90 ${side / 2} ${side / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
const RING_SIDE = 72;
const RING_STROKE = 4;

// An accepted table's "geliyor" note stays this long.
const COMING_MS = 6000;

// The profile's place while it loads: the photo's circle, or a line of the name's height.
function Placeholder({ round, label }: { round?: boolean; label?: string }) {
  const { colors, shape } = useTheme();
  const side = AVATAR_SIZE.xl;
  return (
    <View
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={{
        width: round ? side : '55%',
        height: round ? side : ICON.lg,
        borderRadius: round ? shape.radius.pill : shape.radius.sm,
        backgroundColor: colors.surface2,
      }}
    />
  );
}
