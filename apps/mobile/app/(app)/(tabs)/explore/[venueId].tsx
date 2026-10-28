import { describeEventTime } from '@shared/explore.ts';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, type ImageSourcePropType, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { Btn, Glass, Round, T, Tag } from '@/aura/kit';
import { SceneGround } from '@/aura/Scene';
import { VenueScene } from '@/aura/VenueScene';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { Loader } from '@/components/Loader';
import { useCheckinDraft } from '@/features/checkin/draft';
import { spotPicture } from '@/features/checkin/SpotPicker';
import { useVenueSpots } from '@/features/checkin/spots';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useExploreVenue } from '@/features/explore/useExploreVenues';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { venueType } from '@/lib/venueType';
import { useNow } from '@/lib/useNow';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { VENUE_FRAME } from '@/theme/venueScene';
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
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const barSpace = useTabBarSpace();
  const now = useNow(60_000);
  const spots = useVenueSpots(venueId).data ?? [];

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

  const here = active.data?.venue_id === venue.id;
  const k = sceneWidth > 0 ? sceneWidth / VENUE_FRAME.width : 1;
  const calm = venue.bucket === 'calm';
  // docs/design/aura → KesfetMekan: the venue as a scene under the status bar (the buddies at a
  // table doing what the place is for, theme/venueScene.ts; no disk with the mark, the owner's
  // call, 29 Ekim), back and its tags over it; the name and district, today's event, then check-in. Not a
  // list: the screen stays still (CLAUDE.md → Ekran davranışı).
  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <ScrollView
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + SPACING[8] + barSpace,
        }}
      >
        <View
          onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}
          style={{
            height: VENUE_FRAME.height * k + insets.top,
            borderBottomLeftRadius: KIT.stage.radius,
            borderBottomRightRadius: KIT.stage.radius,
            overflow: 'hidden',
          }}
        >
          <SceneGround top={0} bottom={KIT.stage.radius} />
          {sceneWidth > 0 ? (
            <VenueScene kind={venueType(venue)} width={sceneWidth} delay={SCENE_CAST_DELAY} />
          ) : null}
          <View
            className="flex-row items-center justify-between"
            style={{ paddingHorizontal: KIT.size.side, paddingTop: insets.top + SPACING[3] }}
          >
            <Round icon="back" label={tr.explore.back} onPress={() => router.back()} />
            <View style={{ flexDirection: 'row', gap: KIT.size.chipGap }}>
              <Tag label={tr.explore.typeLabel[venueType(venue)]} />
              <Tag
                label={tr.explore.buckets[venue.bucket]}
                lead={
                  calm ? undefined : (
                    <View
                      style={{
                        width: KIT.size.dot,
                        height: KIT.size.dot,
                        borderRadius: KIT.size.dot / 2,
                        backgroundColor: KIT.pink,
                      }}
                    />
                  )
                }
              />
            </View>
          </View>
        </View>
        <View
          style={{
            flexGrow: 1,
            paddingHorizontal: KIT.size.side,
            paddingTop: GAP,
            gap: GAP,
          }}
        >
          <View style={{ gap: KIT.size.tagGap }}>
            <T v="display" style={KIT_TYPE.venueTitle} accessibilityRole="header">
              {venue.name}
            </T>
            <T v="body">{venue.district}</T>
          </View>
          {spots.length > 0 ? (
            <Glass pad="pad" style={{ gap: KIT.size.rowGap }}>
              <View className="flex-row items-baseline justify-between">
                <T v="h3">{tr.checkin.spotTitle}</T>
                <T v="fine">{tr.explore.spotCount(spots.length)}</T>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: SPOT_GAP }}>
                {spots.map((spot) => (
                  <View
                    key={spot.id}
                    style={{
                      width: `${100 / SPOT_COLUMNS - 3}%`,
                      alignItems: 'center',
                      gap: SPACING[1.5],
                    }}
                  >
                    <SpotTile source={spotPicture(spot.ref)} />
                    <T v="fine" strong center>
                      {spot.name}
                    </T>
                  </View>
                ))}
              </View>
            </Glass>
          ) : null}
          {venue.event ? (
            <Glass
              pad="pad"
              style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.rowGap }}
            >
              <Tag tone="amber" label={tr.explore.eventTagShort} />
              <T v="fine" ink style={{ flex: 1 }}>
                <T v="fine" strong>
                  {venue.event.title}
                </T>
                {` ${tr.common.separator} ${tr.explore.eventTime(
                  describeEventTime(venue.event.startsAt, venue.event.endsAt, now),
                )}`}
              </T>
            </Glass>
          ) : null}
          <T v="fine">{tr.explore.checkInHint}</T>
          <View style={{ flexGrow: 1 }} />
          <Btn
            block
            icon={here ? 'forward' : 'pin'}
            label={here ? tr.explore.backToVenue : tr.explore.checkInHere}
            onPress={() => {
              if (here) {
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
      </ScrollView>
    </View>
  );
}

const GAP = 14;
const SPOT_COLUMNS = 3;
const SPOT_GAP = 10;
const SPOT_TILE = 76;

// A spot's picture filling its column (KesfetMekan: `.thumb`, 76 high).
function SpotTile({ source }: { source: ImageSourcePropType | undefined }) {
  return (
    <View
      style={{
        alignSelf: 'stretch',
        height: SPOT_TILE,
        borderRadius: KIT.size.thumbRadius,
        overflow: 'hidden',
        boxShadow: KIT.thumbShadow,
      }}
    >
      {source ? (
        <Image source={source} fadeDuration={0} style={{ width: '100%', height: '100%' }} />
      ) : null}
    </View>
  );
}
