import { JOIN_REQUEST_TTL_SECONDS } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Countdown } from '@/components/Countdown';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { roomsApi } from '@/lib/api';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import { BigAlias } from './BigAlias';
import { ProfiledTag } from './ProfiledTag';
import { roomKeys, useIncomingRequests } from './queries';

// `leaderSessionId`: this phone, when it leads a side; null otherwise (no requests to answer).
type Props = { roomId: string; leaderSessionId: string | null };

// A leader's 60 second window: Kabul / Reddet (MVP_SPEC §4.4, screen 4). "Bu masadayım" shows the
// requester's alias as large as the requester's own waiting card (docs/SPEC_V3.md §22.C; canvas:
// Faz 2 · 22.5 → Lider: istek kartı).
export function IncomingRequest({ roomId, leaderSessionId }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const requests = useIncomingRequests(roomId, leaderSessionId);
  const now = useNow(1000);
  const request = requests.data?.find((r) => Date.parse(r.expires_at) > now);

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean; member: boolean }) =>
      roomsApi.respond(id, accept),
    onSuccess: (_data, { accept, member }) => {
      // A second side came; a member joining a side does not make a two-table room.
      if (accept && !member) track('room_two_tables', {});
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.incoming(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
    },
  });

  if (!request) return null;
  const seconds = Math.max(0, Math.ceil((Date.parse(request.expires_at) - now) / 1000));

  const member = request.as_member;

  return (
    <Sheet
      visible
      centered
      title={member ? tr.rooms.incomingMemberTitle : tr.rooms.incomingTitle}
      icon="people-outline"
    >
      {member ? (
        <>
          <BigAlias alias={request.requester_alias} />
          <Text variant="fine" tone="text">
            {tr.rooms.incomingMemberBody}
          </Text>
        </>
      ) : (
        <Text variant="bodyStrong" align="center">
          {tr.rooms.incomingBody(request.requester_alias, request.requester_headcount)}
        </Text>
      )}
      {request.requester_profiled ? (
        <View className="items-center">
          <ProfiledTag />
        </View>
      ) : null}
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
