import { CONCEPTS, type Concept, type Intent, isIntent } from '@shared/rooms.ts';
import { tableState } from '@shared/tableCard.ts';
import { roomSeat } from '@shared/teams.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, type ScrollView, useWindowDimensions, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { useVenueSpots } from '@/features/checkin/spots';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { Lobby } from '@/features/rooms/Lobby';
import { OpenLobbySheet } from '@/features/rooms/OpenLobbySheet';
import { useOpenedTables } from '@/features/rooms/openedTables';
import { useCurrentRoom, useRoom, useRoomPhones } from '@/features/rooms/queries';
import { TableCard } from '@/features/rooms/TableCard';
import { VenueTop } from '@/features/rooms/VenueTop';
import { VenueChatCard } from '@/features/venueChat/VenueChatCard';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { sessionDurationMinutes } from '@shared/analytics.ts';

import { trackOnce } from '@/lib/analytics';
import { callLeave } from '@/lib/api';
import { useNow } from '@/lib/useNow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// Above this share of the screen the venue's two cards scroll with the page (v45: .pin.unpin).
const PIN_SHARE = 0.45;

type LobbySheet = { intent: Intent | null; gameTag: Concept | null };

function endSession(tableId: string, startedAt: string) {
  trackOnce(`session_ended:${tableId}`, 'session_ended', {
    duration_min: sessionDurationMinutes(startedAt, Date.now()),
  });
}

function isConcept(value: unknown): value is Concept {
  return (CONCEPTS as readonly unknown[]).includes(value);
}

