import { Ionicons } from '@expo/vector-icons';
import {
  EXPLORE_KINDS,
  type ExploreCity,
  type ExploreKind,
  type ExplorePlace,
  exploreCities,
  exploreLayout,
  explorePlace,
  filterVenues,
  sortVenues,
} from '@shared/explore.ts';
import { hasActiveTable } from '@shared/navigation.ts';
import type { VenueKind } from '@shared/venueKind.ts';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chips } from '@/components/Chips';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { LiveDot } from '@/components/LiveDot';
import { Loader } from '@/components/Loader';
import { Mark } from '@/components/Mark';
import { Rise, usePressScale } from '@/components/motion';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { useTabBarOverMap, useTabBarSpace } from '@/components/TabBar';
import { Text } from '@/components/Text';
import { useCheckinDraft } from '@/features/checkin/draft';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { ExploreMap } from '@/features/explore/ExploreMap';
import { useExplorePlace } from '@/features/explore/placeStore';
import {
  type CityVenue,
  type ExploreVenue,
  useCityVenues,
} from '@/features/explore/useExploreVenues';
import { BucketBadge, BucketLine, EventRow, VenueTile } from '@/features/explore/VenueTags';
import { NotificationsBell } from '@/features/notifications/Bell';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

type View_ = 'list' | 'map';

// The single venue's colour block (canvas: Keşfet · tek mekan).
const HERO_HEIGHT = SPACING[16] * 2 + SPACING[8];
const HERO_MARK = SPACING[16] + SPACING[10];

type Here = { name: string; spot: string | null; kind: VenueKind };

// The own check-in's dot beats slow and steady.
const HERE_BEAT_MS = 1600;

