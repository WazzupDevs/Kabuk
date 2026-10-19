import type { Concept } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { isLocalGame } from '@/features/games/GameArea';
import { gamesApi, roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { roomKeys } from './queries';

// "Masanla oyna" (docs/SPEC_V3.md §5.1): a private one-table room, anonymous, never in the lobby;
// the room screen then offers its games. From the table screen the room is made only when a game
// is picked (K-36: looking at the table makes nothing), and that game starts in it: a game played on
// the phone through the room screen's `start`, Sohbet kartları with its first card from the server.
// `replace`: the table screen gives its place to the room, so back goes to the venue.
export function useCreateSolo({ replace = false }: { replace?: boolean } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: async (game?: Concept) => {
      const { roomId } = await roomsApi.createSolo();
      if (game === 'sohbet') {
        // The room is there either way; a card that did not come is asked for again in it.
        await gamesApi.sohbetNext(roomId).catch(() => undefined);
      }
      return { roomId, game };
    },
    onSuccess: async ({ roomId, game }) => {
      await queryClient.invalidateQueries({ queryKey: roomKeys.current });
      const target = {
        pathname: '/room/[id]' as const,
        params: isLocalGame(game) ? { id: roomId, start: game } : { id: roomId },
      };
      if (replace) router.replace(target);
      else router.push(target);
    },
  });
}
