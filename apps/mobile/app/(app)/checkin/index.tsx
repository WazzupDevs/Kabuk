import { BOUNDARY_TOLERANCE_M, isWithinCheckinRadius } from '@shared/checkin.ts';
import { CURRENT_LOCATION_CONSENT_VERSION } from '@shared/consent.ts';
import { distanceMeters } from '@shared/explore.ts';
import { withinBoundary } from '@shared/geo.ts';
import * as Location from 'expo-location';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useProfile } from '@/features/account/useProfile';
import { useCheckinDraft } from '@/features/checkin/draft';
import { useSkipLocation } from '@/features/checkin/locationMode';
import { useVenueSpots } from '@/features/checkin/spots';
import { useCheckIn } from '@/features/checkin/useCheckIn';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';

type Problem = 'denied' | 'failed' | 'tooFar' | 'outsideBoundary' | null;

// Check-in, step 1: consent and the position, which only verifies the venue chosen in Keşfet
// (docs/SPEC_V2.md §4). Outside the radius, or the boundary with its tolerance (docs/SPEC_V3.md
// §4.2), the user is warned here; the server decides anyway. A venue with spots asks "Neredesin?"
// next; any other checks in from here (docs/SPEC_V4.md §4.E: no headcount). On the dev project with CHECKIN_SKIP_LOCATION (useSkipLocation) neither a position outside
// the venue nor a missing one (no permission, no fix indoors) stops the flow: the server skips the
// check there, and the venue's own point stands in for a missing position (never stored).
export default function LocationScreen() {
  const profile = useProfile();
  const venue = useCheckinDraft((s) => s.venue);
  const setPosition = useCheckinDraft((s) => s.setPosition);
  const spots = useVenueSpots(venue?.id);
  const skipLocation = useSkipLocation();
  const consentGiven = profile.data?.location_consent_version === CURRENT_LOCATION_CONSENT_VERSION;
  const [consent, setConsent] = useState(false);
  const [locating, setLocating] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const checkIn = useCheckIn();

  function proceed(position: { lat: number; lng: number; accuracyM: number | null }) {
    setPosition(position);
    if ((spots.data ?? []).length > 0) router.push('/checkin/spot');
    else checkIn.mutate({ position, spot: null });
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
      const { coords } = await Location.getCurrentPositionAsync({
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
      proceed({ ...here, accuracyM: coords.accuracy });
    } catch {
      if (!proceedWithoutPosition()) setProblem('failed');
    } finally {
      setLocating(false);
    }
  }

  // A check-in that went through is on its way out: the cleared draft sends it nowhere else.
  if (!venue && !checkIn.isSuccess) return <Redirect href="/explore" />;
  if (!venue) return null;

  return (
    <Screen>
      <ScreenHeader
        eyebrow={venue.name}
        eyebrowIcon="location-outline"
        title={tr.checkin.locationTitle}
        onBack={() => router.back()}
      />
      <View className="mt-4">
        <Banner tone="info" body={tr.checkin.locationBody} />
      </View>
      {consentGiven ? null : (
        <View className="mt-4">
          <Checkbox
            label={tr.checkin.locationConsent}
            checked={consent}
            onToggle={() => setConsent((v) => !v)}
          />
        </View>
      )}
      {problem === 'denied' ? (
        <View className="mt-4 gap-3">
          <Banner tone="danger" body={tr.checkin.permissionDenied} />
          <Button
            variant="secondary"
            label={tr.checkin.openSettings}
            onPress={() => void Linking.openSettings()}
          />
        </View>
      ) : null}
      {problem === 'tooFar' ? (
        <View className="mt-4">
          <Banner tone="danger" body={tr.errors.too_far} />
        </View>
      ) : null}
      {problem === 'outsideBoundary' ? (
        <View className="mt-4">
          <Banner tone="danger" body={tr.checkin.outsideBoundary(venue.kind)} />
        </View>
      ) : null}
      {problem === 'failed' ? (
        <View className="mt-4">
          <Banner tone="danger" body={tr.checkin.locationFailed} />
        </View>
      ) : null}
      {checkIn.isError ? (
        <View className="mt-4">
          <Banner tone="danger" body={errorMessage(checkIn.error)} />
        </View>
      ) : null}
      <View className="mt-auto pt-8">
        <Button
          size="lg"
          label={locating ? tr.checkin.locating : tr.checkin.useLocation}
          onPress={() => void locate()}
          disabled={!(consentGiven || consent) || spots.isPending}
          loading={locating || checkIn.isPending}
        />
      </View>
    </Screen>
  );
}
