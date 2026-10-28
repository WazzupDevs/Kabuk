import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MarkDisk } from '@/aura/MarkDisk';
import { Gathering, SceneGround } from '@/aura/Scene';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { Loader } from '@/components/Loader';
import { useCheckinDraft } from '@/features/checkin/draft';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useExploreVenue } from '@/features/explore/useExploreVenues';
import { BucketLine, EventTag, VenueTile } from '@/features/explore/VenueTags';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { venueType } from '@/lib/venueType';
import { AURA } from '@/theme/aura';
import { SPACING } from '@/theme/tokens';

// The buddies come in after the screen's own arrival.
const SCENE_CAST_DELAY = 240;

// A venue from Keşfet: its bucket, its event, and check-in. Choosing the venue here is the manual
// selection; the position is taken next only to verify it (docs/SPEC_V2.md §4). In v44's look until
// 4.5 brings v44's check-in sheet in its place (docs/SPEC_V4.md K-43).
export default function VenueDetailScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { venue, isPending, isError, error, refetch } = useExploreVenue(venueId);
  const setVenue = useCheckinDraft((s) => s.setVenue);
  // Already checked in here: back to Mekan, not a new check-in that would end this one and take
  // the person off its table (audit VEN-2).
  const active = useActiveTable();
  const [sceneWidth, setSceneWidth] = useState(0);

  if (isPending) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }
  // The list could not be read: not "bulunamadı" (audit UI-10).
  if (!venue && isError) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <EmptyState
            kind="error"
            body={errorMessage(error)}
            action={{ label: tr.common.retry, onPress: () => void refetch() }}
          />
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
      {/* The venue as a scene (docs/design/aura → Mekan sayfası): buddies around its mark. */}
      <View
        onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}
        style={{
          marginTop: SPACING[3],
          height: AURA.gatherings.venue.height * (sceneWidth / AURA.gatherings.venue.frame),
          borderRadius: AURA.scene.radius,
          overflow: 'hidden',
        }}
      >
        <SceneGround />
        {sceneWidth > 0 ? (
          <Gathering
            kind="venue"
            width={sceneWidth}
            delay={SCENE_CAST_DELAY}
            center={
              <MarkDisk
                size={AURA.gatherings.venue.disk.size * (sceneWidth / AURA.gatherings.venue.frame)}
              />
            }
          />
        ) : null}
      </View>
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
          label={
            active.data?.venue_id === venue.id ? tr.explore.backToVenue : tr.explore.checkInHere
          }
          onPress={() => {
            if (active.data?.venue_id === venue.id) {
              router.navigate('/venue');
              return;
            }
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
