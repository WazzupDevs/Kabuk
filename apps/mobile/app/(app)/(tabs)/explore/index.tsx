import {
  EXPLORE_KINDS,
  type ExploreCity,
  type ExploreKind,
  type ExplorePlace,
  type ExploreEmpty,
  exploreCities,
  exploreEmpty,
  explorePlace,
  type ExploreUniversity,
  filterVenues,
  groupByUniversity,
  liveliestBucket,
  sortVenues,
} from '@shared/explore.ts';
import { hasActiveTable } from '@shared/navigation.ts';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground, AuraBand } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Li, Live, Round, T, Tag, useKit } from '@/aura/kit';
import { useTabOpenings } from '@/aura/motion';
import type { TabOpenings } from '@/lib/tabOpenings';
import { Reveal } from '@/aura/Reveal';
import { VenueThumb } from '@/aura/VenueThumb';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { PullScroll } from '@/components/PullScroll';
import { Sheet } from '@/components/Sheet';
import { TabBarFade, useTabBarOverMap, useTabBarSpace } from '@/components/TabBar';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { ExploreMap } from '@/features/explore/ExploreMap';
import { useExplorePlace } from '@/features/explore/placeStore';
import { EventTag } from '@/features/explore/EventTag';
import { type CityVenue, useCityVenues } from '@/features/explore/useExploreVenues';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { dayPart } from '@/lib/dayPart';
import { haptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { venueType } from '@/lib/venueType';
import { AURA } from '@/theme/aura';
import { useNarrow } from '@/lib/useNarrow';
import { KIT, KIT_TYPE, VENUE_THUMB } from '@/theme/auraKit';
import { THEME } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type View_ = 'list' | 'map';

type Here = { name: string; spot: string | null };

// Keşfet (docs/design/aura → Keşfet, Keşfet: boş; docs/arsiv/SPEC_V2.md §4, SPEC_V4 §4.C): always the
// list of a city's venues, chosen by hand, never by the phone's position (rule 6). The venue is
// picked here; check-in then verifies the position. The question at the very top (no bar with the
// place and the bell: the bell is in Mesajlar only, K-6), the search and the list/map switch, the
// kind chips, the city and district with the count (K-38; it opens the place sheet), then the venues
// as plain rows with a hairline between them; venues with an event today first (K-21, K-42), the
// bucket in words (K-41); a row opens the venue page (K-43). No venue to show: a glass card says so.
export default function ExploreScreen() {
  const narrow = useNarrow();
  const { scheme, shape } = useTheme();
  const table = useActiveTable();
  const now = useNow(30_000);
  const { venues, cities, listed } = useCityVenues();
  const openings = useTabOpenings();
  const [view, setView] = useState<View_>('list');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ExploreKind>('all');
  // A kind chosen plays the list's arrival again (hareket.json → dissolve).
  const [kindRuns, setKindRuns] = useState(0);
  const saved = useExplorePlace((s) => s.saved);
  const loadPlace = useExplorePlace((s) => s.load);
  useEffect(loadPlace, [loadPlace]);
  // The map lies under the head; its opening camera keeps the venues below it.
  const [headerHeight, setHeaderHeight] = useState(0);
  // The floating tab bar covers the bottom of the map and the list.
  const barSpace = useTabBarSpace();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const ready = venues.isSuccess && cities.isSuccess;
  const showMap = ready && view === 'map';
  // The map's GL surface cannot be blurred: over it the tab bar is opaque.
  useTabBarOverMap(showMap);

  useEffect(() => {
    track('explore_viewed', { view });
  }, [view]);

  const place = useMemo(() => explorePlace(saved, listed), [saved, listed]);
  const shown = useMemo(
    () => sortVenues(filterVenues(listed, { place, kind, query }), now),
    [listed, place, kind, query, now],
  );
  // Why nothing shows, for the list's card and the map (kabul raporu §9.1).
  const empty = exploreEmpty(listed.length, { kind, query });
  const here = hasActiveTable(table.data, now) ? table.data : null;
  const hereCard: Here | null = here
    ? { name: here.venue?.name ?? '', spot: here.spot?.name ?? null }
    : null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      {/* The colour clouds (docs/design/aura → Keşfet); the map covers them when it is open. */}
      <AuraBackground />
      {/* The map from the very top, under the status bar, fading into the ground towards the top
          under the head (the owner's call, 28 Ekim: the status bar's flat band looked odd). */}
      {showMap && headerHeight > 0 ? (
        <>
          <View style={StyleSheet.absoluteFill}>
            <ExploreMap
              venues={shown.venues}
              empty={emptyCopy(empty, kind)}
              headerHeight={insets.top + headerHeight}
              tabBarHeight={barSpace}
            />
          </View>
          {/* U14: the aura over the top 26 % of the screen, giving way to the map by 40 %; never
              before the head's foot, or the map's labels show between its parts (the owner's
              report, 2 Kasım, 4.3). */}
          <AuraBand
            top={0}
            height={Math.max(screenHeight * MAP_SOLID, insets.top + headerHeight)}
            fade={screenHeight * MAP_FADE}
            direction="down"
          />
        </>
      ) : null}
      <View style={{ flex: 1 }}>
        <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} style={{ zIndex: 1 }}>
          {/* docs/design/aura → Keşfet: the question, the search field and the list/map switch
              on glass, the kind chips; each part arrives a step after the one before. */}
          <View
            testID="explore-head"
            style={{
              paddingHorizontal: KIT.size.side,
              paddingTop: SPACING[2],
              gap: SPACING[6],
            }}
          >
            {/* U13: the question at .display, at most its two lines. */}
            <Reveal index={0} openings={openings}>
              <T v="display" accessibilityRole="header">
                {tr.explore.question[dayPart(now)]}
              </T>
            </Reveal>
            {ready ? (
              <View style={{ gap: SPACING[3] }}>
                <Reveal index={1} openings={openings}>
                  <View style={{ flexDirection: 'row', gap: SEARCH_GAP }}>
                    <SearchGlass value={query} onChangeText={setQuery} />
                    <ViewSwitch
                      value={view}
                      onChange={(mode) => {
                        haptic('selection');
                        setView(mode);
                      }}
                    />
                  </View>
                </Reveal>
                <Reveal index={2} openings={openings}>
                  {/* U13: the kind chips on one line, scrolling sideways to the screen's edge. */}
                  <ScrollView
                    horizontal
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    accessibilityRole="radiogroup"
                    accessibilityLabel={tr.explore.kindsLabel}
                    style={{ marginRight: -KIT.size.side, overflow: 'visible' }}
                    contentContainerStyle={{
                      gap: KIT.size.chipsGap,
                      paddingRight: KIT.size.side,
                    }}
                  >
                    {EXPLORE_KINDS.map((k) => (
                      <Chip
                        key={k}
                        testID={`explore-kind-${k}`}
                        label={tr.explore.kinds[k]}
                        narrow={narrow}
                        on={kind === k}
                        onPress={() => {
                          if (k === kind) return;
                          setKind(k);
                          setKindRuns((n) => n + 1);
                        }}
                      />
                    ))}
                  </ScrollView>
                </Reveal>
              </View>
            ) : null}
          </View>
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

        {ready && view === 'list' ? (
          <VenueList
            venues={shown.venues}
            eventsFirst={shown.sort === 'eventsFirst'}
            listed={listed}
            empty={empty}
            kind={kind}
            place={place}
            here={hereCard}
            bottomSpace={barSpace}
            replay={kindRuns}
            openings={openings}
            onRefresh={() => Promise.all([venues.refetch(), cities.refetch()])}
          />
        ) : null}
        {ready && view === 'list' ? <TabBarFade /> : null}
      </View>
    </SafeAreaView>
  );
}

