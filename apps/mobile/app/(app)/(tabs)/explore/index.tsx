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
import { upperTr } from '@shared/trText.ts';
import { router } from 'expo-router';
import { type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Li, Live, Round, T, useKit } from '@/aura/kit';
import { useTabOpenings } from '@/aura/motion';
import { RisoPeekOver } from '@/aura/Peek';
import type { TabOpenings } from '@/lib/tabOpenings';
import { Reveal } from '@/aura/Reveal';
import { VenueThumb } from '@/aura/VenueThumb';
import { EmptyState } from '@/components/EmptyState';
import { shadowParts } from '@/components/NativeShadow';
import { Loader } from '@/components/Loader';
import { PullScroll } from '@/components/PullScroll';
import { Sheet } from '@/components/Sheet';
import { useTabBarOverMap, useTabBarSpace } from '@/components/TabBar';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { DistrictCard } from '@/features/district/DistrictCard';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { ExploreMap } from '@/features/explore/ExploreMap';
import { useExplorePlace } from '@/features/explore/placeStore';
import { Bucket } from '@/features/explore/Bucket';
import { EventTag } from '@/features/explore/EventTag';
import { type CityVenue, useCityVenues } from '@/features/explore/useExploreVenues';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { dayLine, dayPart } from '@/lib/dayPart';
import { haptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { useLabOff } from '@/lib/drawLab';
import { type VenueType, venueType } from '@/lib/venueType';
import { useNarrow } from '@/lib/useNarrow';
import { LargeTitle, ScrollScreen, SlideFrom, StickyField, Tap } from '@/motion';
import { StickyStatusBand } from '@/motion/StickyField';
import { ScrollViewport, useContentHeightFeed, useScrollOffset } from '@/motion/ScrollScreen';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE, VENUE_THUMB } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';
import { EXPLORE_PEEK } from '@/theme/kankiMotion';
import { THEME } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type View_ = 'list' | 'map';

type Here = { name: string; spot: string | null };

const X = KIT.size.explore;
// The head's parts stand 22 from the sides, the cards 16 (tuval Kesfet).
const HEAD_IN = EXPLORE.headSide - EXPLORE.side;

