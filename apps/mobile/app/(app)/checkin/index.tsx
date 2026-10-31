import { BOUNDARY_TOLERANCE_M, isWithinCheckinRadius } from '@shared/checkin.ts';
import { distanceMeters } from '@shared/explore.ts';
import { withinBoundary } from '@shared/geo.ts';
import * as Location from 'expo-location';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Reveal } from '@/aura/Reveal';
import { Banner } from '@/components/Banner';
import { RouteSheet, useCloseSheet } from '@/components/RouteSheet';
import { type Position, useCheckinDraft } from '@/features/checkin/draft';
import { useSkipLocation } from '@/features/checkin/locationMode';
import { checkinButton } from '@/features/checkin/checkinButton';
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
// Aura v37 (docs/design/aura/aktarim-37-checkin.md): the content scrolls when it does not fit, the
// buttons stay at the sheet's foot (RouteSheet → footer). Taking the position and the server's
// check are one waiting state (checkinButton); every problem ends it, a new try clears the last
// warning, the server's included. On success the button keeps waiting until Mekan opens.
export default function LocationScreen() {
  const draftVenue = useCheckinDraft((s) => s.venue);
  // The sheet keeps its venue while it goes down to Mekan (the draft is cleared on the way).
  const [openedVenue] = useState(draftVenue);
  const setPosition = useCheckinDraft((s) => s.setPosition);
  const spot = useCheckinDraft((s) => s.spot);
  const setSpot = useCheckinDraft((s) => s.setSpot);
  const active = useActiveTable();
  const spots = useVenueSpots((draftVenue ?? openedVenue)?.id);
  const skipLocation = useSkipLocation();
  const [locating, setLocating] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const checkIn = useCheckIn();
  const venue = draftVenue ?? (checkIn.isSuccess ? openedVenue : null);

  const hasSpots = (spots.data ?? []).length > 0;

  // `locating` stays set from the position to the server's answer: no frame between the two shows
  // the button idle. An error ends it; a success leaves it to the way out.
  function proceed(position: Position) {
    setPosition(position);
    setLocating(true);
    checkIn.mutate(
      { position, spot: hasSpots ? spot : null },
      { onError: () => setLocating(false) },
    );
  }

  // Dev only (see above): the venue's point when there is no position.
  function proceedWithoutPosition(): boolean {
    if (!skipLocation || !venue) return false;
    proceed({ lat: venue.lat, lng: venue.lng, accuracyM: null });
    return true;
  }

  async function locate() {
    setProblem(null);
    // The last try's server error goes with the new try (its request id stays: useCheckIn).
    checkIn.reset();
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
      if (!venue) {
        setLocating(false);
        return;
      }
      const here = { lat: coords.latitude, lng: coords.longitude };
      const inside = venue.boundary
        ? withinBoundary(here, venue.boundary, BOUNDARY_TOLERANCE_M)
        : isWithinCheckinRadius(distanceMeters(here, venue));
      if (!inside && !skipLocation) {
        track('checkin_out_of_range', {});
        setLocating(false);
        setProblem(venue.boundary ? 'outsideBoundary' : 'tooFar');
        return;
      }
      proceed({ ...here, accuracyM: coords.accuracy, mocked: mocked === true });
    } catch {
      if (!proceedWithoutPosition()) {
        setLocating(false);
        setProblem('failed');
      }
    }
  }

  // A check-in that went through is on its way out: the cleared draft sends it nowhere else.
  if (!venue && !checkIn.isSuccess) return <Redirect href="/explore" />;
  if (!venue) return null;

  const button = checkinButton({
    locating,
    sending: checkIn.isPending,
    sent: checkIn.isSuccess,
    spotsLoading: spots.isPending,
    needsSpot: hasSpots && !spot,
  });

  const elsewhere =
    active.data && active.data.venue_id !== venue.id ? (active.data.venue?.name ?? null) : null;
  return (
    <RouteSheet
      testID="checkin"
      peek="checkin"
      footer={
        <View style={{ gap: KIT.size.chipGap + 2 }}>
          {problem === 'denied' ? (
            <Btn
              block
              tall
              variant="glassy"
              label={tr.checkin.openSettings}
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
          <Btn
            block
            tall
            icon="pin"
            label={button.busy ? tr.checkin.locating : tr.checkin.useLocation}
            onPress={() => void locate()}
            disabled={button.off}
            loading={button.busy}
          />
          <CancelButton />
        </View>
      }
    >
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
      {/* A try's warning arrives 70 ms after the button turns idle (aktarim-37 → hareket 4). */}
      {problem === 'denied' ? (
        <Reveal index={1}>
          <Banner tone="danger" title={tr.checkin.deniedTitle} body={tr.checkin.permissionDenied} />
        </Reveal>
      ) : null}
      {problem === 'tooFar' ? (
        <Reveal index={1}>
          <Banner tone="warn" body={tr.errors.too_far} />
        </Reveal>
      ) : null}
      {problem === 'outsideBoundary' ? (
        <Reveal index={1}>
          <Banner tone="warn" body={tr.checkin.outsideBoundary(venue.kind)} />
        </Reveal>
      ) : null}
      {problem === 'failed' ? (
        <Reveal index={1}>
          <Banner tone="danger" body={tr.checkin.locationFailed} />
        </Reveal>
      ) : null}
      {checkIn.isError ? (
        <Reveal index={1}>
          <Banner tone="danger" body={errorMessage(checkIn.error)} />
        </Reveal>
      ) : null}
    </RouteSheet>
  );
}

function CancelButton() {
  const close = useCloseSheet();
  return <Btn block tall variant="glassy" label={tr.common.cancel} onPress={close} />;
}
