import { Redirect, router } from 'expo-router';

import { Btn, T } from '@/aura/kit';
import { RouteSheet } from '@/components/RouteSheet';
import { useCheckinDraft } from '@/features/checkin/draft';
import { SpotPicker } from '@/features/checkin/SpotPicker';
import { useVenueSpots } from '@/features/checkin/spots';
import { tr } from '@/i18n/tr';

// "Neredesin?" before the position (yeni arayüz tuvali, CheckInNokta): the venue's spots as radio
// rows in a sheet of their own, "Devam" to the position's sheet (checkin/index). Only a venue with
// spots comes here; the spot goes to the check-in (docs/SPEC_V4.md §4.E: no headcount).
export default function CheckinSpotScreen() {
  const venue = useCheckinDraft((s) => s.venue);
  const spot = useCheckinDraft((s) => s.spot);
  const setSpot = useCheckinDraft((s) => s.setSpot);
  const spots = useVenueSpots(venue?.id);

  if (!venue) return <Redirect href="/explore" />;
  const list = spots.data ?? [];
  return (
    <RouteSheet
      testID="checkin-spot"
      title={tr.checkin.spotTitle}
      titleType="locateTitle"
      subtitle={venue.name}
      footer={
        <Btn
          block
          testID="spot-next"
          label={tr.checkin.spotNext}
          disabled={!spot}
          onPress={() => router.replace('/checkin')}
        />
      }
    >
      <T v="body">{tr.checkin.spotHint}</T>
      <SpotPicker
        spots={list}
        selectedId={spot?.id ?? null}
        onSelect={(s) => setSpot({ id: s.id, name: s.name })}
      />
    </RouteSheet>
  );
}
