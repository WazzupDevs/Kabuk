import type { Concept } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isLocalGame } from '@/features/games/GameArea';
import { gamesApi, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { roomKeys } from './queries';

export type SoloRoom = { roomId: string; game?: Concept; firstCard: boolean };

// "Masanla oyna" (docs/SPEC_V3.md §5.1): a private one-table room, anonymous, never in the lobby;
// the room screen then offers its games. From the table screen the room is made only when a game
// is picked (K-36: looking at the table makes nothing), and that game starts in it: a game played on
// the phone through the room screen's `start`, Sohbet kartları with its first card from the server.
// Where to go is the caller's (`mutate(game, { onSuccess })`, soloRoomHref): a screen closed before
// the answer came goes nowhere. The current room is read again either way: after an error too, a
// room the server made before the answer was lost is found and opened (the table screen goes to it).
export function useCreateSolo() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: roomKeys.current });
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: async (game?: Concept): Promise<SoloRoom> => {
      const { roomId } = await roomsApi.createSolo();
      // The room is there either way; a first card that did not come is asked for again in the
      // room, which says why if it fails again.
      const firstCard =
        game === 'sohbet'
          ? await gamesApi.sohbetNext(roomId).then(
              () => true,
              () => false,
            )
          : true;
      return { roomId, game, firstCard };
    },
    onSuccess: refresh,
    onError: refresh,
  });
}

// The room the pick made, with the game to start: one played on the phone, or Sohbet kartları when
// its first card is still to be asked for.
export function soloRoomHref({ roomId, game, firstCard }: SoloRoom) {
  const start = isLocalGame(game) ? game : game === 'sohbet' && !firstCard ? game : undefined;
  return {
    pathname: '/room/[id]' as const,
    params: start ? { id: roomId, start } : { id: roomId },
  };
}
