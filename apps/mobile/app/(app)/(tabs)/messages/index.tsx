import { inboxStamp } from '@shared/dmInbox.ts';
import type { DmInboxThread } from '@shared/api/friends.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ListCard } from '@/components/ListCard';
import { DeliveryTicks } from '@/components/ChatBubble';
import { EmptyState } from '@/components/EmptyState';
import { useLoaderHold } from '@/components/Loader';
import { Rise } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { TypingDots } from '@/components/TypingDots';
import { openDm } from '@/features/friends/openDm';
import { useDmInbox, useRequestCount } from '@/features/friends/queries';
import { RequestList } from '@/features/friends/RequestList';
import { useDmTyping } from '@/features/friends/useDmTyping';
import { NotificationsBell } from '@/features/notifications/Bell';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { rowPress } from '@/theme/rowPress';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type Tab = 'chats' | 'requests';

// Mesajlar (docs/SPEC_V3.md §18.3; docs/SPEC_V4.md §4.C, v45: .msgs): "Sohbet" lists every friend,
// newest conversation first, from dm/inbox (the function signs the photos); a friend without
// messages shows "Henüz mesaj yok" and a row opens the DM. "İstekler" lists the open friend
// requests waiting for the caller (RequestList). The bell stays where it is until step 4.7.
export default function MessagesScreen() {
  const [tab, setTab] = useState<Tab>('chats');
  const requests = useRequestCount();
  const now = useNow(60_000);

  return (
    <Screen edges={['top']} refreshable>
      <ScreenHeader title={tr.tabs.messages} trailing={<NotificationsBell />} />
      <View className="mt-3">
        <Segmented<Tab>
          fill
          value={tab}
          onChange={setTab}
          accessibilityLabel={tr.messages.tabs}
          options={[
            { value: 'chats', label: tr.messages.chats, testID: 'messages-tab-chats' },
            {
              value: 'requests',
              label: tr.messages.requests(requests),
              testID: 'messages-tab-requests',
            },
          ]}
        />
      </View>
      {tab === 'chats' ? <Chats now={new Date(now)} /> : <RequestList now={new Date(now)} />}
    </Screen>
  );
}

function Chats({ now }: { now: Date }) {
  const inbox = useDmInbox();
  const loading = useLoaderHold(inbox.isPending);

  if (inbox.isPending || loading) {
    return (
      <View className="mt-12">
        <EmptyState kind="loading" body={tr.common.loading} />
      </View>
    );
  }
  if (inbox.isError) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        body={errorMessage(inbox.error)}
        action={{
          label: tr.common.retry,
          onPress: () => void inbox.refetch(),
          loading: inbox.isRefetching,
        }}
      />
    );
  }
  if (inbox.data.length === 0) {
    return (
      <View className="flex-1 justify-center">
        <EmptyState kind="empty" title={tr.messages.empty} body={tr.messages.emptyHint} />
      </View>
    );
  }
  return (
    <View className="mt-3">
      <ListCard>
        {inbox.data.map((t, i) => (
          <Rise key={t.publicId} index={i}>
            <InboxRow thread={t} now={now} listen={i < TYPING_ROWS} />
          </Rise>
        ))}
      </ListCard>
    </View>
  );
}

// Rows past this many don't listen for "yazıyor": a Realtime connection carries a limited number
// of channels, and the rows further down are off screen.
const TYPING_ROWS = 30;

// A conversation (v45: .crow): the photo, the name and the time on top, the last message or
// "yazıyor" below. Unread: the name bolder, the time, the line and the counter in the accent.
function InboxRow({
  thread: t,
  now,
  listen,
}: {
  thread: DmInboxThread;
  now: Date;
  listen: boolean;
}) {
  const theme = useTheme();
  const name = t.displayName ?? tr.profile.noName;
  const unread = t.unreadCount > 0;
  const threadId = t.threadId;
  const preview = <Preview thread={t} unread={unread} />;
  return (
    <Pressable
      testID={`inbox-${name}`}
      accessibilityRole="button"
      accessibilityLabel={tr.messages.row(name, t.lastBody ?? tr.messages.noMessage, t.unreadCount)}
      disabled={!threadId}
      onPress={
        threadId ? () => openDm({ threadId, publicId: t.publicId, name: t.displayName }) : undefined
      }
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center"
          // skall tuvali (Mesajlar): a row of the list card; the name, the last line (ink and bold
          // while unread), and the time over the unread count on the right.
          style={{
            gap: SPACING[3] + SPACING[0.5],
            minHeight: SPACING[16] + SPACING[2],
            paddingVertical: SPACING[3],
            ...rowPress(theme, pressed),
          }}
        >
          <Avatar kind="profile" size="xl" name={name} photoUrl={t.photoUrl} />
          <View className="flex-1" style={{ gap: SPACING[0.5] }}>
            <Text variant="heading">{name}</Text>
            <View className="flex-row items-center gap-2">
              {threadId && listen ? (
                <TypingOr threadId={threadId} lastMessageAt={t.lastMessageAt}>
                  {preview}
                </TypingOr>
              ) : (
                preview
              )}
            </View>
          </View>
          <View className="items-end" style={{ gap: SPACING[1.5] }}>
            {t.lastMessageAt ? (
              <Text variant="fine">
                {tr.messages.stamp(t.lastMessageAt, inboxStamp(t.lastMessageAt, now))}
              </Text>
            ) : null}
            {unread ? <UnreadCount count={t.unreadCount} /> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// The last message: the ticks on the own one, in the accent when unread.
function Preview({ thread: t, unread }: { thread: DmInboxThread; unread: boolean }) {
  return (
    <View className="flex-1 flex-row items-center gap-1">
      {t.lastFromMe && t.lastStatus ? <DeliveryTicks delivery={t.lastStatus} /> : null}
      <Text
        variant={unread ? 'label' : 'fine'}
        tone={unread ? 'text' : 'muted'}
        numberOfLines={1}
        className="flex-1"
      >
        {t.lastBody ?? tr.messages.noMessage}
      </Text>
    </View>
  );
}

// "yazıyor" and the dots in place of the last message while the friend types (dm_typing, as in the
// DM).
function TypingOr({
  threadId,
  lastMessageAt,
  children,
}: {
  threadId: string;
  lastMessageAt: string | null;
  children: ReactNode;
}) {
  const { typing, clearTyping } = useDmTyping(threadId);
  // A new message arrived: the dots go at once.
  const seen = useRef(lastMessageAt);
  useEffect(() => {
    if (lastMessageAt === seen.current) return;
    seen.current = lastMessageAt;
    clearTyping();
  }, [lastMessageAt, clearTyping]);
  if (!typing) return children;
  return (
    <View className="flex-1 flex-row items-center" testID="inbox-typing">
      <Text variant="label" tone="accent">
        {tr.messages.typing}
      </Text>
      <TypingDots />
    </View>
  );
}

function UnreadCount({ count }: { count: number }) {
  const { colors, shape } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={tr.messages.unread(count)}
      className="items-center justify-center"
      style={{
        minWidth: SPACING[5] + SPACING[0.5],
        height: SPACING[5] + SPACING[0.5],
        paddingHorizontal: SPACING[1.5],
        borderRadius: shape.radius.pill,
        backgroundColor: colors.primary,
      }}
    >
      <Text variant="caption" tone="onPrimary">
        {String(count)}
      </Text>
    </View>
  );
}
