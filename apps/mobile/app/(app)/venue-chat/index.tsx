import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import {
  prepareVenueMessage,
  senderLabel,
  VENUE_CHAT,
  type VenueChatMessage,
} from '@shared/venueChat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { toRuns } from '@shared/chatRuns.ts';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatRow, ChatScreen, DayLine, dayLabel } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Composer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Mark } from '@/components/Mark';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { ReportModal } from '@/features/chat/ReportModal';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useProfile } from '@/features/account/useProfile';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { quoteJump, toChatQuote, useReplyTarget } from '@/features/chat/messageExtras';
import { ModeSheet } from '@/features/venueChat/ModeSheet';
import {
  useVenueChat,
  useVenueChatReactions,
  type VenueChatPage,
  venueChatKeys,
} from '@/features/venueChat/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, safetyApi, venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { nameInk } from '@/theme/nameInk';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

// The venue's chat room (docs/SPEC_V3.md §7): everyone with a live table at the venue reads and
// writes; a message goes with the table alias, or with the display name and no alias. Which one is
// chosen once per check-in, at the first "Gönder" (§22.G), and then only named over the message
// bar. Tapping a profiled sender opens their profile through the message; any other sender offers
// report and block.
export default function VenueChatScreen() {
  const { colors, shape, scheme } = useTheme();
  const queryClient = useQueryClient();
  const table = useActiveTable();
  const venueId = table.data?.venue_id;
  const venueName = table.data?.venue?.name ?? '';
  const sessionId = table.data?.id;
  const page = useVenueChat(venueId, sessionId);
  const mode = page.data?.mode;
  const photo = useOwnPhoto();
  // The anonymous identity's name is the capsule nick (docs/SPEC_V4.md §4.D).
  const profile = useProfile();
  const [draft, setDraft] = useState('');
  // The first-message choice and, from it, the photo sheet: one at a time.
  const [sheet, setSheet] = useState<'mode' | 'photo' | null>(null);
  const [menuFor, setMenuFor] = useState<VenueChatMessage | null>(null);
  const [reporting, setReporting] = useState<VenueChatMessage | null>(null);
  const [blocking, setBlocking] = useState<VenueChatMessage | null>(null);
  // docs/SPEC_V3.md §21: swipe a message to answer it, long press it for a reaction.
  const reply = useReplyTarget();
  const reactions = useVenueChatReactions(venueId);

  const refresh = () => {
    if (venueId) void queryClient.invalidateQueries({ queryKey: venueChatKeys.messages(venueId) });
  };
  const send = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ text, profiled }: { text: string; profiled: boolean; first: boolean }) =>
      reply.target
        ? venueChatApi.reply(venueId ?? '', text, profiled, reply.target.id)
        : venueChatApi.send(venueId ?? '', text, profiled),
    onSuccess: (_data, { profiled, first }) => {
      setDraft('');
      reply.clear();
      setSheet(null);
      track('venue_chat_sent', { profiled });
      if (first) {
        track('venue_chat_mode_chosen', { profiled });
        // The next "Gönder" must not ask again before the page comes back with the mode.
        if (venueId && sessionId) {
          queryClient.setQueryData<VenueChatPage>(
            venueChatKeys.page(venueId, sessionId),
            (old) => old && { ...old, mode: profiled ? 'profiled' : 'anonymous' },
          );
        }
      }
      refresh();
    },
    onError: (err) => {
      if (!(err instanceof ApiError)) return;
      // The server has this check-in's mode already (the page was read before it): nothing sent;
      // the bar shows that mode and what was typed stays for the next "Gönder".
      if (err.code === 'venue_chat_mode_locked') {
        setSheet(null);
        refresh();
      }
      // The photo went (or was hidden): the sheet stays, "Profilimle" turns unavailable.
      if (err.code === 'photo_required') void photo.refresh();
    },
  });
  const press = () => {
    if (!body || mode === undefined) return;
    if (mode === null) {
      send.reset();
      setSheet('mode');
    } else {
      send.mutate({ text: body, profiled: mode === 'profiled', first: false });
    }
  };
  const closeSheet = () => {
    setSheet(null);
    send.reset();
  };
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason }) =>
      safetyApi.reportVenueChat(id, reason),
    onSuccess: () => {
      track('venue_chat_reported', {});
      setReporting(null);
      Alert.alert(tr.safety.reportSent);
      refresh();
    },
  });
  const block = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason | undefined }) =>
      safetyApi.blockVenueChat(id, reason),
    onSuccess: () => {
      setBlocking(null);
      refresh();
    },
  });

  const body = prepareVenueMessage(draft);
  // Each sender's name keeps one colour, in their bubbles and in quotes of them (v45: VC.col); the
  // viewer's own name in a quote is in the accent.
  const inkOf = (sender: string) => nameInk(scheme, sender);
  const quoteOf = (q: VenueChatMessage['replyTo']) => {
    const base = toChatQuote(q);
    if (!base || !q || q.gone) return base;
    return { ...base, color: q.fromMe ? colors.accent : inkOf(base.name) };
  };
  const openSender = (m: VenueChatMessage) => {
    if (m.profiled) {
      router.push({ pathname: '/venue-chat/[messageId]', params: { messageId: m.id } });
    } else {
      setMenuFor(m);
    }
  };

  if (!table.isPending && !venueId) {
    return (
      <Screen>
        <ScreenHeader title={tr.venueChat.open} onBack={() => router.back()} />
        <EmptyState icon="chatbubbles-outline" body={tr.venueChat.noTable} />
      </Screen>
    );
  }

  const messages = page.data?.messages;
  const newest = messages?.[messages.length - 1];
  const runs = toRuns(
    messages ?? [],
    (m) => (m.fromMe ? '' : `${m.profiled ? 'p' : 'a'}:${senderLabel(m)}`),
    (m) => m.createdAt,
  );

  return (
    <ChatScreen
      testID="venue-chat-messages"
      startAtEnd
      newestKey={newest?.id}
      newestMine={newest?.fromMe}
      top={
        <ChatTopBar
          onBack={() => router.back()}
          title={tr.venueChat.title(venueName)}
          subtitle={tr.venueChat.open}
          leading={
            <View
              className="items-center justify-center"
              style={{
                width: AVATAR_SIZE.md,
                height: AVATAR_SIZE.md,
                borderRadius: shape.radius.pill,
                backgroundColor: colors.signal,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={ICON.md} color={colors.onSignal} />
            </View>
          }
        />
      }
      composer={
        <Composer
          inputTestID="venue-chat-input"
          sendTestID="venue-chat-send"
          sendLabel={tr.venueChat.send}
          placeholder={tr.venueChat.placeholder}
          value={draft}
          onChangeText={setDraft}
          maxLength={VENUE_CHAT.maxLength}
          sendDisabled={!body || mode === undefined}
          sending={send.isPending}
          onSend={press}
          replyTo={reply.target?.quote}
          onCancelReply={reply.clear}
          counter={draft ? tr.chat.counter([...draft].length, VENUE_CHAT.maxLength) : undefined}
          above={
            mode || (send.isError && sheet === null) ? (
              <View className="gap-1.5">
                {send.isError && sheet === null ? (
                  <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
                    {errorMessage(send.error)}
                  </Text>
                ) : null}
                {mode ? (
                  <View
                    testID="venue-chat-mode"
                    className="flex-row items-center gap-2"
                    style={{ minHeight: SPACING[8] }}
                  >
                    {mode === 'profiled' ? (
                      <Avatar kind="profile" name={photo.name} photoUrl={photo.url} size="sm" />
                    ) : (
                      <Avatar kind="default" size="sm" />
                    )}
                    <Text variant="label" tone="muted" className="flex-1">
                      {mode === 'profiled'
                        ? tr.venueChat.writingProfile
                        : tr.venueChat.writingAnonymous}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : undefined
          }
        />
      }
    >
      <Card tone="note">
        <View className="flex-row items-center gap-3">
          <Mark size={SPACING[9]} label={null} />
          <Text variant="fine" tone="text" className="flex-1">
            {tr.venueChat.hint}
          </Text>
        </View>
      </Card>
      {page.isPending ? (
        <View className="items-center">
          <Loader />
        </View>
      ) : messages?.length === 0 ? (
        <View className="flex-1 justify-center">
          <EmptyState kind="empty" body={tr.venueChat.empty} />
        </View>
      ) : (
        runs.map(({ item: m, first, day }) => (
          <ChatRow key={m.id} id={m.id} className={first ? 'mt-1.5 gap-2' : 'gap-2'}>
            {(jumpTo) => (
              <>
                {day ? <DayLine label={dayLabel(day)} /> : null}
                <ChatBubble
                  testID={m.fromMe ? 'venue-chat-mine' : 'venue-chat-theirs'}
                  text={m.body}
                  mine={m.fromMe}
                  quote={quoteOf(m.replyTo)}
                  onPressQuote={quoteJump(m.replyTo, jumpTo)}
                  reactions={reactions.view(m.id, m.reactions)}
                  onToggleReaction={(emoji) => reactions.pick(m.id, m.reactions, emoji)}
                  onReact={(emoji) => reactions.pick(m.id, m.reactions, emoji)}
                  onReply={() =>
                    reply.setTarget({
                      id: m.id,
                      quote: {
                        name: m.fromMe ? tr.chat.you : senderLabel(m),
                        text: m.body,
                        color: m.fromMe ? colors.accent : inkOf(senderLabel(m)),
                      },
                    })
                  }
                  first={first}
                  time={tr.chat.time(m.createdAt)}
                  name={m.fromMe ? tr.venueChat.you : senderLabel(m)}
                  avatar={
                    m.fromMe ? undefined : m.profiled ? (
                      <Avatar
                        kind="profile"
                        name={senderLabel(m)}
                        photoUrl={m.photoUrl}
                        size="sm"
                      />
                    ) : (
                      <Avatar kind="table" alias={senderLabel(m)} size="sm" />
                    )
                  }
                  nameInk={m.fromMe ? undefined : inkOf(senderLabel(m))}
                  onPressSender={m.fromMe ? undefined : () => openSender(m)}
                />
              </>
            )}
          </ChatRow>
        ))
      )}

      <ModeSheet
        visible={sheet === 'mode'}
        onClose={closeSheet}
        alias={profile.data?.capsule_nick ?? ''}
        photo={photo}
        sending={send.isPending}
        error={send.error}
        onSend={(profiled) => body && send.mutate({ text: body, profiled, first: true })}
        onAddPhoto={() => setSheet('photo')}
      />
      {/* From the choice: back to it once the photo sheet closes, uploaded or not. */}
      <PhotoSheet
        visible={sheet === 'photo'}
        onClose={() => {
          setSheet('mode');
          send.reset();
        }}
      />
      <Sheet
        visible={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={tr.venueChat.messageMenu}
        icon="chatbubble-outline"
      >
        <ListRow
          title={tr.safety.report}
          accessibilityRole="button"
          onPress={() => {
            setReporting(menuFor);
            setMenuFor(null);
          }}
        />
        <ListRow
          title={tr.safety.block}
          accessibilityRole="button"
          onPress={() => {
            setBlocking(menuFor);
            setMenuFor(null);
          }}
        />
      </Sheet>
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting !== null}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => reporting && report.mutate({ id: reporting.id, reason })}
        onClose={() => setReporting(null)}
      />
      <ConfirmWithReport
        reasons={REPORT_REASONS}
        visible={blocking !== null}
        title={tr.venueChat.blockConfirmTitle}
        hint={tr.venueChat.blockConfirmBody}
        confirmLabel={tr.safety.blockConfirm}
        pending={block.isPending}
        error={block.error}
        onConfirm={(reason) => blocking && block.mutate({ id: blocking.id, reason })}
        onClose={() => setBlocking(null)}
      />
    </ChatScreen>
  );
}
