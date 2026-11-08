import { MAX_MESSAGE_LENGTH, prepareMessage, type ReportReason } from '@shared/chat.ts';
import {
  canRetry,
  type OutboxMessage,
  outboxReducer,
  QUIET_RETRY_MS,
  retriesQuietly,
} from '@shared/chatOutbox.ts';
import { parseQuote, parseReactionCounts } from '@shared/messageExtras.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useReducer, useRef, useState } from 'react';
import { View } from 'react-native';

import { toRuns } from '@shared/chatRuns.ts';

import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { ChatBubble, skinMovers } from '@/components/ChatBubble';
import { SET_BALLOONS } from '@/theme/setBalloons';
import { setBalloonOf } from '@shared/gifts.ts';
import {
  type ChatListItem,
  type ChatListProps,
  ChatRow,
  DayLine,
  dayLabel,
} from '@/components/ChatScreen';
import { DraftComposer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Glass, T } from '@/aura/kit';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError, chatApi, safetyApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useFlash } from '@/lib/useFlash';
import { KIT } from '@/theme/auraKit';
import { nameInk } from '@/theme/nameInk';
import { useTheme } from '@/theme/ThemeProvider';

import { useFreshLine } from './fresh';
import { quoteJump, toChatQuote, useReactions, useReplyTarget } from './messageExtras';
import { OlderFoot } from './OlderFoot';
import {
  messagesKey,
  readRoomOlder,
  ROOM_CHAT_PAGE,
  type RoomChatMessage,
  useMessages,
  useRoomChatExtras,
} from './useMessages';
import { useOlderPages } from './useOlderPages';

let nextLocalId = 0;

// The room chat (MVP_SPEC §4.5). Sending is optimistic: the message shows at once and is replaced
// by the server's copy; a failed one offers a retry when retrying can help (@shared/chatOutbox.ts).
// docs/SPEC_V3.md §21: replies and reactions; tables by their aliases.
export function useRoomChat(roomId: string) {
  const queryClient = useQueryClient();
  // Another's message deleted (message_gone): the older pages on the screen read again too.
  const rereadOlder = useRef<() => void>(() => {});
  const messages = useMessages(roomId, () => rereadOlder.current());
  // The live page, and over it the older pages read as the list reaches its top.
  const older = useOlderPages({
    key: roomId,
    newest: messages.data,
    pageSize: ROOM_CHAT_PAGE,
    dated: (m: RoomChatMessage) => ({ id: m.id, at: m.created_at }),
    read: (before: string) => readRoomOlder(roomId, before),
  });
  useEffect(() => {
    rereadOlder.current = older.reread;
  });
  const extras = useRoomChatExtras(roomId);
  const [outbox, dispatch] = useReducer(outboxReducer, []);
  const reply = useReplyTarget();
  const reactions = useReactions(chatApi.react, () =>
    queryClient.invalidateQueries({ queryKey: messagesKey(roomId) }),
  );

  // The held message's "Sil" (one's own) and "Bildir" (another's; docs/SPEC_V4.md §4.T).
  const [note, flash] = useFlash();
  const [reporting, setReporting] = useState<string | null>(null);
  const remove = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => chatApi.remove(id),
    onSuccess: (_data, id) => {
      older.forget(id);
      flash(tr.chat.deleted);
      void queryClient.invalidateQueries({ queryKey: messagesKey(roomId) });
    },
  });
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason }) =>
      safetyApi.reportRoomMessage(id, reason),
    onSuccess: () => {
      setReporting(null);
      flash(tr.safety.reportSent);
    },
  });

  const deliver = (localId: string, text: string, replyTo?: string, attempt = 0) => {
    chatApi
      .send(roomId, text, replyTo)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: messagesKey(roomId) });
        dispatch({ type: 'sent', localId });
      })
      .catch((err: unknown) => {
        const errorCode = err instanceof ApiError ? err.code : null;
        // The flood guard: sent again by itself, nothing shown (docs/SPEC_V3.md §7).
        if (retriesQuietly(errorCode, attempt)) {
          setTimeout(() => deliver(localId, text, replyTo, attempt + 1), QUIET_RETRY_MS);
          return;
        }
        dispatch({ type: 'failed', localId, errorCode });
      });
  };

  const submit = (body: string, clear: () => void) => {
    nextLocalId += 1;
    const localId = `local-${nextLocalId}`;
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
  const discard = (m: OutboxMessage) => dispatch({ type: 'remove', localId: m.localId });
  return {
    messages,
    older,
    extras,
    outbox,
    submit,
    retry,
    discard,
    reply,
    reactions,
    note,
    remove,
    report,
    reporting,
    setReporting,
  };
}

