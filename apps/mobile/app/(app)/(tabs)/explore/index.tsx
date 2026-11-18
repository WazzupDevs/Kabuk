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
import {
  Image,
  type ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Li, Live, Round, T, useKit } from '@/aura/kit';
import { useTabOpenings } from '@/aura/motion';
import type { TabOpenings } from '@/lib/tabOpenings';
import { Reveal } from '@/aura/Reveal';
import { VenueThumb } from '@/aura/VenueThumb';
import { EmptyState } from '@/components/EmptyState';
import { PullScroll } from '@/components/PullScroll';
import { Sheet } from '@/components/Sheet';
import { useTabBarOverMap, useTabBarSpace } from '@/components/TabBar';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { DistrictCard, DistrictStrip } from '@/features/district/DistrictCard';
import { ExploreMap } from '@/features/explore/ExploreMap';
import { useExplorePlace } from '@/features/explore/placeStore';
import { Bucket } from '@/features/explore/Bucket';
import { kindLabel } from '@/features/explore/kindLabel';
import { EventTag } from '@/features/explore/EventTag';
import { type CityVenue, useCityVenues } from '@/features/explore/useExploreVenues';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { dayLine, dayPart } from '@/lib/dayPart';
import { haptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { type VenueType, venueType } from '@/lib/venueType';
import { useNarrow } from '@/lib/useNarrow';
import { LargeTitle, ScrollScreen, SlideFrom, StickyGroup, Tap } from '@/motion';
import { StickyGroupStatusBand } from '@/motion/StickyGroup';
import { ScrollViewport, useContentHeightFeed, useScrollOffset } from '@/motion/ScrollScreen';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE, VENUE_THUMB } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type View_ = 'list' | 'map';

type Here = { name: string; spot: string | null };

const L = EXPLORE.list;
// The search and its round are a form field's height (`.sr .field`, `.mp`: 48).
const FIELD = KIT.size.field;

// Keşfet (docs/design/iskelet.md → 5.1; docs/arsiv/SPEC_V2.md §4, SPEC_V4 §4.C; yeni arayüz tuvali
// Kesfet, KesfetAra, KesfetAraBos, KesfetBos, KesfetKaydir, KesfetHarita): always the list of a
// city's venues, chosen by hand, never by the phone's position (rule 6). The venue is picked here;
// check-in then verifies the position. The list: the line of the day over the question (a tab's
// large title, fading as it scrolls), the white search field with the round to the map at its
// right (it pins under the top, no title bar of its own) with a buddy looking over it, the kind
// chips, Semte Git (the one featured card), the city and district with the count (K-38; it opens
// the place sheet) and the order, then each venue as a row on the ground; venues with an event
// today first (K-21, K-42), the bucket in words (K-41); a row opens the venue page (K-43). The map:
// the whole screen, the search and the chips floating over it, no title. The scroll is the
// screen's (ScrollScreen): the tab bar folds with it, everything that follows it on the UI thread.
export default function ExploreScreen() {
  return <ExploreView />;
}

// What the visual gate opens the screen on (features/design/gorsel/kesfetFixture.tsx): something
// typed, the map, a venue chosen on it. The route itself starts on none of these.
export type ExploreStart = { query?: string; view?: View_; selected?: string };

