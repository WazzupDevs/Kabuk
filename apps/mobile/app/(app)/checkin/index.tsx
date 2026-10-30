import { BOUNDARY_TOLERANCE_M, isWithinCheckinRadius } from '@shared/checkin.ts';
import { CURRENT_LOCATION_CONSENT_VERSION } from '@shared/consent.ts';
import { distanceMeters } from '@shared/explore.ts';
import { withinBoundary } from '@shared/geo.ts';
import * as Location from 'expo-location';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { RouteSheet, useCloseSheet } from '@/components/RouteSheet';
import { useProfile } from '@/features/account/useProfile';
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

// Check-in: consent and the position, which only verifies the venue chosen in Keşfet
// (docs/arsiv/SPEC_V2.md §4). Outside the radius, or the boundary with its tolerance (docs/SPEC_V3.md
// §4.2), the user is warned here; the server decides anyway. A venue with spots asks "Neredesin?"
// in the same sheet, before the position (docs/SPEC_V4.md §4.E: no headcount). On the dev project with CHECKIN_SKIP_LOCATION (useSkipLocation) neither a position outside
// the venue nor a missing one (no permission, no fix indoors) stops the flow: the server skips the
// check there, and the venue's own point stands in for a missing position (never stored).
export default function LocationScreen() {
  const { c } = useKit();
  const profile = useProfile();
  const venue = useCheckinDraft((s) => s.venue);
  const setPosition = useCheckinDraft((s) => s.setPosition);
  const spot = useCheckinDraft((s) => s.spot);
  const setSpot = useCheckinDraft((s) => s.setSpot);
  const active = useActiveTable();
  const spots = useVenueSpots(venue?.id);
  const skipLocation = useSkipLocation();
  const consentGiven = profile.data?.location_consent_version === CURRENT_LOCATION_CONSENT_VERSION;
  const [consent, setConsent] = useState(false);
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

  // skall tuvali (KesfetGirisKampus, KesfetMekan, KesfetKonumRiza, KesfetKonumIzin,
  // KesfetKonumDisarida): one sheet over Keşfet; the venue, its spots, the consent, the trouble in
  // a strip, then "Konumumu kullan" and "Vazgeç".
  const elsewhere =
    active.data && active.data.venue_id !== venue.id ? (active.data.venue?.name ?? null) : null;
  return (
    <RouteSheet testID="checkin" peek="checkin">
      {/* docs/design/aura → CheckIn: "Neredesin?" and its line, the spots as glass rows, the
          consent, "Konumumu kullan" and "Vazgeç". */}
      <View style={{ gap: KIT.size.chipGap }}>
        {hasSpots ? <T v="eyebrow">{venue.name}</T> : null}
        <T v="title" accessibilityRole="header">
          {hasSpots ? tr.checkin.spotTitle : venue.name}
        </T>
        <T v="fine">{hasSpots ? tr.checkin.spotHint : tr.checkin.locationBody}</T>
      </View>
      {hasSpots ? (
        <SpotPicker
          spots={spots.data ?? []}
          selectedId={spot?.id ?? null}
          onSelect={(s) => setSpot({ id: s.id, name: s.name })}
        />
      ) : null}
      {hasSpots ? <T v="fine">{tr.checkin.locationBody}</T> : null}
      {consentGiven ? null : (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          accessibilityLabel={tr.checkin.locationConsent}
          onPress={() => setConsent((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: KIT.size.rowGap }}
        >
          <View
            style={{
              width: BOX,
              height: BOX,
              borderRadius: BOX_RADIUS,
              marginTop: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: consent ? KIT.primary : undefined,
              borderWidth: consent ? 0 : BOX_RING,
              borderColor: c.hair,
            }}
          >
            {consent ? <CapIcon name="check" color={KIT.white} size={KIT.size.iconSm} /> : null}
          </View>
          <T v="fine" ink style={{ flex: 1 }}>
            {tr.checkin.locationConsent}
          </T>
        </Pressable>
      )}
      {elsewhere ? <Banner tone="warn" body={tr.checkin.replaces(elsewhere)} /> : null}
      {problem === 'denied' ? (
        <View className="gap-3">
          <Banner tone="danger" title={tr.checkin.deniedTitle} body={tr.checkin.permissionDenied} />
          <Btn
            block
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
          icon="pin"
          label={locating ? tr.checkin.locating : tr.checkin.useLocation}
          onPress={() => void locate()}
          disabled={!(consentGiven || consent) || spots.isPending || (hasSpots && !spot)}
          loading={locating || checkIn.isPending}
        />
        <CancelButton />
      </View>
    </RouteSheet>
  );
}

const BOX = 24;
const BOX_RADIUS = 8;
const BOX_RING = 2;

function CancelButton() {
  const close = useCloseSheet();
  return <Btn block variant="glassy" label={tr.common.cancel} onPress={close} />;
}
