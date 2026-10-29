import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { DM_MAX_LENGTH, prepareDm } from '@shared/friends.ts';
import { canRetry, type OutboxMessage, outboxReducer } from '@shared/chatOutbox.ts';
import { toRuns } from '@shared/chatRuns.ts';
import type { DmPageRow } from '@shared/dmInbox.ts';
import { parseDmReactions, parseQuote } from '@shared/messageExtras.ts';
import { BROADCAST, dmChannel } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert, BackHandler, View } from 'react-native';

import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { ChatBubble, type ChatQuote, type Delivery, TypingBubble } from '@/components/ChatBubble';
import { type ChatListItem, ChatRow, ChatScreen, DayLine, dayLabel } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { DraftComposer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { IconButton, MoreDots } from '@/components/IconButton';
import { Menu, MenuItem } from '@/components/Menu';
import { Loader } from '@/components/Loader';
import { Sheet } from '@/components/Sheet';
import { useHideTabBar } from '@/components/TabBar';
import { quoteJump, toChatQuote, useReplyTarget } from '@/features/chat/messageExtras';
import { ReportModal } from '@/features/chat/ReportModal';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import {
  friendKeys,
  refreshDm,
  useDmMessages,
  useDmReactions,
  useFriends,
  useMarkThreadRead,
  useSendDm,
} from '@/features/friends/queries';
import { useDmTyping } from '@/features/friends/useDmTyping';
import { useBroadcast } from '@/features/rooms/useBroadcast';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, friendsApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useSeen } from '@/lib/useSeen';
import { SPACING } from '@/theme/tokens';
import { useAfterTransition } from '@/lib/afterTransition';

type Params = { threadId: string; publicId: string; name: string };

const isDelivery = (status: string | null): status is Delivery =>
  status === 'sent' || status === 'delivered' || status === 'read';

let nextLocalId = 0;

// A row of the stream: a message from the page, or one of the reader's on its way. `key` stays the
// same from the bubble's first draw: a message sent from here keeps its waiting bubble's key when
// the server's copy takes its place, so only its mark changes (Telegram Android).
type Row = ChatListItem & {
  m?: DmPageRow;
  out?: OutboxMessage;
  // The quote of a message on its way.
  outQuote?: ChatQuote;
  first: boolean;
  day: number | null;
};

type Pages = readonly (readonly DmPageRow[])[];

// A DM thread with a friend (docs/SPEC_V2.md §6.4). The dm: channel carries no data; the page is
// reread through dm_messages_page (`from_me`, never the sender's account id). Read state stays
// with the reader. The friend's photo comes from the friends list (its signed URL expires, so it
// never travels in the route). No tab bar here: the message bar sits at the bottom.
// v3 step 6 (docs/SPEC_V3.md §18.3): ticks on the own messages from their status (dm_status asks
// for a reread), a message on its way shows at once with the waiting state, and "yazıyor"
// (dm_typing) shows the other side's dots.
// Back from a conversation is Mesajlar (skall tuvali, Dm): opened from another tab, the bell or a
// profile, the conversation was the Mesajlar stack's only screen and a plain back left the tab, so
// the other conversations could not be seen.
function backToInbox(): void {
  router.dismissTo('/messages');
}