export function ExploreView({ start }: { start?: ExploreStart }) {
  const { scheme } = useTheme();
  const table = useActiveTable();
  const now = useNow(30_000);
  const { venues, cities, listed } = useCityVenues();
  const openings = useTabOpenings();
  const [view, setView] = useState<View_>(start?.view ?? 'list');
  // Where the list's search stood under the map's when the map was opened: the map's head comes
  // from there (PF-08).
  const capsuleBox = useRef<View>(null);
  const [mapFrom, setMapFrom] = useState(0);
  const [query, setQuery] = useState(start?.query ?? '');
  // Something typed: the line, the question, the buddies and Semte Git give way (KesfetAra).
  const searching = query.length > 0;
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
  // wait for some fifty rows to be drawn again (docs/perf/akicilik-denetimi.md → A-28).
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
  // Why nothing shows, for the list's empty state and the map (kabul raporu §9.1).
  const empty = exploreEmpty(listed.length, { kind, query: asked });
  const here = hasActiveTable(table.data, now) ? table.data : null;
  const hereCard: Here | null = here
    ? { name: here.venue?.name ?? '', spot: here.spot?.name ?? null }
    : null;

  // To the map, from where the list's search stands on the screen at that moment.
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
  const searchOn = (map: boolean) => (
    <SearchRow
      value={query}
      onChangeText={setQuery}
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
  const search = (
    <View ref={capsuleBox} collapsable={false}>
      {searchOn(false)}
    </View>
  );
  const chips = chipsOn(false);
  const mapSearch = searchOn(true);
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
                  initialSelected={start?.selected}
                />
              </View>
            ) : null}
            {/* The search and the chips float over it (KesfetHarita `.top`); no large title. */}
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
                paddingHorizontal: EXPLORE.map.side,
              }}
            >
              <SlideFrom dy={mapFrom}>
                <View style={{ gap: EXPLORE.map.headGap }}>
                  {mapSearch}
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
              search={search}
              chips={chips}
              searching={searching}
              bottomSpace={barSpace}
              onRefresh={() => Promise.all([venues.refetch(), cities.refetch()])}
            >
              {failed ? (
                <EmptyState
                  kind="error"
                  body={errorMessage(venues.error ?? cities.error)}
                  error={venues.error ?? cities.error}
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
                // YukleniyorListe (OrtakKurallar C3): the meeting capsules alone.
                <EmptyState kind="loading" body={tr.common.loading} />
              ) : (
                <VenueList
                  venues={ordered}
                  listed={listed}
                  empty={empty}
                  kind={kind}
                  place={place}
                  here={hereCard}
                  searching={searching}
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
        {showMap ? null : <StickyGroupStatusBand />}
      </SafeAreaView>
    </ScrollScreen>
  );
}

// The list's scroll: the head (the line of the day and the question, fading as a tab's large
// title), the search pinned under the top, the chips, then the body. Pulled down at its top it
// fetches the list again (v46's `.ptr-ind`); its offset is the screen's.
function ListBody({
  y,
  ready,
  failed,
  now,
  openings,
  search,
  chips,
  searching,
  bottomSpace,
  onRefresh,
  children,
}: {
  y: ReturnType<typeof useScrollOffset>;
  ready: boolean;
  failed: boolean;
  now: number;
  openings: TabOpenings | null;
  search: ReactNode;
  chips: ReactNode;
  searching: boolean;
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
        // Kesfet `.content`: 20 from the sides, 13 under the status bar.
        paddingHorizontal: L.side,
        paddingTop: L.top,
        // At least 124 under the list (U13; the bar's room is 92 without a safe area).
        paddingBottom: SPACING[8] + bottomSpace,
      }}
      // The question, the search and the chips stay while the list is pulled (PF-40).
      head={
        <>
          {searching ? null : (
            <View testID="explore-head">
              <Reveal index={0} openings={openings}>
                <Question now={now} />
              </Reveal>
              {/* Kesfet `.sr .kk`: the buddies look over the search's top edge, under the field,
                  64 from the right, their foot 22 over the field's; they scroll with the content. */}
              {ready ? (
                <Image
                  source={PEEK}
                  fadeDuration={0}
                  resizeMode="contain"
                  accessible={false}
                  style={{
                    position: 'absolute',
                    right: EXPLORE.peek.right,
                    bottom: -(L.fieldTop + FIELD - EXPLORE.peek.bottom),
                    width: EXPLORE.peek.width,
                    height: EXPLORE.peek.height,
                  }}
                />
              ) : null}
            </View>
          )}
          {ready ? (
            // Over what scrolls under it once pinned: the search and the chips pin together, and
            // Semte Git's strip comes in under them (KesfetKaydir).
            <View style={{ zIndex: 1, marginTop: searching ? L.searchTop : L.fieldTop }}>
              <StickyGroup
                side={L.side}
                hang={{
                  node: <DistrictStrip />,
                  height: EXPLORE.sticky.stripHeight,
                  gap: EXPLORE.sticky.stripGap,
                  from: EXPLORE.sticky.from,
                  to: EXPLORE.sticky.to,
                }}
              >
                <Reveal index={1} openings={openings}>
                  {search}
                </Reveal>
                <View style={{ marginTop: L.chipsTop }}>
                  <Reveal index={2} openings={openings}>
                    {chips}
                  </Reveal>
                </View>
              </StickyGroup>
            </View>
          ) : null}
        </>
      }
    >
      {/* Semte Git 20 under the chips; the body's own spacing in VenueList (Kesfet). */}
      <View style={{ marginTop: searching ? 0 : L.districtTop }}>{children}</View>
    </PullScroll>
  );
}

