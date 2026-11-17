import { requestGone } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { Av, T, Tag, useKit } from '@/aura/kit';
import { Peek } from '@/aura/Peek';
import { AVATAR_SIZE } from '@/components/Avatar';
import { PopIn } from '@/aura/PopIn';
import { closeAllSheets } from '@/components/sheetCloser';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { useNowUntil } from '@/lib/useNow';
import { AURA } from '@/theme/aura';
import type { ConfirmOptions } from '@/lib/overlayStore';
import { Dialog } from '@/motion/Dialog';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { haptic } from '@/lib/haptics';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { roomKeys, useCurrentRoom, useIncomingRequests, useRequestProfile } from './queries';
import { useLabOff } from '@/lib/drawLab';
import { shadowParts } from '@/components/NativeShadow';

// `ownerSessionId`: this person, when it owns the table; null otherwise (no requests to answer).
type Props = { roomId: string; ownerSessionId: string | null; phones: number; floating?: boolean };

// Whether the table screen is open: there the card sits in the screen (skall tuvali,
// MasaIstekGelsin); anywhere else it floats at the top.
const useTableScreenOpen = create<{ open: number }>(() => ({ open: 0 }));
export function useMarkTableScreen() {
  useEffect(() => {
    useTableScreenOpen.setState((s) => ({ open: s.open + 1 }));
    return () => useTableScreenOpen.setState((s) => ({ open: s.open - 1 }));
  }, []);
}

// The owner's request card wherever the person is in the app (docs/SPEC_V4.md §4.E): whatever tab
// is open, the 60 seconds are not missed. Mounted once, in the app's layout; on the table screen
// the screen shows it.
export function IncomingRequestHost() {
  const table = useActiveTable();
  const sessionId = table.data?.id;
  const room = useCurrentRoom(table.data).data;
  const onTable = useTableScreenOpen((s) => s.open > 0);
  const owns =
    !!room &&
    !!sessionId &&
    (room.status === 'waiting' || room.status === 'active') &&
    room.owner_session_id === sessionId;
  return room && owns && !onTable ? (
    <IncomingRequest
      floating
      roomId={room.id}
      ownerSessionId={sessionId ?? null}
      phones={room.phones}
    />
  ) : null;
}

