import { inboxStamp } from '@shared/dmInbox.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { View } from 'react-native';

import { Btn, Round, T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { type HistoryConcept, tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNarrow } from '@/lib/useNarrow';
import { FLAT } from '@/theme/flatLists';

import { refreshFriends, useIncomingFriendRequests, useVenueChatRequests } from './queries';
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

// Mesajlar → İstekler (docs/SPEC_V4.md §4.C; yeni arayüz tuvali: IsteklerBos, IsteklerDolu): the
// open friend requests waiting for the caller under "Arkadaşlık · N", newest first, from the venue
// chat (the sender's name and photo, rule 4) and from play history (the table's name); a flat row
// each with its decline and "Kabul et". A decline is silent (rule 5). The board's "Masa" section
// (join requests and invites) and "Gönderdiğin" have no data here: they are not drawn.
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
      // IsteklerBos: the riso and its two lines in the middle, no card.
      <View className="flex-1 justify-center">
        <EmptyState
          kind="empty"
          riso="requests"
          compact
          title={tr.messages.noRequests}
          body={tr.messages.noRequestsHint}
        />
      </View>
    );
  }

  const R = FLAT.request;
  return (
    <View style={{ marginTop: R.listTop }}>
      {/* `.rqh`: "Arkadaşlık · 3", 13/700, the muted ink, 14 over and 4 under. */}
      <T
        v="sectionHead"
        accessibilityRole="header"
        style={{ marginTop: R.headTop, marginBottom: R.headBottom }}
      >
        {tr.friends.requestsHead(rows.length)}
      </T>
      {rows.map((r) => (
        <RequestRow
          key={r.id}
          row={r}
          now={now}
          busy={respond.isPending ? (respond.variables ?? null) : null}
          onAnswer={(accept) => respond.mutate({ requestId: r.id, accept })}
        />
      ))}
      {respond.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(respond.error)}
        </T>
      ) : null}
    </View>
  );
}

// `.rq`: the face, the name over its line and its date, the decline round and "Kabul et" at the
// right; at 320 dp or the largest text they stand under the words.
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
  const R = FLAT.request;
  const narrow = useNarrow();
  const mine = busy?.requestId === r.id;
  const actions = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipsGap }}>
      <Round
        icon="close"
        label={tr.messages.decline(r.name)}
        testID={`request-decline-${r.name}`}
        disabled={busy !== null}
        loading={mine && busy?.accept === false}
        onPress={() => onAnswer(false)}
      />
      <Btn
        sm
        icon="check"
        label={tr.friends.accept}
        accessibilityLabel={tr.messages.accept(r.name)}
        testID={`request-accept-${r.name}`}
        disabled={busy !== null}
        loading={mine && busy?.accept === true}
        onPress={() => onAnswer(true)}
      />
    </View>
  );
  return (
    <View
      testID={`request-${r.name}`}
      style={{ gap: KIT.size.chipsGap, paddingVertical: R.rowPadY }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: R.gap }}>
        {r.face.kind === 'table' ? (
          <Avatar kind="table" alias={r.face.alias} size="xl" />
        ) : (
          <Avatar kind="profile" name={r.name} photoUrl={r.face.photoUrl} size="xl" />
        )}
        <View style={{ flex: 1, minWidth: 0 }} accessible accessibilityLabel={r.label}>
          <T v="h3">{r.name}</T>
          <T v="fine">{tr.messages.requestKind}</T>
          <T v="stamp">{tr.messages.stamp(r.at, inboxStamp(r.at, now))}</T>
        </View>
        {narrow ? null : actions}
      </View>
      {narrow ? actions : null}
    </View>
  );
}
