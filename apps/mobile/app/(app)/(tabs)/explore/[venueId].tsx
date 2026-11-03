import { describeEventTime } from '@shared/explore.ts';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { FrostResolve } from '@/aura/FrostIn';
import { PICTURE_FILL } from '@/aura/RisoPicture';
import { Btn, Glass, Round, Sec, T, Tag } from '@/aura/kit';
import { EmptyState } from '@/components/EmptyState';
import { GlassTarget } from '@/components/LiquidGlass';
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
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// U17: the one riso scene of every venue (Aura v65 §9.1; venue scenes of their own wait, §9.2).
const SCENE = require('../../../../assets/riso/venue-scene.webp');

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
  const calm = venue.bucket === 'calm';
  // docs/design/aura → KesfetMekan: the venue's riso scene under the status bar, back and its tags
  // over it; the name and district, why the position is asked,
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
        {/* U17: the scene from the very top, 300 high with the status bar on it (no strip of its
            own), its bottom corners 28. */}
        <View
          style={{
            height: KIT.venueHero.height,
            borderBottomLeftRadius: KIT.venueHero.radius,
            borderBottomRightRadius: KIT.venueHero.radius,
            overflow: 'hidden',
          }}
        >
          {/* The scene is the backdrop of the buttons and tags over it: they frost it, a lamp's
              cord blurred behind a tag instead of crossing its words (the owner's report, 30 Ekim). */}
          {/* Also drawn once as a plain picture under the target, as the ground (AuraBackground,
              K2): the scene showed nothing on first opening (the owner's report, 2 Kasım, 14.1). */}
          <Image
            source={SCENE}
            fadeDuration={0}
            accessible={false}
            resizeMode="cover"
            style={PICTURE_FILL}
          />
          <GlassTarget backdrop style={StyleSheet.absoluteFill}>
            <Image
              source={SCENE}
              fadeDuration={0}
              accessible={false}
              resizeMode="cover"
              style={PICTURE_FILL}
            />
          </GlassTarget>
          {/* The picture appears frosted and resolves 320 ms later over 500 (hareket.json). */}
          <FrostResolve />
          <View
            className="flex-row items-center justify-between"
            style={{ paddingHorizontal: KIT.size.side, paddingTop: insets.top + SPACING[2] }}
          >
            {/* U17: back on light glass, 44 (drawn over the page, below); the kind and the bucket
                as light tags, 28. */}
            <View style={{ width: KIT.size.round, height: KIT.size.round }} />
            <View style={{ flexDirection: 'row', gap: KIT.size.chipGap }}>
              <Tag large tone="scene" label={tr.explore.typeLabel[venueType(venue)]} />
              <Tag
                large
                tone={calm ? 'sceneCalm' : 'scene'}
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
            paddingTop: SPACING[6],
            gap: SPACING[6],
          }}
        >
          {/* U17: the name at .display, the district in the ink 2 under it, why the position is
              asked muted 8 under them. */}
          <View style={{ gap: SPACING[2] }}>
            <View style={{ gap: SPACING[0.5] }}>
              <T v="display" accessibilityRole="header">
                {venue.name}
              </T>
              <T v="body" ink>
                {venue.university
                  ? tr.explore.campusOf(venue.university.name, venue.district)
                  : venue.district}
              </T>
            </View>
            {/* Before a check-in only: once here, the location was already checked (the owner's
                report, 30 Ekim). */}
            {here ? null : <T v="body">{tr.explore.checkInHint}</T>}
          </View>
          <Btn
            block
            tall
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
          {/* The week's events, under the button (the owner's call, 31 Ekim); none: a small glass
              card says so (U17). */}
          <View style={{ gap: SPACING[3] }}>
            <Sec title={tr.explore.eventsTitle} note={tr.explore.weekNote} />
            {venue.events.length === 0 ? (
              <Glass sm style={{ padding: SPACING[4] }}>
                <EmptyState kind="empty" riso="events" compact body={tr.explore.noEvents} />
              </Glass>
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
        </View>
      </ScrollView>
      {/* Back stays where it is while the page scrolls (the owner's report, 2 Kasım, X4). */}
      <View style={{ position: 'absolute', left: KIT.size.side, top: insets.top + SPACING[2] }}>
        <Round light icon="back" label={tr.explore.back} onPress={() => router.back()} />
      </View>
    </View>
  );
}
