import { describeEventTime } from '@shared/explore.ts';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { FrostResolve } from '@/aura/FrostIn';
import { PICTURE_FILL } from '@/aura/RisoPicture';
import { Btn, Glass, Round, T, Tag, useKit } from '@/aura/kit';
import { VenueThumb } from '@/aura/VenueThumb';
import { EmptyState } from '@/components/EmptyState';
import { GlassTarget } from '@/components/LiquidGlass';
import { Loader } from '@/components/Loader';
import { boxShadowParts } from '@/components/NativeShadow';
import { Screen } from '@/components/Screen';
import { ScreenStatusBar } from '@/components/StatusScrim';
import { useTabBarSpace } from '@/components/TabBar';
import { useCheckinDraft } from '@/features/checkin/draft';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { Bucket } from '@/features/explore/Bucket';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { useExploreVenue, useVenueCity } from '@/features/explore/useExploreVenues';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useNow } from '@/lib/useNow';
import { venueType } from '@/lib/venueType';
import {
  BarArrive,
  BarBand,
  Cover,
  ScrollBody,
  ScrollFade,
  ScrollScreen,
  useScrollOffset,
  useScrollPast,
} from '@/motion';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { VENUE_DETAIL as D } from '@/theme/venueDetail';

// U17: the one riso scene of every venue (Aura v65 §9.1; venue scenes of their own wait, §9.2).
const SCENE = require('../../../../assets/riso/venue-scene.webp');
const EVENTS_PICTURE: number = require('../../../../assets/riso/empty-events.webp');

const V = KIT.venueCover;

type Venue = NonNullable<ReturnType<typeof useExploreVenue>['venue']>;

// A venue from Keşfet (docs/design/aura → KesfetMekan): its bucket, the week's events, and check-in.
// Choosing the venue here is the manual selection; the position is taken next only to verify it
// (docs/arsiv/SPEC_V2.md §4). The spot is chosen in the check-in sheet, not here.
export default function VenueDetailScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { venue, isPending, isError, error, refetch } = useExploreVenue(venueId);
  const y = useScrollOffset();

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
    <ScrollScreen y={y}>
      <CoverPage venue={venue} y={y} />
    </ScrollScreen>
  );
}