// Keşfet (docs/SPEC_V2.md §4, SPEC_V4 §4.C): the venues of a city, chosen by hand, never by the
// phone's position (rule 6). The venue is picked here; check-in then verifies the position. With one
// active venue (the campus pilot) it is a single venue card with all its events and no list/map
// switch, search, kind or city (docs/SPEC_V3.md §4.4, K-37). From two on, v44's list: search, kind,
// city and district (K-38), venues with an event today first (K-21, K-42), the bucket in words
// (K-41); a row opens the venue page (K-43).
export default function ExploreScreen() {
  const { colors, shape } = useTheme();
  const table = useActiveTable();
  const now = useNow(30_000);
  const { venues, cities, listed } = useCityVenues();
  const [view, setView] = useState<View_>('list');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ExploreKind>('all');
  const saved = useExplorePlace((s) => s.saved);
  const loadPlace = useExplorePlace((s) => s.load);
  useEffect(loadPlace, [loadPlace]);
  // The map lies under the header; its opening camera keeps the venues below it.
  const [headerHeight, setHeaderHeight] = useState(0);
  // The floating tab bar covers the bottom of the map and the list.
  const barSpace = useTabBarSpace();

  const layout = venues.isSuccess ? exploreLayout(venues.data.length) : 'list';
  const ready = venues.isSuccess && (layout === 'single' || cities.isSuccess);
  const showMap = ready && layout === 'list' && view === 'map';
  // The venue card and the tab bar sit right on the map: no fade band over it.
  useTabBarOverMap(showMap);

  useEffect(() => {
    if (layout === 'list') track('explore_viewed', { view });
  }, [layout, view]);

  const place = useMemo(() => explorePlace(saved, listed), [saved, listed]);
  const shown = useMemo(
    () => sortVenues(filterVenues(listed, { place, kind, query }), now),
    [listed, place, kind, query, now],
  );
  const here = hasActiveTable(table.data, now) ? table.data : null;
  const hereCard: Here | null = here
    ? {
        name: here.venue?.name ?? '',
        spot: here.spot?.name ?? null,
        kind: venues.data?.find((v) => v.id === here.venue_id)?.kind ?? 'cafe',
      }
    : null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ flex: 1 }}>
        {showMap && headerHeight > 0 ? (
          <View style={StyleSheet.absoluteFill}>
            <ExploreMap venues={shown.venues} headerHeight={headerHeight} tabBarHeight={barSpace} />
          </View>
        ) : null}
        <View
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          style={{ paddingHorizontal: shape.screenPadding, backgroundColor: colors.canvas }}
          className="gap-2.5 pb-2.5 pt-3"
        >
          <ScreenHeader
            title={tr.tabs.explore}
            trailing={
              <View className="flex-row items-center gap-2">
                {layout === 'single' ? null : (
                  // Icons only, so "Keşfet", the switch and the bell share one row; the reader
                  // still hears "Liste" and "Harita".
                  <Segmented
                    iconOnly
                    accessibilityLabel={tr.explore.viewSwitch}
                    value={view}
                    onChange={setView}
                    options={[
                      { value: 'list', label: tr.explore.views.list, icon: 'list' },
                      { value: 'map', label: tr.explore.views.map, icon: 'map-outline' },
                    ]}
                  />
                )}
                <NotificationsBell />
              </View>
            }
          />
          {ready && layout === 'list' ? (
            <>
              <Input
                search
                testID="explore-search"
                accessibilityLabel={tr.explore.search}
                placeholder={tr.explore.search}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              <Chips
                accessibilityLabel={tr.explore.kindsLabel}
                value={kind}
                onChange={setKind}
                options={EXPLORE_KINDS.map((k) => ({
                  value: k,
                  label: tr.explore.kinds[k],
                  testID: `explore-kind-${k}`,
                }))}
              />
            </>
          ) : null}
        </View>

        {!ready && !venues.isError && !cities.isError ? (
          <View className="mt-8 items-center">
            <Loader />
          </View>
        ) : null}
        {venues.isError || cities.isError ? (
          <View style={{ paddingHorizontal: shape.screenPadding }}>
            <EmptyState
              icon="cloud-offline-outline"
              body={tr.common.genericError}
              action={{
                label: tr.checkin.retry,
                onPress: () => {
                  void venues.refetch();
                  void cities.refetch();
                },
                loading: venues.isRefetching || cities.isRefetching,
              }}
            />
          </View>
        ) : null}

        {ready && layout === 'list' && view === 'list' ? (
          <VenueList
            venues={shown.venues}
            eventsFirst={shown.sort === 'eventsFirst'}
            listed={listed}
            place={place}
            searching={query.trim() !== ''}
            here={hereCard}
            bottomSpace={barSpace}
          />
        ) : null}
        {ready && layout === 'single' && venues.data[0] ? (
          <SingleVenue venue={venues.data[0]} here={hereCard} bottomSpace={barSpace} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// "Şu an buradasın" (v44: .vhere): the own check-in and the way back to Mekan. The phone's own
// data; nobody else sees it.
function HereCard({ here }: { here: Here }) {
  return (
    <Card testID="explore-here">
      <View className="flex-row items-center gap-2">
        <LiveDot tone="success" periodMs={HERE_BEAT_MS} size={SPACING[2]} />
        <Text variant="label" tone="success">
          {tr.explore.here}
        </Text>
      </View>
      <View className="mt-2.5 flex-row items-center gap-3">
        <VenueTile kind={here.kind} />
        <View className="flex-1">
          <Text variant="bodyStrong">{here.name}</Text>
          <Text variant="fine">{tr.explore.hereAt(here.spot)}</Text>
        </View>
      </View>
      <View className="mt-3">
        <Button
          variant="secondary"
          label={tr.explore.backToVenue}
          onPress={() => router.navigate('/venue')}
          testID="explore-back-to-venue"
        />
      </View>
    </Card>
  );
}

// v44's list (.vloc, .vlist): the city and district, the count line, the venues in one card.
function VenueList({
  venues,
  eventsFirst,
  listed,
  place,
  searching,
  here,
  bottomSpace,
}: {
  venues: readonly CityVenue[];
  eventsFirst: boolean;
  listed: readonly CityVenue[];
  place: ExplorePlace | null;
  searching: boolean;
  here: Here | null;
  bottomSpace: number;
}) {
  const { shape } = useTheme();
  const [placeSheet, setPlaceSheet] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const cityList = useMemo(() => exploreCities(listed), [listed]);
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerClassName="gap-3 pt-1"
      contentContainerStyle={{
        paddingHorizontal: shape.screenPadding,
        paddingBottom: SPACING[8] + bottomSpace,
      }}
    >
      {here ? <HereCard here={here} /> : null}
      <View className="flex-row flex-wrap items-center justify-between gap-x-2.5 gap-y-1.5 px-0.5">
        {/* One city with active venues: no city to choose (K-38). */}
        {place && cityList.length > 1 ? (
          <PlaceButton
            place={place}
            onPress={() => {
              setSheetKey((k) => k + 1);
              setPlaceSheet(true);
            }}
          />
        ) : null}
        <Text variant="label" tone="muted" testID="explore-count">
          {tr.explore.countLine(venues.length, eventsFirst)}
        </Text>
      </View>
      {listed.length === 0 ? (
        <EmptyState icon="cafe-outline" body={tr.explore.empty} />
      ) : venues.length === 0 ? (
        <Card>
          <View className="gap-1" testID="explore-no-match">
            <Text variant="bodyStrong">{searching ? tr.explore.noMatch : tr.explore.noPlace}</Text>
            <Text variant="fine">
              {searching ? tr.explore.noMatchHint : tr.explore.noPlaceHint}
            </Text>
          </View>
        </Card>
      ) : (
        <Card flush>
          <View style={{ paddingVertical: SPACING[1.5] }}>
            {venues.map((v, i) => (
              <Rise key={v.id} index={i}>
                <VenueRow venue={v} />
              </Rise>
            ))}
          </View>
        </Card>
      )}
      <Text variant="fine" align="center" className="pt-2">
        {tr.checkin.osmAttribution}
      </Text>
      {place ? (
        <PlaceSheet
          key={sheetKey}
          visible={placeSheet}
          onClose={() => setPlaceSheet(false)}
          cities={cityList}
          place={place}
        />
      ) : null}
    </ScrollView>
  );
}

// The city and district button (v44: .vloc-btn): a capsule with the pin and the chevron.
function PlaceButton({ place, onPress }: { place: ExplorePlace; onPress: () => void }) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  return (
    <Pressable
      testID="explore-place"
      accessibilityRole="button"
      accessibilityLabel={tr.explore.placeLabel(place.city, place.district)}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center gap-1.5"
          style={[
            {
              minHeight: TOUCH.min,
              paddingLeft: SPACING[2.5],
              paddingRight: SPACING[3] + SPACING[0.5],
              borderRadius: shape.radius.pill,
              borderWidth: shape.stroke.hairline * 1.5,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
            pressScale(pressed),
          ]}
        >
          <Icon name="location-outline" tone="accent" size={ICON.sm} />
          <Text variant="label" className="shrink">
            {tr.explore.place(place.city, place.district)}
          </Text>
          <Icon name="chevron-down" tone="muted" size={ICON.sm} />
        </View>
      )}
    </Pressable>
  );
}

