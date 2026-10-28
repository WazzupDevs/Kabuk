import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { DM_MAX_LENGTH, prepareDm } from '@shared/friends.ts';
import { canRetry, type OutboxMessage, outboxReducer } from '@shared/chatOutbox.ts';
import { toRuns } from '@shared/chatRuns.ts';
import { parseDmReactions, parseQuote } from '@shared/messageExtras.ts';
import { BROADCAST, dmChannel } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Alert, BackHandler, View } from 'react-native';

import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { ChatBubble, type Delivery, TypingBubble } from '@/components/ChatBubble';
import { ChatRow, ChatScreen, DayLine, dayLabel } from '@/components/ChatScreen';
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

type Params = { threadId: string; publicId: string; name: string };

const isDelivery = (status: string | null): status is Delivery =>
  status === 'sent' || status === 'delivered' || status === 'read';

let nextLocalId = 0;

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
  // Read only while seen: what arrives behind the home screen stays unread until the DM is seen
  // again (audit CHAT-2). Being seen, the first time and every time after, marks it read.
  const seen = useSeen(markRead);
  const sendDm = useSendDm(threadId);
  // docs/SPEC_V3.md §21: swipe a message to answer it, long press it for a reaction.
  const reply = useReplyTarget();
  const reactions = useDmReactions(threadId);
  const refetch = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: friendKeys.dm(threadId) });
    if (seen()) markRead();
  }, [queryClient, threadId, markRead, seen]);
  useBroadcast(dmChannel(threadId), BROADCAST.dmMessage, refetch);
  // A tick moved (delivered or read): only the page is read again.
  const rereadPage = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: friendKeys.dm(threadId) }),
    [queryClient, threadId],
  );
  useBroadcast(dmChannel(threadId), BROADCAST.dmStatus, rereadPage);
  // A reaction moved: the page again.
  useBroadcast(dmChannel(threadId), BROADCAST.dmReaction, rereadPage);

  // The other side's newest message: when it changes, their typing dots go.
  const newestFromThem = messages.data?.find((m) => !m.from_me)?.id;
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
    const m = messages.data?.find((x) => x.id === id);
    return m ? { id, body: m.body, fromMe: m.from_me } : { id, body: '', fromMe: false };
  };
  const deliver = (localId: string, text: string, replyTo?: string) => {
    sendDm(text, replyOf(replyTo))
      .then(() => {
        track('dm_sent', {});
        dispatch({ type: 'sent', localId });
      })
      .catch((err: unknown) =>
        dispatch({ type: 'failed', localId, errorCode: err instanceof ApiError ? err.code : null }),
      );
  };
  const submit = (body: string, clear: () => void) => {
    nextLocalId += 1;
    const localId = `dm-${nextLocalId}`;
    const replyTo = reply.target?.id;
    dispatch({ type: 'send', localId, body, ...(replyTo ? { replyTo } : {}) });
    clear();
    reply.clear();
    deliver(localId, body, replyTo);
  };
  const retry = (m: OutboxMessage) => {
    dispatch({ type: 'retry', localId: m.localId });
    deliver(m.localId, m.body, m.replyTo);
  };
  const outboxQuote = (id: string | undefined) => {
    const r = replyOf(id);
    return r ? toChatQuote({ gone: false, ...r, name: null }, name) : undefined;
  };
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

  const list = [...(messages.data ?? [])].reverse();
  const runs = toRuns(
    list,
    (m) => (m.from_me ? 'me' : 'them'),
    (m) => m.created_at,
  );
  // From the DM: removing or blocking there goes back to Mesajlar, not to this DM (audit CHAT-6).
  const openProfile = () =>
    router.push({ pathname: '/people/[publicId]', params: { publicId, from: 'dm' } });
  // The newest message, for following it (ChatScroll): one on its way, else the newest read.
  const newestOut = outbox[outbox.length - 1];
  const newestIn = list[list.length - 1];
  return (
    <ChatScreen
      startAtEnd
      newestKey={newestOut?.localId ?? newestIn?.id}
      newestMine={newestOut ? true : newestIn?.from_me}
      top={
        <ChatTopBar
          onBack={backToInbox}
          title={name}
          leading={<Avatar kind="profile" name={name} size="md" photoUrl={photoUrl} />}
          onPressTitle={openProfile}
          titleAccessibilityLabel={name}
          actions={
            <IconButton
              round
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
      {/* Loading and its error (audit CHAT-8): the DM is never shown empty while it loads or when
          it could not be read. */}
      {messages.isPending && outbox.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Loader />
        </View>
      ) : messages.isError && !messages.data ? (
        <View className="flex-1 justify-center">
          <EmptyState
            kind="error"
            body={errorMessage(messages.error)}
            action={{ label: tr.common.retry, onPress: () => void messages.refetch() }}
          />
        </View>
      ) : list.length === 0 && outbox.length === 0 ? (
        <View className="flex-1 justify-center">
          <EmptyState kind="empty" body={tr.friends.noMessagesYet} />
        </View>
      ) : null}
      {messages.hasNextPage ? (
        <View className="items-center" style={{ paddingVertical: SPACING[2] }}>
          <Button
            size="sm"
            variant="neutral"
            label={tr.dm.olderMessages}
            loading={messages.isFetchingNextPage}
            onPress={() => void messages.fetchNextPage()}
          />
        </View>
      ) : null}
      {runs.map(({ item: m, first, day }) => {
        const counts = parseDmReactions(m.reactions);
        const quote = parseQuote(m.reply_to);
        return (
          <ChatRow key={m.id} id={m.id} first={first}>
            {(jumpTo) => (
              <>
                {day ? <DayLine label={dayLabel(day)} /> : null}
                <ChatBubble
                  text={m.body}
                  mine={m.from_me}
                  quote={toChatQuote(quote, name)}
                  onPressQuote={quoteJump(quote, jumpTo)}
                  reactions={reactions.view(m.id, counts)}
                  onToggleReaction={(emoji) => reactions.pick(m.id, counts, emoji)}
                  onReact={(emoji) => reactions.pick(m.id, counts, emoji)}
                  onReply={() =>
                    reply.setTarget({
                      id: m.id,
                      quote: { name: m.from_me ? tr.chat.you : name, text: m.body },
                    })
                  }
                  first={first}
                  time={tr.chat.time(m.created_at)}
                  delivery={m.from_me && isDelivery(m.status) ? m.status : undefined}
                  // A DM shows no photo or name by the bubbles (skall tuvali, Dm): the top bar
                  // says who it is and opens the profile.
                />
              </>
            )}
          </ChatRow>
        );
      })}
      {outbox.map((m) => (
        <ChatBubble
          key={m.localId}
          text={m.body}
          mine
          quote={outboxQuote(m.replyTo)}
          state={m.status === 'sending' ? 'sending' : 'failed'}
          failedText={m.status === 'failed' && m.errorCode ? tr.errors[m.errorCode] : undefined}
          onRetry={m.status === 'failed' && canRetry(m) ? () => retry(m) : undefined}
          onDiscard={
            m.status === 'failed'
              ? () => dispatch({ type: 'remove', localId: m.localId })
              : undefined
          }
        />
      ))}
      {typing ? <TypingBubble testID="dm-typing" /> : null}

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
