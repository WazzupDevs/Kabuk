import type { DistrictSession } from '@shared/api/district.ts';
import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import { canRetry, mergeOutbox, type OutboxMessage, outboxReducer } from '@shared/chatOutbox.ts';
import { toRuns } from '@shared/chatRuns.ts';
import {
  DISTRICT_CHAT_REACTION_BROADCAST,
  districtChatChannel,
  secondsUntil,
} from '@shared/district.ts';
import { setBalloonOf } from '@shared/gifts.ts';
import {
  prepareVenueMessage,
  senderLabel,
  VENUE_CHAT,
  type VenueChatMessage,
  type VenueChatMode,
} from '@shared/venueChat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useReducer, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { Btn, Glass, Seg, T, useKit } from '@/aura/kit';
import { Avatar, AVATAR_SIZE } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatRow, ChatScreen, DayLine, dayLabel } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { DraftComposer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { FxMoves } from '@/components/FxSvg';
import { IconButton, MoreDots } from '@/components/IconButton';
import { Loader } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { Menu, MenuItem } from '@/components/Menu';
import { Sheet } from '@/components/Sheet';
import { ReportModal } from '@/features/chat/ReportModal';
import { useFreshLine } from '@/features/chat/fresh';
import { quoteJump, toChatQuote, useReplyTarget } from '@/features/chat/messageExtras';
import { OlderFoot } from '@/features/chat/OlderFoot';
import { useOlderPages } from '@/features/chat/useOlderPages';
import { asksToContinue } from '@/features/district/continueNotice';
import { BenchScene, Foot, TimeChip, WarnRow } from '@/features/district/parts';
import { DISTRICT_MUTES_KEY, EndSheet, OptionsSheet } from '@/features/district/RoomSheets';
import {
  districtKeys,
  putDistrictState,
  readDistrictChatOlder,
  useDistrictChat,
  useDistrictChatReactions,
  useDistrictState,
} from '@/features/district/queries';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { useBroadcast } from '@/features/rooms/useBroadcast';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, districtApi, districtChatApi, friendsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { requestKey } from '@/lib/requestKey';
import { useFlash } from '@/lib/useFlash';
import { useNow } from '@/lib/useNow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION } from '@/theme/aura';
import { nameInk } from '@/theme/nameInk';
import { SEMT } from '@/theme/semt';
import { SET_BALLOONS, type SetBalloon } from '@/theme/setBalloons';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// The district room (SemtOda, SemtOdaHal, SemtOdaBos, SemtDevam; docs/SPEC_V4.md §4.V): the venue
// chat's stream, bubbles and bar (venue-chat/index.tsx) for the person's own open session. No head
// count anywhere: no faces in the bar, no live dot, no last writers (rule 4). Under the bar the time
// left; at its end "Devam?" (the sheet; dismissed, the chip asks again).
export default function DistrictRoomScreen() {
  return (
    <FxMoves>
      <DistrictRoomBody />
    </FxMoves>
  );
}

const MUTES_KEY = DISTRICT_MUTES_KEY;

function DistrictRoomBody() {
  const { colors, scheme } = useTheme();
  const queryClient = useQueryClient();
  const state = useDistrictState();
  const session = state.data?.session ?? null;
  const roomId = session?.roomId;
  const name = state.data?.district?.name ?? '';
  const page = useDistrictChat(roomId);
  const photo = useOwnPhoto();
  const look = useOwnLook();
  const [note, flash] = useFlash();
  const reply = useReplyTarget();
  const reactions = useDistrictChatReactions(roomId);
  const [person, setPerson] = useState<VenueChatMessage | null>(null);
  const [reporting, setReporting] = useState<VenueChatMessage | null>(null);
  const [asking, setAsking] = useState<VenueChatMessage | null>(null);
  const [options, setOptions] = useState(false);
  const [closing, setClosing] = useState(false);
  const older = useOlderPages({
    key: roomId ?? '',
    newest: page.data?.messages,
    pageSize: VENUE_CHAT.pageSize,
    dated: (m: VenueChatMessage) => ({ id: m.id, at: m.createdAt }),
    read: (before: string) => readDistrictChatOlder(before),
  });
  useBroadcast(
    roomId ? districtChatChannel(roomId) : null,
    DISTRICT_CHAT_REACTION_BROADCAST,
    older.reread,
  );
  const messages = page.data ? older.rows : undefined;
  const fresh = useFreshLine(roomId && `district:${roomId}`, messages);
  const refresh = () => {
    if (roomId) void queryClient.invalidateQueries({ queryKey: districtKeys.chat(roomId) });
  };

  // The session's end and the extra time's, on this phone's clock (the server keeps them).
  const now = useNow(30_000, !!session);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!session) return undefined;
    const timers = [session.endsAt, session.graceEndsAt].map((at, i) =>
      setTimeout(
        () => {
          setTick(Date.now());
          // Past the extra time the server has closed it: the state says so.
          if (i === 1) void queryClient.invalidateQueries({ queryKey: districtKeys.state });
        },
        Math.max(0, Date.parse(at) - Date.now()) + (i === 1 ? GRACE_READ_AFTER_MS : 0),
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [session, queryClient]);
  const at = Math.max(now, tick);
  const grace = !!session && Date.parse(session.endsAt) <= at;
  // The sheet opens once per end; dismissed, the chip says "Devam?" and opens it again.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const continues = !!state.data && asksToContinue(state.data);
  const sheetOpen = grace && continues && dismissed !== session?.endsAt;

  const [outbox, dispatch] = useReducer(outboxReducer, []);
  const [sentIds, setSentIds] = useState<ReadonlyMap<string, string>>(new Map());
  const identity: VenueChatMode = session?.identity ?? 'anonymous';
  const send = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({
      text,
      replyTo,
      clientId,
    }: {
      text: string;
      replyTo?: string;
      clientId: string;
    }) => districtChatApi.send(text, identity, replyTo, clientId),
  });
  const deliver = (m: { localId: string; body: string; replyTo?: string }) => {
    send
      .mutateAsync({
        text: m.body,
        clientId: m.localId,
        ...(m.replyTo ? { replyTo: m.replyTo } : {}),
      })
      .then(({ messageId }) => {
        setSentIds((ids) => new Map(ids).set(m.localId, messageId));
        refresh();
      })
      .catch((err: unknown) => {
        const errorCode = err instanceof ApiError ? err.code : null;
        dispatch({ type: 'failed', localId: m.localId, errorCode });
        if (errorCode === 'identity_mismatch' || errorCode === 'no_session') {
          void queryClient.invalidateQueries({ queryKey: districtKeys.state });
          refresh();
        }
      });
  };
  const submit = (body: string, clear: () => void) => {
    const replyTo = reply.target?.id;
    const m = { localId: requestKey(), body, ...(replyTo ? { replyTo } : {}) };
    dispatch({ type: 'send', ...m, at: new Date().toISOString() });
    clear();
    reply.clear();
    deliver(m);
  };
  const retry = (m: OutboxMessage) => {
    dispatch({ type: 'retry', localId: m.localId });
    deliver(m);
  };
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason }) =>
      districtChatApi.report(id, reason),
    onSuccess: () => {
      setReporting(null);
      flash(tr.safety.reportSent);
      refresh();
    },
  });
  const mute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (m: VenueChatMessage) => districtChatApi.mute(m.id),
    onSuccess: (_d, m) => {
      setPerson(null);
      flash(tr.venueChat.mutedToast(senderLabel(m)));
      void queryClient.invalidateQueries({ queryKey: MUTES_KEY });
      refresh();
    },
    onError: (err) => flash(errorMessage(err)),
  });
  const remove = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => districtChatApi.remove(id),
    onSuccess: () => {
      flash(tr.venueChat.deleted);
      refresh();
    },
    onError: (err) => flash(errorMessage(err)),
  });
  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (id: string) => friendsApi.requestFromDistrictChat(id),
    onSuccess: () => {
      setAsking(null);
      flash(tr.venueChat.requestSent);
    },
  });
  const setIdentity = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (mode: VenueChatMode) => districtApi.setIdentity(mode === 'anonymous'),
    onSuccess: (next) => putDistrictState(queryClient, next),
    onError: (err) => flash(errorMessage(err)),
  });

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

  const onPage = useMemo(() => new Set((messages ?? []).map((m) => m.id)), [messages]);
  useEffect(() => {
    for (const [localId, id] of sentIds) {
      if (onPage.has(id) && outbox.some((o) => o.localId === localId)) {
        dispatch({ type: 'sent', localId });
      }
    }
  }, [onPage, sentIds, outbox]);
  const entries = mergeOutbox(
    messages ?? [],
    (m) => m.createdAt,
    outbox,
    sentIds,
    new Date().toISOString(),
  );
  const outQuote = (id: string | undefined) => {
    if (!id) return undefined;
    const q = messages?.find((x) => x.id === id);
    return quoteOf(
      q
        ? {
            gone: false,
            id,
            body: q.body,
            fromMe: q.fromMe,
            name: q.fromMe ? null : senderLabel(q),
          }
        : { gone: false, id, body: '', fromMe: false, name: null },
    );
  };

  // The session closed (Hayır, the extra time over, 00:00, another district): SemtBitti.
  if (state.data && !session) return <Redirect href="/district/ended" />;

  const runs = toRuns(
    entries,
    (e) =>
      e.out || e.m?.fromMe
        ? ''
        : (e.m?.senderKey ?? `${e.m?.profiled ? 'p' : 'a'}:${e.m ? senderLabel(e.m) : ''}`),
    (e) => e.at,
  );
  const rows = runs
    .map(({ item, first, last, day }) => ({
      key: item.key,
      id: item.m?.id ?? item.key,
      m: item.m,
      out: item.out,
      first,
      last,
      day,
    }))
    .reverse();
  const newest = rows[0];
  const renderRow = ({ m, out, first, last, day }: (typeof rows)[number]) =>
    out ? (
      <ChatRow id={out.localId} first={first} mine>
        {() => (
          <>
            {day ? <DayLine label={dayLabel(day)} /> : null}
            <ChatBubble
              testID="district-chat-pending"
              text={out.body}
              mine
              first={first}
              last={last}
              quote={outQuote(out.replyTo)}
              {...(out.status === 'sending'
                ? {
                    time: tr.chat.time(out.at ?? new Date().toISOString()),
                    delivery: 'sending' as const,
                  }
                : { state: 'failed' as const })}
              failedText={
                out.status === 'failed' && out.errorCode ? tr.errors[out.errorCode] : undefined
              }
              onRetry={out.status === 'failed' && canRetry(out) ? () => retry(out) : undefined}
              onDiscard={
                out.status === 'failed'
                  ? () => dispatch({ type: 'remove', localId: out.localId })
                  : undefined
              }
            />
          </>
        )}
      </ChatRow>
    ) : m ? (
      <ChatRow id={m.id} first={first} mine={m.fromMe}>
        {(jumpTo) => (
          <>
            {day ? <DayLine label={dayLabel(day)} /> : null}
            {m.id === fresh ? <DayLine fresh label={tr.chat.newLine} /> : null}
            <ChatBubble
              testID={m.fromMe ? 'district-chat-mine' : 'district-chat-theirs'}
              skin={balloonOf(m)}
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
                        testID: 'district-chat-delete',
                        onPress: () => remove.mutate(m.id),
                      },
                    ]
                  : [
                      {
                        label: tr.chat.report,
                        icon: 'alert',
                        negative: true,
                        testID: 'district-chat-report',
                        onPress: () => setReporting(m),
                      },
                      {
                        label: tr.venueChat.mute,
                        icon: 'mute',
                        testID: 'district-chat-mute',
                        onPress: () => mute.mutate(m),
                      },
                      // Only a profiled message opens a request (the sender's name is known).
                      ...(m.profiled
                        ? [
                            {
                              label: tr.district.room.friendRequest,
                              icon: 'invite' as const,
                              testID: 'district-chat-request',
                              onPress: () => setAsking(m),
                            },
                          ]
                        : []),
                    ]
              }
              first={first}
              last={last}
              time={tr.chat.time(m.createdAt)}
              name={m.fromMe ? undefined : senderLabel(m)}
              avatar={m.fromMe ? undefined : faceOf(m, AVATAR_SIZE.sm)}
              nameInk={m.fromMe ? undefined : inkOf(senderLabel(m))}
              onPressSender={m.fromMe ? undefined : () => setPerson(m)}
            />
          </>
        )}
      </ChatRow>
    ) : (
      <View />
    );

  const profiled = identity === 'profiled';
  const ownFace = profiled ? (
    <Avatar kind="profile" name={photo.name} photoUrl={photo.url} size="sm" />
  ) : look ? (
    <LookAvatar look={look} size={SEMT.identity.face} />
  ) : (
    <Avatar kind="default" size="sm" />
  );
  const leftH = session
    ? Math.floor(Math.ceil(secondsUntil(session.endsAt, new Date(at)) / 60) / 60)
    : 0;
  const leftM = session ? Math.ceil(secondsUntil(session.endsAt, new Date(at)) / 60) % 60 : 0;

  return (
    <ChatScreen
      wall="mekan"
      testID="district-chat-messages"
      startAtEnd
      newestKey={newest?.key}
      newestMine={newest ? (newest.out ? true : newest.m?.fromMe) : undefined}
      list={{
        items: rows,
        renderItem: renderRow,
        openAt: fresh,
        timeOf: (row) => Date.parse(row.m?.createdAt ?? row.out?.at ?? ''),
        onReachOld: older.loadOlder,
        older: (
          <OlderFoot
            loading={older.loadingOlder}
            failed={older.olderFailed}
            onRetry={older.retryOlder}
          />
        ),
        empty:
          state.isPending || page.isPending ? (
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
          ) : (
            <FirstHere />
          ),
      }}
      top={
        <View style={{ gap: SEMT.timeChip.top }}>
          <ChatTopBar
            onBack={() => router.back()}
            split
            title={tr.district.room.title(name)}
            titleLines={1}
            actions={
              <IconButton
                icon="ellipsis-vertical"
                glyph={<MoreDots />}
                label={tr.district.room.options}
                testID="district-chat-options"
                onPress={() => setOptions(true)}
              />
            }
          />
          {session ? (
            <View style={{ alignItems: 'center' }}>
              {grace && continues ? (
                <TimeChip
                  testID="district-time"
                  text={tr.district.continueChip}
                  label={tr.district.continueChipLabel}
                  onPress={() => setDismissed(null)}
                />
              ) : (
                <TimeChip
                  testID="district-time"
                  text={tr.district.left(leftH, leftM)}
                  label={tr.district.leftLabel(leftH, leftM)}
                />
              )}
            </View>
          ) : null}
        </View>
      }
      composer={
        <DraftComposer
          inputTestID="district-chat-input"
          sendTestID="district-chat-send"
          sendLabel={tr.venueChat.send}
          placeholder={tr.district.room.placeholder(name)}
          prepare={prepareVenueMessage}
          blocked={!session}
          maxLength={VENUE_CHAT.maxLength}
          onSend={submit}
          replyTo={reply.target?.quote}
          onCancelReply={reply.clear}
          above={
            <View style={{ gap: SPACING[1.5] }}>
              {note ? <Banner tone="info" body={note} testID="district-chat-note" /> : null}
              {session ? (
                <IdentityStrip
                  face={ownFace}
                  mode={identity}
                  busy={setIdentity.isPending}
                  onChange={(mode) => {
                    if (mode === identity || setIdentity.isPending) return;
                    if (session.identitySwitchUsed) {
                      flash(tr.errors.identity_switch_used);
                      return;
                    }
                    setIdentity.mutate(mode);
                  }}
                />
              ) : null}
            </View>
          }
        />
      }
    >
      {session ? (
        <ContinueSheet
          visible={sheetOpen}
          session={session}
          onClose={() => setDismissed(session.endsAt)}
        />
      ) : null}
      <OptionsSheet
        visible={options}
        onClose={() => setOptions(false)}
        onChanged={refresh}
        onEnd={() => {
          setOptions(false);
          setClosing(true);
        }}
      />
      <EndSheet visible={closing} onClose={() => setClosing(false)} />
      <Sheet visible={person !== null} onClose={() => setPerson(null)}>
        {person ? (
          <>
            <View className="flex-row items-center" style={{ gap: SPACING[3] }}>
              {faceOf(person, AVATAR_SIZE.xl)}
              <View className="flex-1">
                <T v="title">{senderLabel(person)}</T>
                <T v="fine">
                  {person.profiled ? tr.venueChat.profiledPerson : tr.venueChat.anonymousPerson}
                </T>
              </View>
            </View>
            {person.profiled ? (
              <Btn
                block
                label={tr.venueChat.seeProfile}
                testID="district-chat-see-profile"
                onPress={() => {
                  const id = person.id;
                  setPerson(null);
                  router.push({ pathname: '/district/[messageId]', params: { messageId: id } });
                }}
              />
            ) : (
              <T v="fine">{tr.venueChat.anonymousNote}</T>
            )}
            <Menu>
              <MenuItem
                label={tr.venueChat.mute}
                icon="volume-mute-outline"
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
            </Menu>
            <Btn block variant="glassy" label={tr.common.close} onPress={() => setPerson(null)} />
          </>
        ) : null}
      </Sheet>
      <Sheet
        visible={asking !== null}
        onClose={() => setAsking(null)}
        title={tr.venueChat.requestConfirmTitle}
      >
        <T ink>{tr.venueChat.requestConfirmBody}</T>
        {request.isError ? <Banner tone="danger" body={errorMessage(request.error)} /> : null}
        <View className="gap-2.5">
          <Btn
            block
            testID="district-chat-request-confirm"
            label={tr.venueChat.requestConfirm}
            onPress={() => asking && !request.isPending && request.mutate(asking.id)}
            loading={request.isPending}
          />
          <Btn block variant="glassy" label={tr.common.cancel} onPress={() => setAsking(null)} />
        </View>
      </Sheet>
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting !== null}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => reporting && report.mutate({ id: reporting.id, reason })}
        onClose={() => setReporting(null)}
      />
    </ChatScreen>
  );
}
// After the extra time, the state is read a little later: the server's minute closes it.
const GRACE_READ_AFTER_MS = 1500;

