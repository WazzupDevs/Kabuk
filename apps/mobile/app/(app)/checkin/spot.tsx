import { Redirect, router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Loader } from '@/components/Loader';
import { useCheckinDraft } from '@/features/checkin/draft';
import { SpotPicker } from '@/features/checkin/SpotPicker';
import { useVenueSpots } from '@/features/checkin/spots';
import { useCheckIn } from '@/features/checkin/useCheckIn';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

// Check-in at a venue with spots: where the person sits (docs/SPEC_V3.md §4.3), then the check-in.
// The spot is the person's own statement; no position is taken for it.
export default function SpotScreen() {
  const { venue, position, spot, setSpot } = useCheckinDraft();
  const spots = useVenueSpots(venue?.id);
  const checkIn = useCheckIn();

  // A check-in that went through is on its way out: the cleared draft sends it nowhere else.
  if (checkIn.isSuccess) return null;
  if (!venue) return <Redirect href="/explore" />;
  if (!position) return <Redirect href="/checkin" />;

  return (
    <Screen>
      <ScreenHeader
        eyebrow={venue.name}
        eyebrowIcon="location-outline"
        title={tr.checkin.spotTitle}
        subtitle={tr.checkin.spotHint}
        onBack={() => router.back()}
      />
      <View className="mt-4">
        {spots.isPending ? (
          <View className="mt-8 items-center">
            <Loader />
          </View>
        ) : null}
        <SpotPicker
          spots={spots.data ?? []}
          selectedId={spot?.id ?? null}
          onSelect={(s) => setSpot({ id: s.id, name: s.name })}
        />
      </View>
      {checkIn.isError ? (
        <Text variant="fine" tone="danger" className="mt-4">
          {errorMessage(checkIn.error)}
        </Text>
      ) : null}
      <View className="mt-auto pt-8">
        <Button
          size="lg"
          label={tr.checkin.continue}
          onPress={() => spot && checkIn.mutate({ position, spot })}
          disabled={!spot}
          loading={checkIn.isPending}
        />
      </View>
    </Screen>
  );
}
