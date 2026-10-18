import { inboxStamp } from '@shared/dmInbox.ts';
import type { BarIconKind } from '@/theme/barIcons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BarIcon } from '@/components/BarIcon';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Loader, useLoaderHold } from '@/components/Loader';
import { usePressScale } from '@/components/motion';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { type HistoryConcept, tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { friendKeys, useIncomingFriendRequests, useVenueChatRequests } from './queries';
import { useRetryAfterName } from './useRetryAfterName';

// The last game of the encounter, or the chat (docs/SPEC_V3.md §5.5), as on Bildirimler.
const concept = (c: string): HistoryConcept =>
  c === 'tabu' ? 'tabu' : c === 'sohbet' ? 'sohbet' : 'chat';

type Row = {
  id: string;
  name: string;
  at: string;
  // What the reader hears: who asked and from where (Bildirimler's sentence).
  label: string;
  face: { kind: 'table'; alias: string } | { kind: 'profile'; photoUrl: string | null };
};

type Answer = { requestId: string; accept: boolean };

// Mesajlar → İstekler (docs/SPEC_V4.md §4.C; v45: .qlist): the open friend requests waiting for the
// caller, newest first, from the venue chat (the sender's name and photo, rule 4) and from play
// history (the table's name). Decline and accept as on Bildirimler, which keeps the full cards with
// "Diğer" (block, report) until step 4.7. A decline is silent (rule 5).
export function RequestList({ now }: { now: Date }) {
  const queryClient = useQueryClient();
  const fromTables = useIncomingFriendRequests();
  const fromChat = useVenueChatRequests();
  const pending = fromTables.isPending || fromChat.isPending;
  const loading = useLoaderHold(pending);

  const respond = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ requestId, accept }: Answer) => friendsApi.respond(requestId, accept),
    onSuccess: (_data, { accept }) => {
      if (!accept) return;
      track('friend_request_accepted', {});
      track('friendship_created', { source: 'request' });
    },
    onError: (err, answer) => void askName(err, answer),
    onSettled: () => queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });
  const run = useCallback((a: Answer) => respond.mutate(a), [respond]);
  const askName = useRetryAfterName(run);

  if (pending || loading) {
    return (
      <View className="mt-12">
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  if (fromTables.isError || fromChat.isError) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        body={errorMessage(fromTables.error ?? fromChat.error)}
        action={{
          label: tr.common.retry,
          onPress: () => {
            void fromTables.refetch();
            void fromChat.refetch();
          },
        }}
      />
    );
  }

  const rows: Row[] = [
    ...fromChat.data.map((r): Row => ({
      id: r.requestId,
      name: r.displayName ?? tr.profile.noName,
      at: r.createdAt,
      label: tr.venueChat.incoming(r.venueName ?? '', r.displayName ?? '', r.age),
      face: { kind: 'profile', photoUrl: r.photoUrl },
    })),
    ...fromTables.data.map((r): Row => ({
      id: r.request_id,
      name: r.other_alias,
      at: r.created_at,
      label: tr.friends.incoming(r.played_at, concept(r.concept), r.other_alias),
      face: { kind: 'table', alias: r.other_alias },
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (rows.length === 0) {
    return (
      <View className="flex-1 justify-center">
        <EmptyState kind="empty" title={tr.messages.noRequests} body={tr.messages.noRequestsHint} />
      </View>
    );
  }

  return (
    <View className="mt-3 gap-3">
      <Card flush>
        <View style={{ paddingVertical: SPACING[1.5] }}>
          {rows.map((r) => (
            <RequestRow
              key={r.id}
              row={r}
              now={now}
              busy={respond.isPending ? (respond.variables ?? null) : null}
              onAnswer={(accept) => respond.mutate({ requestId: r.id, accept })}
            />
          ))}
        </View>
      </Card>
      {respond.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(respond.error)}
        </Text>
      ) : null}
    </View>
  );
}

function RequestRow({
  row: r,
  now,
  busy,
  onAnswer,
}: {
  row: Row;
  now: Date;
  busy: Answer | null;
  onAnswer: (accept: boolean) => void;
}) {
  const { colors } = useTheme();
  const mine = busy?.requestId === r.id;
  return (
    <View
      testID={`request-${r.name}`}
      className="flex-row items-center"
      style={{
        gap: SPACING[3],
        paddingVertical: SPACING[2.5],
        paddingHorizontal: SPACING[4],
      }}
    >
      {r.face.kind === 'table' ? (
        <Avatar kind="table" alias={r.face.alias} size="xl" />
      ) : (
        <Avatar kind="profile" name={r.name} photoUrl={r.face.photoUrl} size="xl" />
      )}
      <View
        className="flex-1"
        style={{ gap: SPACING[0.5] }}
        accessible
        accessibilityLabel={r.label}
      >
        <View
          className="flex-row flex-wrap items-baseline justify-between"
          style={{ columnGap: SPACING[2] }}
        >
          <Text variant="bodyStrong" className="shrink">
            {r.name}
          </Text>
          <Text variant="fine">{tr.messages.stamp(r.at, inboxStamp(r.at, now))}</Text>
        </View>
        <Text variant="fine">{tr.messages.requestKind}</Text>
      </View>
      <RoundAction
        icon="cross"
        fill={colors.dangerSoft}
        label={tr.messages.decline(r.name)}
        testID={`request-decline-${r.name}`}
        disabled={busy !== null}
        busy={mine && busy?.accept === false}
        onPress={() => onAnswer(false)}
      />
      <RoundAction
        icon="check"
        fill={colors.successSoft}
        label={tr.messages.accept(r.name)}
        testID={`request-accept-${r.name}`}
        disabled={busy !== null}
        busy={mine && busy?.accept === true}
        onPress={() => onAnswer(true)}
      />
    </View>
  );
}

// v45: .qbtn, a 40 dp tinted circle with the bar icon; 44 dp to the finger. While its answer goes,
// it shows Buluş and neither circle takes a press.
function RoundAction({
  icon,
  fill,
  label,
  testID,
  disabled,
  busy,
  onPress,
}: {
  icon: Extract<BarIconKind, 'cross' | 'check'>;
  fill: string;
  label: string;
  testID: string;
  disabled: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const { shape } = useTheme();
  const pressScale = usePressScale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      hitSlop={SPACING[0.5]}
    >
      {({ pressed }) => (
        <View
          className="items-center justify-center"
          style={[
            {
              width: SPACING[10],
              height: SPACING[10],
              borderRadius: shape.radius.pill,
              backgroundColor: fill,
            },
            pressScale(pressed),
          ]}
        >
          {busy ? <Loader kind="meet" size={ICON.lg} /> : <BarIcon kind={icon} size={ICON.md} />}
        </View>
      )}
    </Pressable>
  );
}
