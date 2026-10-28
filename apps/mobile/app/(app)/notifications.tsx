import type { NotificationItem } from '@shared/api/friends.ts';
import { inviteState, seenMark } from '@shared/notifications.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Av, Btn, Glass, GlassList, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { RouteSheet } from '@/components/RouteSheet';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { openDm } from '@/features/friends/openDm';
import { friendKeys, useFriends, useNotifications } from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { callAccount, friendsApi, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { SPACING } from '@/theme/tokens';

// Bildirimler (docs/SPEC_V4.md §4.G; skall tuvali: Bildirimler, BildirimlerKabul, BildirimlerBos):
// friends/notifications's rows, the new ones (after the list was last opened) on soft cards under
// "Yeni", the rest under "Önceki". A friend request is answered here, a table invite too (Reddet,
// Katıl, its minutes); an accepted request, a match and a friendship offer "Mesaj yaz". Opening
// the list marks it seen (account/notifications-seen); what was new stays under "Yeni" until the
// list closes.
export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const list = useNotifications();
  const items = list.data?.notifications;
  // What was new when the list opened, and what was there at all; the mark below would otherwise
  // move it on the next read. What comes in while the list is open is new too (audit VEN-19).
  const [opened, setOpened] = useState<{
    fresh: ReadonlySet<string>;
    known: ReadonlySet<string>;
  } | null>(null);
  if (items && opened === null) {
    setOpened({
      fresh: new Set(items.filter((n) => n.isNew).map(keyOf)),
      known: new Set(items.map(keyOf)),
    });
  }
  const newest = items?.[0]?.createdAt;
  useEffect(() => {
    if (!newest) return;
    void callAccount({ action: 'notifications-seen', seenAt: seenMark(newest, Date.now()) });
  }, [newest]);
  // The bell's count goes when the list closes.
  useEffect(
    () => () => void queryClient.invalidateQueries({ queryKey: friendKeys.notifications }),
    [queryClient],
  );

  if (list.isPending) {
    return (
      <RouteSheet title={tr.notifications.title} testID="notifications">
        <View className="items-center py-6">
          <Loader />
        </View>
      </RouteSheet>
    );
  }
  if (list.isError) {
    return (
      <RouteSheet title={tr.notifications.title} testID="notifications">
        <EmptyState
          kind="error"
          body={errorMessage(list.error)}
          action={{ label: tr.common.retry, onPress: () => void list.refetch() }}
        />
      </RouteSheet>
    );
  }
  if (!items || items.length === 0) {
    return (
      <RouteSheet title={tr.notifications.title} testID="notifications">
        <EmptyState kind="empty" title={tr.notifications.empty} body={tr.notifications.emptyHint} />
      </RouteSheet>
    );
  }
  const isFresh = (n: NotificationItem) =>
    opened ? opened.fresh.has(keyOf(n)) || !opened.known.has(keyOf(n)) : n.isNew;
  const newer = items.filter(isFresh);
  const older = items.filter((n) => !isFresh(n));
  return (
    <RouteSheet title={tr.notifications.title} testID="notifications">
      {newer.length > 0 ? (
        <View style={{ gap: KIT.size.rowGap }}>
          <T v="eyebrow">{tr.notifications.fresh}</T>
          {newer.map((n) => (
            <Row key={keyOf(n)} item={n} fresh />
          ))}
        </View>
      ) : null}
      {older.length > 0 ? (
        <View style={{ gap: KIT.size.rowGap }}>
          <T v="eyebrow">{tr.notifications.earlier}</T>
          <GlassList>
            {older.map((n) => (
              <Row key={keyOf(n)} item={n} />
            ))}
          </GlassList>
        </View>
      ) : null}
    </RouteSheet>
  );
}