// The owner's 60 second window (docs/SPEC_V4.md §4.E; skall tuvali: MasaIstekGelsin,
// MasaIstekAnonim, MasaIstekMasa, MasaIstekDolu, MasaIstekGeliyor): who asks, how (profiled,
// anonymous, a table of N with the one who asked) and the seconds left, then "Reddet" and "Kabul
// et". A table that would pass 12 people cannot be accepted. A "Kabul" that comes too late (the
// requester moved meanwhile) says "Bu masa artık müsait değil." with only "Kapat"; an accepted
// table says it is coming for a few seconds. A requester who asked with its profile shows its
// name, age and photo, read while the request waits (rule 4); the seconds and the buttons never
// wait for it.
export function IncomingRequest({ roomId, ownerSessionId, phones, floating }: Props) {
  const { shape, colors } = useTheme();
  const k = useKit();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const requests = useIncomingRequests(roomId, ownerSessionId);
  // The clock runs only while a request's window is open (the latest one's end).
  const latest = (requests.data ?? []).reduce<string | null>(
    (last, r) =>
      last === null || Date.parse(r.expires_at) > Date.parse(last) ? r.expires_at : last,
    null,
  );
  const now = useNowUntil(latest, 1000);
  // Requests whose "Kabul" came too late, and the one whose card says so now.
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  const [gone, setGone] = useState<string | null>(null);
  const [coming, setComing] = useState<{ alias: string; phones: number } | null>(null);
  const request = requests.data?.find(
    (r) => (Date.parse(r.expires_at) > now || r.id === gone) && !closed.has(r.id),
  );
  const profile = useRequestProfile(request?.id, request?.requester_profiled === true);
  // The dialog opens a Modal: a focused text field lets go as it does (lib/modalKeyboard).
  useLeaveKeyboard(request !== undefined);

  const respond = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, accept }: { id: string; accept: boolean; member: boolean }) =>
      roomsApi.respond(id, accept),
    onSuccess: (_data, { accept, member }) => {
      if (accept) {
        haptic('requestAccepted');
        track('join_accepted', { as_member: member });
        if (request && request.requester_phones > 1) {
          setComing({ alias: request.requester_alias, phones: request.requester_phones });
        }
      }
    },
    onError: (err, { id }) => {
      if (err instanceof ApiError && requestGone(err.code)) setGone(id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.incoming(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      // The table card's people.
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.people(roomId) });
    },
  });

  // A request coming in is felt once.
  const requestId = request?.id;
  const felt = useRef<string | null>(null);
  useEffect(() => {
    if (!requestId || felt.current === requestId) return;
    felt.current = requestId;
    haptic('incomingRequest');
    // No sheet over the card while its seconds run.
    closeAllSheets();
  }, [requestId]);
  useEffect(() => {
    if (!coming) return undefined;
    const timer = setTimeout(() => setComing(null), COMING_MS);
    return () => clearTimeout(timer);
  }, [coming]);

  // The card's soft shadow natively (NativeShadow.tsx): it pops in with a bounce.
  const shadow = shadowParts(
    useLabOff('golge'),
    KIT.requestShadow,
    k.c.glassInset,
    KIT.size.glassRadius,
    true,
    KIT.size.edge,
  );
  const frame = (children: ReactNode, testID: string) => (
    <View
      testID={testID}
      pointerEvents="box-none"
      style={
        floating
          ? {
              position: 'absolute',
              left: shape.screenPadding,
              right: shape.screenPadding,
              top: insets.top + SPACING[2],
            }
          : // Room for the buddies over the card.
            { marginTop: AURA.peek.up }
      }
    >
      {/* It comes up with a bounce, a near-opaque glass pane (docs/design/aura → Gelen istek). */}
      <PopIn key={testID}>
        {/* docs/design/aura → MasaIstek: the table's buddies look over the card. */}
        {floating ? null : <Peek kind="request" />}
        <View
          style={{
            ...gradientStyle(k.c.sheet),
            backgroundColor: k.c.sheetBase,
            gap: KIT.size.padLg - SPACING[1.5],
            padding: KIT.size.pad,
            borderRadius: KIT.size.glassRadius,
            borderWidth: KIT.size.edge,
            borderColor: k.c.glassEdge,
            boxShadow: shadow.boxShadow,
          }}
        >
          {shadow.node}
          {children}
        </View>
      </PopIn>
    </View>
  );

  if (!request) {
    return coming
      ? frame(
          <View style={{ gap: KIT.size.tagGap }}>
            <T v="h3">{tr.rooms.comingTitle(coming.alias, coming.phones)}</T>
            <T v="fine">{tr.rooms.comingBody}</T>
          </View>,
          'request-coming',
        )
      : null;
  }
  const seconds = Math.max(0, Math.ceil((Date.parse(request.expires_at) - now) / 1000));
  const member = request.as_member;

  const noop = () => undefined;
  // Outside and back leave the request unanswered (the seconds run out as if unseen, rule 5).
  const dismiss = () => {
    if (respond.isPending) return;
    setClosed((ids) => new Set([...ids, request.id]));
    respond.reset();
  };
  const modal = (
    options: ConfirmOptions,
    running: 'confirm' | 'other' | null,
    other?: () => void,
  ) => (
    <Modal
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      visible
      onRequestClose={dismiss}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Dialog
          options={options}
          visible
          running={running}
          onConfirm={options.onConfirm as () => void}
          onOther={other ?? noop}
          onCancel={dismiss}
          onHidden={noop}
        />
      </GestureHandlerRootView>
    </Modal>
  );

  if (request.id === gone) {
    return modal(
      {
        title: tr.rooms.requestGone,
        note: '',
        tone: 'plain',
        confirmLabel: tr.common.close,
        testID: 'request-gone',
        onConfirm: () => {
          setClosed((ids) => new Set([...ids, request.id]));
          setGone(null);
          respond.reset();
        },
      },
      null,
    );
  }

  const profiled = request.requester_profiled;
  const person =
    profiled && profile.data
      ? tr.participation.previewName(
          profile.data.displayName ?? request.requester_alias,
          profile.data.age,
        )
      : null;
  const group = request.requester_phones > 1;
  const full = phones + request.requester_phones > MAX_TABLE_PHONES;
  const faceName = profile.data?.displayName ?? request.requester_alias;
  // MasaIstekGelen: the table's face (a letter here: the request carries no table picture), the
  // title, one line, the one who asks (face 40, name and age, how), the seconds, "Kabul et" and
  // "Reddet", what "Reddet" shows the other side.
  const face =
    profiled && profile.isPending ? (
      <Placeholder round label={tr.rooms.requestProfileLoading} />
    ) : (
      <Av
        size="lg"
        name={profiled && profile.data ? faceName : request.requester_alias}
        photoUrl={!group && profiled ? profile.data?.photoUrl : undefined}
      />
    );
  const title = member
    ? tr.rooms.memberClaims(request.requester_alias)
    : tr.rooms.wantsToJoin(group ? request.requester_alias : (person ?? request.requester_alias));
  const note = group
    ? tr.rooms.groupNote(request.requester_phones, phones + request.requester_phones)
    : tr.rooms.memberNote;
  const sub = group
    ? person
      ? tr.rooms.askedBy(faceName)
      : tr.rooms.askedByAnonymous
    : member
      ? tr.rooms.memberAsk
      : null;
  const asker = (
    <View
      testID="request-card"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: KIT.size.chipGap + SPACING[1],
        padding: SPACING[2.5],
        borderRadius: KIT.size.glassRadiusSm,
        backgroundColor: colors.surface2,
      }}
    >
      <View testID={profiled ? 'request-profile' : undefined}>
        <Av
          size="list"
          name={profiled && profile.data ? faceName : request.requester_alias}
          photoUrl={profiled ? profile.data?.photoUrl : undefined}
        />
      </View>
      <View style={{ flex: 1, gap: SPACING[0.5] }}>
        <T v="h3">{person ?? (group ? tr.rooms.anonymous : request.requester_alias)}</T>
        {sub ? <T v="fine">{sub}</T> : null}
      </View>
      <Tag label={profiled ? tr.rooms.withProfile : tr.rooms.anonymous} />
    </View>
  );
  const extra = (
    <View style={{ gap: SPACING[2], alignItems: 'center' }}>
      {asker}
      <T v="fine" color={colors.accent} center>
        {tr.rooms.secondsLeft(seconds)}
      </T>
      {full ? (
        <T v="fine" color={KIT.danger} center>
          {tr.rooms.tooMany}
        </T>
      ) : null}
      {respond.isError ? (
        <T v="fine" color={KIT.danger} center>
          {errorMessage(respond.error)}
        </T>
      ) : null}
    </View>
  );
  const answer = (accept: boolean) => {
    if (!respond.isPending) respond.mutate({ id: request.id, accept, member });
  };
  const running = respond.isPending ? (respond.variables.accept ? 'confirm' : 'other') : null;
  return modal(
    {
      title,
      note,
      face,
      tone: 'plain',
      confirmLabel: tr.rooms.accept,
      confirmIcon: 'check',
      confirmDisabled: full,
      testID: 'join-accept',
      other: { label: tr.rooms.decline, onPress: noop },
      children: extra,
      footnote: member ? tr.rooms.declineMemberNote : tr.rooms.declineNote,
      onConfirm: () => answer(true),
    },
    running,
    () => answer(false),
  );
}

// An accepted table's "geliyor" note stays this long.
const COMING_MS = 6000;

// The profile's place while it loads: the photo's circle, or a line of the name's height.
function Placeholder({ round, label }: { round?: boolean; label?: string }) {
  const { colors, shape } = useTheme();
  const side = AVATAR_SIZE.xl;
  return (
    <View
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={{
        width: round ? side : '55%',
        height: round ? side : ICON.lg,
        borderRadius: round ? shape.radius.pill : shape.radius.sm,
        backgroundColor: colors.surface2,
      }}
    />
  );
}
