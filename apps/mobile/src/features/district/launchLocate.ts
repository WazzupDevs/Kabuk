import { useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useEffect } from 'react';

import { districtApi } from '@/lib/api';

import { DISTRICT_VISIBLE, districtKeys, putDistrictState, readDistrictState } from './queries';

// Once per launch of the app (docs/SPEC_V4.md §4.V, rule 6): coming back from the background is no
// launch. Only for a person who used Semte Git before and already gave the position: nobody is asked
// here. The coordinate goes in the one call and is kept nowhere (no state, no log, no analytics).
let launched = false;

async function locateOnLaunch(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return;
  const state = await queryClient.fetchQuery({
    queryKey: districtKeys.state,
    queryFn: readDistrictState,
  });
  if (state.located === 'never') return;
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const found = await districtApi.locate(coords.latitude, coords.longitude);
  // Near a shared border: the district found last stays if it is one of the two (the person chose
  // it before); otherwise the card asks again when it is pressed.
  const kept = state.district?.ref;
  if (found.candidates && kept && found.candidates.some((c) => c.ref === kept)) {
    const again = await districtApi.locate(coords.latitude, coords.longitude, kept);
    putDistrictState(queryClient, again.state);
    return;
  }
  putDistrictState(queryClient, found.state);
}

export function useDistrictLaunchLocate(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (launched || !DISTRICT_VISIBLE) return;
    launched = true;
    // No position (taken away, no signal): the district found last stays, the session goes on.
    void locateOnLaunch(queryClient).catch(() => undefined);
  }, [queryClient]);
}