// "Şehir ve semt" (v44: [data-vloc-sheet]): a city, then one of its districts or all of them;
// "Göster" keeps the choice on this phone (K-38).
function PlaceSheet({
  visible,
  onClose,
  cities,
  place,
}: {
  visible: boolean;
  onClose: () => void;
  cities: readonly ExploreCity[];
  place: ExplorePlace;
}) {
  const choose = useExplorePlace((s) => s.choose);
  // Mounted afresh at each opening (its key), so the choice starts from the place shown.
  const [pick, setPick] = useState<ExplorePlace>(place);
  const districts = cities.find((c) => c.city === pick.city)?.districts ?? [];
  const ALL = '';
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.explore.placeTitle}>
      <Text variant="fine">{tr.explore.placeNote}</Text>
      <View className="gap-2">
        <Text variant="bodyStrong">{tr.explore.city}</Text>
        <Chips
          wrap
          accessibilityLabel={tr.explore.city}
          value={pick.city}
          onChange={(city) => setPick({ city, district: null })}
          options={cities.map((c) => ({
            value: c.city,
            label: c.city,
            testID: `place-city-${c.city}`,
          }))}
        />
      </View>
      <View className="gap-2">
        <Text variant="bodyStrong">{tr.explore.district}</Text>
        <Chips
          wrap
          accessibilityLabel={tr.explore.district}
          value={pick.district ?? ALL}
          onChange={(d) => setPick({ city: pick.city, district: d === ALL ? null : d })}
          options={[
            { value: ALL, label: tr.explore.allDistricts, testID: 'place-district-all' },
            ...districts.map((d) => ({ value: d, label: d, testID: `place-district-${d}` })),
          ]}
        />
      </View>
      <Button
        label={tr.explore.showPlace}
        testID="place-show"
        onPress={() => {
          choose(pick);
          onClose();
        }}
      />
    </Sheet>
  );
}