// The words for an empty result (kabul raporu §9.1): search, kind, district; no data at all has no hint.
function emptyCopy(empty: ExploreEmpty, kind: ExploreKind): { title: string; hint: string | null } {
  switch (empty) {
    case 'none':
      return { title: tr.explore.empty, hint: null };
    case 'search':
      return { title: tr.explore.noMatch, hint: tr.explore.noMatchHint };
    case 'kind':
      return kind === 'all'
        ? { title: tr.explore.noPlace, hint: tr.explore.noPlaceHint }
        : { title: tr.explore.noKind[kind], hint: tr.explore.noKindHint };
    case 'place':
      return { title: tr.explore.noPlace, hint: tr.explore.noPlaceHint };
  }
}

// A venue row's liveliness: "Sessiz" as the calm tag (U13), the live dot otherwise.
function Bucket({ bucket, calm }: { bucket: CityVenue['bucket']; calm: boolean }) {
  return calm ? (
    <Tag tone="purple" label={tr.explore.buckets[bucket]} />
  ) : (
    <Live label={tr.explore.buckets[bucket]} color={KIT.pink} ring={KIT.pinkRing} />
  );
}

// "Şu an buradasın" (v46 `.vhere`): the own check-in and the way back to Mekan. The phone's own
// data; nobody else sees it.
function HereNow({ here }: { here: Here }) {
  // A thin row: the live dot, the venue and the spot on the whole width, "Mekana dön" as the round
  // arrow at the right, in the words' middle (the owner's report, 2 Kasım, 1.1, 1.2: the written
  // button squeezed a long name into four lines). Without a spot no line under the name (1.3).
  return (
    <Glass
      sm
      testID="explore-here"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: KIT.size.liPadY,
        paddingHorizontal: KIT.size.liPadX,
        gap: KIT.size.liGap,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: SPACING[0.5] }}>
        <Live label={tr.explore.here} />
        <T v="h3">{here.name}</T>
        {here.spot ? <T v="fine">{tr.explore.hereAt(here.spot)}</T> : null}
      </View>
      <View style={{ alignSelf: 'center' }}>
        <Round
          primary
          big
          icon="forward"
          label={tr.explore.backToVenue}
          testID="explore-back-to-venue"
          onPress={() => router.navigate('/venue')}
        />
      </View>
    </Glass>
  );
}

