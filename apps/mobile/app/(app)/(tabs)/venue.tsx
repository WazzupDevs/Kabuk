import { sessionDurationMinutes } from '@shared/analytics.ts';
import type { Concept, Intent } from '@shared/rooms.ts';
import { tableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, type ScrollView, useWindowDimensions, View } from 'react-native';

import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useVenueSpots } from '@/features/checkin/spots';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { CreateTableSheet } from '@/features/rooms/CreateTableSheet';
import { Lobby } from '@/features/rooms/Lobby';
import { OpenLobbySheet } from '@/features/rooms/OpenLobbySheet';
import { useCurrentRoom, useRoom, useVenueTables } from '@/features/rooms/queries';
import { TableCard } from '@/features/rooms/TableCard';
import { VenueTop } from '@/features/rooms/VenueTop';
import { VenueChatCard } from '@/features/venueChat/VenueChatCard';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { trackOnce } from '@/lib/analytics';
import { callLeave } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useNow } from '@/lib/useNow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { V46_VENUE } from '@/theme/parts.generated';

// Above this share of the screen the venue's two cards scroll with the page (v45: .pin.unpin).
const PIN_SHARE = 0.45;

type LobbySheet = { intent: Intent | null; gameTag: Concept | null };

function endSession(checkInId: string, startedAt: string) {
  trackOnce(`session_ended:${checkInId}`, 'session_ended', {
    duration_min: sessionDurationMinutes(startedAt, Date.now()),
  });
}

// Mekan, the home screen (v46 "mekan"; docs/SPEC_V4.md §4.E): the person's card ("Henüz masan yok"
// and "Masa kur", or its table), the venue chat and the lobby. Without a check-in it sends the
// person to Keşfet. The card's head opens the table.
export default function VenueScreen() {
  const { colors, scheme } = useTheme();
  const pin = V46_VENUE[scheme].pin;
  const queryClient = useQueryClient();
  const checkIn = useActiveTable();
  const currentRoom = useCurrentRoom(checkIn.data?.id);
  const spots = useVenueSpots(checkIn.data?.venue_id);
  const tables = useVenueTables(checkIn.data?.venue_id);
  const photo = useOwnPhoto();
  const venueHasSpots = (spots.data ?? []).length > 0;
  const now = useNow(30_000);
  const [lobbySheet, setLobbySheet] = useState<LobbySheet | null>(null);
  const [creating, setCreating] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const reduceMotion = useReduceMotion();
  const { height } = useWindowDimensions();
  const [pinHeight, setPinHeight] = useState<number | null>(null);

  const leave = useMutation({
    meta: FEEL_ERROR,
    mutationFn: callLeave,
    onSuccess: () => {
      if (checkIn.data) endSession(checkIn.data.id, checkIn.data.created_at);
      return queryClient.invalidateQueries();
    },
  });

  const expiresAt = checkIn.data ? Date.parse(checkIn.data.expires_at) : null;
  const expired = expiresAt !== null && expiresAt <= now;

  const checkInId = checkIn.data?.id;
  const startedAt = checkIn.data?.created_at;
  useEffect(() => {
    if (!expired) return;
    if (checkInId && startedAt) endSession(checkInId, startedAt);
    void queryClient.invalidateQueries({ queryKey: ['activeTable'] });
  }, [expired, queryClient, checkInId, startedAt]);

  const room = currentRoom.data ?? null;
  // The scenes the venue's tables show; Masa kur fades them (K-45).
  const usedIcons = useMemo(
    () =>
      new Set(
        [...(tables.data?.open ?? []), ...(tables.data?.running ?? [])].flatMap((t) =>
          t.icon ? [t.icon] : [],
        ),
      ),
    [tables.data],
  );

  if (checkIn.isPending) {
    return (
      <Screen edges={['top']}>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }

  if (!checkIn.data || expired || expiresAt === null) {
    return <Redirect href="/explore" />;
  }

  const state = tableState(room, !!room && room.owner_session_id === checkIn.data.id);
  const minutesLeft = Math.max(0, Math.ceil((expiresAt - now) / 60_000));
  const anonymous = checkIn.data.identity.mode === 'anonymous';
  // A profiled person without a visible photo can neither set up a table nor ask (photo_required).
  const needsPhoto = !anonymous && photo.known && !photo.has;

  function confirmLeave() {
    Alert.alert(tr.venue.leaveConfirmTitle, tr.venue.leaveConfirmBody, [
      { text: tr.common.cancel, style: 'cancel' },
      { text: tr.venue.leaveConfirm, style: 'destructive', onPress: () => leave.mutate() },
    ]);
  }

  // The two cards stay at the top while the lobby scrolls under them (v46: .pin), unless they would
  // take close to half the screen (a small phone, the largest text): then they scroll too. Pinned
  // until measured, so the usual case never changes the sticky index (which rebuilds both cards).
  const pinned = pinHeight === null || pinHeight < height * PIN_SHARE;

  return (
    <Screen edges={['top']} scrollRef={scroll} stickyHeaderIndices={pinned ? [1] : undefined}>
      <View className="gap-1">
        {/* The table's changes reach the card while it is on screen (Realtime and the check). */}
        {room ? <RoomWatch roomId={room.id} /> : null}
        <VenueTop
          venueName={checkIn.data.venue?.name ?? ''}
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
          paddingTop: pin.padding[0],
          paddingBottom: pin.padding[2],
          backgroundColor: colors.canvas,
        }}
        testID="venue-pin"
      >
        <View style={{ gap: pin.gap }}>
          <VenueChatCard venueId={checkIn.data.venue_id} sessionId={checkIn.data.id} />
          <TableCard
            checkIn={checkIn.data}
            room={room}
            state={state}
            minutesLeft={minutesLeft}
            venueHasSpots={venueHasSpots}
            onCreate={() => setCreating(true)}
            onOpenLobby={() => setLobbySheet({ intent: null, gameTag: null })}
          />
        </View>
      </View>
      <View>
        <Lobby
          venueId={checkIn.data.venue_id}
          sessionId={checkIn.data.id}
          since={checkIn.data.created_at}
          mySpotId={checkIn.data.spot_id}
          venueHasSpots={venueHasSpots}
          state={state}
          roomId={room?.id ?? null}
          myPhones={room?.phones ?? 1}
          needsPhoto={needsPhoto}
        />
        {lobbySheet && room && state === 'private' ? (
          <OpenLobbySheet
            onClose={() => setLobbySheet(null)}
            // Opened from further down the screen, the card's new "Lobide açık" is scrolled away.
            onOpened={() => scroll.current?.scrollTo({ y: 0, animated: !reduceMotion })}
            roomId={room.id}
            venueId={checkIn.data.venue_id}
            intent={lobbySheet.intent}
            gameTag={lobbySheet.gameTag}
          />
        ) : null}
        {creating && state === 'none' ? (
          <CreateTableSheet
            onClose={() => setCreating(false)}
            venueId={checkIn.data.venue_id}
            usedIcons={usedIcons}
            anonymous={anonymous}
          />
        ) : null}
      </View>
    </Screen>
  );
}

// Keeps the table live while Mekan shows its card: its row's changes re-read the current table
// (useRoom).
function RoomWatch({ roomId }: { roomId: string }) {
  useRoom(roomId);
  return null;
}
