import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { toRuns } from '@shared/chatRuns.ts';
import {
  prepareVenueMessage,
  senderLabel,
  VENUE_CHAT,
  type VenueChatMessage,
} from '@shared/venueChat.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useState, useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatRow, ChatScreen, DayLine, dayLabel } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { DraftComposer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { GlyphDisc } from '@/components/GlyphDisc';
import { IconButton, MoreDots } from '@/components/IconButton';
import { Loader } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { Menu, MenuItem } from '@/components/Menu';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { ReportModal } from '@/features/chat/ReportModal';
import { useFreshLine } from '@/features/chat/fresh';
import { quoteJump, toChatQuote, useReplyTarget } from '@/features/chat/messageExtras';
import { IdentitySheet } from '@/features/checkin/IdentitySheet';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { ConfirmWithReport } from '@/features/friends/ConfirmWithReport';
import { friendKeys } from '@/features/friends/queries';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { useCurrentRoom } from '@/features/rooms/queries';
import {
  useVenueChat,
  useVenueChatReactions,
  venueChatKeys,
  markVenueChatSeen,
} from '@/features/venueChat/queries';
import { errorMessage } from '@/i18n/errors';
import { Av, Glass, T } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { track } from '@/lib/analytics';
import { ApiError, safetyApi, venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useFlash } from '@/lib/useFlash';
import { nameInk } from '@/theme/nameInk';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { lastRows, useOpenRows } from '@/lib/afterTransition';

