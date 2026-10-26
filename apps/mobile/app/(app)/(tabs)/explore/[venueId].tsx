import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { useCheckinDraft } from '@/features/checkin/draft';
import { useExploreVenue } from '@/features/explore/useExploreVenues';
import { BucketLine, EventTag, VenueTile } from '@/features/explore/VenueTags';
import { tr } from '@/i18n/tr';
import { venueType } from '@/lib/venueType';

// A venue from Keşfet: its bucket, its event, and check-in. Choosing the venue here is the manual
// selection; the position is taken next only to verify it (docs/SPEC_V2.md §4). In v44's look until
// 4.5 brings v44's check-in sheet in its place (docs/SPEC_V4.md K-43).
export default function VenueDetailScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { venue, isPending } = useExploreVenue(venueId);
  const setVenue = useCheckinDraft((s) => s.setVenue);

  if (isPending) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }
  if (!venue) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <EmptyState
            icon="cafe-outline"
            body={tr.explore.notFound}
            action={{ label: tr.explore.back, onPress: () => router.back() }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={tr.tabs.explore} onBack={() => router.back()} />
      {/* v44's venue head (.ci-head): its kind on a tile, the name, the kind and district, the
          bucket in words (K-41) and today's event. */}
      <Card className="mt-3">
        <View className="flex-row items-center gap-3">
          <VenueTile kind={venue.kind} />
          <View className="flex-1 gap-0.5">
            <Text variant="title" accessibilityRole="header">
              {venue.name}
            </Text>
            <Text variant="fine">
              {tr.explore.venueSub(tr.explore.typeLabel[venueType(venue)], venue.district)}
            </Text>
          </View>
        </View>
        <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-2">
          <BucketLine bucket={venue.bucket} />
          {venue.event ? <EventTag event={venue.event} /> : null}
        </View>
      </Card>
      <Card tone="note" className="mt-3">
        <Text variant="fine">{tr.explore.checkInHint}</Text>
      </Card>
      <View className="mt-auto gap-3 pt-8">
        <Button
          size="lg"
          label={tr.explore.checkInHere}
          onPress={() => {
            setVenue({
              id: venue.id,
              name: venue.name,
              lat: venue.lat,
              lng: venue.lng,
              boundary: venue.boundary,
              kind: venue.kind,
            });
            router.push('/checkin');
          }}
        />
      </View>
    </Screen>
  );
}