// Keşfet (docs/design/iskelet.md → 5.1; docs/arsiv/SPEC_V2.md §4, SPEC_V4 §4.C): always the list
// of a city's venues, chosen by hand, never by the phone's position (rule 6). The venue is picked
// here; check-in then verifies the position. The list: the line of the day over the question (a
// tab's large title, fading as it scrolls), the one glass capsule of the search and the list/map
// switch (it pins under the top and thins, no title bar of its own) with a buddy looking over it,
// the kind chips, Semte Git (the one featured card), the city and district with the count (K-38;
// it opens the place sheet) and the order, then each venue on its own card; venues with an event
// today first (K-21, K-42), the bucket in words (K-41); a card opens the venue page (K-43). The map:
// the whole screen, the capsule and the chips floating over it, no title. The scroll is the
// screen's (ScrollScreen): the tab bar folds with it, everything that follows it on the UI thread.
export default function ExploreScreen() {
  const { scheme } = useTheme();
  const table = useActiveTable();
  const now = useNow(30_000);
  const { venues, cities, listed } = useCityVenues();
  const openings = useTabOpenings();
  const [view, setView] = useState<View_>('list');
  // Where the list's capsule stood under the map's when the map was opened: the map's head comes
  // from there (PF-08).
  const capsuleBox = useRef<View>(null);
  const [mapFrom, setMapFrom] = useState(0);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ExploreKind>('all');
  // A kind chosen plays the list's arrival again (hareket.json → dissolve).
  const [kindRuns, setKindRuns] = useState(0);
  // "Ada göre" (5.1): the order by name over the events first (K-42).
  const [byName, setByName] = useState(false);
  const saved = useExplorePlace((s) => s.saved);
  const loadPlace = useExplorePlace((s) => s.load);
  useEffect(loadPlace, [loadPlace]);
  // The map's floating head: its opening camera keeps the venues below it.
  const [mapHead, setMapHead] = useState(0);
  // The floating tab bar covers the bottom of the map and the list.
  const barSpace = useTabBarSpace();
  const insets = useSafeAreaInsets();
  const y = useScrollOffset();

  // A failed refresh keeps what was read (audit M8-02, Mesajlar's way): the list, the search, the
  // chips and the head stay; the error only stands in for nothing read at all.
  const ready = !!venues.data && !!cities.data;
  const failed = !ready && (venues.isError || cities.isError);
  const showMap = ready && view === 'map';
  // The map's GL surface cannot be blurred: over it the tab bar is opaque.
  useTabBarOverMap(showMap);

  useEffect(() => {
    track('explore_viewed', { view });
  }, [view]);

  const place = useMemo(() => explorePlace(saved, listed), [saved, listed]);
  // The field shows each letter at once; the list follows it a moment later, so a letter does not
  // wait for some fifty cards to be drawn again (docs/perf/akicilik-denetimi.md → A-28).
  const asked = useDeferredValue(query);
  const shown = useMemo(
    () => sortVenues(filterVenues(listed, { place, kind, query: asked }), now),
    [listed, place, kind, asked, now],
  );
  // Without an event today both orders are the name's: the button stays, its touch off.
  const canSort = shown.sort === 'eventsFirst';
  const nameOrder = byName || !canSort;
  const ordered = useMemo(
    () =>
      byName ? [...shown.venues].sort((a, b) => a.name.localeCompare(b.name, 'tr')) : shown.venues,
    [shown.venues, byName],
  );
  // Why nothing shows, for the list's card and the map (kabul raporu §9.1).
  const empty = exploreEmpty(listed.length, { kind, query: asked });
  const here = hasActiveTable(table.data, now) ? table.data : null;
  const hereCard: Here | null = here
    ? { name: here.venue?.name ?? '', spot: here.spot?.name ?? null }
    : null;

  // To the map, from where the list's capsule stands on the screen at that moment.
  const showView = (mode: View_) => {
    const box = capsuleBox.current;
    if (mode !== 'map' || !box) {
      setView(mode);
      return;
    }
    box.measureInWindow((_x, top) => {
      setMapFrom(Math.max(0, top - (insets.top + KIT.size.stickyTop)));
      setView(mode);
    });
  };
  const capsuleOn = (map: boolean) => (
    <SearchCapsule
      value={query}
      onChangeText={setQuery}
      view={view}
      map={map}
      onChange={(mode) => {
        haptic('selection');
        showView(mode);
      }}
    />
  );
  const chipsOn = (map: boolean) => (
    <KindChips
      kind={kind}
      map={map}
      onChoose={(k) => {
        setKind(k);
        setKindRuns((n) => n + 1);
      }}
    />
  );
  const capsule = (
    <View ref={capsuleBox} collapsable={false} style={{ flex: 1 }}>
      {capsuleOn(false)}
    </View>
  );
  const chips = chipsOn(false);
  const mapCapsule = capsuleOn(true);
  const mapChips = chipsOn(true);

  return (
    <ScrollScreen y={showMap ? null : y}>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
        {/* The colour clouds (docs/design/aura → Keşfet); the map covers them when it is open. */}
        <AuraBackground />
        {showMap ? (
          <>
            {/* 5.1: the map on the whole screen, under the status bar too. */}
            {mapHead > 0 ? (
              <View style={StyleSheet.absoluteFill}>
                <ExploreMap
                  venues={shown.venues}
                  empty={emptyCopy(empty, kind)}
                  headerHeight={mapHead}
                  tabBarHeight={barSpace}
                />
              </View>
            ) : null}
            {/* The capsule and the chips float over it on glass; no large title. */}
            <View
              testID="explore-head"
              pointerEvents="box-none"
              onLayout={(e) => setMapHead(e.nativeEvent.layout.height)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                paddingTop: insets.top + KIT.size.stickyTop,
                paddingHorizontal: EXPLORE.headSide,
                gap: EXPLORE.map.headGap,
              }}
            >
              <SlideFrom dy={mapFrom}>
                <View style={{ gap: EXPLORE.map.headGap }}>
                  <View style={{ height: X.capsule }}>{mapCapsule}</View>
                  {mapChips}
                </View>
              </SlideFrom>
            </View>
          </>
        ) : (
          <ScrollViewport>
            <ListBody
              y={y}
              ready={ready}
              failed={failed}
              now={now}
              openings={openings}
              capsule={capsule}
              chips={chips}
              bottomSpace={barSpace}
              onRefresh={() => Promise.all([venues.refetch(), cities.refetch()])}
            >
              {failed ? (
                <EmptyState
                  icon="cloud-offline-outline"
                  body={errorMessage(venues.error ?? cities.error)}
                  action={{
                    label: tr.checkin.retry,
                    onPress: () => {
                      void venues.refetch();
                      void cities.refetch();
                    },
                    loading: venues.isRefetching || cities.isRefetching,
                  }}
                />
              ) : !ready ? (
                <View className="mt-8 items-center">
                  <Loader />
                </View>
              ) : (
                <VenueList
                  venues={ordered}
                  listed={listed}
                  empty={empty}
                  kind={kind}
                  place={place}
                  here={hereCard}
                  replay={kindRuns}
                  openings={openings}
                  nameOrder={nameOrder}
                  canSort={canSort}
                  onSort={() => {
                    haptic('selection');
                    setByName((on) => !on);
                  }}
                />
              )}
            </ListBody>
          </ScrollViewport>
        )}
        {showMap ? null : <StickyStatusBand />}
      </SafeAreaView>
    </ScrollScreen>
  );
}