// The venue's chat room (docs/SPEC_V3.md §7; skall tuvali, Mekan sohbeti panoları): everyone with a
// live table at the venue reads and writes, with the check-in's identity (docs/SPEC_V4.md §4.D):
// the capsule and its nick, or the name and the photo. The line over the message bar says which,
// and changes it once per check-in. A sender's face opens their card (profile, mute, report,
// block); a held message its faces and actions (reply; report, or delete one's own).
export default function VenueChatScreen() {
  const { colors, scheme } = useTheme();
  const queryClient = useQueryClient();
  const table = useActiveTable();
  const venueId = table.data?.venue_id;
  const sessionId = table.data?.id;
  const page = useVenueChat(venueId, sessionId);
  // Read while open: Mekan's count starts again from leaving.
  useEffect(() => {
    if (!sessionId) return undefined;
    markVenueChatSeen(sessionId);
    return () => markVenueChatSeen(sessionId);
  }, [sessionId]);
  const currentRoom = useCurrentRoom(sessionId);
  const identity = page.data?.identity ?? table.data?.identity ?? null;
  const photo = useOwnPhoto();
  const look = useOwnLook();
  const [sheet, setSheet] = useState<'options' | 'identity' | null>(null);
  const [person, setPerson] = useState<VenueChatMessage | null>(null);
  const [reporting, setReporting] = useState<VenueChatMessage | null>(null);
  const [blocking, setBlocking] = useState<VenueChatMessage | null>(null);
  const [note, flash] = useFlash();
  // docs/SPEC_V3.md §21: swipe a message to answer it, hold it for a face.
  const reply = useReplyTarget();
  // Opened light: the newest messages while the screen slides in, the rest after.
  const reactions = useVenueChatReactions(venueId);
  const messages = page.data?.messages;
  const fresh = useFreshLine(venueId && `venue:${venueId}`, messages);

  const refresh = () => {
    if (venueId) void queryClient.invalidateQueries({ queryKey: venueChatKeys.messages(venueId) });
  };
  const send = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ text, replyTo }: { text: string; replyTo: string | undefined }) =>
      venueChatApi.sendAs(venueId ?? '', text, identity?.mode ?? 'anonymous', replyTo),
    onSuccess: (_data, { replyTo }) => {
      // A new answer picked while it was sending stays (audit CHAT-13).
      if (reply.target?.id === replyTo) reply.clear();
      track('venue_chat_sent', { profiled: identity?.mode === 'profiled' });
      refresh();
    },
    onError: (err) => {
      // The identity changed elsewhere (or the photo went): nothing was sent; the line over the
      // bar shows the identity again and what was typed stays.
      if (err instanceof ApiError && ['identity_mismatch', 'photo_required'].includes(err.code)) {
        void queryClient.invalidateQueries({ queryKey: ['activeTable'] });
        refresh();
      }
    },
  });
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason }) =>
      safetyApi.reportVenueChat(id, reason),
    onSuccess: () => {
      track('venue_chat_reported', {});
      setReporting(null);
      flash(tr.safety.reportSent);
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
      // Blocking a friend also ends the friendship (audit CHAT-5).
      void queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
  const mute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (m: VenueChatMessage) => venueChatApi.mute(m.id),
    onSuccess: (_data, m) => {
      setPerson(null);
      flash(tr.venueChat.mutedToast(senderLabel(m)));
      void queryClient.invalidateQueries({ queryKey: MUTES_KEY });
      refresh();
    },
  });
  const remove = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => venueChatApi.remove(id),
    onSuccess: () => {
      flash(tr.venueChat.deleted);
      refresh();
    },
  });

  // Each sender's name keeps one colour, in their bubbles and in quotes of them; the viewer's own
  // name in a quote is in the accent.
  const inkOf = (sender: string) => nameInk(scheme, sender);
  const quoteOf = (q: VenueChatMessage['replyTo']) => {
    const base = toChatQuote(q);
    if (!base || !q || q.gone) return base;
    return { ...base, color: q.fromMe ? colors.accent : inkOf(base.name) };
  };
  const faceOf = (m: VenueChatMessage, size: number) =>
    m.profiled ? (
      <Avatar
        kind="profile"
        name={senderLabel(m)}
        photoUrl={m.photoUrl}
        size={size === AVATAR_SIZE.sm ? 'sm' : 'xl'}
      />
    ) : m.senderLook ? (
      <LookAvatar look={m.senderLook} size={size} />
    ) : (
      <Avatar kind="table" alias={senderLabel(m)} size={size === AVATAR_SIZE.sm ? 'sm' : 'xl'} />
    );

  // Opened light: the newest messages while the screen slides in, the rest after in steps.
  const shown = useOpenRows(messages?.length ?? 0);
  if (!table.isPending && !venueId) {
    return (
      <Screen>
        <ScreenHeader title={tr.venueChat.open} onBack={() => router.back()} />
        <EmptyState icon="chatbubbles-outline" body={tr.venueChat.noTable} />
      </Screen>
    );
  }

  const newest = messages?.[messages.length - 1];
  const runs = toRuns(
    messages ?? [],
    (m) => (m.fromMe ? '' : (m.senderKey ?? `${m.profiled ? 'p' : 'a'}:${senderLabel(m)}`)),
    (m) => m.createdAt,
  );
  const profiled = identity?.mode === 'profiled';
  const ownName = profiled ? photo.name : photo.nick;
  const ownFace = profiled ? (
    <Avatar kind="profile" name={photo.name} photoUrl={photo.url} size="sm" />
  ) : look ? (
    <LookAvatar look={look} size={AVATAR_SIZE.sm} />
  ) : (
    <Avatar kind="default" size="sm" />
  );

  return (
    <ChatScreen
      wall="mekan"
      testID="venue-chat-messages"
      startAtEnd
      newestKey={newest?.id}
      newestMine={newest?.fromMe}
      top={
        <ChatTopBar
          onBack={() => router.back()}
          split
          title={tr.venueChat.open}
          subtitle={tr.venue.chatReaders}
          live
          actions={
            <View className="flex-row items-center" style={{ gap: SPACING[1] }}>
              <Writers messages={messages ?? []} />
              <IconButton
                icon="ellipsis-vertical"
                glyph={<MoreDots />}
                label={tr.venueChat.options}
                testID="venue-chat-options"
                onPress={() => setSheet('options')}
              />
            </View>
          }
        />
      }
      composer={
        <DraftComposer
          inputTestID="venue-chat-input"
          sendTestID="venue-chat-send"
          sendLabel={tr.venueChat.send}
          placeholder={tr.venueChat.placeholder}
          prepare={prepareVenueMessage}
          blocked={!identity}
          maxLength={VENUE_CHAT.maxLength}
          sending={send.isPending}
          // What was typed stays when nothing was sent (the identity changed elsewhere).
          onSend={(body, clear) =>
            send.mutate({ text: body, replyTo: reply.target?.id }, { onSuccess: clear })
          }
          replyTo={reply.target?.quote}
          onCancelReply={reply.clear}
          above={
            <View className="gap-1.5">
              {note ? <Banner tone="info" body={note} testID="venue-chat-note" /> : null}
              {send.isError ? (
                <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
                  {errorMessage(send.error)}
                </Text>
              ) : null}
              {identity ? (
                <IdentityRow
                  face={ownFace}
                  name={ownName}
                  used={identity.switchUsed}
                  onChange={() => setSheet('identity')}
                />
              ) : null}
            </View>
          }
        />
      }
    >
      {page.isPending ? (
        <View className="flex-1 items-center justify-center">
          <Loader />
        </View>
      ) : page.isError ? (
        <View className="flex-1 justify-center">
          <EmptyState
            kind="error"
            body={errorMessage(page.error)}
            action={{ label: tr.common.retry, onPress: () => void page.refetch() }}
          />
        </View>
      ) : messages?.length === 0 ? (
        <View className="flex-1 justify-end gap-2">
          <Card>
            <View className="items-center" style={{ gap: SPACING[2] }}>
              <GlyphDisc icon="chatbubbles-outline" />
              <Text variant="heading" className="text-center">
                {tr.venueChat.emptyTitle}
              </Text>
              <Text variant="fine" className="text-center">
                {profiled ? tr.venueChat.emptyProfiled : tr.venueChat.emptyAnonymous(photo.nick)}
              </Text>
            </View>
          </Card>
          <DayLine label={tr.chat.today} />
        </View>
      ) : (
        lastRows(runs, shown).map(({ item: m, first, day }) => (
          <ChatRow key={m.id} id={m.id} first={first}>
            {(jumpTo) => (
              <>
                {day ? <DayLine label={dayLabel(day)} /> : null}
                {m.id === fresh ? <DayLine fresh label={tr.chat.newLine} /> : null}
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
                  actions={
                    m.fromMe
                      ? [
                          {
                            label: tr.chat.delete,
                            icon: 'close',
                            negative: true,
                            testID: 'venue-chat-delete',
                            onPress: () => remove.mutate(m.id),
                          },
                        ]
                      : [
                          {
                            label: tr.chat.report,
                            icon: 'alert',
                            negative: true,
                            testID: 'venue-chat-report',
                            onPress: () => setReporting(m),
                          },
                        ]
                  }
                  first={first}
                  time={tr.chat.time(m.createdAt)}
                  name={m.fromMe ? undefined : senderLabel(m)}
                  avatar={m.fromMe ? undefined : faceOf(m, AVATAR_SIZE.sm)}
                  nameInk={m.fromMe ? undefined : inkOf(senderLabel(m))}
                  onPressSender={m.fromMe ? undefined : () => setPerson(m)}
                />
              </>
            )}
          </ChatRow>
        ))
      )}

      {identity ? (
        <IdentitySheet
          visible={sheet === 'identity'}
          onClose={() => setSheet(null)}
          toAnonymous={identity.mode === 'profiled'}
          atTable={!!currentRoom.data}
          onChanged={refresh}
        />
      ) : null}
      <OptionsSheet
        visible={sheet === 'options'}
        onClose={() => setSheet(null)}
        onChanged={refresh}
      />
      <Sheet visible={person !== null} onClose={() => setPerson(null)}>
        {person ? (
          <>
            <View className="flex-row items-center" style={{ gap: SPACING[3] }}>
              {faceOf(person, AVATAR_SIZE.xl)}
              <View className="flex-1">
                <Text variant="title">{senderLabel(person)}</Text>
                <Text variant="fine">
                  {person.profiled ? tr.venueChat.profiledPerson : tr.venueChat.anonymousPerson}
                </Text>
              </View>
            </View>
            {person.profiled ? (
              <Button
                size="lg"
                label={tr.venueChat.seeProfile}
                testID="venue-chat-see-profile"
                onPress={() => {
                  const id = person.id;
                  setPerson(null);
                  router.push({ pathname: '/venue-chat/[messageId]', params: { messageId: id } });
                }}
              />
            ) : (
              <Text variant="fine">{tr.venueChat.anonymousNote}</Text>
            )}
            <Menu>
              <MenuItem
                label={tr.venueChat.mute}
                icon="volume-mute-outline"
                testID="venue-chat-mute"
                loading={mute.isPending}
                onPress={() => mute.mutate(person)}
              />
              <MenuItem
                label={tr.safety.report}
                icon="alert"
                negative
                onPress={() => {
                  setReporting(person);
                  setPerson(null);
                }}
              />
              <MenuItem
                label={tr.safety.block}
                icon="ban-outline"
                negative
                onPress={() => {
                  setBlocking(person);
                  setPerson(null);
                }}
              />
            </Menu>
            {mute.isError ? <Banner tone="danger" body={errorMessage(mute.error)} /> : null}
            <Button
              size="lg"
              variant="neutral"
              label={tr.common.close}
              onPress={() => setPerson(null)}
            />
          </>
        ) : null}
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

const MUTES_KEY = ['venueChatMutes'] as const;

// docs/design/aura → Mekan sohbeti: who the viewer writes as, a glass pill over the message bar,
// and the one change of the check-in (spent: "Bu girişte değişti").
function IdentityRow({
  face,
  name,
  used,
  onChange,
}: {
  face: ReactNode;
  name: string;
  used: boolean;
  onChange: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Glass
        sm
        testID="venue-chat-mode"
        style={{
          flexShrink: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING[2.5],
          paddingVertical: SPACING[1.5],
          paddingLeft: SPACING[1.5],
          paddingRight: SPACING[3],
          borderRadius: KIT.size.glassRadiusSm + 2,
        }}
      >
        {face}
        <T v="fine" style={{ flexShrink: 1 }}>
          <T v="fine" strong>
            {name}
          </T>{' '}
          {tr.venueChat.writingAs}
        </T>
        {used ? (
          <T v="fine">{tr.venueChat.changed}</T>
        ) : (
          <Pressable
            testID="venue-chat-change"
            accessibilityRole="button"
            accessibilityLabel={tr.venueChat.changeLabel}
            onPress={onChange}
            hitSlop={SPACING[3]}
          >
            <T v="fine" strong color={KIT.primary}>
              {tr.venueChat.change}
            </T>
          </Pressable>
        )}
      </Glass>
    </View>
  );
}

// skall tuvali (MekanSohbetiSecenekler): the people the viewer muted, each with "Sesi aç".
function OptionsSheet({
  visible,
  onClose,
  onChanged,
}: {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const mutes = useQuery({
    queryKey: MUTES_KEY,
    queryFn: () => venueChatApi.mutes(),
    enabled: visible,
  });
  const unmute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => venueChatApi.unmute(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MUTES_KEY });
      onChanged();
    },
  });
  const list = mutes.data?.mutes ?? [];
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.venueChat.open}>
      <View style={{ gap: SPACING[1.5] }}>
        <Text variant="label">{tr.venueChat.mutedTitle}</Text>
        {mutes.isPending ? (
          <Loader />
        ) : list.length === 0 ? (
          <Text variant="fine">{tr.venueChat.mutedNone}</Text>
        ) : (
          <Menu>
            {list.map((m) => (
              <MenuItem
                key={m.id}
                label={m.label}
                note={tr.venueChat.unmute}
                icon={m.profiled ? 'person-outline' : 'happy-outline'}
                loading={unmute.isPending && unmute.variables === m.id}
                onPress={() => unmute.mutate(m.id)}
              />
            ))}
          </Menu>
        )}
      </View>
      <Button size="lg" variant="neutral" label={tr.venueChat.done} onPress={onClose} />
    </Sheet>
  );
}

