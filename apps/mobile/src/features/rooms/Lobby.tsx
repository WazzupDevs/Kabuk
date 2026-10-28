import { isIntent, JOIN_REQUEST_TTL_SECONDS, requesterStatus } from '@shared/rooms.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
import { lobbyActions, requestGone, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useReducer, useState } from 'react';
import { View } from 'react-native';

import { Btn, GlassList, Li, Sec, T, Tag, Thumb, useKit } from '@/aura/kit';
import { Pips } from '@/aura/Pips';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { registerForPush } from '@/features/push/push';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNowUntil } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

import { roomKeys, useMyRequest, useVenueTables, type VenueTable } from './queries';
import { SpotHeading } from './SpotHeading';
import { TABLE_ICON_IMAGES } from './tableIconImages';

// After "Kabul edildi" the table opens by itself (v46: the row's note, then the table).
const OPEN_AFTER_ACCEPT_MS = 1800;
// An accept is news only this long after its 60 s window: a request is answered inside it.
const ACCEPT_NEWS_MS = 30_000;
// Accepts already acted on, or found old (this run of the app).
const doneAccepts = new Set<string>();

type Props = {
  venueId: string;
  sessionId: string;
  // The check-in's start: only its own requests count.
  since: string;
  // The person's spot, and whether the venue has spots at all (docs/SPEC_V3.md §4.3).
  mySpotId: string | null;
  venueHasSpots: boolean;
  state: TableState;
  // The person's table: left out of the lists; its people count for the 12.
  roomId: string | null;
  myPhones: number;
  // A profiled identity without a visible photo can neither ask nor sit (photo_required).
  needsPhoto: boolean;
};

