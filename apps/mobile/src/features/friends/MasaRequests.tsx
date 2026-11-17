import { requestGone } from '@shared/tableCard.ts';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import type { InviteNotification } from '@shared/api/friends.ts';
import { inviteState } from '@shared/notifications.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Av, T } from '@/aura/kit';
import { Avatar } from '@/components/Avatar';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import {
  roomKeys,
  useCurrentRoom,
  useIncomingRequests,
  useRequestProfile,
} from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { useNowUntil } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { FLAT } from '@/theme/flatLists';

import { friendKeys, useNotifications } from './queries';
import { RequestRowView } from './RequestRowView';

type JoinRequest = NonNullable<ReturnType<typeof useIncomingRequests>['data']>[number];

export type MasaData = {
  pending: boolean;
  error: unknown;
  refetch: () => void;
  // The caller's own table (it owns it), when a request can wait on it.
  roomId: string | null;
  phones: number;
  joins: readonly JoinRequest[];
  invites: readonly InviteNotification[];
  any: boolean;
};

// What waits for the caller about tables, read from the ways that already exist: the join
// requests to the table the caller owns (rooms' `join_requests` read the table screen and the
// floating card use) and the table invites of friends/notifications. What the caller sent to
// other tables is not here (rule 5: its answer is the same silence for a decline and a timeout).
export function useMasaRequestData(nowMs: number): MasaData {
  const table = useActiveTable();
  const room = useCurrentRoom(table.data).data;
  const sessionId = table.data?.id ?? null;
  const owns =
    !!room &&
    !!sessionId &&
    (room.status === 'waiting' || room.status === 'active') &&
    room.owner_session_id === sessionId;
  const incoming = useIncomingRequests(room?.id ?? '', owns ? sessionId : null);
  const notes = useNotifications();

  const joins = owns ? (incoming.data ?? []).filter((r) => Date.parse(r.expires_at) > nowMs) : [];
  const invites = (notes.data?.notifications ?? []).filter(
    (n): n is InviteNotification => n.kind === 'invite',
  );
  const open = invites.filter((n) => inviteState(n.state, n.expiresAt, nowMs) === 'open');
  const error = (owns ? incoming.error : null) ?? notes.error;
  return {
    // The table read may still be on its way: the list waits only for what it needs.
    pending: table.isPending || notes.isPending || (owns && incoming.isPending),
    // A failed refresh keeps what was read (audit PRO-2).
    error: (owns && !incoming.data) || !notes.data ? error : null,
    refetch: () => {
      void table.refetch();
      void notes.refetch();
      if (owns) void incoming.refetch();
    },
    roomId: owns && room ? room.id : null,
    phones: room?.phones ?? 0,
    joins,
    invites,
    any: joins.length + open.length > 0,
  };
}

// The tab's badge adds these.
export function useMasaRequestCount(now: number): number {
  const { joins, invites } = useMasaRequestData(now);
  return (
    joins.length + invites.filter((n) => inviteState(n.state, n.expiresAt, now) === 'open').length
  );
}

// "Masa · N" (IsteklerDolu `.rqh` and `.mq` rows): the join requests of the caller's table, then the
// table invites. An invite that ran out while the list was open stays with "Süresi doldu"
// (MasaDavetSuresiDoldu); one that was already over when the list came is not listed.
export function MasaSection({ data, nowMs }: { data: MasaData; nowMs: number }) {
  const R = FLAT.request;
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set());
  const clockEnd = [...data.joins.map((r) => r.expires_at), ...data.invites.map((n) => n.expiresAt)]
    .filter((at) => Date.parse(at) > nowMs)
    .reduce<string | null>((last, at) => (last === null || at > last ? at : last), null);
  const now = useNowUntil(clockEnd, 1000);
  const open = data.invites.filter((n) => inviteState(n.state, n.expiresAt, now) === 'open');
  const fresh = open.filter((n) => !seen.has(n.inviteId));
  if (fresh.length > 0) setSeen(new Set([...seen, ...fresh.map((n) => n.inviteId)]));
  const listed = data.invites.filter(
    (n) => seen.has(n.inviteId) || open.some((o) => o.inviteId === n.inviteId),
  );
  const count = data.joins.length + open.length;
  if (data.joins.length + listed.length === 0) return null;
  return (
    <>
      <T
        v="sectionHead"
        accessibilityRole="header"
        style={{ marginTop: R.headTop, marginBottom: R.headBottom }}
      >
        {tr.messages.requestsMasaHead(count)}
      </T>
      {data.joins.map((r) => (
        <JoinRow key={r.id} request={r} roomId={data.roomId ?? ''} phones={data.phones} now={now} />
      ))}
      {listed.map((n) => (
        <InviteRow key={n.inviteId} invite={n} now={now} />
      ))}
    </>
  );
}