// The line of the day from the phone's clock ("CUMARTESİ AKŞAMI", `.eyebrow`) 4 over the question
// (`.kh`), its last words in green; a tab's large title, fading and shrinking from its lower left.
function Question({ now }: { now: number }) {
  const { c } = useKit();
  const { colors } = useTheme();
  const line = dayLine(new Date(now));
  return (
    <LargeTitle kind="buyukBaslik">
      <View style={{ gap: L.titleTop }}>
        <T v="kesfetEyebrow" color={c.muted}>
          {upperTr(tr.explore.dayLine(line.weekday, line.part))}
        </T>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[KIT_TYPE.kesfetTitle, { color: c.ink }]}
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

// The kind chips on one line (`.ch`), each growing to share it; past the screen's width (320 dp,
// the largest text) they scroll sideways to its edge.
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
  const side = map ? EXPLORE.map.side : L.side;
  const chips = EXPLORE_KINDS.map((k) => (
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
  ));
  const row = { flexDirection: 'row', alignSelf: 'stretch', gap: EXPLORE.chip.gap } as const;
  // The chips share the line (`.ch`: a plain row, each `flex: 1 1 auto`). Only where they do not fit
  // (320 dp, the largest text) the row scrolls sideways to the screen's edge, at least as wide as
  // the screen.
  if (!narrow) {
    return (
      <View accessibilityRole="radiogroup" accessibilityLabel={tr.explore.kindsLabel} style={row}>
        {chips}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={tr.explore.kindsLabel}
      style={{ marginHorizontal: -side, overflow: 'visible' }}
      contentContainerStyle={{ ...row, flexGrow: 1, paddingHorizontal: side }}
    >
      {chips}
    </ScrollView>
  );
}

// A kind chip (`.ch .chip`): 14 in, its words 14/600; the chosen one in the ink with white words,
// the others on the board's glass on the list and white on the map. 46 high when narrow (Aura v75
// KesfetHaritaDar).
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
  // Kesfet `.chip`: 40 high.
  const h = narrow ? KIT.size.chipNarrow : KIT.size.chipLg;
  const shape = {
    height: h,
    borderRadius: h / 2,
    paddingHorizontal: EXPLORE.chip.padX,
    alignItems: 'center',
    justifyContent: 'center',
  } as const;
  const words = (
    <T v="kesfetChip" lines={1} color={on ? c.onChipOn : c.ink}>
      {label}
    </T>
  );
  return (
    <View style={{ flexGrow: 1, flexBasis: 'auto' }}>
      <Tap testID={testID} accessibilityState={{ selected: on }} onPress={onPress}>
        {on ? (
          <View style={[shape, { backgroundColor: c.chipOn }]}>{words}</View>
        ) : (
          <Glass face={map ? EXPLORE[scheme].solid : undefined} radius={h / 2} style={shape}>
            {words}
          </Glass>
        )}
      </Tap>
    </View>
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
// order, then each venue as a row on the ground. The rows arrive 60 ms apart after the head's
// parts.
function VenueList({
  venues,
  listed,
  empty,
  kind,
  place,
  here,
  searching,
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
  // Something typed in the search: Semte Git and "Şu an buradasın" are not drawn (KesfetAra).
  searching: boolean;
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
  const { colors } = useTheme();
  const p = EXPLORE.place;
  const s = EXPLORE.sort;
  const choosable = cityList.length > 1;
  return (
    <>
      {/* Semte Git (docs/SPEC_V4.md §4.V): the screen's one featured card, under the chips. */}
      {searching ? null : <DistrictCard />}
      {here && !searching ? (
        <View style={{ marginTop: L.hereTop }}>
          <HereNow here={here} />
        </View>
      ) : null}
      {/* The city and district on its glass pill and how many venues (K-38), the order at the
          right (Kesfet `.lh`); 24 under Semte Git. */}
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
            marginTop: L.sectionTop,
          }}
        >
          <View
            style={{
              flexShrink: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: p.countGap,
              rowGap: SPACING[1],
            }}
          >
            {/* The place sheet opens from here when there is a city to choose (K-38); every city
                is the default (5 Kasım). */}
            <Tap
              testID="explore-place"
              accessibilityRole={choosable ? 'button' : 'header'}
              accessibilityLabel={
                place
                  ? tr.explore.placeLabel(place.city, place.district)
                  : tr.explore.allCitiesLabel
              }
              disabled={!choosable}
              sink={choosable}
              onPress={() => {
                setSheetKey((k) => k + 1);
                setPlaceSheet(true);
              }}
              hitSlop={KIT.size.chipsGap}
            >
              <Glass
                radius={KIT.size.btnSm / 2}
                style={{
                  minHeight: KIT.size.btnSm,
                  borderRadius: KIT.size.btnSm / 2,
                  paddingLeft: p.padLeft,
                  paddingRight: p.padRight,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: p.gap,
                }}
              >
                <CapIcon name="pin" color={colors.accent} size={p.icon} />
                <View style={{ flexShrink: 1 }}>
                  <T v="kesfetPlace">
                    {place ? tr.explore.place(place.city, place.district) : tr.explore.allCities}
                  </T>
                </View>
                {choosable ? (
                  <View style={{ marginLeft: p.chevronIn }}>
                    <CapIcon name="down" color={c.muted} size={p.chevron} />
                  </View>
                ) : null}
              </Glass>
            </Tap>
            {/* KesfetBos, KesfetAraBos: nothing to count, no count. */}
            {venues.length > 0 ? (
              <T v="kesfetCount" color={c.muted} testID="explore-count">
                {tr.explore.count(venues.length)}
              </T>
            ) : null}
          </View>
          {/* `.srt`: the order as plain words, its arrow after them. */}
          <Tap
            testID="explore-sort"
            accessibilityLabel={tr.explore.sortLabel(nameOrder)}
            disabled={!canSort}
            onPress={onSort}
            hitSlop={(KIT.size.round - s.height) / 2}
            style={{
              height: s.height,
              paddingLeft: s.padLeft,
              paddingRight: s.padRight,
              flexDirection: 'row',
              alignItems: 'center',
              gap: s.gap,
            }}
          >
            <T v="kesfetSort" lines={1} color={c.muted}>
              {nameOrder ? tr.explore.sortByName : tr.explore.sortEventsFirst}
            </T>
            <CapIcon name="down" color={c.muted} size={s.chevron} />
          </Tap>
        </View>
      </Reveal>
      <View style={{ marginTop: L.rowsTop, marginHorizontal: -L.side }}>
        {venues.length === 0 ? (
          // KesfetBos, KesfetAraBos: nothing at all, or a filter or a search that finds nothing,
          // said by its cause under the riso.
          <Reveal index={ROWS_AT} step={ROW_STEP} replay={replay} openings={openings}>
            <ListEmpty
              testID={listed.length === 0 ? 'explore-empty' : 'explore-no-match'}
              search={empty === 'search'}
              title={copy.title}
              body={copy.hint}
            />
          </Reveal>
        ) : (
          // A university with several campuses is one row opening its campuses (docs/SPEC_V4.md
          // §4.Q); every other venue, a single campus included, is its own row.
          groupByUniversity(venues, listed).map((row, i) => (
            <Reveal
              key={row.type === 'venue' ? row.venue.id : `u-${row.university.id}`}
              index={ROWS_AT + i}
              step={ROW_STEP}
              replay={replay}
              openings={openings}
            >
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

// The board's riso pictures: the buddies over the search (`.kk`), the empty list (KesfetBos) and the
// search that finds nothing (KesfetAraBos).
const PEEK = require('../../../../assets/riso/peek-explore.webp') as ImageSourcePropType;
const EMPTY_LIST = require('../../../../assets/riso/empty-explore.webp') as ImageSourcePropType;
const EMPTY_SEARCH = require('../../../../assets/riso/empty-search.webp') as ImageSourcePropType;

// KesfetBos, KesfetAraBos `.emp`: the riso, its title 12 under it and the sentence 4 under that,
// centred, 10 under the place line, 24 from the sides.
function ListEmpty({
  testID,
  search,
  title,
  body,
}: {
  testID: string;
  search: boolean;
  title: string;
  body: string | null;
}) {
  const { c } = useKit();
  const e = EXPLORE.empty;
  const picture = search ? e.search : e.list;
  // KesfetAraBos `.emp{flex:1 0 auto; justify-content:center; padding:0 24px 150px}`: the search that
  // finds nothing stands in the middle of what is left under the place line, above the bottom's
  // 150; the empty list (KesfetBos) stays at the top.
  const box = useRef<View>(null);
  const { height: screen } = useWindowDimensions();
  const [room, setRoom] = useState(0);
  return (
    <View
      ref={box}
      testID={testID}
      collapsable={false}
      onLayout={() => {
        if (!search) return;
        box.current?.measureInWindow((_x, top) => setRoom(Math.max(0, screen - top - e.bottom)));
      }}
      style={{
        alignItems: 'center',
        paddingTop: search ? 0 : e.top,
        paddingHorizontal: e.side,
        minHeight: search ? room : undefined,
        justifyContent: search ? 'center' : undefined,
      }}
    >
      <Image
        source={search ? EMPTY_SEARCH : EMPTY_LIST}
        fadeDuration={0}
        resizeMode="contain"
        accessible={false}
        style={{ width: picture.width, height: picture.height }}
      />
      <View style={{ marginTop: e.titleTop }}>
        <T v="kesfetEmptyTitle" center accessibilityRole="header">
          {title}
        </T>
      </View>
      {body ? (
        <View style={{ marginTop: e.noteTop, maxWidth: e.noteWidth }}>
          <T v="kesfetSub" center color={c.muted}>
            {body}
          </T>
        </View>
      ) : null}
    </View>
  );
}

// How lively a venue is, at the row's right (`.stt`): the bucket in words (K-41, never a count),
// in the accent with its dot when there are tables, muted when quiet.
function Liveliness({ bucket }: { bucket: CityVenue['bucket'] }) {
  const { c } = useKit();
  const { colors } = useTheme();
  const r = EXPLORE.row;
  const on = bucket !== 'calm';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: r.statusGap, flexShrink: 0 }}>
      {on ? (
        <View
          style={{
            width: r.dot,
            height: r.dot,
            borderRadius: r.dot / 2,
            backgroundColor: colors.accent,
          }}
        />
      ) : null}
      <T v="kesfetStatus" color={on ? colors.accent : c.muted}>
        {tr.explore.buckets[bucket]}
      </T>
    </View>
  );
}

// A venue's row (Kesfet `.rw.vr`): its 56 picture, the name (wrapping, never cut) over the type and
// district, how lively and the arrow; on the ground, no card and no hairline.
function PlaceRow({
  testID,
  accessibilityLabel,
  onPress,
  kind,
  name,
  sub,
  bucket,
}: {
  testID: string;
  accessibilityLabel: string;
  onPress: () => void;
  kind: VenueType;
  name: string;
  sub: string;
  bucket: CityVenue['bucket'];
}) {
  const { c } = useKit();
  const r = EXPLORE.row;
  return (
    <Tap
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: r.gap,
        minHeight: r.minHeight,
        paddingVertical: r.padY,
        paddingHorizontal: r.padX,
      }}
    >
      <VenueThumb kind={kind} size={r.picture} radius={r.pictureRadius} shadow="" />
      <View style={{ flex: 1, minWidth: 0, gap: r.lineGap }}>
        <T v="kesfetName">{name}</T>
        <T v="kesfetSub" color={c.muted}>
          {sub}
        </T>
      </View>
      <Liveliness bucket={bucket} />
      <View style={{ marginLeft: r.chevronIn }}>
        <CapIcon name="chevron" color={c.muted} size={r.chevron} />
      </View>
    </Tap>
  );
}

function VenueRow({ venue: v, onPress }: { venue: CityVenue; onPress: () => void }) {
  const type = venueType(v);
  return (
    <PlaceRow
      testID={`explore-venue-${v.name}`}
      accessibilityLabel={`${v.name}, ${kindLabel(v.kind)}, ${tr.explore.buckets[v.bucket]}`}
      onPress={onPress}
      kind={type}
      name={v.name}
      sub={tr.explore.venueSub(kindLabel(v.kind), v.district)}
      bucket={v.bucket}
    />
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
    <PlaceRow
      testID={`explore-university-${university.ref}`}
      accessibilityLabel={tr.explore.universityLabel(university.name, campuses.length)}
      onPress={onPress}
      kind="kampus"
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

// The place line comes after the head's three parts (the question, the search, the chips), 70 ms
// apart; the rows after it, 60 ms apart (hareket.json → stagger).
const SECTION_AT = 3;
const ROWS_AT = 5;
const ROW_STEP = 60;

// The campus sheet's rows' picture, the thumb's own (56).
const VENUE_THUMB_SIZE = VENUE_THUMB.size;

// The search (Kesfet, KesfetAra, KesfetHarita `.sr`): the white field with the search icon, "Mekan
// ara" and, once something is typed, the clear button; the round to the map (on the map: to the
// list) 8 at its right. Both a form field's 48.
function SearchRow({
  value,
  onChangeText,
  map,
  onChange,
}: {
  value: string;
  onChangeText: (text: string) => void;
  map: boolean;
  onChange: (v: View_) => void;
}) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const f = EXPLORE.field;
  const to: View_ = map ? 'list' : 'map';
  return (
    <View
      accessibilityLabel={tr.explore.viewSwitch}
      style={{ flexDirection: 'row', alignItems: 'center', gap: f.rowGap }}
    >
      <Glass
        face={EXPLORE[scheme].solid}
        radius={FIELD / 2}
        style={{
          flex: 1,
          height: FIELD,
          borderRadius: FIELD / 2,
          paddingHorizontal: f.padX,
          flexDirection: 'row',
          alignItems: 'center',
          gap: f.gap,
        }}
      >
        <CapIcon name="search" color={c.muted} size={f.icon} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <TextInput
            testID="explore-search"
            value={value}
            onChangeText={onChangeText}
            accessibilityLabel={tr.explore.search}
            returnKeyType="search"
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            style={[
              KIT_TYPE.kesfetField,
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
              <T v="kesfetField" lines={1} color={colors.placeholder}>
                {tr.explore.search}
              </T>
            </View>
          ) : null}
        </View>
        {value.length > 0 ? <ClearButton onPress={() => onChangeText('')} /> : null}
      </Glass>
      <Round
        side={FIELD}
        icon={to}
        label={tr.explore.views[to]}
        testID={`explore-view-${to}`}
        onPress={() => onChange(to)}
      />
    </View>
  );
}

// KesfetAra `.clr`: a 36 round at the field's right, its 20 icon a soft disc with a cross.
function ClearButton({ onPress }: { onPress: () => void }) {
  const { c } = useKit();
  const f = EXPLORE.field;
  return (
    <Tap
      testID="explore-search-clear"
      accessibilityLabel={tr.explore.clearSearch}
      onPress={onPress}
      style={{
        width: f.clear,
        height: f.clear,
        borderRadius: f.clear / 2,
        marginRight: f.clearOut,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={f.clearIcon} height={f.clearIcon} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={9.4} fill={c.muted} opacity={0.22} />
        <Path d="M9 9l6 6M15 9l-6 6" stroke={c.muted} strokeWidth={2.2} strokeLinecap="round" />
      </Svg>
    </Tap>
  );
}
