import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { preloadSkiaKit } from '@/components/skiaInside';
import { useProfile } from '@/features/account/useProfile';
import { giftStateQuery } from '@/features/gifts/queries';
import { labOff } from '@/lib/drawLab';
import { ticketWholeOn } from '@/theme/capsuleSkia';

import { ownProfileViewAhead } from './queries';

// The Profil tab read ahead, in idle time after the launch (docs/perf/akicilik-denetimi.md → 4.13
// D: its first opening waited for the network and the loader's 600 ms): the own profile's view
// and the gift state, the same queries the tab reads (a fresh one is not asked again), and Skia
// for the ticket's capsule canvas (IdentityTicket → useTicketWhole). Once a signed-in launch.
const AHEAD_TIMEOUT_MS = 2000;

export function useProfileAhead(): void {
  const queryClient = useQueryClient();
  const publicId = useProfile().data?.public_id;
  useEffect(() => {
    if (!publicId) return undefined;
    const id = requestIdleCallback(
      () => {
        void queryClient.prefetchQuery(ownProfileViewAhead(publicId));
        void queryClient.prefetchQuery(giftStateQuery);
        if (ticketWholeOn(Platform.OS, labOff('biletsvg'))) preloadSkiaKit();
      },
      { timeout: AHEAD_TIMEOUT_MS },
    );
    return () => cancelIdleCallback(id);
  }, [publicId, queryClient]);
}
