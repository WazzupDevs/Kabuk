import { CURRENT_LOCATION_CONSENT_VERSION } from '@shared/consent.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { track } from '@/lib/analytics';
import { callCheckIn } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { requestKey } from '@/lib/requestKey';

import { type DraftSpot, type Position, useCheckinDraft } from './draft';

// The check-in itself (docs/SPEC_V4.md §4.E): the person is at the venue; no table, no headcount.
// One key for the screen that sends it: the same check-in sent again (the app's retry after a 5xx,
// or a press after an error whose check-in went through) returns the same check-in. Then Mekan.
export function useCheckIn() {
  const queryClient = useQueryClient();
  const venue = useCheckinDraft((s) => s.venue);
  const clear = useCheckinDraft((s) => s.clear);
  const [key] = useState(requestKey);

  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ position, spot }: { position: Position; spot: DraftSpot | null }) => {
      if (!venue) throw new Error('No check-in draft');
      return callCheckIn({
        action: 'check-in',
        venueId: venue.id,
        lat: position.lat,
        lng: position.lng,
        accuracyM: position.accuracyM,
        ...(position.mocked ? { mocked: true } : {}),
        locationConsentVersion: CURRENT_LOCATION_CONSENT_VERSION,
        ...(spot ? { spotId: spot.id } : {}),
        requestId: key,
      });
    },
    // To Mekan first, then the draft goes: cleared while a check-in screen was still up, it sent the
    // phone to Keşfet instead. The profile and the check-in are read again without holding the way.
    onSuccess: async () => {
      track('check_in', {});
      await queryClient.invalidateQueries({ queryKey: ['activeTable'] });
      router.dismissTo('/venue');
      clear();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