// The list (Keşfet, Keşfet: boş): the city and district with the count, then the venues as plain
// rows with a hairline between them, within the screen's side padding. The rows arrive 60 ms apart
// after the head's parts.
function VenueList({
  venues,
  eventsFirst,
  listed,
  empty,
  kind,
  place,
  here,
  bottomSpace,
  replay,
  openings,
  onRefresh,
}: {
  venues: readonly CityVenue[];
  eventsFirst: boolean;
  listed: readonly CityVenue[];
  empty: ExploreEmpty;
  kind: ExploreKind;
  place: ExplorePlace | null;
  here: Here | null;
  bottomSpace: number;
  replay: number;
  openings: TabOpenings | null;
  onRefresh: () => Promise<unknown>;
}) {
  const side = KIT.size.side;
  const [placeSheet, setPlaceSheet] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const cityList = useMemo(() => exploreCities(listed), [listed]);
  // The university whose campuses are open in the sheet (docs/SPEC_V4.md §4.Q).
  const [uni, setUni] = useState<ExploreUniversity | null>(null);
  const [uniKey, setUniKey] = useState(0);
  return (
    // Pulled down at its top it fetches the list again (v46's `.ptr-ind`).
    <PullScroll
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        paddingHorizontal: side,
        paddingTop: SPACING[6],
        // At least 124 under the list (U13; the bar's room is 92 without a safe area).
        paddingBottom: SPACING[8] + bottomSpace,
        gap: SPACING[3],
      }}
    >
      {here ? <HereNow here={here} /> : null}
      {/* The city and district, and how many venues (K-38): a section's head. */}
      <Reveal index={SECTION_AT} replay={replay} openings={openings}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            // Side by side while both fit; the count goes under the place on a narrow screen (the
            // owner's report, 30 Ekim: the two ran into each other).
            columnGap: KIT.size.rowGap,
            rowGap: SPACING[0.5],
            paddingTop: KIT.size.secPadTop,
          }}
        >
          {place ? (
            // The place sheet opens from here when there is a city to choose (K-38).
            <Pressable
              testID="explore-place"
              accessibilityRole={cityList.length > 1 ? 'button' : 'header'}
              accessibilityLabel={tr.explore.placeLabel(place.city, place.district)}
              disabled={cityList.length <= 1}
              onPress={() => {
                setSheetKey((k) => k + 1);
                setPlaceSheet(true);
              }}
              hitSlop={KIT.size.chipsGap}
            >
              <T v="h3">{tr.explore.place(place.city, place.district)}</T>
            </Pressable>
          ) : (
            <View />
          )}
          <T v="fine" testID="explore-count">
            {tr.explore.countLine(venues.length, eventsFirst)}
          </T>
        </View>
      </Reveal>
      {listed.length === 0 ? (
        <EmptyState kind="empty" riso="venues" body={tr.explore.empty} />
      ) : venues.length === 0 ? (
        // Keşfet: boş: a filter or a search that finds nothing, said by its cause.
        <Reveal index={ROWS_AT} step={ROW_STEP} replay={replay} openings={openings}>
          <Glass pad="lg" testID="explore-no-match" style={{ gap: SPACING[1] }}>
            <T v="sec">{emptyCopy(empty, kind).title}</T>
            <T v="body">{emptyCopy(empty, kind).hint}</T>
          </Glass>
        </Reveal>
      ) : (
        // U13: the rows on a small glass card, a hairline between them from the words to 16 short of
        // the right edge.
        <Glass sm style={{ paddingVertical: KIT.size.listPadY }}>
          {/* A university with several campuses is one row opening its campuses (docs/SPEC_V4.md
              §4.Q); every other venue, a single campus included, is its own row. */}
          {groupByUniversity(venues, listed).map((row, i) => (
            <Reveal
              key={row.type === 'venue' ? row.venue.id : `u-${row.university.id}`}
              index={ROWS_AT + i}
              step={ROW_STEP}
              replay={replay}
              openings={openings}
            >
              {i > 0 ? <RowHair /> : null}
              {row.type === 'venue' ? (
                <VenueRow
                  venue={row.venue}
                  onPress={() =>
                    router.push({
                      pathname: '/explore/[venueId]',
                      params: { venueId: row.venue.id },
                    })
                  }
                />
              ) : (
                <UniversityRow
                  university={row.university}
                  campuses={row.campuses}
                  onPress={() => {
                    haptic('selection');
                    setUniKey((k) => k + 1);
                    setUni(row.university);
                  }}
                />
              )}
            </Reveal>
          ))}
        </Glass>
      )}
      <CampusSheet
        key={uniKey}
        university={uni}
        campuses={uni ? venues.filter((v) => v.university?.id === uni.id) : []}
        onClose={() => setUni(null)}
      />
      {place ? (
        <PlaceSheet
          key={sheetKey}
          visible={placeSheet}
          onClose={() => setPlaceSheet(false)}
          cities={cityList}
          place={place}
        />
      ) : null}
    </PullScroll>
  );
}