// The list's scroll: the head (the line of the day and the question, fading as a tab's large
// title), the capsule pinned under the top, the chips, then the body. Pulled down at its top it
// fetches the list again (v46's `.ptr-ind`); its offset is the screen's.
function ListBody({
  y,
  ready,
  failed,
  now,
  openings,
  capsule,
  chips,
  bottomSpace,
  onRefresh,
  children,
}: {
  y: ReturnType<typeof useScrollOffset>;
  ready: boolean;
  failed: boolean;
  now: number;
  openings: TabOpenings | null;
  capsule: ReactNode;
  chips: ReactNode;
  bottomSpace: number;
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
}) {
  const onContentSizeChange = useContentHeightFeed();
  return (
    <PullScroll
      onRefresh={onRefresh}
      scrollY={y}
      onContentSizeChange={onContentSizeChange}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        // tuval Kesfet: the head 22 from the sides, the cards 16; 15 under the status bar.
        paddingHorizontal: EXPLORE.side,
        paddingTop: EXPLORE.top,
        // At least 124 under the list (U13; the bar's room is 92 without a safe area).
        paddingBottom: SPACING[8] + bottomSpace,
      }}
      // The question, the capsule and the chips stay while the list is pulled (PF-40).
      head={
        <>
          <View testID="explore-head" style={{ marginHorizontal: HEAD_IN }}>
            <Reveal index={0} openings={openings}>
              <Question now={now} />
            </Reveal>
            {/* 5.1: a buddy looks over the capsule's top edge; it scrolls with the content. */}
            {ready ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -EXPLORE.capsuleTop,
                  height: 0,
                }}
              >
                <RisoPeekOver places={EXPLORE_PEEK} />
              </View>
            ) : null}
          </View>
          {ready ? (
            <>
              {/* Over what scrolls under it once pinned. */}
              <View style={{ zIndex: 1, marginTop: EXPLORE.capsuleTop, marginHorizontal: HEAD_IN }}>
                <Reveal index={1} openings={openings}>
                  <StickyField shrink={[X.capsule, X.capsulePinned]} band side={EXPLORE.headSide}>
                    {capsule}
                  </StickyField>
                </Reveal>
              </View>
              <View style={{ marginTop: EXPLORE.chipsTop, marginHorizontal: HEAD_IN }}>
                <Reveal index={2} openings={openings}>
                  {chips}
                </Reveal>
              </View>
            </>
          ) : null}
        </>
      }
    >
      {/* Semte Git 22 under the chips; the body's own spacing in VenueList (tuval Kesfet). */}
      <View style={{ marginTop: EXPLORE.districtTop }}>{children}</View>
    </PullScroll>
  );
}