function keyOf(n: NotificationItem): string {
  switch (n.kind) {
    case 'request':
      return `r:${n.requestId}`;
    case 'accepted':
      return `a:${n.requestId}`;
    case 'invite':
      return `i:${n.inviteId}`;
    case 'match':
      return `m:${n.publicId}:${n.createdAt}`;
  }
}

function Row({ item, fresh }: { item: NotificationItem; fresh?: boolean }) {
  const { c } = useKit();
  const now = useNow(item.kind === 'invite' ? 1000 : 30000);
  const queryClient = useQueryClient();
  const friends = useFriends();
  const checkIn = useActiveTable();
  const settle = () => void queryClient.invalidateQueries({ queryKey: friendKeys.all });

  const respond = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      friendsApi.respond(requestId, accept),
    onSuccess: (_data, { accept }) => {
      if (!accept) return;
      track('friend_request_accepted', {});
      track('friendship_created', { source: 'request' });
    },
    onError: (err, answer) => void askName(err, answer),
    onSettled: settle,
  });
  const run = useCallback(
    (a: { requestId: string; accept: boolean }) => respond.mutate(a),
    [respond],
  );
  const askName = useRetryAfterName(run);
  const answer = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ inviteId, accept }: { inviteId: string; accept: boolean }) =>
      roomsApi.answerInvite(inviteId, accept),
    onSettled: () => {
      settle();
      void queryClient.invalidateQueries({ queryKey: ['activeTable'] });
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    },
  });
  const message = (publicId: string, name: string | null) => {
    const f = friends.data?.find((x) => x.publicId === publicId);
    if (f?.threadId) openDm({ threadId: f.threadId, publicId, name: f.displayName ?? name });
    else void friends.refetch();
  };

  let name = item.displayName ?? '';
  let rest = '';
  let meta = tr.common.ago(item.createdAt, now);
  let faded = false;
  let actions: ReactNode = null;
  let note: ReactNode = null;
  switch (item.kind) {
    case 'request': {
      name =
        item.source === 'venue_chat'
          ? tr.participation.previewName(item.displayName ?? '', item.age)
          : (item.otherAlias ?? item.displayName ?? '');
      const accepted = item.state === 'accepted' || (respond.isSuccess && respond.variables.accept);
      if (accepted) {
        rest = tr.notifications.friendsNow;
        actions = item.publicId ? (
          <MessageButton onPress={() => message(item.publicId ?? '', item.displayName)} />
        ) : null;
      } else {
        rest = tr.notifications.requestRest;
        if (item.source === 'venue_chat' && item.venueName) {
          meta = [item.venueName, meta].join(` ${tr.common.separator} `);
        }
        actions = (
          <Pair
            left={
              <Btn
                sm
                block
                variant="glassy"
                style={{ flex: 1 }}
                label={tr.friends.decline}
                disabled={respond.isPending}
                onPress={() => respond.mutate({ requestId: item.requestId, accept: false })}
              />
            }
            right={
              <Btn
                sm
                block
                icon="check"
                style={{ flex: 1 }}
                testID="notification-accept"
                label={tr.friends.accept}
                loading={respond.isPending && respond.variables.accept}
                disabled={respond.isPending}
                onPress={() => respond.mutate({ requestId: item.requestId, accept: true })}
              />
            }
          />
        );
      }
      if (respond.isError) note = <Error error={respond.error} />;
      break;
    }
    case 'accepted':
      rest = tr.notifications.acceptedRest;
      meta = [tr.notifications.acceptedMeta, meta].join(` ${tr.common.separator} `);
      actions = <MessageButton onPress={() => message(item.publicId, item.displayName)} />;
      break;
    case 'match':
      rest = tr.notifications.matchRest;
      meta = [tr.notifications.matchMeta, meta].join(` ${tr.common.separator} `);
      actions = <MessageButton onPress={() => message(item.publicId, item.displayName)} />;
      break;
    case 'invite': {
      const state = answer.isSuccess
        ? answer.variables.accept
          ? 'joined'
          : 'declined'
        : inviteState(item.state, item.expiresAt, now);
      const table = item.tableName ?? '';
      if (state === 'open') {
        rest = tr.notifications.inviteRest;
        const seconds = Math.max(0, Math.ceil((Date.parse(item.expiresAt) - now) / 1000));
        meta = tr.notifications.inviteMeta(table, item.phones, tr.invite.clock(seconds));
        actions = (
          <Pair
            left={
              <Btn
                sm
                block
                variant="glassy"
                style={{ flex: 1 }}
                label={tr.friends.decline}
                disabled={answer.isPending}
                onPress={() => answer.mutate({ inviteId: item.inviteId, accept: false })}
              />
            }
            right={
              <Btn
                sm
                block
                icon="forward"
                style={{ flex: 1 }}
                testID="invite-join"
                label={tr.notifications.join}
                loading={answer.isPending && answer.variables.accept}
                disabled={answer.isPending || !checkIn.data}
                onPress={() => answer.mutate({ inviteId: item.inviteId, accept: true })}
              />
            }
          />
        );
      } else if (state === 'joined') {
        rest = tr.notifications.inviteRest;
        meta = '';
        note = (
          <T v="fine" strong color={KIT.success}>
            {tr.notifications.inviteJoined(table)}
          </T>
        );
      } else {
        rest = tr.notifications.invitePastRest;
        faded = true;
        meta = [
          state === 'declined' ? tr.notifications.inviteDeclined : tr.notifications.inviteGone,
          meta,
        ].join(` ${tr.common.separator} `);
      }
      if (answer.isError) note = <Error error={answer.error} />;
      break;
    }
  }

  const words = (
    <View style={{ flex: 1, gap: SPACING[0.5] }}>
      <T v="fine" ink>
        <T v="fine" strong>
          {name}
        </T>{' '}
        {rest}
      </T>
      {meta ? <T v="fine">{meta}</T> : null}
      {note}
    </View>
  );
  const face = <Av name={name} photoUrl={item.photoUrl} />;
  // docs/design/aura → Bildirimler: a new one as its own card (an invite on the brand's soft
  // gradient), the actions under it; an earlier one as a row of the list, its action at the right.
  if (!fresh) {
    return (
      <View testID={`notification-${item.kind}`} style={{ opacity: faded ? FADED : 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: KIT.size.liGap,
            paddingVertical: OLD_PAD_Y,
            paddingHorizontal: KIT.size.rowGap,
          }}
        >
          {face}
          {words}
          {actions}
        </View>
      </View>
    );
  }
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.liGap }}>
        {face}
        {words}
      </View>
      {actions}
    </>
  );
  return item.kind === 'invite' ? (
    <View
      testID={`notification-${item.kind}`}
      style={{
        ...gradientStyle(KIT.inviteGround),
        padding: FRESH_PAD,
        gap: KIT.size.rowGap,
        borderRadius: KIT.size.glassRadiusSm + 2,
        borderWidth: KIT.size.edge,
        borderColor: c.glassEdge,
        opacity: faded ? FADED : 1,
      }}
    >
      {body}
    </View>
  ) : (
    <Glass
      sm
      testID={`notification-${item.kind}`}
      style={{ padding: FRESH_PAD, gap: KIT.size.rowGap, opacity: faded ? FADED : 1 }}
    >
      {body}
    </Glass>
  );
}

const FADED = 0.6;
const FRESH_PAD = 14;
const OLD_PAD_Y = 10;

function Pair({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: KIT.size.chipsGap }}>
      {left}
      {right}
    </View>
  );
}

function MessageButton({ onPress }: { onPress: () => void }) {
  return (
    <Btn sm variant="glassy" icon="chat" label={tr.notifications.writeMessage} onPress={onPress} />
  );
}

function Error({ error }: { error: unknown }) {
  return (
    <T v="fine" color={KIT.danger}>
      {errorMessage(error)}
    </T>
  );
}
