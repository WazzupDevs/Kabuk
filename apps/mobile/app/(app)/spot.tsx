import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { RouteSheet, useCloseSheet } from '@/components/RouteSheet';
import { Loader } from '@/components/Loader';
import { SpotPicker } from '@/features/checkin/SpotPicker';
import { useVenueSpots } from '@/features/checkin/spots';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { callChangeSpot } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

// Changing the table's spot without a new position (docs/SPEC_V3.md §4.3). The server refuses it
// while the table is in a room or has a request out.
export default function ChangeSpotScreen() {
  const queryClient = useQueryClient();
  const table = useActiveTable();
  const spots = useVenueSpots(table.data?.venue_id);
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = chosen ?? table.data?.spot_id ?? null;

  const change = useMutation({
    meta: FEEL_ERROR,
    mutationFn: callChangeSpot,
    onSuccess: async () => {
      track('spot_changed', {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeTable'] }),
        queryClient.invalidateQueries({
          queryKey: roomKeys.venueTables(table.data?.venue_id ?? ''),
        }),
      ]);
      router.back();
    },
  });

  if (table.isPending) {
    return (
      <RouteSheet>
        <View className="items-center py-6">
          <Loader />
        </View>
      </RouteSheet>
    );
  }
  if (!table.data) return <Redirect href="/explore" />;

  // skall tuvali (MekanNoktaDegistir, v71): a sheet over Mekan, the spots as `.opt` rows.
  return (
    <RouteSheet title={tr.venue.changeSpotTitle} testID="change-spot-sheet">
      <T v="fine">{tr.venue.changeSpotHint}</T>
      <SpotPicker
        spots={spots.data ?? []}
        selectedId={selected}
        onSelect={(s) => setChosen(s.id)}
      />
      {change.isError ? <Banner tone="danger" body={errorMessage(change.error)} /> : null}
      <View className="gap-2.5 pt-1">
        <Btn
          block
          icon="check"
          label={tr.venue.changeSpotSave}
          onPress={() => selected && change.mutate(selected)}
          disabled={!selected || selected === table.data.spot_id}
          loading={change.isPending}
        />
        <CancelButton />
      </View>
    </RouteSheet>
  );
}

function CancelButton() {
  const close = useCloseSheet();
  return <Btn block variant="glassy" label={tr.common.cancel} onPress={close} />;
}