// The line of the day from the phone's clock ("PERŞEMBE AKŞAMI", 13/700) over the question at 36/800,
// its last word in green (5.1); a tab's large title, fading and shrinking from its lower left.
function Question({ now }: { now: number }) {
  const { c } = useKit();
  const { colors } = useTheme();
  const line = dayLine(new Date(now));
  return (
    <LargeTitle kind="buyukBaslik">
      <View style={{ gap: EXPLORE.titleGap }}>
        <T v="exploreEyebrow" color={c.muted}>
          {upperTr(tr.explore.dayLine(line.weekday, line.part))}
        </T>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[KIT_TYPE.exploreTitle, { color: c.ink }]}
        >
          {tr.explore.question[dayPart(now)]}
          <Text style={{ color: colors.accent }}>{tr.explore.questionEnd}</Text>
        </Text>
      </View>
    </LargeTitle>
  );
}
// As the kit's text (aura/kit → T).
const MAX_FONT_SCALE = 1.3;

// U13: the kind chips on one line, scrolling sideways to the screen's edge (22 in, as the head).
function KindChips({
  kind,
  map,
  onChoose,
}: {
  kind: ExploreKind;
  map: boolean;
  onChoose: (k: ExploreKind) => void;
}) {
  const narrow = useNarrow();
  return (
    <ScrollView
      horizontal
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={tr.explore.kindsLabel}
      style={{ marginHorizontal: -EXPLORE.headSide, overflow: 'visible' }}
      contentContainerStyle={{ gap: KIT.size.chipsGap, paddingHorizontal: EXPLORE.headSide }}
    >
      {EXPLORE_KINDS.map((k) => (
        <KindChip
          key={k}
          testID={`explore-kind-${k}`}
          label={tr.explore.kinds[k]}
          narrow={narrow}
          map={map}
          on={kind === k}
          onPress={() => {
            if (k !== kind) onChoose(k);
          }}
        />
      ))}
    </ScrollView>
  );
}

// A kind chip (tuval Kesfet, Harita): 36 high, 16 in, 14; the chosen one the ink with white words
// at 700 on its soft shadow, the others on the board's glass (on the map with its shadow). 46 high
// when narrow (Aura v75 KesfetHaritaDar).
function KindChip({
  label,
  on,
  narrow,
  map,
  testID,
  onPress,
}: {
  label: string;
  on: boolean;
  narrow: boolean;
  map: boolean;
  testID: string;
  onPress: () => void;
}) {
  const { c, scheme } = useKit();
  const e = EXPLORE[scheme];
  const face = map ? e.mapGlass : e.glass;
  const h = narrow ? KIT.size.chipNarrow : KIT.size.chip;
  const shadow = shadowParts(
    useLabOff('golge'),
    (on ? e.chipOnShadow : map ? face.shadow : '') || undefined,
    on ? undefined : face.inset || undefined,
    h / 2,
    true,
    KIT.size.edge,
  );
  return (
    <Tap
      testID={testID}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        height: h,
        paddingHorizontal: EXPLORE.chipPadX,
        borderRadius: h / 2,
        justifyContent: 'center',
        backgroundColor: on ? c.chipOn : face.fill,
        borderWidth: on ? 0 : KIT.size.edge,
        borderColor: face.edge,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <T v={on ? 'exploreChipOn' : 'exploreChip'} lines={1} color={on ? c.onChipOn : c.ink}>
        {label}
      </T>
    </Tap>
  );
}