export default function DmScreen() {
  const { threadId, publicId, name } = useLocalSearchParams<Params>();
  useHideTabBar();
  const queryClient = useQueryClient();
  const friend = useFriends().data?.find((f) => f.publicId === publicId);
  const photoUrl = friend?.photoUrl ?? null;
  const messages = useDmMessages(threadId);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<'remove' | 'block' | null>(null);
  const [reporting, setReporting] = useState(false);
  const [outbox, dispatch] = useReducer(outboxReducer, []);
  const { typing, notifyTyping, clearTyping } = useDmTyping(threadId);

  const markRead = useMarkThreadRead(threadId);
  // Opening the DM marks it read once it has slid in (the owner's report, 29 Ekim: marking it on
  // the tap changed the Mesajlar list and its count under the slide); the row is under the DM by
  // then. Later, while it is seen, at once.
  const settled = useAfterTransition();
  const readWhenSettled = useRef(false);
  const markSeen = useCallback(() => {
    if (settled) markRead();
    else readWhenSettled.current = true;
  }, [settled, markRead]);
  useEffect(() => {
    if (!settled || !readWhenSettled.current) return;
    readWhenSettled.current = false;
    markRead();
  }, [settled, markRead]);
  // Read only while seen: what arrives behind the home screen stays unread until the DM is seen
  // again (audit CHAT-2). Being seen, the first time and every time after, marks it read.
  const seen = useSeen(markSeen);
  const sendDm = useSendDm(threadId);
  // docs/SPEC_V3.md §21: swipe a message to answer it, long press it for a reaction.
  const reply = useReplyTarget();
  const reactions = useDmReactions(threadId);
  // Each broadcast reads only the newest page and puts it in place (refreshDm); a reaction, which
  // may be on an older message, the pages loaded.
  const onMessage = useCallback(() => {
    void refreshDm(queryClient, threadId);
    if (seen()) markRead();
  }, [queryClient, threadId, markRead, seen]);
  useBroadcast(dmChannel(threadId), BROADCAST.dmMessage, onMessage);
  // A tick moved (delivered or read).
  const onStatus = useCallback(
    () => void refreshDm(queryClient, threadId),
    [queryClient, threadId],
  );
  useBroadcast(dmChannel(threadId), BROADCAST.dmStatus, onStatus);
  const onReaction = useCallback(
    () => void refreshDm(queryClient, threadId, 'all'),
    [queryClient, threadId],
  );
  useBroadcast(dmChannel(threadId), BROADCAST.dmReaction, onReaction);

  // While the DM slides in it shows what it opened with; what changed meanwhile comes once it is
  // in (Telegram Android holds a chat's updates during its opening animation).
  const livePages = messages.data?.pages;
  const [heldPages, setHeldPages] = useState<Pages | undefined>(livePages);
  if (!settled && heldPages === undefined && livePages !== undefined) setHeldPages(livePages);
  const pages: Pages | undefined = settled ? livePages : (heldPages ?? livePages);
  const server = useMemo(() => (pages ?? []).flat(), [pages]);

  // The reader's messages sent from here: the server's id to the waiting bubble's key.
  const [sentKeys, setSentKeys] = useState<ReadonlyMap<string, string>>(() => new Map());

  // The other side's newest message: when it changes, their typing dots go.
  const newestFromThem = server.find((m) => !m.from_me)?.id;
  const seenFromThem = useRef(newestFromThem);
  useEffect(() => {
    if (newestFromThem === seenFromThem.current) return;
    seenFromThem.current = newestFromThem;
    clearTyping();
  }, [newestFromThem, clearTyping]);

  // Sending is optimistic, as in the room chat (@shared/chatOutbox.ts): the message shows at once
  // with the waiting state and is replaced by the server's copy on the reply, with the sent tick.
  // The answered message from the loaded page, for the quote shown at once.
  const replyOf = (id: string | undefined) => {
    if (!id) return undefined;
    const m = server.find((x) => x.id === id);
    return m ? { id, body: m.body, fromMe: m.from_me } : { id, body: '', fromMe: false };
  };
  const deliver = (localId: string, text: string, replyTo?: string) => {
    sendDm(text, replyOf(replyTo))
      .then((id) => {
        track('dm_sent', {});
        // The server's copy takes the waiting bubble's place (and key); the waiting one goes once
        // the copy is on the page.
        if (id) setSentKeys((keys) => new Map(keys).set(id, localId));
        else dispatch({ type: 'sent', localId });
      })
      .catch((err: unknown) =>
        dispatch({ type: 'failed', localId, errorCode: err instanceof ApiError ? err.code : null }),
      );
  };
  const submit = (body: string, clear: () => void) => {
    nextLocalId += 1;
    const localId = `dm-${nextLocalId}`;
    const replyTo = reply.target?.id;
    dispatch({
      type: 'send',
      localId,
      body,
      at: new Date().toISOString(),
      ...(replyTo ? { replyTo } : {}),
    });
    clear();
    reply.clear();
    deliver(localId, body, replyTo);
  };
  const retry = (m: OutboxMessage) => {
    dispatch({ type: 'retry', localId: m.localId });
    deliver(m.localId, m.body, m.replyTo);
  };

  // The same function for every row (a new one would draw every bubble again): it calls the
  // newest retry.
  const retryNow = useRef(retry);
  useEffect(() => {
    retryNow.current = retry;
  });
  const onRetry = useCallback((m: OutboxMessage) => retryNow.current(m), []);
  const onChangeDraft = (text: string) => {
    if (text.trim()) notifyTyping();
  };

  const leave = () => {
    void queryClient.invalidateQueries({ queryKey: friendKeys.all });
    backToInbox();
  };
  // Android's back key too (a sheet or the reaction bar, when open, takes it first).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        backToInbox();
        return true;
      });
      return () => sub.remove();
    }, []),
  );
  const end = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ kind, reason }: { kind: 'remove' | 'block'; reason?: ReportReason }) =>
      kind === 'remove'
        ? friendsApi.remove(publicId, reason)
        : safetyApi.blockFriend(publicId, reason),
    onSuccess: (_data, { kind, reason }) => {
      if (kind === 'block') track('block_created', {});
      if (reason) track('report_submitted', {});
      setConfirm(null);
      leave();
    },
  });
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (reason: ReportReason) => safetyApi.reportDm(threadId, reason),
    onSuccess: () => {
      track('report_submitted', {});
      setReporting(false);
      Alert.alert(tr.safety.reportSent);
    },
  });

  // The waiting bubbles whose server copy is on the page leave the outbox (they were drawn as the
  // copy already).
  const sentLocal = useMemo(
    () => new Map([...sentKeys].map(([id, local]) => [local, id])),
    [sentKeys],
  );
  useEffect(() => {
    const onPage = new Set(server.map((m) => m.id));
    for (const [local, id] of sentLocal) {
      if (onPage.has(id) && outbox.some((o) => o.localId === local)) {
        dispatch({ type: 'sent', localId: local });
      }
    }
  }, [server, sentLocal, outbox]);

  // Newest first (the stream is drawn from the bottom up), runs and day lines worked out oldest
  // first.
  const rows = useMemo(() => {
    const onPage = new Set(server.map((m) => m.id));
    // The answered message from the loaded page, for the quote of a message on its way.
    const quoteOf = (id: string) => {
      const q = server.find((x) => x.id === id);
      return toChatQuote(
        { gone: false, id, body: q?.body ?? '', fromMe: q?.from_me ?? false, name: null },
        name,
      );
    };
    const waiting = outbox.filter((o) => {
      const id = sentLocal.get(o.localId);
      return !(id && onPage.has(id));
    });
    type Entry = {
      key: string;
      id: string;
      mine: boolean;
      at: string;
      m?: DmPageRow;
      out?: OutboxMessage;
    };
    const oldestFirst: Entry[] = [
      ...[...server].reverse().map((m) => ({
        key: sentKeys.get(m.id) ?? m.id,
        id: m.id,
        mine: m.from_me,
        at: m.created_at,
        m,
      })),
      ...waiting.map((o) => ({
        key: o.localId,
        id: o.localId,
        mine: true,
        at: o.at ?? new Date().toISOString(),
        out: o,
      })),
    ];
    return toRuns(
      oldestFirst,
      (e) => (e.mine ? 'me' : 'them'),
      (e) => e.at,
    )
      .map(({ item, first, day }): Row => ({
        key: item.key,
        id: item.id,
        ...(item.m ? { m: item.m } : {}),
        ...(item.out ? { out: item.out } : {}),
        ...(item.out?.replyTo ? { outQuote: quoteOf(item.out.replyTo) } : {}),
        first,
        day: day ? day.getTime() : null,
      }))
      .reverse();
  }, [server, outbox, sentKeys, sentLocal, name]);

  // From the DM: removing or blocking there goes back to Mesajlar, not to this DM (audit CHAT-6).
  const openProfile = () =>
    router.push({ pathname: '/people/[publicId]', params: { publicId, from: 'dm' } });
  // The newest message, for following it: the reader's own goes to the end.
  const newest = rows[0];
  const newestMine = newest ? (newest.out ? true : newest.m?.from_me) : undefined;
  const setReply = reply.setTarget;
  const onReply = useCallback(
    (m: DmPageRow) =>
      setReply({ id: m.id, quote: { name: m.from_me ? tr.chat.you : name, text: m.body } }),
    [setReply, name],
  );
  const onDiscard = useCallback(
    (m: OutboxMessage) => dispatch({ type: 'remove', localId: m.localId }),
    [],
  );
  const renderRow = (row: Row) => (
    <DmRow
      rowKey={row.key}
      m={row.m}
      out={row.out}
      outQuote={row.outQuote}
      first={row.first}
      day={row.day}
      name={name}
      view={reactions.view}
      pick={reactions.pick}
      onReply={onReply}
      onRetry={onRetry}
      onDiscard={onDiscard}
    />
  );
  const loadOlder = () => {
    if (messages.hasNextPage && !messages.isFetchingNextPage && !messages.isFetchNextPageError) {
      void messages.fetchNextPage();
    }
  };
  return (
    <ChatScreen
      startAtEnd
      hidesTabBar
      newestKey={newest?.key}
      newestMine={newestMine}
      list={{
        items: rows,
        renderItem: renderRow,
        onReachOld: loadOlder,
        latest: typing ? <TypingBubble testID="dm-typing" /> : null,
        older: messages.isFetchingNextPage ? (
          <View className="items-center" style={{ paddingVertical: SPACING[2] }}>
            <Loader size={SPACING[8]} />
          </View>
        ) : messages.isFetchNextPageError ? (
          <View className="items-center" style={{ paddingVertical: SPACING[2] }}>
            <Button
              size="sm"
              variant="neutral"
              label={tr.common.retry}
              onPress={() => void messages.fetchNextPage()}
            />
          </View>
        ) : null,
        // Loading and its error (audit CHAT-8): the DM is never shown empty while it loads or
        // when it could not be read.
        empty: messages.isPending ? (
          <View className="flex-1 items-center justify-center">
            <Loader />
          </View>
        ) : messages.isError ? (
          <View className="flex-1 justify-center">
            <EmptyState
              kind="error"
              body={errorMessage(messages.error)}
              action={{ label: tr.common.retry, onPress: () => void messages.refetch() }}
            />
          </View>
        ) : (
          <View className="flex-1 justify-center">
            <EmptyState kind="empty" body={tr.friends.noMessagesYet} />
          </View>
        ),
      }}
      top={
        <ChatTopBar
          onBack={backToInbox}
          split
          title={name}
          leading={<Avatar kind="profile" name={name} size="lg" photoUrl={photoUrl} />}
          onPressTitle={openProfile}
          titleAccessibilityLabel={name}
          actions={
            <IconButton
              icon="ellipsis-horizontal"
              glyph={<MoreDots />}
              label={tr.friends.more}
              onPress={() => setMenu(true)}
            />
          }
        />
      }
      composer={
        <DraftComposer
          inputTestID="dm-input"
          sendTestID="dm-send"
          sendLabel={tr.dm.send}
          placeholder={tr.dm.placeholder}
          prepare={prepareDm}
          onDraftChange={onChangeDraft}
          maxLength={DM_MAX_LENGTH}
          onSend={submit}
          replyTo={reply.target?.quote}
          onCancelReply={reply.clear}
        />
      }
    >
      <Sheet visible={menu} onClose={() => setMenu(false)} title={tr.friends.friendMenuTitle}>
        <Menu>
          <MenuItem
            icon="flag-outline"
            label={tr.dm.report}
            onPress={() => {
              setMenu(false);
              setReporting(true);
            }}
          />
          <MenuItem
            icon="person-remove-outline"
            label={tr.friends.removeFriend}
            onPress={() => {
              setMenu(false);
              setConfirm('remove');
            }}
          />
          <MenuItem
            negative
            icon="ban-outline"
            label={tr.friends.block}
            onPress={() => {
              setMenu(false);
              setConfirm('block');
            }}
          />
        </Menu>
        <Button
          size="lg"
          variant="neutral"
          label={tr.common.cancel}
          onPress={() => setMenu(false)}
        />
      </Sheet>

      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => report.mutate(reason)}
        onClose={() => setReporting(false)}
      />
      <ConfirmWithReport
        reasons={REPORT_REASONS}
        visible={confirm !== null}
        title={confirm === 'block' ? tr.safety.blockConfirmTitle : tr.friends.removeFriend}
        hint={confirm === 'block' ? tr.friends.blockHint : tr.friends.removeHint}
        confirmLabel={confirm === 'block' ? tr.friends.blockConfirm : tr.friends.removeConfirm}
        pending={end.isPending}
        error={end.error}
        onConfirm={(reason) => confirm && end.mutate({ kind: confirm, reason })}
        onClose={() => setConfirm(null)}
      />
    </ChatScreen>
  );
}