// SemtOdaBos: the bench, "Bugün ilk sen geldin" and the words.
function FirstHere() {
  const [width, setWidth] = useState(0);
  return (
    <View
      className="flex-1 justify-center"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: SEMT.empty.gap }}
      testID="district-chat-empty"
    >
      {width > 0 ? <BenchScene label={tr.district.room.emptyLabel} width={width} /> : null}
      <View style={{ marginTop: SEMT.scene.titleTop - SEMT.empty.gap }}>
        <T v="title" accessibilityRole="header">
          {tr.district.room.emptyTitle}
        </T>
      </View>
      <T v="body">{tr.district.room.emptyBody}</T>
    </View>
  );
}

// `.idst`: who the viewer writes as, and Anonim | Profilim (one change per session; the seg wraps
// under the words at 320 dp).
function IdentityStrip({
  face,
  mode,
  busy,
  onChange,
}: {
  face: ReactNode;
  mode: VenueChatMode;
  busy: boolean;
  onChange: (mode: VenueChatMode) => void;
}) {
  const s = SEMT.identity;
  return (
    <Glass
      sm
      testID="district-chat-mode"
      radius={s.radius}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: s.gap,
        rowGap: s.rowGap,
        padding: s.pad,
        borderRadius: s.radius,
        opacity: busy ? BUSY_OPACITY : 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.labelGap,
          flexShrink: 1,
        }}
      >
        {face}
        <T v="fine" style={{ flexShrink: 1 }}>
          {mode === 'profiled'
            ? tr.district.room.writingProfiled
            : tr.district.room.writingAnonymous}
        </T>
      </View>
      <View style={{ marginLeft: 'auto' }}>
        <Seg
          value={mode}
          onChange={onChange}
          accessibilityLabel={tr.district.room.identityLabel}
          options={[
            {
              value: 'anonymous',
              label: tr.district.room.anonymous,
              testID: 'district-mode-anonymous',
            },
            {
              value: 'profiled',
              label: tr.district.room.profiled,
              testID: 'district-mode-profiled',
            },
          ]}
        />
      </View>
    </Glass>
  );
}
const BUSY_OPACITY = 0.6;

