import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { InvitePage } from '@/features/rooms/InvitePage';
import { useRoom } from '@/features/rooms/queries';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

// Masana davet et on its own page (yeni arayüz tuvali, MasaDavet): opened from the owner's "Davet
// et" on Masa and on Mekan's table card, back returns there. A table that closed goes back, where
// Masa bitti shows.
export default function RoomInviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const room = useRoom(id);
  const closed = room.isSuccess && room.data?.status === 'closed';
  useEffect(() => {
    if (closed && router.canGoBack()) router.back();
  }, [closed]);
  return <InvitePage roomId={id} />;
}
