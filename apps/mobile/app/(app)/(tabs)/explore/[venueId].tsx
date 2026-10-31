import { describeEventTime } from '@shared/explore.ts';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { FrostResolve } from '@/aura/FrostIn';
import { Btn, Glass, Round, Sec, T, Tag } from '@/aura/kit';
import { SceneGround } from '@/aura/Scene';
import { VenueScene } from '@/aura/VenueScene';
import { EmptyState } from '@/components/EmptyState';
import { Frost, GlassTarget } from '@/components/LiquidGlass';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { useCheckinDraft } from '@/features/checkin/draft';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useExploreVenue } from '@/features/explore/useExploreVenues';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { venueType } from '@/lib/venueType';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { VENUE_FRAME } from '@/theme/venueScene';

// The buddies come in after the screen's own arrival.
const SCENE_CAST_DELAY = 240;

// A venue from Keşfet (docs/design/aura → KesfetMekan): its bucket, the week's events, and check-in.
// Choosing the venue here is the manual selection; the position is taken next only to verify it
// (docs/arsiv/SPEC_V2.md §4). The spot is chosen in the check-in sheet, not here.
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
  // call, 29 Ekim), back and its tags over it; the name and district, why the position is asked,
  // check-in, and under it the week's events (the owner's call, 31 Ekim: they stay). Not a list:
  // the screen stays still (CLAUDE.md → Ekran davranışı).
  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
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
          {/* The scene is the backdrop of the buttons and tags over it: they frost it, a lamp's
              cord blurred behind a tag instead of crossing its words (the owner's report, 30 Ekim). */}
          <GlassTarget backdrop style={StyleSheet.absoluteFill}>
            <SceneGround top={0} bottom={KIT.stage.radius} />
            {sceneWidth > 0 ? (
              <VenueScene kind={venueType(venue)} width={sceneWidth} delay={SCENE_CAST_DELAY} />
            ) : null}
          </GlassTarget>
          {/* The picture appears frosted and resolves 320 ms later over 500 (hareket.json). */}
          <FrostResolve />
          {/* The status bar frosted over the scene: the cords pass under its words, blurred. */}
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top }}
          >
            <Frost radius={0} ground={AURA[scheme].ground} />
          </View>
          <View
            className="flex-row items-start justify-between"
            style={{ paddingHorizontal: KIT.size.side, paddingTop: insets.top + SPACING[3] }}
          >
            <Round big icon="back" label={tr.explore.back} onPress={() => router.back()} />
            <View style={{ flexDirection: 'row', gap: KIT.size.chipGap }}>
              <Tag large label={tr.explore.typeLabel[venueType(venue)]} />
              <Tag
                large
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
            paddingTop: SPACING[5],
            gap: GAP,
          }}
        >
          <View style={{ gap: SPACING[1.5] }}>
            <T v="display" style={KIT_TYPE.venueTitle} accessibilityRole="header">
              {venue.name}
            </T>
            <T v="bodyLg">{venue.district}</T>
          </View>
          {/* Before a check-in only: once here, the location was already checked (the owner's
              report, 30 Ekim). */}
          {here ? null : <T v="body">{tr.explore.checkInHint}</T>}
          <Btn
            block
            tall
            icon={here ? 'forward' : 'pin'}
            label={here ? tr.explore.backToVenue : tr.explore.checkInHere}
            style={{ marginTop: SPACING[2.5] }}
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
          {/* The week's events, under the button (the owner's call, 31 Ekim). */}
          <Sec title={tr.explore.eventsTitle} note={tr.explore.weekNote} />
          {venue.events.length === 0 ? (
            <T v="fine">{tr.explore.noEvents}</T>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -KIT.size.side }}
              contentContainerStyle={{ paddingHorizontal: KIT.size.side, gap: KIT.size.rowGap }}
            >
              {venue.events.map((event, i) => (
                <Glass
                  sm
                  key={`${event.startsAt}-${event.title}`}
                  style={{
                    width: KIT.size.eventCard,
                    padding: KIT.size.eventPad,
                    gap: KIT.size.chipsGap,
                  }}
                >
                  <Tag
                    tone={i % 2 === 0 ? 'purple' : 'pink'}
                    label={tr.explore.eventTime(
                      describeEventTime(event.startsAt, event.endsAt, now),
                    )}
                  />
                  <T v="h3">{event.title}</T>
                </Glass>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const GAP = 14;