// A venue (v44: .vrow): its kind on a tile, the name, the kind and district, then the bucket in
// words (K-41).
function VenueRow({ venue: v }: { venue: CityVenue }) {
  const { colors } = useTheme();
  const sub = tr.explore.venueSub(tr.explore.kindLabel[v.kind], v.district);
  const bucket = tr.explore.buckets[v.bucket];
  return (
    <Pressable
      testID={`explore-venue-${v.name}`}
      accessibilityRole="button"
      accessibilityLabel={`${v.name}, ${sub}, ${bucket}`}
      onPress={() => router.push({ pathname: '/explore/[venueId]', params: { venueId: v.id } })}
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center gap-3"
          style={{
            minHeight: TOUCH.large + SPACING[4],
            paddingVertical: SPACING[2.5],
            paddingLeft: SPACING[4],
            paddingRight: SPACING[3],
            backgroundColor: pressed ? colors.canvas : undefined,
          }}
        >
          <VenueTile kind={v.kind} />
          <View className="flex-1" style={{ gap: SPACING[0.5] }}>
            <Text variant="bodyStrong">{v.name}</Text>
            <Text variant="fine">{sub}</Text>
            <View className="mt-0.5">
              <BucketLine bucket={v.bucket} />
            </View>
          </View>
          <Icon name="chevron-forward" tone="muted" />
        </View>
      )}
    </Pressable>
  );
}

// The pilot's Keşfet: the one venue as the featured card (a colour block with the mark, the name,
// check-in), all its events within the week, then "Yeni mekanlar yakında". A second active venue
// brings the list and the map back (content only).
function SingleVenue({
  venue,
  here,
  bottomSpace,
}: {
  venue: ExploreVenue;
  here: Here | null;
  bottomSpace: number;
}) {
  const { colors, shape } = useTheme();
  const setVenue = useCheckinDraft((s) => s.setVenue);
  return (
    <ScrollView
      // The floating tab bar covers the bottom: the card and the note end above it.
      contentContainerStyle={{
        paddingHorizontal: shape.screenPadding,
        paddingBottom: SPACING[8] + bottomSpace,
      }}
      contentContainerClassName="gap-4 pt-2"
    >
      {here ? <HereCard here={here} /> : null}
      <Rise>
        <Card tone="feature" flush>
          <View
            style={{ height: HERO_HEIGHT, backgroundColor: colors.surface2 }}
            className="flex-row items-end justify-between px-4 pb-3 pt-4"
          >
            <View className="self-start">
              <BucketBadge bucket={venue.bucket} />
            </View>
            <Mark size={HERO_MARK} label={null} />
          </View>
          <View className="gap-4 p-4">
            <View className="gap-1">
              <Text variant="title" accessibilityRole="header">
                {venue.name}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Icon name="location-outline" tone="muted" />
                <Text variant="fine">{venue.district}</Text>
              </View>
            </View>
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
        </Card>
      </Rise>
      <Rise index={1}>
        <View className="gap-3">
          <Text variant="heading" accessibilityRole="header">
            {tr.explore.eventsTitle}
          </Text>
          {venue.events.length === 0 ? (
            <Card>
              <View className="flex-row items-center gap-3">
                <View
                  className="items-center justify-center"
                  style={{
                    width: TOUCH.button,
                    height: TOUCH.button,
                    borderRadius: shape.radius.pill,
                    backgroundColor: colors.surface2,
                  }}
                >
                  <Ionicons name="calendar-outline" size={ICON.lg} color={colors.text} />
                </View>
                <Text tone="muted" className="flex-1">
                  {tr.explore.noEvents}
                </Text>
              </View>
            </Card>
          ) : (
            venue.events.map((event) => (
              <EventRow key={`${event.startsAt}-${event.title}`} event={event} />
            ))
          )}
        </View>
      </Rise>
      <Rise index={2}>
        <Card tone="note">
          <View className="flex-row items-center gap-3">
            <Mark size={SPACING[11]} label={null} />
            <Text variant="bodyStrong" className="flex-1">
              {tr.explore.comingSoon}
            </Text>
          </View>
        </Card>
      </Rise>
    </ScrollView>
  );
}