// The words for an empty result (kabul raporu §9.1): search, kind, district; no data at all says
// there is none.
function emptyCopy(empty: ExploreEmpty, kind: ExploreKind): { title: string; hint: string | null } {
  switch (empty) {
    case 'none':
      return { title: tr.explore.emptyTitle, hint: tr.explore.empty };
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

// The list's body: Semte Git, "Şu an buradasın", the city and district with the count and the
// order, then each venue on its own card (3.4), 12 apart. The cards arrive 60 ms apart after the
// head's parts.
function VenueList({
  venues,
  listed,
  empty,
  kind,
  place,
  here,
  replay,
  openings,
  nameOrder,
  canSort,
  onSort,
}: {
  venues: readonly CityVenue[];
  listed: readonly CityVenue[];
  empty: ExploreEmpty;
  kind: ExploreKind;
  place: ExplorePlace | null;
  here: Here | null;
  replay: number;
  openings: TabOpenings | null;
  nameOrder: boolean;
  canSort: boolean;
  onSort: () => void;
}) {
  const [placeSheet, setPlaceSheet] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const cityList = useMemo(() => exploreCities(listed), [listed]);
  // The university whose campuses are open in the sheet (docs/SPEC_V4.md §4.Q).
  const [uni, setUni] = useState<ExploreUniversity | null>(null);
  const [uniKey, setUniKey] = useState(0);
  const copy = emptyCopy(empty, kind);
  const { c } = useKit();
  return (
    <>
      {/* Semte Git (docs/SPEC_V4.md §4.V): the screen's one featured card, under the chips. */}
      <DistrictCard />
      {here ? (
        <View style={{ marginTop: X.cardsGap }}>
          <HereNow here={here} />
        </View>
      ) : null}
      {/* The city and district, and how many venues (K-38), the order at the right; 28 under Semte
          Git, 12 over the cards, 22 from the sides (tuval Kesfet). */}
      <Reveal index={SECTION_AT} replay={replay} openings={openings}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            // Side by side while both fit; the order goes under the place on a narrow screen (the
            // owner's report, 30 Ekim: the two ran into each other).
            columnGap: KIT.size.rowGap,
            rowGap: SPACING[2],
            marginTop: EXPLORE.sectionTop,
            marginBottom: EXPLORE.sectionBottom,
            marginHorizontal: HEAD_IN,
          }}
        >
          <View
            style={{
              flexShrink: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              columnGap: EXPLORE.sectionGap,
            }}
          >
            {/* The place sheet opens from here when there is a city to choose (K-38); every city
                is the default (5 Kasım). */}
            <Tap
              testID="explore-place"
              accessibilityRole={cityList.length > 1 ? 'button' : 'header'}
              accessibilityLabel={
                place
                  ? tr.explore.placeLabel(place.city, place.district)
                  : tr.explore.allCitiesLabel
              }
              disabled={cityList.length <= 1}
              sink={cityList.length > 1}
              onPress={() => {
                setSheetKey((k) => k + 1);
                setPlaceSheet(true);
              }}
              hitSlop={KIT.size.chipsGap}
            >
              <T v="exploreSection">
                {place ? tr.explore.place(place.city, place.district) : tr.explore.allCities}
              </T>
            </Tap>
            <T v="exploreCount" color={c.muted} testID="explore-count">
              {tr.explore.count(venues.length)}
            </T>
          </View>
          {/* 5.1: the order as a clear button, its arrow after the words. */}
          <Btn
            sm
            variant="glassy"
            testID="explore-sort"
            label={nameOrder ? tr.explore.sortByName : tr.explore.sortEventsFirst}
            accessibilityLabel={tr.explore.sortLabel(nameOrder)}
            disabled={!canSort}
            onPress={onSort}
            tint={c.ink}
            trail={<CapIcon name="down" color={c.ink} size={EXPLORE.sortIcon} />}
          />
        </View>
      </Reveal>
      <View style={{ gap: X.cardsGap }}>
        {venues.length === 0 ? (
          // Keşfet: boş: nothing at all, or a filter or a search that finds nothing, said by its
          // cause on the small card (3.4).
          <Reveal index={ROWS_AT} step={ROW_STEP} replay={replay} openings={openings}>
            <EmptyCard
              testID={listed.length === 0 ? 'explore-empty' : 'explore-no-match'}
              title={copy.title}
              body={copy.hint}
            />
          </Reveal>
        ) : (
          // A university with several campuses is one card opening its campuses (docs/SPEC_V4.md
          // §4.Q); every other venue, a single campus included, is its own card.
          groupByUniversity(venues, listed).map((row, i) => (
            <Reveal
              key={row.type === 'venue' ? row.venue.id : `u-${row.university.id}`}
              index={ROWS_AT + i}
              step={ROW_STEP}
              replay={replay}
              openings={openings}
            >
              {row.type === 'venue' ? (
                <VenueCard
                  venue={row.venue}
                  onPress={() =>
                    router.push({
                      pathname: '/explore/[venueId]',
                      params: { venueId: row.venue.id },
                    })
                  }
                />
              ) : (
                <UniversityCard
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
          ))
        )}
      </View>
      <CampusSheet
        key={uniKey}
        university={uni}
        campuses={uni ? venues.filter((v) => v.university?.id === uni.id) : []}
        onClose={() => setUni(null)}
      />
      <PlaceSheet
        key={sheetKey}
        visible={placeSheet}
        onClose={() => setPlaceSheet(false)}
        cities={cityList}
        place={place}
      />
    </>
  );
}

// A venue's card (5.1, 3.4; tuval Kesfet): its 76 picture, the name, the type and district, the
// dotted bucket and the arrow; the board's `.card`, 26 round, 12 inside, 14 apart, the lines 5.
function PlaceCard({
  testID,
  accessibilityLabel,
  onPress,
  picture,
  name,
  sub,
  bucket,
}: {
  testID: string;
  accessibilityLabel: string;
  onPress: () => void;
  picture: ReactNode;
  name: string;
  sub: string;
  bucket: CityVenue['bucket'];
}) {
  const { c, scheme } = useKit();
  const card = X.card;
  const e = EXPLORE[scheme];
  return (
    <Tap testID={testID} accessibilityLabel={accessibilityLabel} onPress={onPress}>
      <Glass
        face={e.card}
        radius={card.radius}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: card.gap,
          padding: card.pad,
          borderRadius: card.radius,
        }}
      >
        {picture}
        <View style={{ flex: 1, minWidth: 0, gap: card.lineGap }}>
          <T v="placeName">{name}</T>
          <T v="placeSub" color={c.muted}>
            {sub}
          </T>
          <Bucket bucket={bucket} />
        </View>
        <CapIcon name="forward" color={e.chevron} size={EXPLORE.card.chevron} />
      </Glass>
    </Tap>
  );
}