// One message of the stream. The server's copy of a message sent from here is the same row as its
// waiting bubble (the same key and component): only its mark changes, the clock to the tick. A row
// whose message did not change is not drawn again (memo: the message is the same object, from
// @shared/dmPages.ts).
const DmRow = memo(function DmRow({
  rowKey,
  m,
  out,
  outQuote,
  first,
  day,
  name,
  view,
  pick,
  onReply,
  onRetry,
  onDiscard,
}: {
  rowKey: string;
  m: DmPageRow | undefined;
  out: OutboxMessage | undefined;
  outQuote: ChatQuote | undefined;
  first: boolean;
  day: number | null;
  name: string;
  view: ReturnType<typeof useDmReactions>['view'];
  pick: ReturnType<typeof useDmReactions>['pick'];
  onReply: (m: DmPageRow) => void;
  onRetry: (m: OutboxMessage) => void;
  onDiscard: (m: OutboxMessage) => void;
}) {
  return (
    <ChatRow id={rowKey} first={first}>
      {(jumpTo) => (
        <>
          {day !== null ? <DayLine label={dayLabel(new Date(day))} /> : null}
          {m ? (
            <ServerBubble
              m={m}
              name={name}
              first={first}
              jumpTo={jumpTo}
              view={view}
              pick={pick}
              onReply={onReply}
            />
          ) : out ? (
            <ChatBubble
              text={out.body}
              mine
              first={first}
              quote={outQuote}
              // On its way: its time and a clock where the ticks go (Telegram Android).
              {...(out.status === 'sending'
                ? {
                    time: tr.chat.time(out.at ?? new Date().toISOString()),
                    delivery: 'sending' as const,
                  }
                : {
                    state: 'failed' as const,
                    failedText: out.errorCode ? tr.errors[out.errorCode] : undefined,
                    onRetry: canRetry(out) ? () => onRetry(out) : undefined,
                    onDiscard: () => onDiscard(out),
                  })}
            />
          ) : null}
        </>
      )}
    </ChatRow>
  );
});

function ServerBubble({
  m,
  name,
  first,
  jumpTo,
  view,
  pick,
  onReply,
}: {
  m: DmPageRow;
  name: string;
  first: boolean;
  jumpTo: (id: string) => void;
  view: ReturnType<typeof useDmReactions>['view'];
  pick: ReturnType<typeof useDmReactions>['pick'];
  onReply: (m: DmPageRow) => void;
}) {
  const counts = parseDmReactions(m.reactions);
  const quote = parseQuote(m.reply_to);
  return (
    <ChatBubble
      text={m.body}
      mine={m.from_me}
      quote={toChatQuote(quote, name)}
      onPressQuote={quoteJump(quote, jumpTo)}
      reactions={view(m.id, counts)}
      onToggleReaction={(emoji) => pick(m.id, counts, emoji)}
      onReact={(emoji) => pick(m.id, counts, emoji)}
      onReply={() => onReply(m)}
      first={first}
      time={tr.chat.time(m.created_at)}
      delivery={m.from_me && isDelivery(m.status) ? m.status : undefined}
      // A DM shows no photo or name by the bubbles (skall tuvali, Dm): the top bar says who it is
      // and opens the profile.
    />
  );
}