// Mekan's lobby (v46 "mekan"; docs/SPEC_V4.md §4.E): "Açık masalar" with "Katıl" and "Süren
// masalar" with "Bu masadayım", one read of venue_tables. "Katıl": a person without a table alone, an
// owner with the whole table; a participant leaves first. A request waits 60 s on its row; a refusal
// and a time-out look the same ("Masa şu an müsait değil", rule 5); an accepted one opens the table.
// At a venue with spots the tables are grouped by spot, the person's own first.
export function Lobby({
  venueId,
  sessionId,
  since,
  mySpotId,
  venueHasSpots,
  state,
  roomId,
  myPhones,
  needsPhoto,
}: Props) {
  const queryClient = useQueryClient();
  const tables = useVenueTables(venueId);
  const mine = useMyRequest(sessionId, since);
  // The clock runs only while the person's request waits (its countdown, then its time-out); the
  // rest of the time the lobby is not drawn again each second.
  const now = useNowUntil(
    mine.data && mine.data.status !== 'accepted' ? mine.data.expiresAt : null,
    1000,
  );
  // The request this screen sent, and to which table; the plain row once it is gone.
  const [asked, setAsked] = useState<{ roomId: string; name: string } | null>(null);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ table, asMember }: { table: VenueTable; asMember: boolean }) =>
      roomsApi.requestJoin(table.roomId, asMember),
    onSuccess: (_data, { table, asMember }) => {
      track('join_requested', { as_member: asMember });
      // The spec's second moment to ask for push (MVP_SPEC §9): sending a join request.
      void registerForPush();
      setAsked({ roomId: table.roomId, name: table.name });
      void queryClient.invalidateQueries({ queryKey: roomKeys.myRequest });
    },
    onError: (err) => {
      // The table filled, closed or moved meanwhile: the lobby is read again.
      if (err instanceof ApiError && (requestGone(err.code) || err.code === 'table_full')) {
        void queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(venueId) });
      }
    },
  });

  const status = mine.data ? requesterStatus(mine.data.status, mine.data.expiresAt, now) : null;
  const waitingOn = mine.data && status === 'pending' ? mine.data.roomId : null;
  const unavailable = mine.data && status === 'unavailable' ? mine.data.roomId : null;
  // An accept counts once, while it is news (audit VEN-3): an old one sent the person back to a
  // table it had left on every visit, counted again, and kept "Kabul edildi" on its row with no
  // "Katıl" for the whole check-in.
  const [, recheck] = useReducer((n: number) => n + 1, 0);
  const acceptedId = mine.data && status === 'accepted' ? mine.data.id : null;
  const acceptedEnds = mine.data?.expiresAt;
  const accepted =
    mine.data && acceptedId && !doneAccepts.has(acceptedId) ? mine.data.roomId : null;

  // Accepted: the person sits at that table now (Masadakiler, K-69); it opens after the note.
  useEffect(() => {
    if (!accepted || !acceptedId || !acceptedEnds) return;
    if (Date.now() > Date.parse(acceptedEnds) + ACCEPT_NEWS_MS) {
      doneAccepts.add(acceptedId);
      recheck();
      return;
    }
    track('table_joined', { via: 'request' });
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    const timer = setTimeout(() => {
      doneAccepts.add(acceptedId);
      router.push({ pathname: '/room/[id]', params: { id: accepted } });
    }, OPEN_AFTER_ACCEPT_MS);
    return () => clearTimeout(timer);
  }, [accepted, acceptedId, acceptedEnds, queryClient]);
  const askedRoom = asked?.roomId;
  useEffect(() => {
    if (unavailable && unavailable === askedRoom) track('join_unavailable', { as_member: false });
  }, [unavailable, askedRoom]);

  const others = (list: VenueTable[]) => list.filter((t) => t.roomId !== roomId);
  const open = others(tables.data?.open ?? []);
  const running = others(tables.data?.running ?? []);

  const ownerNote =
    state === 'private' || state === 'open'
      ? myPhones > 1
        ? tr.lobby.bringsTable(myPhones - 1)
        : null
      : null;
  const note = needsPhoto
    ? tr.lobby.needsPhoto
    : state === 'participant'
      ? tr.lobby.leaveFirst
      : ownerNote;

  const rowNote = (table: VenueTable): string | null => {
    if (!mine.data || mine.data.roomId !== table.roomId) return null;
    if (status === 'pending') {
      const left = Math.max(0, Math.ceil((Date.parse(mine.data.expiresAt) - now) / 1000));
      return tr.lobby.waiting(Math.min(left, JOIN_REQUEST_TTL_SECONDS));
    }
    if (status === 'accepted')
      return accepted === table.roomId ? tr.lobby.accepted(table.name) : null;
    if (asked?.roomId === table.roomId) return tr.lobby.unavailable;
    return null;
  };

  const groups = (list: VenueTable[]) =>
    groupRoomsBySpot(
      list.map((t) => ({ ...t, spot_id: t.spotId, spot_name: t.spotName })),
      mySpotId,
    );

  return (
    <View className="gap-3" testID="lobby">
      <SectionHead title={tr.lobby.openTitle} count={open.length} />
      {note ? <T v="fine">{note}</T> : null}
      {tables.isPending ? (
        <View className="items-center py-4" accessibilityLabel={tr.lobby.loading}>
          <Loader />
        </View>
      ) : tables.isError ? (
        <EmptyState
          kind="error"
          body={errorMessage(tables.error)}
          action={{ label: tr.common.retry, onPress: () => void tables.refetch() }}
        />
      ) : open.length === 0 ? (
        <EmptyState kind="empty" title={tr.lobby.emptyTitle} body={tr.lobby.emptyBody} />
      ) : (
        groups(open).map((group) => (
          <View key={group.spotId ?? 'none'} className="gap-2.5">
            {venueHasSpots ? (
              <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
            ) : null}
            <GlassList>
              {group.rooms.map((table) => {
                const actions = lobbyActions(state, myPhones, table.phones);
                const busy = request.isPending && request.variables?.table.roomId === table.roomId;
                const waiting = waitingOn === table.roomId;
                return (
                  <LobbyRow
                    key={table.roomId}
                    table={table}
                    note={rowNote(table)}
                    action={
                      actions.join && !needsPhoto && !waiting && accepted !== table.roomId ? (
                        <Btn
                          sm
                          icon="forward"
                          testID={`join-${table.name}`}
                          label={tr.lobby.join}
                          disabled={actions.full || waitingOn !== null}
                          loading={busy}
                          onPress={() => request.mutate({ table, asMember: false })}
                        />
                      ) : waiting ? (
                        <WaitingSlot />
                      ) : null
                    }
                  />
                );
              })}
            </GlassList>
          </View>
        ))
      )}

      <SectionHead title={tr.lobby.runningTitle} count={running.length} />
      <T v="fine">
        {state === 'none' && !needsPhoto ? tr.lobby.runningNote : tr.lobby.runningNoteShort}
      </T>
      {/* By spot as well, the person's own first (audit VEN-13): "Bu masadayım" to a table at
          another spot only met different_spot. */}
      {groups(running).map((group) => (
        <View key={group.spotId ?? 'none'} className="gap-2.5">
          {venueHasSpots ? (
            <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
          ) : null}
          <GlassList>
            {group.rooms.map((table) => {
              const actions = lobbyActions(state, myPhones, table.phones);
              const busy = request.isPending && request.variables?.table.roomId === table.roomId;
              const waiting = waitingOn === table.roomId;
              return (
                <LobbyRow
                  key={table.roomId}
                  table={table}
                  note={rowNote(table)}
                  action={
                    actions.member && !needsPhoto && !waiting && accepted !== table.roomId ? (
                      <Btn
                        sm
                        variant="glassy"
                        testID={`here-${table.name}`}
                        label={tr.lobby.here}
                        disabled={waitingOn !== null}
                        loading={busy}
                        onPress={() => request.mutate({ table, asMember: true })}
                      />
                    ) : waiting ? (
                      <WaitingSlot />
                    ) : null
                  }
                />
              );
            })}
          </GlassList>
        </View>
      ))}

      {request.isError ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(request.error)}
        </T>
      ) : null}
    </View>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return <Sec title={title} note={tr.lobby.tables(count)} />;
}