// A card's picture: 76 at 14 on the board's soft ink shadow.
function CardPicture({ kind }: { kind: VenueType }) {
  const { scheme } = useKit();
  return (
    <VenueThumb
      kind={kind}
      size={VENUE_CARD_PICTURE}
      radius={X.card.pictureRadius}
      shadow={EXPLORE[scheme].pictureShadow}
    />
  );
}

function VenueCard({ venue: v, onPress }: { venue: CityVenue; onPress: () => void }) {
  const type = venueType(v);
  return (
    <PlaceCard
      testID={`explore-venue-${v.name}`}
      accessibilityLabel={`${v.name}, ${tr.explore.typeLabel[type]}, ${tr.explore.buckets[v.bucket]}`}
      onPress={onPress}
      picture={<CardPicture kind={type} />}
      name={v.name}
      sub={tr.explore.venueSub(tr.explore.typeLabel[type], v.district)}
      bucket={v.bucket}
    />
  );
}

// A university with several campuses (docs/SPEC_V4.md §4.Q): the kampüs picture, its name, how
// many campuses are shown and their districts, the liveliest campus's bucket. Not a place: it opens
// the campus sheet; nothing here asks for the position.
function UniversityCard({
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
    <PlaceCard
      testID={`explore-university-${university.ref}`}
      accessibilityLabel={tr.explore.universityLabel(university.name, campuses.length)}
      onPress={onPress}
      picture={<CardPicture kind="kampus" />}
      name={university.name}
      sub={tr.explore.universitySub(campuses.length, districts)}
      bucket={bucket}
    />
  );
}