// The `kapak` page (docs/design/iskelet.md → 3.1, 5.2): the scene 360 high under the status bar,
// moving at 0.45 of the scroll, a dark fade over its top; the content rides over its foot as a
// card 34 round: the kind, district and city with the bucket's tag at the right, the name at 31,
// why the position is asked, check-in (or "Mekana dön"), and the week's events (the owner's call,
// 31 Ekim: they stay). Scrolled, the bar's band comes in over 240–280 and the venue's small
// picture and name beside the back button over 300–330; the back button never moves. The rest of
// the board's values (tuval Detay): theme/venueDetail.ts.
function CoverPage({ venue, y }: { venue: Venue; y: ReturnType<typeof useScrollOffset> }) {
  const setVenue = useCheckinDraft((s) => s.setVenue);
  // Already checked in here: back to Mekan, not a new check-in that would end this one and take
  // the person off its table (audit VEN-2).
  const active = useActiveTable();
  const city = useVenueCity(venue.id);
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const barSpace = useTabBarSpace();
  const now = useNow(60_000);
  // The status bar's icons: light on the scene, the scheme's once the band is in (M15-12).
  const onBar = useScrollPast((V.band[0] + V.band[1]) / 2);
  const here = active.data?.venue_id === venue.id;
  const type = venueType(venue);
  const place = tr.explore.venuePlace([venue.district, city].filter((p): p is string => !!p));
  const barTop = insets.top + D.barTop;
  const look = D[scheme];
  const { c } = useKit();
  // The card's shadow rising over the cover (tuval Detay), drawn natively.
  const cardShadow = boxShadowParts(useLabOff('golge'), look.shadow || undefined, [
    V.cardRadius,
    V.cardRadius,
    0,
    0,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <ScreenStatusBar style={onBar && scheme === 'light' ? 'dark' : 'light'} />
      <Cover height={V.height} speed={V.speed}>
        {/* The scene is the backdrop of the back button over it: it frosts it (the owner's
            report, 30 Ekim). Also drawn once as a plain picture under the target, as the ground
            (AuraBackground, K2): the scene showed nothing on first opening (2 Kasım, 14.1). */}
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
          style={[
            { position: 'absolute', left: 0, right: 0, top: 0, height: V.shadeHeight },
            gradientStyle(V.shade),
          ]}
        />
      </Cover>
      <ScrollBody
        y={y}
        contentContainerStyle={{ flexGrow: 1, paddingTop: V.height - V.cardRadius }}
      >
        <View
          style={[
            {
              flexGrow: 1,
              backgroundColor: AURA[scheme].ground,
              borderTopLeftRadius: V.cardRadius,
              borderTopRightRadius: V.cardRadius,
              boxShadow: cardShadow.boxShadow,
              paddingHorizontal: D.side,
              paddingTop: D.padTop,
              paddingBottom: insets.bottom + SPACING[8] + barSpace,
            },
          ]}
        >
          {cardShadow.node}
          {look.ground ? (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { borderTopLeftRadius: V.cardRadius, borderTopRightRadius: V.cardRadius },
                gradientStyle(look.ground),
              ]}
            />
          ) : null}
          {/* The card's handle (tuval Detay). */}
          <View
            style={{
              alignSelf: 'center',
              width: D.handle.width,
              height: D.handle.height,
              borderRadius: D.handle.radius,
              marginTop: D.handle.top,
              marginBottom: D.handle.bottom,
              backgroundColor: look.handle,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: D.infoGap,
            }}
          >
            <View
              style={{
                minHeight: D.pill.height,
                paddingHorizontal: D.pill.padX,
                borderRadius: D.pill.height / 2,
                backgroundColor: look.pill,
                justifyContent: 'center',
              }}
            >
              <T v="detailPill" ink>
                {tr.explore.typeLabel[type]}
              </T>
            </View>
            {place ? (
              <View style={{ flexShrink: 1, minWidth: 0 }}>
                <T v="detailPlace" color={c.muted}>
                  {place}
                </T>
              </View>
            ) : null}
            <View style={{ marginLeft: 'auto' }}>
              <Bucket tall bucket={venue.bucket} />
            </View>
          </View>
          {/* The name fades as the bar's small one comes in (tuval Detay: 290–330). */}
          <View style={{ marginTop: D.titleTop, gap: SPACING[2] }}>
            <ScrollFade fade={D.titleFade} shrink={NO_SHRINK} scaleTo={1}>
              <T v="detailTitle" accessibilityRole="header">
                {venue.name}
              </T>
            </ScrollFade>
            {/* Not twice when the campus carries its university's name (igu-tower). */}
            {venue.university && venue.university.name !== venue.name ? (
              <T v="body" ink>
                {venue.university.name}
              </T>
            ) : null}
            {/* Before a check-in only: once here, the location was already checked (the owner's
                report, 30 Ekim). */}
            {here ? null : <T v="body">{tr.explore.checkInHint}</T>}
          </View>
          {/* Prominent (iskelet.md → 2.1): the body's main action; "Mekana dön" with its arrow
              after the words (tuval Detay). */}
          <Btn
            block
            tall
            style={{ marginTop: D.buttonTop }}
            look={{ type: 'detailBtn' }}
            icon={here ? undefined : 'pin'}
            trail={
              here ? <CapIcon name="chevron" color={KIT.onPrimary} size={D.buttonIcon} /> : null
            }
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
          {/* The week's events, under the button (the owner's call, 31 Ekim); none: the small
              empty card (3.4). */}
          <View style={{ marginTop: D.eventsTop, gap: D.eventsBottom }}>
            {/* Etkinlikler at 21/800 and "Bu hafta" in a glass pill at its right (tuval Detay):
                a note, not a press. */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACING[2],
              }}
            >
              <T v="exploreSection" accessibilityRole="header">
                {tr.explore.eventsTitle}
              </T>
              <Glass
                face={look.week}
                radius={D.week.height / 2}
                style={{
                  minHeight: D.week.height,
                  paddingHorizontal: D.week.padX,
                  justifyContent: 'center',
                }}
              >
                <T v="exploreSort" ink>
                  {tr.explore.weekNote}
                </T>
              </Glass>
            </View>
            {venue.events.length === 0 ? (
              <EmptyCard
                title={tr.explore.noEventsTitle}
                body={tr.explore.noEvents}
                picture={EVENTS_PICTURE}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -D.side }}
                contentContainerStyle={{ paddingHorizontal: D.side, gap: KIT.size.rowGap }}
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
      </ScrollBody>
      {/* The bar (3.1, `kapak`): its band from the screen's top edge, under the status bar too. */}
      <BarBand from={V.band[0]} to={V.band[1]} />
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: D.barSide,
          right: D.barSide,
          top: barTop,
          flexDirection: 'row',
          alignItems: 'center',
          gap: D.barGap,
        }}
      >
        {/* Back stays where it is while the page scrolls (the owner's report, 2 Kasım, X4). */}
        <Round
          light
          icon="back"
          side={KIT.size.topBtn}
          label={tr.explore.back}
          onPress={() => router.back()}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <BarArrive from={V.barTitle[0]} to={V.barTitle[1]} rise={D.barRise}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: D.barNameGap }}>
              <VenueThumb
                kind={type}
                size={D.barThumb}
                radius={D.barThumb / 2}
                shadow={look.barThumbShadow || undefined}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="barName" lines={2} fit>
                  {venue.name}
                </T>
              </View>
            </View>
          </BarArrive>
        </View>
      </View>
    </View>
  );
}

// The name's fade does not shrink it.
const NO_SHRINK = [0, 1] as const;
