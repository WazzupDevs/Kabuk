import { inboxStamp } from '@shared/dmInbox.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { View } from 'react-native';

import { T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { type HistoryConcept, tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { FLAT } from '@/theme/flatLists';

import {
  refreshFriends,
  useIncomingFriendRequests,
  useSentRequests,
  useVenueChatRequests,
} from './queries';
import { MasaSection, useMasaRequestData } from './MasaRequests';
import { LetterFace, RequestRowView } from './RequestRowView';
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
// each with its decline and "Kabul et". A decline is silent (rule 5). The board's "Masa · N"
// section over it is MasaRequests.tsx (join requests and table invites). Under them
// "Gönderdiğin · N": the caller's own requests, every one "Kabul etmesi bekleniyor" whatever became
// of it (rule 5), with the name shown when it was sent and a letter for a face (no photo comes),
// and "Geri çek". A list that fails to load leaves the section out: the rest stays.
export function RequestList({ now }: { now: Date }) {
  const queryClient = useQueryClient();
  const fromTables = useIncomingFriendRequests();
  const fromChat = useVenueChatRequests();
  const masa = useMasaRequestData(now.getTime());
  const sent = useSentRequests();
  const withdraw = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (sentId: string) => friendsApi.withdraw(sentId),
    onSettled: () => refreshFriends(queryClient, 'pressed'),
  });
  const pending = fromTables.isPending || fromChat.isPending || masa.pending;
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
      <View className="flex-1">
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  // A failed refresh keeps the lists (audit PRO-2).
  if (!fromTables.data || !fromChat.data || masa.error) {
    return (
      <EmptyState
        kind="error"
        body={errorMessage(fromTables.error ?? fromChat.error ?? masa.error)}
        error={fromTables.error ?? fromChat.error ?? masa.error}
        action={{
          label: tr.common.retry,
          onPress: () => {
            void fromTables.refetch();
            void fromChat.refetch();
            masa.refetch();
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

  const mine = sent.data ?? [];
  if (rows.length === 0 && mine.length === 0 && !masa.any) {
    return (
      // IsteklerBos: the riso and its two lines in the middle, no card.
      <EmptyState
        page
        kind="empty"
        riso="requests"
        compact
        title={tr.messages.noRequests}
        body={tr.messages.noRequestsHint}
      />
    );
  }

  const R = FLAT.request;
  return (
    <View style={{ marginTop: R.listTop }}>
      {/* IsteklerDolu: "Masa · N" over "Arkadaşlık · N". */}
      <MasaSection data={masa} nowMs={now.getTime()} />
      {/* `.rqh`: "Arkadaşlık · 3", 13/700, the muted ink, 14 over and 4 under. */}
      {rows.length > 0 ? (
        <T
          v="sectionHead"
          accessibilityRole="header"
          style={{ marginTop: R.headTop, marginBottom: R.headBottom }}
        >
          {tr.friends.requestsHead(rows.length)}
        </T>
      ) : null}
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
      {mine.length > 0 ? (
        <T
          v="sectionHead"
          accessibilityRole="header"
          style={{ marginTop: R.headTop, marginBottom: R.headBottom }}
        >
          {tr.friends.sentHead(mine.length)}
        </T>
      ) : null}
      {mine.map((s) => {
        const name = s.name ?? tr.profile.noName;
        return (
          <RequestRowView
            key={s.id}
            testID={`sent-${name}`}
            label={tr.friends.sentRow(name)}
            name={name}
            kind={tr.friends.sentKind}
            stamp={{ text: tr.messages.stamp(s.sentAt, inboxStamp(s.sentAt, now)) }}
            face={<LetterFace name={name} />}
            soft={{
              text: tr.friends.withdraw,
              label: tr.friends.withdrawLabel(name),
              testID: `sent-withdraw-${name}`,
              disabled: withdraw.isPending,
              loading: withdraw.isPending && withdraw.variables === s.id,
              onPress: () => withdraw.mutate(s.id),
            }}
          />
        );
      })}
      {withdraw.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(withdraw.error)}
        </T>
      ) : null}
    </View>
  );
}

// `.rq` (RequestRowView) of a friend request.
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
  const mine = busy?.requestId === r.id;
  return (
    <RequestRowView
      testID={`request-${r.name}`}
      label={r.label}
      name={r.name}
      kind={tr.messages.requestKind}
      stamp={{ text: tr.messages.stamp(r.at, inboxStamp(r.at, now)) }}
      face={
        r.face.kind === 'table' ? (
          <Avatar kind="table" alias={r.face.alias} size="xl" />
        ) : r.face.photoUrl ? (
          <Avatar kind="profile" name={r.name} photoUrl={r.face.photoUrl} size="xl" />
        ) : (
          // `.rqa`: no photo, the letter on a colour.
          <LetterFace name={r.name} />
        )
      }
      decline={{
        label: tr.messages.decline(r.name),
        testID: `request-decline-${r.name}`,
        disabled: busy !== null,
        loading: mine && busy?.accept === false,
        onPress: () => onAnswer(false),
      }}
      accept={{
        text: tr.friends.accept,
        label: tr.messages.accept(r.name),
        testID: `request-accept-${r.name}`,
        disabled: busy !== null,
        loading: mine && busy?.accept === true,
        onPress: () => onAnswer(true),
      }}
    />
  );
}
