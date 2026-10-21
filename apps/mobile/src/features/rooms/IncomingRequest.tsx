import { JOIN_REQUEST_TTL_SECONDS } from '@shared/rooms.ts';
import { requestGone } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Countdown } from '@/components/Countdown';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { BigAlias } from './BigAlias';
import { roomKeys, useCurrentRoom, useIncomingRequests, useRequestProfile } from './queries';

// `ownerSessionId`: this person, when it owns the table; null otherwise (no requests to answer).
type Props = { roomId: string; ownerSessionId: string | null };

// The owner's request card wherever the person is in the app (docs/SPEC_V4.md §4.E): whatever tab
// is open, the 60 seconds are not missed. Mounted once, in the app's layout.
export function IncomingRequestHost() {
  const table = useActiveTable();
  const sessionId = table.data?.id;
  const room = useCurrentRoom(sessionId).data;
  const owns =
    !!room &&
    !!sessionId &&
    (room.status === 'waiting' || room.status === 'active') &&
    room.owner_session_id === sessionId;
  return room && owns ? <IncomingRequest roomId={room.id} ownerSessionId={sessionId ?? null} /> : null;
}

// The owner's 60 second window: Kabul / Geç (docs/SPEC_V4.md §4.E, "İstek kartı"): the requesting
// table's name and phones, or the person's own name for "Bu masadayım". A "Kabul" that comes too late
// (the requester's table moved to another meanwhile) says "Bu masa artık müsait değil." in place of
// the request, with only "Kapat"; the request is not shown again on this phone (the requester sees
// "Masa şu an müsait değil" when its 60 seconds end, as after "Geç": rule 5). A requester who asked
// with its profile shows its name, age and photo (docs/SPEC_V3.md §23.E), read while the request
// waits; the countdown and the buttons never wait for it.
export function IncomingRequest({ roomId, ownerSessionId }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const requests = useIncomingRequests(roomId, ownerSessionId);
  const now = useNow(1000);
  // Requests whose "Kabul" came too late, and the one whose card says so now.
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  const [gone, setGone] = useState<string | null>(null);
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

  if (!request) return null;
  const seconds = Math.max(0, Math.ceil((Date.parse(request.expires_at) - now) / 1000));

  const member = request.as_member;

  if (request.id === gone) {
    return (
      <Sheet
        visible
        centered
        title={member ? tr.rooms.incomingMemberTitle : tr.rooms.incomingTitle}
        icon="people-outline"
      >
        <Text variant="bodyStrong" align="center" testID="request-gone">
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
      </Sheet>
    );
  }

  const profiled = request.requester_profiled;
  const body = member
    ? tr.rooms.incomingMemberBody
    : tr.rooms.incomingBody(request.requester_alias, request.requester_phones);

  return (
    <Sheet
      visible
      centered={!profiled}
      title={member ? tr.rooms.incomingMemberTitle : tr.rooms.incomingTitle}
      icon={profiled ? undefined : 'people-outline'}
    >
      {profiled ? (
        <View className="flex-row items-start gap-3" testID="request-profile">
          {profile.isPending ? (
            <Placeholder round />
          ) : profile.data ? (
            <Avatar
              kind="profile"
              name={profile.data.displayName ?? request.requester_alias}
              photoUrl={profile.data.photoUrl}
              size="xl"
            />
          ) : (
            <Avatar kind="default" size="xl" />
          )}
          <View className="flex-1 gap-0.5">
            {profile.isPending ? (
              <Placeholder label={tr.rooms.requestProfileLoading} />
            ) : profile.data ? (
              <Text variant="heading">
                {tr.participation.previewName(
                  profile.data.displayName ?? request.requester_alias,
                  profile.data.age,
                )}
              </Text>
            ) : null}
            {member ? <Text variant="fine">{request.requester_alias}</Text> : null}
            <Text className="mt-0.5">{body}</Text>
          </View>
        </View>
      ) : member ? (
        <>
          <BigAlias alias={request.requester_alias} />
          <Text variant="fine" tone="text">
            {body}
          </Text>
        </>
      ) : (
        <Text variant="bodyStrong" align="center">
          {body}
        </Text>
      )}
      <View className="mt-1">
        <Countdown
          secondsLeft={seconds}
          totalSeconds={JOIN_REQUEST_TTL_SECONDS}
          label={tr.rooms.secondsLeft(seconds)}
        />
      </View>
      {respond.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(respond.error)}
        </Text>
      ) : null}
      <View className="mt-1 flex-row gap-2.5">
        <View className="flex-1">
          <Button
            variant="neutral"
            label={tr.rooms.decline}
            onPress={() => respond.mutate({ id: request.id, accept: false, member })}
            disabled={respond.isPending}
          />
        </View>
        <View className="flex-1">
          <Button
            testID="join-accept"
            label={tr.rooms.accept}
            onPress={() => respond.mutate({ id: request.id, accept: true, member })}
            loading={respond.isPending}
          />
        </View>
      </View>
      <View className="flex-row items-start gap-2">
        <Ionicons name="lock-closed-outline" size={ICON.sm} color={colors.muted} />
        <Text variant="fine" className="flex-1">
          {member ? tr.rooms.declineMemberNote : tr.rooms.declineNote}
        </Text>
      </View>
    </Sheet>
  );
}

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