// The last writers' faces in the bar (docs/design/aura → Mekan sohbeti: `.stack`): a capsule for an
// anonymous message, the photo or initial for a profiled one; one face per writer and identity.
function Writers({ messages }: { messages: readonly VenueChatMessage[] }) {
  const seen = new Set<string>();
  const last: VenueChatMessage[] = [];
  for (let i = messages.length - 1; i >= 0 && last.length < WRITERS; i--) {
    const m = messages[i];
    if (!m || m.fromMe) continue;
    const key = m.senderKey ?? `${m.profiled ? 'p' : 'a'}:${senderLabel(m)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    last.push(m);
  }
  if (last.length === 0) return null;
  return (
    // In the actions' pill: clear of its round edge.
    <View
      className="flex-row"
      style={{ paddingLeft: SPACING[2] }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {last.map((m, i) => (
        <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -KIT.size.stackOverlap }}>
          {m.profiled ? (
            <Av size="sm" name={senderLabel(m)} photoUrl={m.photoUrl} />
          ) : m.senderLook ? (
            <Av size="sm" name={senderLabel(m)}>
              <LookAvatar look={m.senderLook} size={KIT.size.av.sm} />
            </Av>
          ) : (
            <Av size="sm" name={senderLabel(m)} />
          )}
        </View>
      ))}
    </View>
  );
}
const WRITERS = 3;
