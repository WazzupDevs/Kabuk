import { MAX_MESSAGE_LENGTH, prepareMessage } from '@shared/chat.ts';
import { canRetry, type OutboxMessage, outboxReducer } from '@shared/chatOutbox.ts';
import { parseQuote, parseReactionCounts } from '@shared/messageExtras.ts';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useReducer } from 'react';
import { View } from 'react-native';

import { toRuns } from '@shared/chatRuns.ts';

import { Avatar } from '@/components/Avatar';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatRow, DayLine, dayLabel } from '@/components/ChatScreen';
import { DraftComposer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError, chatApi } from '@/lib/api';

import { quoteJump, toChatQuote, useReactions, useReplyTarget } from './messageExtras';
import { messagesKey, useMessages, useRoomChatExtras } from './useMessages';

let nextLocalId = 0;

// The room chat (MVP_SPEC §4.5). Sending is optimistic: the message shows at once and is replaced
// by the server's copy; a failed one offers a retry when retrying can help (@shared/chatOutbox.ts).
// docs/SPEC_V3.md §21: replies and reactions; tables by their aliases.
export function useRoomChat(roomId: string) {
  const queryClient = useQueryClient();
  const messages = useMessages(roomId);
  const extras = useRoomChatExtras(roomId);
  const [outbox, dispatch] = useReducer(outboxReducer, []);
  const reply = useReplyTarget();
  const reactions = useReactions(chatApi.react, () =>
    queryClient.invalidateQueries({ queryKey: messagesKey(roomId) }),
  );

  const deliver = (localId: string, text: string, replyTo?: string) => {
    chatApi
      .send(roomId, text, replyTo)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: messagesKey(roomId) });
        dispatch({ type: 'sent', localId });
      })
      .catch((err: unknown) => {
        dispatch({
          type: 'failed',
          localId,
          errorCode: err instanceof ApiError ? err.code : null,
        });
      });
  };

  const submit = (body: string, clear: () => void) => {
    nextLocalId += 1;
    const localId = `local-${nextLocalId}`;
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
  const discard = (m: OutboxMessage) => dispatch({ type: 'remove', localId: m.localId });
  return {
    messages,
    extras,
    outbox,
    submit,
    retry,
    discard,
    reply,
    reactions,
  };
}

export type RoomChat = ReturnType<typeof useRoomChat>;

// The room's messages in runs (canvas: Aşama 4 · Yenileme), then the ones still on their way. A
// profiled phone's message opens its profile while the room runs (docs/SPEC_V3.md §22.G).
export function RoomMessages({
  chat,
  sessionId,
  profiles,
}: {
  chat: RoomChat;
  sessionId: string;
  // Profile ids of the room's profiled phones, by table session id (room_member_profiles).
  profiles: ReadonlyMap<string, string> | undefined;
}) {
  const openProfile = (sender: string) => {
    const publicId = profiles?.get(sender);
    return publicId
      ? () => router.push({ pathname: '/people/[publicId]', params: { publicId } })
      : undefined;
  };
  const list = chat.messages.data ?? [];
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
  const runs = toRuns(
    list,
    (m) => m.session_id,
    (m) => m.created_at,
  );
  return (
    <>
      {/* Loading and its error (audit CHAT-8). */}
      {chat.messages.isPending && chat.outbox.length === 0 ? (
        <View className="mt-2 items-center">
          <Loader />
        </View>
      ) : chat.messages.isError && !chat.messages.data ? (
        <EmptyState
          kind="error"
          body={errorMessage(chat.messages.error)}
          action={{ label: tr.common.retry, onPress: () => void chat.messages.refetch() }}
        />
      ) : list.length === 0 && chat.outbox.length === 0 ? (
        <Text variant="fine" align="center" className="mt-2">
          {tr.chat.empty}
        </Text>
      ) : null}
      {runs.map(({ item: m, first, day }) => {
        const mine = m.session_id === sessionId;
        const extra = extras?.get(m.id);
        const counts = parseReactionCounts(extra?.reactions);
        const quote = m.replied ? parseQuote(extra?.reply_to) : null;
        return (
          <ChatRow key={m.id} id={m.id} first={first}>
            {(jumpTo) => (
              <>
                {day ? <DayLine label={dayLabel(day)} /> : null}
                <ChatBubble
                  text={m.body}
                  mine={mine}
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
                  time={tr.chat.time(m.created_at)}
                  name={mine ? undefined : m.sender_alias}
                  avatar={
                    mine ? undefined : <Avatar kind="table" alias={m.sender_alias} size="sm" />
                  }
                  onPressSender={mine ? undefined : openProfile(m.session_id)}
                />
              </>
            )}
          </ChatRow>
        );
      })}
      {chat.outbox.map((m) => (
        <ChatBubble
          key={m.localId}
          text={m.body}
          mine
          quote={outboxQuote(m.replyTo)}
          state={m.status === 'sending' ? 'sending' : 'failed'}
          failedText={m.status === 'failed' && m.errorCode ? tr.errors[m.errorCode] : undefined}
          onRetry={m.status === 'failed' && canRetry(m) ? () => chat.retry(m) : undefined}
          onDiscard={m.status === 'failed' ? () => chat.discard(m) : undefined}
        />
      ))}
    </>
  );
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
    />
  );
}