// The table's venue, the home screen (docs/SPEC_V3.md §23.C): the table card with its state, the
// venue chat and the lobby. Without an active table it sends the user to Keşfet. Nothing sends the
// table to its room any more: the card's head opens the table (K-36; canvas: Faz 3 · 23.1 Masa ve
// lobi).
// Aktiviteler's "Bu oyunla lobiye aç" lands here with the game (`lobbyGame`, `lobbyIntent`) and
// opens "Masanı lobiye aç" with them.
export default function VenueScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const table = useActiveTable();
  const currentRoom = useCurrentRoom(table.data?.id);
  const spots = useVenueSpots(table.data?.venue_id);
  const venueHasSpots = (spots.data ?? []).length > 0;
  const now = useNow(30_000);
  const params = useLocalSearchParams<{ lobbyGame?: string; lobbyIntent?: string }>();
  const [sheet, setSheet] = useState<LobbySheet | null>(null);
  const scroll = useRef<ScrollView>(null);
  const reduceMotion = useReduceMotion();
  const { height } = useWindowDimensions();
  const [pinHeight, setPinHeight] = useState<number | null>(null);

  const leave = useMutation({
    meta: FEEL_ERROR,
    mutationFn: callLeave,
    onSuccess: () => {
      if (table.data) endSession(table.data.id, table.data.created_at);
      return queryClient.invalidateQueries();
    },
  });

  const expiresAt = table.data ? Date.parse(table.data.expires_at) : null;
  const expired = expiresAt !== null && expiresAt <= now;

  const tableId = table.data?.id;
  const tableStartedAt = table.data?.created_at;
  useEffect(() => {
    if (!expired) return;
    if (tableId && tableStartedAt) endSession(tableId, tableStartedAt);
    void queryClient.invalidateQueries({ queryKey: ['activeTable'] });
  }, [expired, queryClient, tableId, tableStartedAt]);

  // "Bu oyunla lobiye aç" from Aktiviteler: the sheet opens once with the game (adjusted while
  // rendering), then the params go so that the next time opens it again.
  const { lobbyGame, lobbyIntent } = params;
  const asked = isConcept(lobbyGame) ? `${lobbyGame}:${lobbyIntent ?? ''}` : null;
  const [handled, setHandled] = useState<string | null>(null);
  if (asked !== handled) {
    setHandled(asked);
    if (asked && isConcept(lobbyGame)) {
      setSheet({ intent: isIntent(lobbyIntent) ? lobbyIntent : null, gameTag: lobbyGame });
    }
  }
  useEffect(() => {
    if (asked) router.setParams({ lobbyGame: undefined, lobbyIntent: undefined });
  }, [asked]);

  const room = currentRoom.data ?? null;
  const leads =
    !!room && !!tableId && [room.owner_session_id, room.guest_session_id].includes(tableId);
  // A member's side is only in room_phones (docs/SPEC_V3.md §22.B).
  const phones = useRoomPhones(room?.id ?? '', !!room && !leads);
  // "Kabul edildi …" / "… geliyor" until this phone opens the merged table once (openedTables).
  const openedIds = useOpenedTables((s) => s.ids);
  const loadOpened = useOpenedTables((s) => s.load);
  useEffect(() => loadOpened(), [loadOpened]);

  if (table.isPending) {
    return (
      <Screen edges={['top']}>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }

  if (!table.data || expired || expiresAt === null) {
    return <Redirect href="/explore" />;
  }

  const seat = room ? roomSeat(room, phones.data, table.data.id) : null;
  const state = tableState(room, seat?.leader ?? false);
  const minutesLeft = Math.max(0, Math.ceil((expiresAt - now) / 60_000));

  function confirmLeave() {
    Alert.alert(tr.venue.leaveConfirmTitle, tr.venue.leaveConfirmBody, [
      { text: tr.common.cancel, style: 'cancel' },
      { text: tr.venue.leaveConfirm, style: 'destructive', onPress: () => leave.mutate() },
    ]);
  }

  // The two cards stay at the top while the lobby scrolls under them (v45: .pin), unless they would
  // take close to half the screen (a small phone, the largest text): then they scroll too. Pinned
  // until measured, so the usual case never changes the sticky index (which rebuilds both cards:
  // the venue chat's channel again, an open "Davet et" sheet closed).
  const pinned = pinHeight === null || pinHeight < height * PIN_SHARE;

  return (
    <Screen edges={['top']} scrollRef={scroll} stickyHeaderIndices={pinned ? [1] : undefined}>
      <View className="gap-1">
        {/* The room's changes reach the card while it is on screen (Realtime and the status check). */}
        {room ? <RoomWatch roomId={room.id} /> : null}
        <VenueTop
          venueName={table.data.venue?.name ?? ''}
          onLeave={confirmLeave}
          leaving={leave.isPending}
        />
        {leave.isError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(leave.error)}
          </Text>
        ) : null}
      </View>
      <View
        onLayout={(e) => setPinHeight(e.nativeEvent.layout.height)}
        style={{
          paddingTop: SPACING[2],
          paddingBottom: SPACING[1.5],
          backgroundColor: colors.canvas,
        }}
        testID="venue-pin"
      >
        <View className="gap-3">
          <VenueChatCard venueId={table.data.venue_id} sessionId={table.data.id} />
          <TableCard
            table={table.data}
            room={room}
            state={state}
            seat={seat}
            minutesLeft={minutesLeft}
            venueHasSpots={venueHasSpots}
            // Unknown until read: the plain "Birleşti" rather than a line that may be gone a moment
            // later.
            opened={openedIds === null || (!!room && openedIds.includes(room.id))}
            onOpenLobby={() => setSheet({ intent: null, gameTag: null })}
          />
        </View>
      </View>
      <View>
        <Lobby
          venueId={table.data.venue_id}
          sessionId={table.data.id}
          alias={table.data.alias}
          since={table.data.created_at}
          mySpotId={table.data.spot_id}
          venueHasSpots={venueHasSpots}
          state={state}
        />
        {sheet && state === 'off' ? (
          <OpenLobbySheet
            onClose={() => setSheet(null)}
            // Opened from further down the screen, the card's new "Lobide açık" is scrolled away.
            onOpened={() => scroll.current?.scrollTo({ y: 0, animated: !reduceMotion })}
            alias={table.data.alias}
            venueId={table.data.venue_id}
            intent={sheet.intent}
            gameTag={sheet.gameTag}
          />
        ) : null}
      </View>
    </Screen>
  );
}

// Keeps the table's room live while the venue screen shows its card: its row's changes re-read the
// table's current room (useRoom).
function RoomWatch({ roomId }: { roomId: string }) {
  useRoom(roomId);
  return null;
}
