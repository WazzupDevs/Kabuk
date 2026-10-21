import { isIntent, JOIN_REQUEST_TTL_SECONDS, requesterStatus } from '@shared/rooms.ts';
import { groupRoomsBySpot } from '@shared/spots.ts';
import { lobbyActions, requestGone, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { SPACING, TOUCH } from '@/theme/tokens';

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

  return (
    <View className="gap-3" testID="lobby">
      <SectionHead title={tr.lobby.openTitle} count={open.length} />
      {note ? <Text variant="fine">{note}</Text> : null}
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
                      <Button
                        size="sm"
                        testID={`join-${table.name}`}
                        label={tr.lobby.join}
                        disabled={actions.full || waitingOn !== null}
                        loading={busy}
                        onPress={() => request.mutate({ table, asMember: false })}
                      />
                    ) : waiting ? (
                      <Loader kind="swap" label={null} />
                    ) : null
                  }
                />
              );
            })}
          </View>
        ))
      )}

      <SectionHead title={tr.lobby.runningTitle} count={running.length} />
      <Text variant="fine">
        {state === 'none' && !needsPhoto ? tr.lobby.runningNote : tr.lobby.runningNoteShort}
      </Text>
      {running.map((table) => {
        const actions = lobbyActions(state, myPhones, table.phones);
        const busy = request.isPending && request.variables?.table.roomId === table.roomId;
        const waiting = waitingOn === table.roomId;
        return (
          <LobbyRow
            key={table.roomId}
            table={table}
            note={rowNote(table)}
            below={
              actions.member && !needsPhoto && !waiting && accepted !== table.roomId ? (
                <Button
                  variant="neutral"
                  testID={`here-${table.name}`}
                  label={tr.lobby.here}
                  disabled={waitingOn !== null}
                  loading={busy}
                  onPress={() => request.mutate({ table, asMember: true })}
                />
              ) : null
            }
          />
        );
      })}

      {request.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(request.error)}
        </Text>
      ) : null}
    </View>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <View className="mt-2 flex-row items-baseline justify-between">
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="label" tone="muted">
        {tr.lobby.tables(count)}
      </Text>
    </View>
  );
}

// A table in the lobby (v46: .card.row): its icon, name and the request's note, the people, intent
// and game tag; its button beside it ("Katıl") or under it ("Bu masadayım"). No person's name.
function LobbyRow({
  table,
  note,
  action,
  below,
}: {
  table: VenueTable;
  note: string | null;
  action?: ReactNode;
  below?: ReactNode;
}) {
  const intent = isIntent(table.intent) ? table.intent : null;
  return (
    <Card flush testID={`lobby-row-${table.name}`}>
      <View
        style={{
          gap: SPACING[2.5],
          paddingVertical: SPACING[2.5],
          paddingLeft: SPACING[2.5],
          paddingRight: SPACING[3],
        }}
      >
        <View className="flex-row items-center" style={{ gap: SPACING[3] }}>
          <TableIcon icon={table.icon} size="lobby" />
          <View className="flex-1 gap-1">
            <Text variant="bodyStrong">{table.name}</Text>
            {note ? (
              <Text variant="fine" accessibilityLiveRegion="polite">
                {note}
              </Text>
            ) : null}
            <View className="flex-row flex-wrap items-center gap-1.5">
              <Tag icon="people-outline" label={tr.venue.people(table.phones)} />
              {intent ? <Tag variant={intent} label={tr.intents[intent]} /> : null}
              {table.gameTag ? (
                <Tag icon="dice-outline" label={tr.concepts[table.gameTag]} />
              ) : null}
            </View>
          </View>
          {action ? (
            <View
              className="items-center justify-center"
              style={{ minWidth: TOUCH.min, minHeight: TOUCH.min }}
            >
              {action}
            </View>
          ) : null}
        </View>
        {below}
      </View>
    </Card>
  );
}
