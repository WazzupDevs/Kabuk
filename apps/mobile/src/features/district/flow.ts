import type { DistrictState } from '@shared/api/district.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { track } from '@/lib/analytics';
import { ApiError, districtApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { askNoticePermission } from './continueNotice';
import { districtKeys, putDistrictState } from './queries';

export type DistrictScreen =
  | '/district/locate'
  | '/district/outside'
  | '/district/room'
  | '/district/gate'
  | '/district/closed';

// Where Semte Git goes from the person's state (docs/SPEC_V4.md §4.V); null: Geçit is open (the day's
// question answered right, or no question today) and the press goes straight in.
export function districtScreen(state: DistrictState): DistrictScreen | null {
  if (state.session) return '/district/room';
  if (!state.district)
    return state.located === 'outside' ? '/district/outside' : '/district/locate';
  if (state.gate === 'question') return '/district/gate';
  if (state.gate === 'failed') return '/district/closed';
  return null;
}

// "İçeri gir", "Yeniden gir" and the card's press with Geçit open: a new 2 hours (the same day without
// the question), the room. A refusal (the day changed, the district went) reads the state again.
export function useEnterDistrict({ replace = true }: { replace?: boolean } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: async () => {
      await askNoticePermission();
      return districtApi.enter();
    },
    onSuccess: (state) => {
      putDistrictState(queryClient, state);
      track('district_entered', {});
      if (replace) router.replace('/district/room');
      else router.push('/district/room');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code !== 'internal') {
        void queryClient.invalidateQueries({ queryKey: districtKeys.state });
      }
    },
  });
}
