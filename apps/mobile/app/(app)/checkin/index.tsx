import { BOUNDARY_TOLERANCE_M, isWithinCheckinRadius } from '@shared/checkin.ts';
import { distanceMeters } from '@shared/explore.ts';
import { withinBoundary } from '@shared/geo.ts';
import * as Location from 'expo-location';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { RouteSheet, useCloseSheet } from '@/components/RouteSheet';
import { type Position, useCheckinDraft } from '@/features/checkin/draft';
import { useSkipLocation } from '@/features/checkin/locationMode';
import { SpotPicker } from '@/features/checkin/SpotPicker';
import { useVenueSpots } from '@/features/checkin/spots';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useCheckIn } from '@/features/checkin/useCheckIn';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { KIT } from '@/theme/auraKit';

type Problem = 'denied' | 'failed' | 'tooFar' | 'outsideBoundary' | null;

// Check-in: the position, which only verifies the venue chosen in Keşfet (docs/arsiv/SPEC_V2.md §4).
// Outside the radius, or the boundary with its tolerance (docs/SPEC_V3.md §4.2), the user is warned
// here; the server decides anyway. A venue with spots asks "Neredesin?" in the same sheet, before the
// position (docs/SPEC_V4.md §4.E: no headcount). There is no consent box (the owner's call, 31 Ekim):
// the press on "Konumumu kullan" under the line that says what the position is for is the consent,
// and the version still goes in the check-in (useCheckIn). On the dev project with
// CHECKIN_SKIP_LOCATION (useSkipLocation) neither a position outside the venue nor a missing one (no
// permission, no fix indoors) stops the flow: the server skips the check there, and the venue's own
// point stands in for a missing position (never stored).
export default function LocationScreen() {
  const venue = useCheckinDraft((s) => s.venue);
  const setPosition = useCheckinDraft((s) => s.setPosition);
  const spot = useCheckinDraft((s) => s.spot);
  const setSpot = useCheckinDraft((s) => s.setSpot);
  const active = useActiveTable();
  const spots = useVenueSpots(venue?.id);
  const skipLocation = useSkipLocation();
  const [locating, setLocating] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const checkIn = useCheckIn();

  const hasSpots = (spots.data ?? []).length > 0;

  function proceed(position: Position) {
    setPosition(position);
    checkIn.mutate({ position, spot: hasSpots ? spot : null });
  }

  // Dev only (see above): the venue's point when there is no position.
  function proceedWithoutPosition(): boolean {
    if (!skipLocation || !venue) return false;
    proceed({ lat: venue.lat, lng: venue.lng, accuracyM: null });
    return true;
  }

  async function locate() {
    setProblem(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      if (!proceedWithoutPosition()) setProblem('denied');
      return;
    }
    setLocating(true);
    try {
      const { coords, mocked } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (!venue) return;
      const here = { lat: coords.latitude, lng: coords.longitude };
      const inside = venue.boundary
        ? withinBoundary(here, venue.boundary, BOUNDARY_TOLERANCE_M)
        : isWithinCheckinRadius(distanceMeters(here, venue));
      if (!inside && !skipLocation) {
        track('checkin_out_of_range', {});
        setProblem(venue.boundary ? 'outsideBoundary' : 'tooFar');
        return;
      }
      proceed({ ...here, accuracyM: coords.accuracy, mocked: mocked === true });
    } catch {
      if (!proceedWithoutPosition()) setProblem('failed');
    } finally {
      setLocating(false);
    }
  }

  // A check-in that went through is on its way out: the cleared draft sends it nowhere else.
  if (!venue && !checkIn.isSuccess) return <Redirect href="/explore" />;
  if (!venue) return null;

  const elsewhere =
    active.data && active.data.venue_id !== venue.id ? (active.data.venue?.name ?? null) : null;
  return (
    <RouteSheet testID="checkin" peek="checkin">
      {/* docs/design/aura → CheckIn: the venue's name and why the position is asked, "Konumumu
          kullan" and "Vazgeç"; the page it opened from stays behind the sheet. A venue with spots
          also asks "Neredesin?" as glass rows (the owner's call, 31 Ekim): the spot is chosen before
          the position, as the table invite depends on it (CLAUDE.md → Değişmez kurallar 4). */}
      <View style={{ gap: KIT.size.chipsGap }}>
        <T v="sheetTitle" accessibilityRole="header">
          {venue.name}
        </T>
        <T v="body">{tr.checkin.locationBody}</T>
      </View>
      {hasSpots ? (
        <View style={{ gap: KIT.size.chipsGap }}>
          <View style={{ gap: KIT.size.chipGap }}>
            <T v="h3">{tr.checkin.spotTitle}</T>
            <T v="fine">{tr.checkin.spotHint}</T>
          </View>
          <SpotPicker
            spots={spots.data ?? []}
            selectedId={spot?.id ?? null}
            onSelect={(s) => setSpot({ id: s.id, name: s.name })}
          />
        </View>
      ) : null}
      {elsewhere ? <Banner tone="warn" body={tr.checkin.replaces(elsewhere)} /> : null}
      {problem === 'denied' ? (
        <View className="gap-3">
          <Banner tone="danger" title={tr.checkin.deniedTitle} body={tr.checkin.permissionDenied} />
          <Btn
            block
            tall
            variant="glassy"
            label={tr.checkin.openSettings}
            onPress={() => void Linking.openSettings()}
          />
        </View>
      ) : null}
      {problem === 'tooFar' ? <Banner tone="warn" body={tr.errors.too_far} /> : null}
      {problem === 'outsideBoundary' ? (
        <Banner tone="warn" body={tr.checkin.outsideBoundary(venue.kind)} />
      ) : null}
      {problem === 'failed' ? <Banner tone="danger" body={tr.checkin.locationFailed} /> : null}
      {checkIn.isError ? <Banner tone="danger" body={errorMessage(checkIn.error)} /> : null}
      <View style={{ gap: KIT.size.chipGap + 2, paddingTop: KIT.size.tagGap }}>
        <Btn
          block
          tall
          icon="pin"
          label={locating ? tr.checkin.locating : tr.checkin.useLocation}
          onPress={() => void locate()}
          disabled={spots.isPending || (hasSpots && !spot)}
          loading={locating || checkIn.isPending}
        />
        <CancelButton />
      </View>
    </RouteSheet>
  );
}

function CancelButton() {
  const close = useCloseSheet();
  return <Btn block tall variant="glassy" label={tr.common.cancel} onPress={close} />;
}