export type RoomChat = ReturnType<typeof useRoomChat>;

// The room's messages as the DM's list draws them (Telegram Android's chat, newest first from the
// bottom up; the owner's call, 30 Ekim): runs, day lines, and the ones still on their way at the
// end. A profiled phone's message opens its profile while the room runs (docs/SPEC_V3.md §22.G).
type RoomMessage = RoomChatMessage;

type RoomRow = ChatListItem & {
  m?: RoomMessage;
  out?: OutboxMessage;
  first: boolean;
  last: boolean;
  day: Date | null;
  at: number;
};

export function useRoomChatList(
  chat: RoomChat,
  sessionId: string,
  // Profile ids of the room's profiled phones, by table session id (room_member_profiles).
  profiles: ReadonlyMap<string, string> | undefined,
  roomId: string,
  // Each seat's look and identity (table_people): an anonymous seat wearing a set in all three
  // regions writes in the set's balloon (§4.U, 8 Kasım).
  seats?: ReadonlyMap<string, { look: string | null; profiled: boolean }>,
): ChatListProps<RoomRow> {
  const balloonOf = (sender: string) => {
    const seat = seats?.get(sender);
    if (!seat || seat.profiled || !seat.look) return null;
    const set = setBalloonOf(seat.look);
    return set ? SET_BALLOONS[set] : null;
  };
  const { scheme } = useTheme();
  const openProfile = (sender: string) => {
    const publicId = profiles?.get(sender);
    return publicId
      ? () => router.push({ pathname: '/people/[publicId]', params: { publicId } })
      : undefined;
  };
  const list = chat.messages.data ? chat.older.rows : [];
  const extras = chat.extras.data;
  // The quote of a message on its way, from the loaded list.
  const outboxQuote = (id: string | undefined) => {
    const q = id ? list.find((m) => m.id === id) : undefined;
    return q
      ? toChatQuote({
          gone: false,
          id: q.id,
          body: q.body,
          fromMe: q.session_id === sessionId,
          name: q.sender_alias,
        })
      : undefined;
  };
  const lastAt = list.at(-1)?.created_at;
  // As in the DM and the venue chat: the chat opens at the first message from the others since the
  // last visit, under the "Okunmamış mesajlar" line (CLAUDE.md → Ekran davranışı).
  const fresh = useFreshLine(
    roomId && `room:${roomId}`,
    list.map((m) => ({ id: m.id, createdAt: m.created_at, fromMe: m.session_id === sessionId })),
  );
  const rows: RoomRow[] = [
    ...toRuns(
      list,
      (m) => m.session_id,
      (m) => m.created_at,
    ).map(({ item, first, last, day }) => ({
      key: item.id,
      id: item.id,
      m: item,
      first,
      last,
      day,
      at: Date.parse(item.created_at),
    })),
    ...chat.outbox.map((o, i) => ({
      key: o.localId,
      id: o.localId,
      out: o,
      first: i === 0,
      last: i === chat.outbox.length - 1,
      day: null,
      at: Date.parse(o.at ?? lastAt ?? ''),
    })),
  ].reverse();
  const movers = skinMovers(rows, (r) => !!r.m && balloonOf(r.m.session_id) !== null);
  const renderItem = (row: RoomRow) => {
    const { m, out, first, last, day } = row;
    if (out) {
      return (
        <ChatRow id={row.key} first={first} mine>
          {() => (
            <ChatBubble
              text={out.body}
              mine
              first={first}
              last={last}
              quote={outboxQuote(out.replyTo)}
              // As in the DM (Telegram Android): on its way, its time and a clock where the ticks
              // would go; the clock goes with the server's copy (the table chat has no ticks).
              {...(out.status === 'sending'
                ? {
                    time: tr.chat.time(out.at ?? new Date().toISOString()),
                    delivery: 'sending' as const,
                  }
                : { state: 'failed' as const })}
              failedText={
                out.status === 'failed' && out.errorCode ? tr.errors[out.errorCode] : undefined
              }
              onRetry={out.status === 'failed' && canRetry(out) ? () => chat.retry(out) : undefined}
              onDiscard={out.status === 'failed' ? () => chat.discard(out) : undefined}
            />
          )}
        </ChatRow>
      );
    }
    if (!m) return <View />;
    const mine = m.session_id === sessionId;
    const extra = extras?.get(m.id);
    const counts = parseReactionCounts(extra?.reactions);
    const quote = m.replied ? parseQuote(extra?.reply_to) : null;
    return (
      <ChatRow id={m.id} first={first} mine={mine}>
        {(jumpTo) => (
          <>
            {day ? <DayLine label={dayLabel(day)} /> : null}
            {m.id === fresh ? <DayLine fresh label={tr.chat.newLine} /> : null}
            <ChatBubble
              text={m.body}
              mine={mine}
              skin={balloonOf(m.session_id)}
              skinMoves={movers.has(row.key)}
              quote={toChatQuote(quote)}
              onPressQuote={quoteJump(quote, jumpTo)}
              reactions={chat.reactions.view(m.id, counts)}
              onToggleReaction={(emoji) => chat.reactions.pick(m.id, counts, emoji)}
              onReact={(emoji) => chat.reactions.pick(m.id, counts, emoji)}
              onReply={() =>
                chat.reply.setTarget({
                  id: m.id,
                  quote: { name: mine ? tr.chat.you : m.sender_alias, text: m.body },
                })
              }
              first={first}
              last={last}
              time={tr.chat.time(m.created_at)}
              name={mine ? undefined : m.sender_alias}
              // The name inside the bubble, as in Mekan sohbeti (the owner's call, 28 Ekim).
              nameInk={mine ? undefined : nameInk(scheme, m.sender_alias)}
              avatar={mine ? undefined : <Avatar kind="table" alias={m.sender_alias} size="sm" />}
              actions={
                mine
                  ? [
                      {
                        label: tr.chat.delete,
                        icon: 'close',
                        negative: true,
                        testID: 'room-chat-delete',
                        onPress: () => chat.remove.mutate(m.id),
                      },
                    ]
                  : [
                      {
                        label: tr.chat.report,
                        icon: 'alert',
                        negative: true,
                        testID: 'room-chat-report',
                        onPress: () => chat.setReporting(m.id),
                      },
                    ]
              }
              onPressSender={mine ? undefined : openProfile(m.session_id)}
            />
          </>
        )}
      </ChatRow>
    );
  };
  return {
    items: rows,
    renderItem,
    openAt: fresh,
    timeOf: (row) => row.at,
    onReachOld: chat.older.loadOlder,
    older: (
      <OlderFoot
        loading={chat.older.loadingOlder}
        failed={chat.older.olderFailed}
        onRetry={chat.older.retryOlder}
      />
    ),
    // Loading and its error (audit CHAT-8), and the empty room.
    empty: chat.messages.isPending ? (
      <View className="flex-1 items-center justify-center">
        <Loader />
      </View>
    ) : chat.messages.isError && !chat.messages.data ? (
      <View className="flex-1 justify-center">
        <EmptyState
          kind="error"
          body={errorMessage(chat.messages.error)}
          action={{ label: tr.common.retry, onPress: () => void chat.messages.refetch() }}
        />
      </View>
    ) : (
      // U25 (MasaSohbeti `.day`): a glass pill over the message bar.
      <View className="flex-1 items-center justify-end">
        <Glass
          radius={KIT.size.chip}
          style={{ paddingHorizontal: KIT.chatEmptyPad.x, paddingVertical: KIT.chatEmptyPad.y }}
        >
          <T v="chip">{tr.chat.empty}</T>
        </Glass>
      </View>
    ),
  };
}

export function RoomComposer({ chat }: { chat: RoomChat }) {
  return (
    <DraftComposer
      sendLabel={tr.chat.send}
      placeholder={tr.chat.placeholder}
      prepare={prepareMessage}
      maxLength={MAX_MESSAGE_LENGTH}
      onSend={chat.submit}
      replyTo={chat.reply.target?.quote}
      onCancelReply={chat.reply.clear}
      above={chat.note ? <Banner tone="info" body={chat.note} testID="room-chat-note" /> : null}
    />
  );
}
