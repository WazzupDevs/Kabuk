import type { NotificationItem } from '@shared/api/friends.ts';
import { upperTr } from '@shared/trText.ts';
import { inviteState, seenMark } from '@shared/notifications.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Av, Btn, Round, T, useKit } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { RouteSheet } from '@/components/RouteSheet';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { openDm } from '@/features/friends/openDm';
import {
  friendKeys,
  refreshFriends,
  useFriends,
  useNotifications,
} from '@/features/friends/queries';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { callAccount, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { FLAT } from '@/theme/flatLists';
import { firstRows, useOpenRows } from '@/lib/afterTransition';
import { Tap } from '@/motion';

// Bildirimler (docs/SPEC_V4.md §4.G; yeni arayüz tuvali: Bildirimler, BildirimlerBos,
// MasaDavetGeldi, MasaDavetSuresiDoldu): friends/notifications's rows as a flat list on the sheet,
// the new ones (after the list was last opened) under "YENİ" with a dot at their left, the rest
// under "ÖNCEKİ". A friend request is answered here, a table invite too (Reddet, Katıl, its
// minutes); an accepted request, a match and a friendship offer "Mesaj yaz". Opening the list
// "Bak" on a friend request opens Mesajlar → İstekler. The list is marked seen
// (account/notifications-seen: the newest row shown) when it closes or "Tümünü okundu say" is
// pressed; what was new stays under "YENİ" until then ("Tümünü okundu say" moves it under
// "ÖNCEKİ").
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
  const [allSeen, setAllSeen] = useState(false);
  if (items && opened === null) {
    setOpened({
      fresh: new Set(items.filter((n) => n.isNew).map(keyOf)),
      known: new Set(items.map(keyOf)),
    });
  }
  const newest = items?.[0]?.createdAt;
  // The mark goes when the list closes (the newest row it showed), or with the button below.
  const newestRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    newestRef.current = newest;
  }, [newest]);
  const markSeen = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (shownAt: string) =>
      callAccount({ action: 'notifications-seen', seenAt: seenMark(shownAt, Date.now()) }),
    onSuccess: () => {
      setAllSeen(true);
      void queryClient.invalidateQueries({ queryKey: friendKeys.notifications });
    },
  });
  // The bell's count goes when the list closes, after the mark.
  useEffect(
    () => () => {
      const shownAt = newestRef.current;
      const done = shownAt
        ? callAccount({
            action: 'notifications-seen',
            seenAt: seenMark(shownAt, Date.now()),
          }).catch(() => undefined)
        : Promise.resolve();
      void done.then(() => queryClient.invalidateQueries({ queryKey: friendKeys.notifications }));
    },
    [queryClient],
  );

  // Opened light: the first rows while the sheet comes up, the rest after.
  const shown = useOpenRows(items?.length ?? 0);
  // The new board's sheet: the surface, 20 from the sides, the title under the handle.
  const { c, scheme } = useKit();
  const sheet = {
    title: tr.notifications.title,
    // Bildirimler `.nh .title`: 21/27, 600.
    // One sheet title weight (700; the owner's call, 20 Kasım; the board's 600).
    titleType: 'pageBarTitle' as const,
    testID: 'notifications',
    peek: 'notifications' as const,
    look: {
      base: KIT.layer[scheme].sheet,
      padX: KIT.layer.size.sheetPadX,
      padBottom: FLAT.sheet.padBottom,
    },
  };
  if (list.isPending) {
    return (
      <RouteSheet {...sheet}>
        <EmptyState kind="loading" body={tr.common.loading} />
      </RouteSheet>
    );
  }
  if (list.isError) {
    return (
      <RouteSheet {...sheet}>
        <EmptyState
          kind="error"
          body={errorMessage(list.error)}
          error={list.error}
          action={{ label: tr.common.retry, onPress: () => void list.refetch() }}
        />
      </RouteSheet>
    );
  }
  if (!items || items.length === 0) {
    return (
      <RouteSheet {...sheet}>
        <View style={{ paddingTop: FLAT.sheetEmpty.top, paddingBottom: FLAT.sheetEmpty.bottom }}>
          <EmptyState
            kind="empty"
            riso="notifications"
            compact
            title={tr.notifications.empty}
            body={tr.notifications.emptyHint}
          />
        </View>
      </RouteSheet>
    );
  }
  const isFresh = (n: NotificationItem) =>
    !allSeen && (opened ? opened.fresh.has(keyOf(n)) || !opened.known.has(keyOf(n)) : n.isNew);
  const newer = items.filter(isFresh);
  const older = items.filter((n) => !isFresh(n));
  return (
    <RouteSheet {...sheet}>
      <View>
        {newer.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Label first>{tr.notifications.fresh}</Label>
              </View>
              <Tap
                testID="notifications-mark-seen"
                accessibilityRole="button"
                accessibilityLabel={tr.notifications.markAllSeen}
                hitSlop={KIT.size.chipGap}
                disabled={markSeen.isPending || !newest}
                onPress={() => newest && markSeen.mutate(newest)}
              >
                <T v="btnSm" color={c.link}>
                  {tr.notifications.markAllSeen}
                </T>
              </Tap>
            </View>
            {markSeen.isError ? <Error error={markSeen.error} /> : null}
            {newer.map((n) => (
              <Row key={keyOf(n)} item={n} fresh />
            ))}
          </>
        ) : null}
        {older.length > 0 ? (
          <>
            {newer.length > 0 ? <Label>{tr.notifications.earlier}</Label> : null}
            {firstRows(older, shown).map((n) => (
              <Row key={keyOf(n)} item={n} />
            ))}
          </>
        ) : null}
      </View>
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
  const R = FLAT.sheet;
  const now = useNow(item.kind === 'invite' ? 1000 : 30000);
  const queryClient = useQueryClient();
  const friends = useFriends();
  const checkIn = useActiveTable();
  const settle = () => void refreshFriends(queryClient, 'friendship');

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
  let line = '';
  // An invite: the table and its phones, then its minutes or its state.
  let tableLine = '';
  let status = '';
  let live = false;
  let time = tr.common.ago(item.createdAt, now);
  let actions: ReactNode = null;
  let error: unknown = null;
  switch (item.kind) {
    case 'request': {
      name =
        item.source === 'venue_chat'
          ? tr.participation.previewName(item.displayName ?? '', item.age)
          : (item.otherAlias ?? item.displayName ?? '');
      if (item.state === 'accepted') {
        line = tr.notifications.line.friends;
        actions = item.publicId ? (
          <MessageRound onPress={() => message(item.publicId ?? '', item.displayName)} />
        ) : null;
      } else {
        line = tr.notifications.line.request;
        actions = (
          <Btn
            sm
            testID="notification-look"
            label={tr.notifications.look}
            onPress={() => router.navigate({ pathname: '/messages', params: { tab: 'requests' } })}
          />
        );
      }
      break;
    }
    case 'accepted':
      line = tr.notifications.line.accepted;
      actions = <MessageRound onPress={() => message(item.publicId, item.displayName)} />;
      break;
    case 'match':
      line = tr.notifications.line.match;
      actions = <MessageRound onPress={() => message(item.publicId, item.displayName)} />;
      break;
    case 'invite': {
      line = tr.notifications.line.invite;
      tableLine = tr.notifications.inviteTable(item.tableName ?? '', item.phones);
      time = '';
      const state = answer.isSuccess
        ? answer.variables.accept
          ? 'joined'
          : 'declined'
        : inviteState(item.state, item.expiresAt, now);
      if (state === 'open') {
        const seconds = Math.max(0, Math.ceil((Date.parse(item.expiresAt) - now) / 1000));
        status = tr.notifications.short.invite(tr.invite.clock(seconds));
        live = true;
        actions = (
          <>
            <Round
              icon="close"
              label={tr.friends.decline}
              disabled={answer.isPending}
              onPress={() => answer.mutate({ inviteId: item.inviteId, accept: false })}
            />
            <Btn
              sm
              testID="invite-join"
              label={tr.notifications.join}
              loading={answer.isPending && answer.variables.accept}
              disabled={answer.isPending || !checkIn.data}
              onPress={() => answer.mutate({ inviteId: item.inviteId, accept: true })}
            />
          </>
        );
      } else {
        status =
          state === 'joined'
            ? tr.notifications.short.joined
            : state === 'declined'
              ? tr.notifications.short.declined
              : tr.notifications.short.gone;
      }
      if (answer.isError) error = answer.error;
      break;
    }
  }

  // The face, then the name in bold with what happened as one sentence ("Furkan isteğini kabul
  // etti"; it wraps, never cut), its date under it (an invite's table, then its minutes or its
  // state), the answers at the right. A new one: a pink dot 12 left of the row.
  return (
    <View
      testID={`notification-${item.kind}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: R.rowGap,
        paddingVertical: R.rowPadY,
      }}
    >
      {fresh ? (
        <View
          style={{
            position: 'absolute',
            left: -FLAT.dot.out,
            width: FLAT.dot.side,
            height: FLAT.dot.side,
            borderRadius: FLAT.dot.side / 2,
            backgroundColor: KIT.pink,
          }}
        />
      ) : null}
      <Av size="md" name={name} photoUrl={item.photoUrl} />
      <View style={{ flex: 1, minWidth: 0, gap: R.lineGap }}>
        <T v="body">
          <T v="body" strong ink>
            {name}
          </T>
          {` ${line}`}
        </T>
        {tableLine ? <T v="fine">{tableLine}</T> : null}
        {time ? (
          <T v="fine" tabular strong={fresh} color={fresh ? c.link : undefined}>
            {time}
          </T>
        ) : null}
        {status ? (
          <T v="fine" tabular strong={live} color={live ? c.link : undefined}>
            {status}
          </T>
        ) : null}
        {error ? <Error error={error} /> : null}
      </View>
      {actions ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.chipsGap }}>
          {actions}
        </View>
      ) : null}
    </View>
  );
}

// YENİ and ÖNCEKİ (`.sl`): small, the muted ink, 18 over and 4 under (the first 0 over).
function Label({ children, first }: { children: string; first?: boolean }) {
  const R = FLAT.sheet;
  return (
    <View style={{ marginTop: first ? 0 : R.labelTop, marginBottom: R.labelBottom }}>
      <T v="eyebrow" accessibilityRole="header">
        {upperTr(children)}
      </T>
    </View>
  );
}

// The soft round with the speech bubble in the green (`.sm2`).
function MessageRound({ onPress }: { onPress: () => void }) {
  const { c } = useKit();
  return (
    <Round icon="chat" color={c.link} label={tr.notifications.writeMessage} onPress={onPress} />
  );
}

function Error({ error }: { error: unknown }) {
  return (
    <T v="fine" color={KIT.danger}>
      {errorMessage(error)}
    </T>
  );
}