// SemtDevam: the session's 2 hours are over; Evet gives 2 more in the same room, Hayır closes it.
// Out of the sheet (a tap outside, back) is no answer: the extra time runs on (§8.3).
function ContinueSheet({
  visible,
  session,
  onClose,
}: {
  visible: boolean;
  session: DistrictSession;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const extend = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => districtApi.extend(),
    onSuccess: (next) => {
      putDistrictState(queryClient, next);
      track('district_extended', {});
    },
  });
  const leave = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => districtApi.leave(),
    onSuccess: (next) => putDistrictState(queryClient, next),
  });
  const error = extend.error ?? leave.error;
  const busy = extend.isPending || leave.isPending;
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tr.district.cont.title}
      footer={
        <Foot>
          {error ? <WarnRow tone="danger" text={errorMessage(error)} /> : null}
          <Btn
            block
            label={tr.district.cont.yes}
            testID="district-continue-yes"
            loading={extend.isPending}
            disabled={leave.isPending}
            onPress={() => !busy && extend.mutate()}
          />
          <Btn
            block
            variant="glassy"
            label={tr.district.cont.no}
            testID="district-continue-no"
            loading={leave.isPending}
            disabled={extend.isPending}
            onPress={() => !busy && leave.mutate()}
          />
        </Foot>
      }
    >
      <T v="body">{tr.district.cont.body}</T>
      {visible ? <GraceBar graceEndsAt={session.graceEndsAt} /> : null}
    </Sheet>
  );
}