// The hairline between two rows of the list, from the words to 16 short of the right edge (U13).
function RowHair() {
  const { c } = useKit();
  return (
    <View
      style={{
        height: KIT.size.hair,
        marginLeft: KIT.size.liPadX + VENUE_ROW_PICTURE + KIT.size.liGap,
        marginRight: KIT.size.liPadX,
        backgroundColor: c.hair,
      }}
    />
  );
}

// A venue's row (U13): its picture, the name, the type and district, the bucket.
function VenueRow({ venue: v, onPress }: { venue: CityVenue; onPress: () => void }) {
  const type = venueType(v);
  return (
    <Li
      padY={SPACING[3]}
      testID={`explore-venue-${v.name}`}
      accessibilityLabel={`${v.name}, ${tr.explore.typeLabel[type]}, ${tr.explore.buckets[v.bucket]}`}
      onPress={onPress}
    >
      <VenueThumb kind={type} size={VENUE_ROW_PICTURE} />
      <View style={{ flex: 1, gap: SPACING[0.5] }}>
        <T v="h3">{v.name}</T>
        <T v="fine">{tr.explore.venueSub(tr.explore.typeLabel[type], v.district)}</T>
        {/* Under the type and district, so it never wraps the name (1.4). */}
        <View style={{ flexDirection: 'row' }}>
          <Bucket bucket={v.bucket} calm={v.bucket === 'calm'} />
        </View>
      </View>
    </Li>
  );
}

