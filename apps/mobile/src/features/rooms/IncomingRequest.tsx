import { requestGone } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { GlyphDisc } from '@/components/GlyphDisc';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { useNow } from '@/lib/useNow';
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
  const { colors, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const requests = useIncomingRequests(roomId, ownerSessionId);
  const now = useNow(1000);
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
          : undefined
      }
    >
      <View
        style={{
          gap: SPACING[3],
          padding: SPACING[4],
          borderRadius: shape.radius.lg,
          backgroundColor: colors.surface,
          borderWidth: shape.stroke.card,
          borderColor: colors.cardLine,
          boxShadow: floating ? shape.shadow.sheet : shape.shadow.card,
        }}
      >
        {children}
      </View>
    </View>
  );

  if (!request) {
    return coming
      ? frame(
          <View className="flex-row items-center gap-3">
            <GlyphDisc icon="walk-outline" />
            <View className="flex-1 gap-0.5">
              <Text variant="heading">{tr.rooms.comingTitle(coming.alias, coming.phones)}</Text>
              <Text variant="fine">{tr.rooms.comingBody}</Text>
            </View>
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
        <Text variant="heading" testID="request-gone">
          {tr.rooms.requestGone}
        </Text>
        <Button
          variant="neutral"
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
  const meta = [
    ...(group
      ? [
          tr.venue.people(request.requester_phones),
          person ? tr.rooms.askedBy(person) : tr.rooms.askedByAnonymous,
        ]
      : [member ? tr.rooms.memberAsk : profiled ? tr.rooms.withProfile : tr.rooms.anonymous]),
    tr.rooms.secondsLeft(seconds),
  ].join(` ${tr.common.separator} `);
  const face =
    profiled && profile.data ? (
      <Avatar
        kind="profile"
        name={profile.data.displayName ?? request.requester_alias}
        photoUrl={profile.data.photoUrl}
        size={group ? 'sm' : 'xl'}
      />
    ) : profiled && profile.isPending ? (
      <Placeholder round label={tr.rooms.requestProfileLoading} />
    ) : (
      <Avatar kind="default" size={group ? 'sm' : 'xl'} />
    );

  return frame(
    <>
      <View
        className="flex-row items-center gap-3"
        testID={profiled ? 'request-profile' : undefined}
      >
        {group ? (
          <View style={{ width: AVATAR_SIZE.xl, height: AVATAR_SIZE.xl }}>
            <GlyphDisc icon="people-outline" />
            <View className="absolute" style={{ right: -SPACING[1.5], bottom: -SPACING[1.5] }}>
              {face}
            </View>
          </View>
        ) : (
          face
        )}
        <View className="flex-1 gap-0.5">
          <Text variant="heading">{title}</Text>
          <Text variant="fine" tabular>
            {meta}
          </Text>
        </View>
      </View>
      {full ? (
        <Text variant="fine" tone="danger">
          {tr.rooms.tooMany}
        </Text>
      ) : null}
      {respond.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(respond.error)}
        </Text>
      ) : null}
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Button
            variant="neutral"
            icon="close"
            iconTone="danger"
            label={tr.rooms.decline}
            accessibilityHint={member ? tr.rooms.declineMemberNote : tr.rooms.declineNote}
            onPress={() => respond.mutate({ id: request.id, accept: false, member })}
            disabled={respond.isPending}
          />
        </View>
        <View className="flex-1">
          <Button
            variant="positive"
            icon="checkmark"
            testID="join-accept"
            label={tr.rooms.accept}
            onPress={() => respond.mutate({ id: request.id, accept: true, member })}
            loading={respond.isPending}
            disabled={full}
          />
        </View>
      </View>
    </>,
    'request-card',
  );
}

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