// A request to join the caller's table: who asks (a profiled one with name, age and photo, read
// for the owner while the request waits, rule 4; an anonymous one by its alias), the seconds left,
// "Reddet" and "Kabul et". A decline is silent (rule 5).
function JoinRow({
  request,
  roomId,
  phones,
  now,
}: {
  request: JoinRequest;
  roomId: string;
  phones: number;
  now: number;
}) {
  const queryClient = useQueryClient();
  const profiled = request.requester_profiled;
  const profile = useRequestProfile(request.id, profiled);
  const group = request.requester_phones > 1;
  const alias = request.requester_alias;
  const person =
    profiled && profile.data
      ? tr.participation.previewName(profile.data.displayName ?? alias, profile.data.age)
      : alias;
  const seconds = Math.max(0, Math.ceil((Date.parse(request.expires_at) - now) / 1000));
  const full = phones + request.requester_phones > MAX_TABLE_PHONES;
  const member = request.as_member;

  const respond = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (accept: boolean) => roomsApi.respond(request.id, accept),
    onSuccess: (_data, accept) => {
      if (!accept) return;
      haptic('requestAccepted');
      track('join_accepted', { as_member: member });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.incoming(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: roomKeys.people(roomId) });
    },
  });
  const gone =
    respond.error instanceof ApiError && requestGone(respond.error.code)
      ? tr.rooms.requestGone
      : null;
  const note = full
    ? { text: tr.rooms.tooMany, danger: true }
    : respond.isError
      ? { text: gone ?? errorMessage(respond.error), danger: true }
      : undefined;
  const kind = group
    ? tr.messages.requestsMasaGroup(request.requester_phones)
    : member
      ? tr.rooms.memberAsk
      : tr.messages.requestsMasaWants;

  return (
    <RequestRowView
      testID={`masa-request-${alias}`}
      label={`${person}. ${kind}`}
      name={group ? alias : person}
      kind={kind}
      stamp={{ text: tr.rooms.secondsLeft(seconds), color: KIT.danger }}
      face={
        group ? (
          <Avatar kind="table" alias={alias} size="xl" />
        ) : (
          <Av
            size="row"
            name={profiled ? (profile.data?.displayName ?? alias) : alias}
            photoUrl={profiled ? profile.data?.photoUrl : null}
          />
        )
      }
      decline={{
        label: tr.messages.requestsMasaDecline(person),
        testID: `masa-request-decline-${alias}`,
        disabled: respond.isPending,
        loading: respond.isPending && respond.variables === false,
        onPress: () => respond.mutate(false),
      }}
      accept={{
        text: tr.friends.accept,
        label: tr.messages.requestsMasaAccept(person),
        testID: `masa-request-accept-${alias}`,
        disabled: respond.isPending || full,
        loading: respond.isPending && respond.variables === true,
        onPress: () => respond.mutate(true),
      }}
      note={note}
    />
  );
}

// A friend's table invite (2 minutes; the table's name and phones, never the venue): "Reddet" and
// "Katıl" while it is open, its state after (MasaDavetGeldi, MasaDavetSuresiDoldu).
function InviteRow({ invite, now }: { invite: InviteNotification; now: number }) {
  const queryClient = useQueryClient();
  const checkIn = useActiveTable();
  const name = invite.displayName ?? '';
  const answer = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (accept: boolean) => roomsApi.answerInvite(invite.inviteId, accept),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['activeTable'] });
      void queryClient.invalidateQueries({ queryKey: roomKeys.current });
      void queryClient.invalidateQueries({ queryKey: friendKeys.notifications });
    },
  });
  const state = answer.isSuccess
    ? answer.variables
      ? 'joined'
      : 'declined'
    : inviteState(invite.state, invite.expiresAt, now);
  const seconds = Math.max(0, Math.ceil((Date.parse(invite.expiresAt) - now) / 1000));
  const live = state === 'open';
  const kind = live
    ? tr.messages.requestsMasaInvited
    : state === 'joined'
      ? tr.notifications.short.joined
      : state === 'declined'
        ? tr.notifications.short.declined
        : tr.notifications.short.gone;
  return (
    <RequestRowView
      testID={`masa-invite-${name}`}
      label={`${name}. ${kind}`}
      name={name}
      kind={kind}
      stamp={live ? { text: tr.invite.clock(seconds), color: KIT.danger } : undefined}
      face={<Av size="row" name={name} photoUrl={invite.photoUrl} />}
      decline={
        live
          ? {
              label: tr.messages.requestsMasaInviteDecline(name),
              testID: `masa-invite-decline-${name}`,
              disabled: answer.isPending,
              loading: answer.isPending && answer.variables === false,
              onPress: () => answer.mutate(false),
            }
          : undefined
      }
      accept={
        live
          ? {
              text: tr.notifications.join,
              label: tr.messages.requestsMasaInviteAccept(name),
              testID: `masa-invite-join-${name}`,
              disabled: answer.isPending || !checkIn.data,
              loading: answer.isPending && answer.variables === true,
              onPress: () => answer.mutate(true),
            }
          : undefined
      }
      note={answer.isError ? { text: errorMessage(answer.error), danger: true } : undefined}
    />
  );
}