// A university with several campuses (docs/SPEC_V4.md §4.Q): the kampüs picture, its name, how
// many campuses are shown and their districts, the liveliest campus's bucket. Not a place: it opens
// the campus sheet; nothing here asks for the position.
function UniversityRow({
  university,
  campuses,
  onPress,
}: {
  university: ExploreUniversity;
  campuses: readonly CityVenue[];
  onPress: () => void;
}) {
  const bucket = liveliestBucket(campuses.map((v) => v.bucket));
  const districts = [...new Set(campuses.map((v) => v.district))].join(', ');
  return (
    <Li
      padY={SPACING[3]}
      testID={`explore-university-${university.ref}`}
      accessibilityLabel={tr.explore.universityLabel(university.name, campuses.length)}
      onPress={onPress}
    >
      <VenueThumb kind="kampus" size={VENUE_ROW_PICTURE} />
      <View style={{ flex: 1, gap: SPACING[0.5] }}>
        <T v="h3">{university.name}</T>
        <T v="fine">{tr.explore.universitySub(campuses.length, districts)}</T>
        <View style={{ flexDirection: 'row' }}>
          <Bucket bucket={bucket} calm={bucket === 'calm'} />
        </View>
      </View>
    </Li>
  );
}

// "Yerleşke seç" (docs/SPEC_V4.md §4.Q): the university's shown campuses, each with its district,
// its bucket and its first event; a campus opens its own venue page, where check-in verifies the
// position against that campus's boundary only.
function CampusSheet({
  university,
  campuses,
  onClose,
}: {
  university: ExploreUniversity | null;
  campuses: readonly CityVenue[];
  onClose: () => void;
}) {
  return (
    <Sheet
      visible={university !== null}
      onClose={onClose}
      title={university?.name ?? ''}
      footer={<Btn block tall variant="glassy" label={tr.common.cancel} onPress={onClose} />}
    >
      <T v="note">{tr.explore.campusNote}</T>
      <View accessibilityRole="list" testID="explore-campus-sheet">
        {campuses.map((v, i) => (
          <View key={v.id}>
            {i > 0 ? <RowHair /> : null}
            <Li
              padY={SPACING[3]}
              testID={`explore-campus-${v.name}`}
              accessibilityLabel={`${v.name}, ${v.district}, ${tr.explore.buckets[v.bucket]}`}
              onPress={() => {
                onClose();
                router.push({ pathname: '/explore/[venueId]', params: { venueId: v.id } });
              }}
            >
              <VenueThumb kind="kampus" size={VENUE_ROW_PICTURE} />
              <View style={{ flex: 1, gap: SPACING[0.5] }}>
                <T v="h3">{v.name}</T>
                <T v="fine">{v.district}</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[1] }}>
                  <Bucket bucket={v.bucket} calm={v.bucket === 'calm'} />
                  {v.event ? <EventTag event={v.event} /> : null}
                </View>
              </View>
            </Li>
          </View>
        ))}
      </View>
    </Sheet>
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
  return (
    // Şehir ve semt (aura v51, kabul raporu §6.3): the aura sheet with the kit's chips, the
    // buttons fixed under it.
    <Sheet
      visible={visible}
      onClose={onClose}
      title={tr.explore.placeTitle}
      footer={
        <View style={{ gap: KIT.size.chipGap + 2 }}>
          <Btn
            block
            tall
            label={tr.explore.showPlace}
            testID="place-show"
            onPress={() => {
              choose(pick);
              onClose();
            }}
          />
          <Btn block tall variant="glassy" label={tr.common.cancel} onPress={onClose} />
        </View>
      }
    >
      <T v="note">{tr.explore.placeNote}</T>
      <View style={{ gap: KIT.size.chipsGap }}>
        <T v="eyebrow">{tr.explore.city}</T>
        <View accessibilityRole="radiogroup" accessibilityLabel={tr.explore.city} style={CHIPS}>
          {cities.map((c) => (
            <Chip
              key={c.city}
              testID={`place-city-${c.city}`}
              label={c.city}
              on={pick.city === c.city}
              onPress={() => setPick({ city: c.city, district: null })}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: KIT.size.chipsGap }}>
        <T v="eyebrow">{tr.explore.district}</T>
        <View accessibilityRole="radiogroup" accessibilityLabel={tr.explore.district} style={CHIPS}>
          <Chip
            testID="place-district-all"
            label={tr.explore.allDistricts}
            on={pick.district === null}
            onPress={() => setPick({ city: pick.city, district: null })}
          />
          {districts.map((d) => (
            <Chip
              key={d}
              testID={`place-district-${d}`}
              label={d}
              on={pick.district === d}
              onPress={() => setPick({ city: pick.city, district: d })}
            />
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const CHIPS = { flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap } as const;

// Over the map (U14, KesfetHarita): the aura solid over the top 26 % of the screen, fading into the
// map down to 40 %.
const MAP_SOLID = 0.26;
const MAP_FADE = 0.14;

// The place line comes after the head's three parts (the question, the search, the chips), 70 ms
// apart; the rows after it, 60 ms apart (hareket.json → stagger).
const SECTION_AT = 3;
const ROWS_AT = 5;
const ROW_STEP = 60;

// A venue row's picture (U13: 56, 18 round).
const VENUE_ROW_PICTURE = VENUE_THUMB.size;

// U13: the search field and the switch 8 apart, the search icon 8 before the words.
const SEARCH_GAP = SPACING[2];

// "Mekan ara" on glass (U13: 56 high, a pill, 20 inside, the search icon md first, the hint in
// the placeholder colour).
function SearchGlass({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const { c } = useKit();
  const { colors } = useTheme();
  // Aura v75 KesfetHaritaDar: 56 when narrow, the hint on one line.
  const narrow = useNarrow();
  const h = narrow ? KIT.size.fieldNarrow : KIT.size.field;
  return (
    <Glass
      frost
      radius={h / 2}
      style={{
        flex: 1,
        height: h,
        borderRadius: h / 2,
        paddingHorizontal: SPACING[5],
        flexDirection: 'row',
        alignItems: 'center',
        gap: SEARCH_GAP,
      }}
    >
      <CapIcon name="search" color={colors.placeholder} size={ICON_MD} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <TextInput
          testID="explore-search"
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel={tr.explore.search}
          style={[
            KIT_TYPE.body,
            { color: c.ink, paddingVertical: 0, paddingHorizontal: 0, includeFontPadding: false },
          ]}
        />
        {/* The hint is drawn by the app, in the app's type: Android draws a field's own hint in
            the phone's system face (the owner's report, 27 and 28 Ekim). */}
        {value.length === 0 ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}
          >
            {/* No `fit`: in the absolute layer it shrank the hint to nothing (ui 3.1). */}
            <T v="body" lines={1} color={colors.placeholder}>
              {tr.explore.search}
            </T>
          </View>
        ) : null}
      </View>
    </Glass>
  );
}

// The list/map switch (U13): two round buttons 2 apart in a glass capsule as tall as the search, 4 in
// from its outer edge; the chosen one raised on the surface, its icon lit (accent in front, buzz behind;
// in the dark on white 94 % with the light accent).
function ViewSwitch({ value, onChange }: { value: View_; onChange: (v: View_) => void }) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  // As tall as the search beside it (Aura v75 KesfetHaritaDar).
  const h = useNarrow() ? KIT.size.fieldNarrow : KIT.size.field;
  // The rounds fill the capsule less its padding (ui 3.2: a fixed 48 stood out of a 48 capsule).
  const pad = SPACING[1] - KIT.size.edge;
  const round = h - 2 * pad;
  return (
    <Glass
      frost
      radius={h / 2}
      style={{
        height: h,
        borderRadius: h / 2,
        padding: pad,
      }}
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel={tr.explore.viewSwitch}
        style={{ flexDirection: 'row', gap: 2 }}
      >
        {(['list', 'map'] as const).map((mode) => {
          const on = value === mode;
          return (
            <Pressable
              key={mode}
              testID={`explore-view-${mode}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={tr.explore.views[mode]}
              onPress={() => onChange(mode)}
              style={{
                width: round,
                height: round,
                borderRadius: round / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? c.segOn : undefined,
                boxShadow: on ? c.segShadow || undefined : undefined,
              }}
            >
              <CapIcon
                name={mode}
                color={on ? (scheme === 'dark' ? THEME_LIGHT_ACCENT : colors.accent) : c.muted}
                second={on ? colors.buzz : undefined}
                soft={on ? 1 : undefined}
                size={ICON_MD}
              />
            </Pressable>
          );
        })}
      </View>
    </Glass>
  );
}

// skall.css `.ci.md` (20).
const ICON_MD = 20;
// Kesfet `.dark .segx span.on .ci`: the light scheme's accent on the white part.
const THEME_LIGHT_ACCENT = THEME.palettes.light.accent;
