import type { NotificationItem } from '@shared/api/friends.ts';
import { inviteState, seenMark } from '@shared/notifications.ts';
import { TABLE_ICONS } from '@shared/tableIcons.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Av, Glass, GlassList, Round, T, Thumb, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { RouteSheet } from '@/components/RouteSheet';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { openDm } from '@/features/friends/openDm';
import { friendKeys, useFriends, useNotifications } from '@/features/friends/queries';
import { useRetryAfterName } from '@/features/friends/useRetryAfterName';
import { roomKeys } from '@/features/rooms/queries';
import { TABLE_ICON_IMAGES } from '@/features/rooms/tableIconImages';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { callAccount, friendsApi, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { SPACING } from '@/theme/tokens';
import { firstRows, useOpenRows } from '@/lib/afterTransition';

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

  // Opened light: the first rows while the sheet comes up, the rest after.
  const shown = useOpenRows(items?.length ?? 0);
  if (list.isPending) {
    return (
      <RouteSheet title={tr.notifications.title} testID="notifications" peek="notifications">
        <View className="items-center py-6">
          <Loader />
        </View>
      </RouteSheet>
    );
  }
  if (list.isError) {
    return (
      <RouteSheet title={tr.notifications.title} testID="notifications" peek="notifications">
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
      <RouteSheet title={tr.notifications.title} testID="notifications" peek="notifications">
        <EmptyState kind="empty" title={tr.notifications.empty} body={tr.notifications.emptyHint} />
      </RouteSheet>
    );
  }
  const isFresh = (n: NotificationItem) =>
    opened ? opened.fresh.has(keyOf(n)) || !opened.known.has(keyOf(n)) : n.isNew;
  const newer = items.filter(isFresh);
  const older = items.filter((n) => !isFresh(n));
  return (
    <RouteSheet title={tr.notifications.title} testID="notifications" peek="notifications">
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
            {firstRows(older, shown).map((n) => (
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
  let status = '';
  let time = tr.common.ago(item.createdAt, now);
  let faded = false;
  let joined = false;
  let actions: ReactNode = null;
  let error: unknown = null;
  switch (item.kind) {
    case 'request': {
      name =
        item.source === 'venue_chat'
          ? tr.participation.previewName(item.displayName ?? '', item.age)
          : (item.otherAlias ?? item.displayName ?? '');
      const accepted = item.state === 'accepted' || (respond.isSuccess && respond.variables.accept);
      if (accepted) {
        status = tr.notifications.short.friends;
        actions = item.publicId ? (
          <MessageRound onPress={() => message(item.publicId ?? '', item.displayName)} />
        ) : null;
      } else {
        status = tr.notifications.short.request;
        actions = (
          <>
            <Round
              icon="close"
              label={tr.friends.decline}
              disabled={respond.isPending}
              onPress={() => respond.mutate({ requestId: item.requestId, accept: false })}
            />
            <Round
              primary
              icon="check"
              testID="notification-accept"
              label={tr.friends.accept}
              loading={respond.isPending && respond.variables.accept}
              disabled={respond.isPending}
              onPress={() => respond.mutate({ requestId: item.requestId, accept: true })}
            />
          </>
        );
      }
      if (respond.isError) error = respond.error;
      break;
    }
    case 'accepted':
      status = tr.notifications.short.accepted;
      actions = <MessageRound onPress={() => message(item.publicId, item.displayName)} />;
      break;
    case 'match':
      status = tr.notifications.short.match;
      actions = <MessageRound onPress={() => message(item.publicId, item.displayName)} />;
      break;
    case 'invite': {
      const state = answer.isSuccess
        ? answer.variables.accept
          ? 'joined'
          : 'declined'
        : inviteState(item.state, item.expiresAt, now);
      if (state === 'open') {
        const seconds = Math.max(0, Math.ceil((Date.parse(item.expiresAt) - now) / 1000));
        status = tr.notifications.short.invite(tr.invite.clock(seconds));
        time = '';
        actions = (
          <>
            <Round
              icon="close"
              label={tr.friends.decline}
              disabled={answer.isPending}
              onPress={() => answer.mutate({ inviteId: item.inviteId, accept: false })}
            />
            <Round
              primary
              icon="forward"
              testID="invite-join"
              label={tr.notifications.join}
              loading={answer.isPending && answer.variables.accept}
              disabled={answer.isPending || !checkIn.data}
              onPress={() => answer.mutate({ inviteId: item.inviteId, accept: true })}
            />
          </>
        );
      } else if (state === 'joined') {
        status = tr.notifications.short.joined;
        joined = true;
        time = '';
      } else {
        status =
          state === 'declined' ? tr.notifications.short.declined : tr.notifications.short.gone;
        faded = true;
      }
      if (answer.isError) error = answer.error;
      break;
    }
  }

  // docs/design/aura → Bildirimler, kept short (the owner's call, 28 Ekim): the face, the name
  // and one line of state on a row of one height, the answers as round buttons at the right.
  const words = (
    <View style={{ flex: 1, gap: SPACING[0.5] }}>
      <T v="fine" strong lines={1} fit>
        {name}
      </T>
      <T v="fine" lines={1} fit color={joined ? KIT.success : undefined}>
        {time ? [status, time].join(` ${tr.common.separator} `) : status}
      </T>
      {error ? <Error error={error} /> : null}
    </View>
  );
  // An invite shows the table's picture with the inviter's face on its corner (Bildirimler).
  const tableIcon =
    item.kind === 'invite'
      ? TABLE_ICONS.find((i) => (item.tableName ?? '').startsWith(i.name))?.id
      : undefined;
  const tablePicture = tableIcon ? TABLE_ICON_IMAGES[tableIcon] : undefined;
  const face = tablePicture ? (
    <View>
      <Thumb source={tablePicture} size={INVITE_THUMB} radius={INVITE_RADIUS} />
      <View style={{ position: 'absolute', right: -INVITE_BADGE_OUT, bottom: -INVITE_BADGE_OUT }}>
        <Av size="sm" name={name} photoUrl={item.photoUrl} />
      </View>
    </View>
  ) : (
    <Av name={name} photoUrl={item.photoUrl} />
  );
  const row = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: KIT.size.liGap,
        minHeight: ROW_HEIGHT,
      }}
    >
      {face}
      {words}
      {actions ? (
        <View style={{ flexDirection: 'row', gap: KIT.size.chipsGap }}>{actions}</View>
      ) : null}
    </View>
  );
  // A new one as its own card (an invite on the brand's soft gradient), an earlier one as a row
  // of the list.
  if (!fresh) {
    return (
      <View
        testID={`notification-${item.kind}`}
        style={{
          opacity: faded ? FADED : 1,
          paddingVertical: OLD_PAD_Y,
          paddingHorizontal: KIT.size.rowGap,
        }}
      >
        {row}
      </View>
    );
  }
  return item.kind === 'invite' ? (
    <View
      testID={`notification-${item.kind}`}
      style={{
        ...gradientStyle(KIT.inviteGround),
        padding: FRESH_PAD,
        borderRadius: KIT.size.glassRadiusSm + 2,
        borderWidth: KIT.size.edge,
        borderColor: c.glassEdge,
        opacity: faded ? FADED : 1,
      }}
    >
      {row}
    </View>
  ) : (
    <Glass
      sm
      testID={`notification-${item.kind}`}
      style={{ padding: FRESH_PAD, opacity: faded ? FADED : 1 }}
    >
      {row}
    </Glass>
  );
}

const FADED = 0.6;
const INVITE_THUMB = 48;
// Every row one height: the face's.
const ROW_HEIGHT = 52;
const INVITE_RADIUS = 16;
const INVITE_BADGE_OUT = 8;
const FRESH_PAD = 14;
const OLD_PAD_Y = 10;

function MessageRound({ onPress }: { onPress: () => void }) {
  return <Round icon="chat" label={tr.notifications.writeMessage} onPress={onPress} />;
}

function Error({ error }: { error: unknown }) {
  return (
    <T v="fine" color={KIT.danger}>
      {errorMessage(error)}
    </T>
  );
}