// `.prog` and the words under it: the extra time going down, linear (semteGit.continueBar).
function GraceBar({ graceEndsAt }: { graceEndsAt: string }) {
  const { scheme } = useKit();
  const reduce = useReduceMotion();
  const now = useNow(1000);
  const total = MOTION.semteGit.continueBar.durationS;
  const left = secondsUntil(graceEndsAt, new Date(now));
  const [fill] = useState(() => new Animated.Value(Math.min(1, left / total)));
  useEffect(() => {
    const ms = Math.max(0, Date.parse(graceEndsAt) - Date.now());
    fill.setValue(Math.min(1, ms / 1000 / total));
    if (reduce) return undefined;
    const run = Animated.timing(fill, {
      toValue: 0,
      duration: ms,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [graceEndsAt, fill, total, reduce]);
  const p = SEMT.progress;
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <View style={{ gap: SPACING[2] }}>
      <View
        style={{
          height: p.height,
          borderRadius: p.height / 2,
          backgroundColor: p[scheme].track,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: p.height,
            width: '100%',
            borderRadius: p.height / 2,
            backgroundColor: p[scheme].fill,
            transformOrigin: 'left',
            transform: [{ scaleX: reduce ? Math.min(1, left / total) : fill }],
          }}
        />
      </View>
      <T v="fine" accessibilityLiveRegion="polite">
        {tr.district.cont.closesIn(clock)}
      </T>
    </View>
  );
}

// A set worn whole, written anonymously: the set's balloon (as the venue chat's).
function balloonOf(m: VenueChatMessage): SetBalloon | null {
  if (m.profiled || !m.senderLook) return null;
  const set = setBalloonOf(m.senderLook);
  return set === 'elf' || set === 'ninja' ? SET_BALLOONS[set] : null;
}