// A table in the lobby (docs/design/aura → Mekan: `.li`): its picture, name, headcount as pips and
// the request's note or the tags; its action at the right. No person's name.
function LobbyRow({
  table,
  note,
  action,
}: {
  table: VenueTable;
  note: string | null;
  action?: ReactNode;
}) {
  const intent = isIntent(table.intent) ? table.intent : null;
  return (
    <Li testID={`lobby-row-${table.name}`}>
      <Thumb source={table.icon ? TABLE_ICON_IMAGES[table.icon] : undefined} />
      <View style={{ flex: 1, gap: ROW_GAP }}>
        <T v="h3">{table.name}</T>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: KIT.size.chipsGap,
          }}
        >
          <Pips count={table.phones} />
          <T v="fine">{tr.venue.people(table.phones)}</T>
          {note ? null : intent ? (
            <Tag tone={intent === 'game' ? 'purple' : 'pink'} label={tr.intents[intent]} />
          ) : null}
          {note || !table.gameTag ? null : <Tag label={tr.concepts[table.gameTag]} />}
        </View>
        {note ? (
          <T v="fine" accessibilityLiveRegion="polite">
            {note}
          </T>
        ) : null}
      </View>
      {action}
    </Li>
  );
}
const ROW_GAP = 5;

// The pending request in the action's place: the meeting capsules on a raised capsule.
function WaitingSlot() {
  const { c } = useKit();
  return (
    <View
      style={{
        height: KIT.size.btnSm,
        paddingHorizontal: KIT.size.btnPadXSm + SPACING[2],
        borderRadius: KIT.size.btnSm,
        backgroundColor: c.raised,
        borderWidth: KIT.size.edge,
        borderColor: c.raisedEdge,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Loader kind="meet" size={KIT.size.iconSm} delay={0} label={null} />
    </View>
  );
}
