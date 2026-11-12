import { inboxStamp } from '@shared/dmInbox.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { Avatar } from '@/components/Avatar';
import { CapIcon } from '@/aura/CapIcon';
import { ListCard } from '@/components/ListCard';
import { EmptyState } from '@/components/EmptyState';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { Loader, useLoaderHold } from '@/components/Loader';
import { usePressScale } from '@/components/motion';
import { errorMessage } from '@/i18n/errors';
import { type HistoryConcept, tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { refreshFriends, useIncomingFriendRequests, useVenueChatRequests } from './queries';
import { useRetryAfterName } from './useRetryAfterName';

const NO_REQUESTS_PICTURE: number = require('../../../assets/riso/empty-requests.webp');

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
    onSettled: () => refreshFriends(queryClient, 'friendship'),
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
  // A failed refresh keeps the lists (audit PRO-2).
  if (!fromTables.data || !fromChat.data) {
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
      // tuval Mesajlar ("İstekler"): the small empty card, its riso 104 × 72 (iskelet.md → 3.4).
      <EmptyCard
        title={tr.messages.noRequests}
        body={tr.messages.noRequestsHint}
        picture={NO_REQUESTS_PICTURE}
        pictureTestID="empty-riso-requests"
      />
    );
  }

  return (
    <View className="mt-3 gap-3">
      <ListCard>
        {rows.map((r) => (
          <RequestRow
            key={r.id}
            row={r}
            now={now}
            busy={respond.isPending ? (respond.variables ?? null) : null}
            onAnswer={(accept) => respond.mutate({ requestId: r.id, accept })}
          />
        ))}
      </ListCard>
      {respond.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(respond.error)}
        </T>
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
        gap: SPACING[3] + SPACING[0.5],
        minHeight: SPACING[16] + SPACING[2],
        paddingVertical: SPACING[3],
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
          <T v="h3" style={{ flexShrink: 1 }}>
            {r.name}
          </T>
          <T v="fine">{tr.messages.stamp(r.at, inboxStamp(r.at, now))}</T>
        </View>
        <T v="fine">{tr.messages.requestKind}</T>
      </View>
      <RoundAction
        icon="close"
        fill={colors.dangerSoft}
        ink={colors.onDangerSoft}
        label={tr.messages.decline(r.name)}
        testID={`request-decline-${r.name}`}
        disabled={busy !== null}
        busy={mine && busy?.accept === false}
        onPress={() => onAnswer(false)}
      />
      <RoundAction
        icon="check"
        fill={colors.successSoft}
        ink={colors.onSuccessSoft}
        label={tr.messages.accept(r.name)}
        testID={`request-accept-${r.name}`}
        disabled={busy !== null}
        busy={mine && busy?.accept === true}
        onPress={() => onAnswer(true)}
      />
    </View>
  );
}

// v45: .qbtn, a 40 dp tinted circle with the capsule icon in its ink; 44 dp to the finger. While its answer goes,
// it shows Buluş and neither circle takes a press.
function RoundAction({
  icon,
  fill,
  label,
  ink,
  testID,
  disabled,
  busy,
  onPress,
}: {
  icon: 'close' | 'check';
  fill: string;
  // The icon's ink on its soft fill (onDangerSoft, onSuccessSoft).
  ink: string;
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
          {busy ? (
            <Loader kind="meet" size={ICON.lg} />
          ) : (
            <CapIcon name={icon} color={ink} size={ICON.md} />
          )}
        </View>
      )}
    </Pressable>
  );
}
