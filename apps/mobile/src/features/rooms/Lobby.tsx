import { isIntent, JOIN_REQUEST_TTL_SECONDS, requesterStatus } from '@shared/rooms.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
import { lobbyActions, requestGone, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { Button } from '@/ui/Button';
import { LobbyChip, LobbyRow, useHereGap, useLobbyGap } from '@/ui/LobbyRow';
import { EmptyLobbyCard, SectionHead, VenueNote } from '@/ui/VenueCards';

import { roomKeys, useMyRequest, useVenueTables, type VenueTable } from './queries';
import { SpotHeading } from './SpotHeading';
import { TableIcon } from './TableIcon';

// After "Kabul edildi" the table opens by itself (v46: the row's note, then the table).
const OPEN_AFTER_ACCEPT_MS = 1800;

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
  const now = useNow(1000);
  // The request this screen sent, and to which table; the plain row once it is gone.
  const [asked, setAsked] = useState<{ roomId: string; name: string } | null>(null);

  const request = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ table, asMember }: { table: VenueTable; asMember: boolean }) =>
      roomsApi.requestJoin(table.roomId, asMember),
    onSuccess: (_data, { table, asMember }) => {
      track('join_requested', { as_member: asMember });
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
  const accepted = mine.data && status === 'accepted' ? mine.data.roomId : null;
  const unavailable = mine.data && status === 'unavailable' ? mine.data.roomId : null;

  // Accepted: the person sits at that table now (Masadakiler, K-69); it opens after the note.
  useEffect(() => {
    if (!accepted) return;
    track('table_joined', { via: 'request' });
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    const timer = setTimeout(
      () => router.push({ pathname: '/room/[id]', params: { id: accepted } }),
      OPEN_AFTER_ACCEPT_MS,
    );
    return () => clearTimeout(timer);
  }, [accepted, queryClient]);
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
    if (status === 'accepted') return tr.lobby.accepted(table.name);
    if (asked?.roomId === table.roomId) return tr.lobby.unavailable;
    return null;
  };

  const groups = (list: VenueTable[]) =>
    groupRoomsBySpot(
      list.map((t) => ({ ...t, spot_id: t.spotId, spot_name: t.spotName })),
      mySpotId,
    );

  const gap = useLobbyGap();
  const hereGap = useHereGap();

  return (
    <View testID="lobby">
      <SectionHead title={tr.lobby.openTitle} count={tr.lobby.tables(open.length)} />
      {note ? <VenueNote>{note}</VenueNote> : null}
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
        <EmptyLobbyCard title={tr.lobby.emptyTitle} body={tr.lobby.emptyBody} />
      ) : (
        <View style={{ gap }}>
          {groups(open).map((group) => (
            <View key={group.spotId ?? 'none'} style={{ gap }}>
              {venueHasSpots ? (
                <SpotHeading spotId={group.spotId} spotName={group.spotName} mine={group.mine} />
              ) : null}
              {group.rooms.map((table) => {
                const actions = lobbyActions(state, myPhones, table.phones);
                const busy = request.isPending && request.variables?.table.roomId === table.roomId;
                const waiting = waitingOn === table.roomId;
                return (
                  <LobbyRow
                    key={table.roomId}
                    testID={`lobby-row-${table.name}`}
                    icon={<TableIcon icon={table.icon} size="lobby" />}
                    name={table.name}
                    note={rowNote(table)}
                    chips={<Chips table={table} />}
                    waiting={waiting}
                    action={
                      actions.join && !needsPhoto && !waiting && accepted !== table.roomId ? (
                        <Button
                          look="katil"
                          testID={`join-${table.name}`}
                          label={tr.lobby.join}
                          disabled={actions.full || waitingOn !== null}
                          loading={busy}
                          onPress={() => request.mutate({ table, asMember: false })}
                        />
                      ) : null
                    }
                  />
                );
              })}
            </View>
          ))}
        </View>
      )}

      <SectionHead title={tr.lobby.runningTitle} count={tr.lobby.tables(running.length)} />
      <VenueNote>
        {state === 'none' && !needsPhoto ? tr.lobby.runningNote : tr.lobby.runningNoteShort}
      </VenueNote>
      <View style={{ gap }}>
        {running.map((table) => {
          const actions = lobbyActions(state, myPhones, table.phones);
          const busy = request.isPending && request.variables?.table.roomId === table.roomId;
          const waiting = waitingOn === table.roomId;
          return (
            <LobbyRow
              key={table.roomId}
              testID={`lobby-row-${table.name}`}
              icon={<TableIcon icon={table.icon} size="lobby" />}
              name={table.name}
              note={rowNote(table)}
              chips={<Chips table={table} />}
              below={
                actions.member && !needsPhoto && !waiting && accepted !== table.roomId ? (
                  <View style={{ marginTop: hereGap }}>
                    <Button
                      look="katil-burada"
                      block
                      testID={`here-${table.name}`}
                      label={tr.lobby.here}
                      disabled={waitingOn !== null}
                      loading={busy}
                      onPress={() => request.mutate({ table, asMember: true })}
                    />
                  </View>
                ) : null
              }
            />
          );
        })}
      </View>

      {request.isError ? (
        <Text variant="fine" tone="danger" className="mt-2">
          {errorMessage(request.error)}
        </Text>
      ) : null}
    </View>
  );
}

// A lobby table's chips: its people, and its intent and game tag while it has them. No person's
// name.
function Chips({ table }: { table: VenueTable }) {
  const intent = isIntent(table.intent) ? table.intent : null;
  return (
    <>
      <LobbyChip people label={tr.venue.people(table.phones)} />
      {intent ? <LobbyChip label={tr.intents[intent]} /> : null}
      {table.gameTag ? <LobbyChip label={tr.concepts[table.gameTag]} /> : null}
    </>
  );
}
