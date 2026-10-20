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
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chips } from '@/components/Chips';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Loader } from '@/components/Loader';
import { Mark } from '@/components/Mark';
import { Rise } from '@/components/motion';
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
import { BucketBadge, EventRow } from '@/features/explore/VenueTags';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { venueType, type VenueType } from '@/lib/venueType';
import { V46_EXPLORE } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { V46_PALETTE } from '@/theme/tokens.generated';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { CityButton } from '@/ui/CityButton';
import { FilterChips } from '@/ui/FilterChips';
import { HereCard } from '@/ui/HereCard';
import { SearchField } from '@/ui/SearchField';
import { TopBar } from '@/ui/TopBar';
import { VenueList as VenueCard } from '@/ui/VenueList';
import { VenueRow } from '@/ui/VenueRow';
import { ViewModeToggle } from '@/ui/ViewModeToggle';

type View_ = 'list' | 'map';

// The single venue's colour block (canvas: Keşfet · tek mekan).
const HERO_HEIGHT = SPACING[16] * 2 + SPACING[8];
const HERO_MARK = SPACING[16] + SPACING[10];

type Here = { name: string; spot: string | null; type: VenueType };

// Keşfet (docs/SPEC_V2.md §4, SPEC_V4 §4.C): the venues of a city, chosen by hand, never by the
// phone's position (rule 6). The venue is picked here; check-in then verifies the position. With one
// active venue (the campus pilot) it is a single venue card with all its events and no list/map
// switch, search, kind or city (docs/SPEC_V3.md §4.4, K-37). From two on, v46's Keşfet (`.disc`):
// the pinned head with the title, the list/map switch, the search and the kind chips (`.dhd`), then
// "Şu an buradasın", the city and district (K-38) with the count, and the venues in one card;
// venues with an event today first (K-21, K-42), the bucket in words (K-41); a row opens the venue
// page (K-43). The bell is in Mesajlar only (K-6).
export default function ExploreScreen() {
  const { scheme, shape } = useTheme();
  const table = useActiveTable();
  const now = useNow(30_000);
  const { venues, cities, listed } = useCityVenues();
  const [view, setView] = useState<View_>('list');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ExploreKind>('all');
  const saved = useExplorePlace((s) => s.saved);
  const loadPlace = useExplorePlace((s) => s.load);
  useEffect(loadPlace, [loadPlace]);
  // The map lies under the head; its opening camera keeps the venues below it.
  const [headerHeight, setHeaderHeight] = useState(0);
  // The floating tab bar covers the bottom of the map and the list.
  const barSpace = useTabBarSpace();

  const layout = venues.isSuccess ? exploreLayout(venues.data.length) : 'list';
  const ready = venues.isSuccess && (layout === 'single' || cities.isSuccess);
  const showMap = ready && layout === 'list' && view === 'map';
  // The map's GL surface cannot be blurred: over it the tab bar is opaque.
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
  const hereVenue = here ? venues.data?.find((v) => v.id === here.venue_id) : undefined;
  const hereCard: Here | null = here
    ? {
        name: here.venue?.name ?? '',
        spot: here.spot?.name ?? null,
        type: hereVenue ? venueType(hereVenue) : 'kafe',
      }
    : null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: V46_PALETTE[scheme].canvas }}>
      <View style={{ flex: 1 }}>
        {showMap && headerHeight > 0 ? (
          <View style={StyleSheet.absoluteFill}>
            <ExploreMap venues={shown.venues} headerHeight={headerHeight} tabBarHeight={barSpace} />
          </View>
        ) : null}
        <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} style={{ zIndex: 1 }}>
          <TopBar
            kind="explore"
            title={tr.tabs.explore}
            testID="explore-head"
            right={
              layout === 'single' ? undefined : (
                <ViewModeToggle
                  value={view}
                  labels={tr.explore.views}
                  accessibilityLabel={tr.explore.viewSwitch}
                  onChange={(mode) => {
                    haptic('selection');
                    setView(mode);
                  }}
                />
              )
            }
          >
            {ready && layout === 'list' ? (
              <>
                {/* 12 below the title's row (`.dsearch{margin-top:12px}`). */}
                <View style={{ marginTop: V46_EXPLORE[scheme].search.marginTop }}>
                  <SearchField
                    value={query}
                    onChangeText={setQuery}
                    placeholder={tr.explore.search}
                    testID="explore-search"
                  />
                </View>
                <FilterChips
                  items={EXPLORE_KINDS.map((k) => ({
                    key: k,
                    label: tr.explore.kinds[k],
                    testID: `explore-kind-${k}`,
                  }))}
                  value={kind}
                  onChange={setKind}
                  accessibilityLabel={tr.explore.kindsLabel}
                />
              </>
            ) : null}
          </TopBar>
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

// "Şu an buradasın" (v46 `.vhere`): the own check-in and the way back to Mekan. The phone's own
// data; nobody else sees it.
function HereNow({ here }: { here: Here }) {
  return (
    <HereCard
      label={tr.explore.here}
      thumb={here.type}
      name={here.name}
      sub={tr.explore.hereAt(here.spot)}
      action={tr.explore.backToVenue}
      onPress={() => router.navigate('/venue')}
      testID="explore-here"
    />
  );
}

// v46's list (`.vloc`, `.vlist`): the city and district with the count, the venues in one card,
// within the screen's side padding (the chips reach past it by as much).
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
  const { scheme } = useTheme();
  const side = -V46_EXPLORE[scheme].chips.margin[3];
  const [placeSheet, setPlaceSheet] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const cityList = useMemo(() => exploreCities(listed), [listed]);
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingHorizontal: side, paddingBottom: SPACING[8] + bottomSpace }}
    >
      {here ? <HereNow here={here} /> : null}
      <CityButton
        // One city with active venues: no city to choose, the count alone (K-38).
        label={place && cityList.length > 1 ? tr.explore.place(place.city, place.district) : null}
        accessibilityLabel={place ? tr.explore.placeLabel(place.city, place.district) : undefined}
        count={tr.explore.countLine(venues.length, eventsFirst)}
        onPress={() => {
          setSheetKey((k) => k + 1);
          setPlaceSheet(true);
        }}
        testID="explore-place"
        countTestID="explore-count"
      />
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
        <VenueCard>
          {venues.map((v, i) => {
            const type = venueType(v);
            return (
              <VenueRow
                key={v.id}
                thumb={type}
                name={v.name}
                sub={tr.explore.venueSub(tr.explore.typeLabel[type], v.district)}
                status={{ text: tr.explore.buckets[v.bucket], live: v.bucket !== 'calm' }}
                index={i}
                onPress={() =>
                  router.push({ pathname: '/explore/[venueId]', params: { venueId: v.id } })
                }
                testID={`explore-venue-${v.name}`}
              />
            );
          })}
        </VenueCard>
      )}
      <Text variant="fine" align="center" className="pt-5">
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
      {here ? <HereNow here={here} /> : null}
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
