import { router } from 'expo-router';

import { venueSpotsQuery } from '@/features/checkin/spots';
import { queryClient } from '@/lib/queryClient';

// A venue's page, opened from Keşfet's list, its map or Aktiviteler: what the page reads that the
// list does not already hold (its spots) is asked for at the press, so it is there, or on its way,
// as the page slides in (Telegram Android starts loading a screen's data as it is tapped, not after
// the transition; the owner's call, 21 Kasım). A fresh copy is not asked again.
export function openVenue(venueId: string, how: 'push' | 'navigate' = 'push'): void {
  void queryClient.prefetchQuery(venueSpotsQuery(venueId));
  const to = { pathname: '/explore/[venueId]', params: { venueId } } as const;
  if (how === 'navigate') router.navigate(to);
  else router.push(to);
}
