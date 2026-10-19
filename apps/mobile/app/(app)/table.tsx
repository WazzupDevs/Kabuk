import type { Concept } from '@shared/rooms.ts';
import { Redirect, router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Loader } from '@/components/Loader';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { SoloGames } from '@/features/games/SoloGames';
import { useCurrentRoom } from '@/features/rooms/queries';
import { useCreateSolo } from '@/features/rooms/useCreateSolo';
import { tr } from '@/i18n/tr';

// The table before it has a room (K-36): the venue card's head opens it. Only the table's games;
// nothing is made by looking. Picking one makes the "Masanla oyna" room and starts the game there,
// in place of this screen. A table that has a room by then (accepted in the lobby, a game started
// on another phone of the side) goes to it.
export default function TableScreen() {
  const table = useActiveTable();
  const room = useCurrentRoom(table.data?.id);
  const solo = useCreateSolo({ replace: true });

  if (table.isPending || (table.data && room.isPending)) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }
  if (!table.data) return <Redirect href="/explore" />;
  // Not while the pick's own room is on its way: it replaces this screen with the game.
  if (room.data && !solo.isPending && !solo.isSuccess) {
    return <Redirect href={{ pathname: '/room/[id]', params: { id: room.data.id } }} />;
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow={tr.venue.people(table.data.headcount)}
        title={table.data.alias}
        onBack={() => router.back()}
      />
      <View className="mt-4">
        <SoloGames
          headcount={table.data.headcount}
          onPick={(game: Concept) => solo.mutate(game)}
          busy={solo.isPending}
          error={solo.error}
        />
        {/* The cards wait while the room is made (they have no busy mark of their own). */}
        {solo.isPending ? (
          <View className="mt-4 items-center">
            <Loader />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