// The hairline between two rows of the campus sheet, from the words to 16 short of the right edge.
function RowHair() {
  const { c } = useKit();
  return (
    <View
      style={{
        height: KIT.size.hair,
        marginLeft: KIT.size.liPadX + VENUE_THUMB_SIZE + KIT.size.liGap,
        marginRight: KIT.size.liPadX,
        backgroundColor: c.hair,
      }}
    />
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
              <VenueThumb kind="kampus" size={VENUE_THUMB_SIZE} />
              <View style={{ flex: 1, gap: SPACING[0.5] }}>
                <T v="h3">{v.name}</T>
                <T v="fine">{v.district}</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[1] }}>
                  <Bucket bucket={v.bucket} />
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
  // null: every city.
  place: ExplorePlace | null;
}) {
  const choose = useExplorePlace((s) => s.choose);
  // Mounted afresh at each opening (its key), so the choice starts from the place shown.
  const [pick, setPick] = useState<ExplorePlace | null>(place);
  const districts = pick ? (cities.find((c) => c.city === pick.city)?.districts ?? []) : [];
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
          <Chip
            testID="place-city-all"
            label={tr.explore.allCities}
            on={pick === null}
            onPress={() => setPick(null)}
          />
          {cities.map((c) => (
            <Chip
              key={c.city}
              testID={`place-city-${c.city}`}
              label={c.city}
              on={pick?.city === c.city}
              onPress={() => setPick({ city: c.city, district: null })}
            />
          ))}
        </View>
      </View>
      {/* Districts once a city is chosen. */}
      {pick ? (
        <View style={{ gap: KIT.size.chipsGap }}>
          <T v="eyebrow">{tr.explore.district}</T>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={tr.explore.district}
            style={CHIPS}
          >
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
      ) : null}
    </Sheet>
  );
}

const CHIPS = { flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap } as const;

// The place line comes after the head's three parts (the question, the capsule, the chips), 70 ms
// apart; the cards after it, 60 ms apart (hareket.json → stagger).
const SECTION_AT = 3;
const ROWS_AT = 5;
const ROW_STEP = 60;

// A venue card's picture (5.1: 76, 14 round), the campus sheet's rows' the thumb's own (56).
const VENUE_CARD_PICTURE = X.card.picture;
const VENUE_THUMB_SIZE = VENUE_THUMB.size;

// The one glass capsule (5.1; tuval Kesfet, Harita): "Mekan ara" with the search icon, and the
// list/map switch at its right; 54 high, 48 once pinned (StickyField → shrink: it fills the height
// it is given). On the board's glass, 18 in at its left and 5 at its right, 10 apart.
function SearchCapsule({
  value,
  onChangeText,
  view,
  map,
  onChange,
}: {
  value: string;
  onChangeText: (text: string) => void;
  view: View_;
  map: boolean;
  onChange: (v: View_) => void;
}) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const k = EXPLORE.capsule;
  return (
    <Glass
      frost
      face={map ? EXPLORE[scheme].mapGlass : EXPLORE[scheme].glass}
      radius={X.capsule / 2}
      style={{
        flex: 1,
        borderRadius: X.capsule / 2,
        paddingLeft: k.padLeft,
        paddingRight: k.padRight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: k.gap,
      }}
    >
      <CapIcon name="search" color={c.muted} size={k.icon} />
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
      <ViewSwitch value={view} onChange={onChange} />
    </Glass>
  );
}

// The list/map switch inside the capsule: a sunk track 3 in, its two parts 40 × 38, 2 apart, the
// chosen one raised white, its icon green (5.1); it fits the pinned capsule too.
function ViewSwitch({ value, onChange }: { value: View_; onChange: (v: View_) => void }) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const k = EXPLORE.capsule;
  const e = EXPLORE[scheme];
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={tr.explore.viewSwitch}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: X.switchGap,
        padding: k.trackPad,
        borderRadius: k.trackRadius,
        backgroundColor: e.track,
      }}
    >
      {(['list', 'map'] as const).map((mode) => {
        const on = value === mode;
        return (
          <Tap
            key={mode}
            testID={`explore-view-${mode}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tr.explore.views[mode]}
            onPress={() => {
              if (!on) onChange(mode);
            }}
            style={{
              width: k.segWidth,
              height: k.segHeight,
              borderRadius: k.segHeight / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? c.segOn : undefined,
              boxShadow: on ? e.segOnShadow || undefined : undefined,
            }}
          >
            {/* In the dark on white 94 % with the light scheme's green. */}
            <CapIcon
              name={mode}
              color={on ? (scheme === 'dark' ? THEME_LIGHT_ACCENT : colors.accent) : c.muted}
              size={k.segIcon}
            />
          </Tap>
        );
      })}
    </View>
  );
}

// Kesfet `.dark .segx span.on .ci`: the light scheme's accent on the white part.
const THEME_LIGHT_ACCENT = THEME.palettes.light.accent;
