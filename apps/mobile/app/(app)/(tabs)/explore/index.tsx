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
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Li, Live, PulseDot, Round, T, Tag, useKit } from '@/aura/kit';
import { useTabOpenings } from '@/aura/motion';
import { RisoPeekOver } from '@/aura/Peek';
import type { TabOpenings } from '@/lib/tabOpenings';
import { Reveal } from '@/aura/Reveal';
import { VenueThumb } from '@/aura/VenueThumb';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { PullScroll } from '@/components/PullScroll';
import { Sheet } from '@/components/Sheet';
import { useTabBarOverMap, useTabBarSpace } from '@/components/TabBar';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { DistrictCard } from '@/features/district/DistrictCard';
import { EmptyCard } from '@/features/explore/EmptyCard';
import { ExploreMap } from '@/features/explore/ExploreMap';
import { useExplorePlace } from '@/features/explore/placeStore';
import { EventTag } from '@/features/explore/EventTag';
import { type CityVenue, useCityVenues } from '@/features/explore/useExploreVenues';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { dayLine, dayPart } from '@/lib/dayPart';
import { haptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { venueType } from '@/lib/venueType';
import { useNarrow } from '@/lib/useNarrow';
import { LargeTitle, ScrollScreen, StickyField, Tap } from '@/motion';
import { ScrollViewport, useContentHeightFeed, useScrollOffset } from '@/motion/ScrollScreen';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE, VENUE_THUMB } from '@/theme/auraKit';
import { EXPLORE_PEEK } from '@/theme/kankiMotion';
import { THEME } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type View_ = 'list' | 'map';

type Here = { name: string; spot: string | null };

const X = KIT.size.explore;

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
  const shown = useMemo(
    () => sortVenues(filterVenues(listed, { place, kind, query }), now),
    [listed, place, kind, query, now],
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
  const empty = exploreEmpty(listed.length, { kind, query });
  const here = hasActiveTable(table.data, now) ? table.data : null;
  const hereCard: Here | null = here
    ? { name: here.venue?.name ?? '', spot: here.spot?.name ?? null }
    : null;

  const capsule = (
    <SearchCapsule
      value={query}
      onChangeText={setQuery}
      view={view}
      onChange={(mode) => {
        haptic('selection');
        setView(mode);
      }}
    />
  );
  const chips = (
    <KindChips
      kind={kind}
      onChoose={(k) => {
        setKind(k);
        setKindRuns((n) => n + 1);
      }}
    />
  );

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
                paddingTop: insets.top + SPACING[2],
                paddingHorizontal: KIT.size.side,
                gap: SPACING[3],
              }}
            >
              <View style={{ height: X.capsule }}>{capsule}</View>
              {chips}
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
        paddingHorizontal: KIT.size.side,
        paddingTop: SPACING[2],
        // At least 124 under the list (U13; the bar's room is 92 without a safe area).
        paddingBottom: SPACING[8] + bottomSpace,
      }}
    >
      <View testID="explore-head">
        <Reveal index={0} openings={openings}>
          <Question now={now} />
        </Reveal>
        {/* 5.1: a buddy looks over the capsule's top edge; it scrolls with the content. */}
        {ready ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, bottom: -SPACING[6], height: 0 }}
          >
            <RisoPeekOver places={EXPLORE_PEEK} />
          </View>
        ) : null}
      </View>
      {ready ? (
        <>
          {/* Over what scrolls under it once pinned. */}
          <View style={{ zIndex: 1, marginTop: SPACING[6] }}>
            <Reveal index={1} openings={openings}>
              <StickyField shrink={[X.capsule, X.capsulePinned]} band>
                {capsule}
              </StickyField>
            </Reveal>
          </View>
          <View style={{ marginTop: SPACING[3] }}>
            <Reveal index={2} openings={openings}>
              {chips}
            </Reveal>
          </View>
        </>
      ) : null}
      {/* 24 between the head's blocks and the body, 12 inside it (U13). */}
      <View style={{ marginTop: SPACING[6], gap: SPACING[3] }}>{children}</View>
    </PullScroll>
  );
}

// The line of the day from the phone's clock ("PERŞEMBE AKŞAMI") over the question at 36/800, its
// last word in green (5.1); a tab's large title, fading and shrinking from its lower left.
function Question({ now }: { now: number }) {
  const { c } = useKit();
  const { colors } = useTheme();
  const line = dayLine(new Date(now));
  return (
    <LargeTitle kind="buyukBaslik">
      <View style={{ gap: SPACING[1] }}>
        <T v="eyebrow">{upperTr(tr.explore.dayLine(line.weekday, line.part))}</T>
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

// U13: the kind chips on one line, scrolling sideways to the screen's edge.
function KindChips({ kind, onChoose }: { kind: ExploreKind; onChoose: (k: ExploreKind) => void }) {
  const narrow = useNarrow();
  return (
    <ScrollView
      horizontal
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={tr.explore.kindsLabel}
      style={{ marginHorizontal: -KIT.size.side, overflow: 'visible' }}
      contentContainerStyle={{ gap: KIT.size.chipsGap, paddingHorizontal: KIT.size.side }}
    >
      {EXPLORE_KINDS.map((k) => (
        <Chip
          key={k}
          testID={`explore-kind-${k}`}
          label={tr.explore.kinds[k]}
          narrow={narrow}
          on={kind === k}
          onPress={() => {
            if (k !== kind) onChoose(k);
          }}
        />
      ))}
    </ScrollView>
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

// A venue's liveliness as a dotted tag (5.1): "Sessiz" with a still dot, the livelier ones with
// the beating pink dot.
function Bucket({ bucket }: { bucket: CityVenue['bucket'] }) {
  const { tags } = useKit();
  const calm = bucket === 'calm';
  return (
    <Tag
      tone={calm ? 'purple' : 'pink'}
      label={tr.explore.buckets[bucket]}
      lead={
        calm ? (
          <View
            style={{
              width: KIT.size.dot,
              height: KIT.size.dot,
              borderRadius: KIT.size.dot / 2,
              backgroundColor: tags.purple.fg,
            }}
          />
        ) : (
          <PulseDot color={KIT.pink} ring={KIT.pinkRing} />
        )
      }
    />
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
  return (
    <>
      {/* Semte Git (docs/SPEC_V4.md §4.V): the screen's one featured card, under the chips. */}
      <DistrictCard />
      {here ? <HereNow here={here} /> : null}
      {/* The city and district, and how many venues (K-38), the order at the right. */}
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
            paddingTop: KIT.size.secPadTop,
          }}
        >
          <View style={{ flexShrink: 1, gap: SPACING[0.5] }}>
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
              <T v="h3">
                {place ? tr.explore.place(place.city, place.district) : tr.explore.allCities}
              </T>
            </Tap>
            <T v="fine" testID="explore-count">
              {tr.explore.count(venues.length)}
            </T>
          </View>
          {/* 5.1: the order as a clear button. */}
          <Btn
            sm
            variant="glassy"
            testID="explore-sort"
            label={nameOrder ? tr.explore.sortByName : tr.explore.sortEventsFirst}
            accessibilityLabel={tr.explore.sortLabel(nameOrder)}
            disabled={!canSort}
            onPress={onSort}
          />
        </View>
      </Reveal>
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

// A venue's card (5.1, 3.4): its 76 picture, the name, the type and district, the dotted bucket and
// the arrow; 26 round, 12 inside.
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
  const { c } = useKit();
  const card = X.card;
  return (
    <Tap testID={testID} accessibilityLabel={accessibilityLabel} onPress={onPress}>
      <Glass
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
          <T v="h3">{name}</T>
          <T v="fine">{sub}</T>
          <View style={{ flexDirection: 'row', marginTop: card.lineGap }}>
            <Bucket bucket={bucket} />
          </View>
        </View>
        <CapIcon name="forward" color={c.muted} size={X.icon} />
      </Glass>
    </Tap>
  );
}

function VenueCard({ venue: v, onPress }: { venue: CityVenue; onPress: () => void }) {
  const type = venueType(v);
  return (
    <PlaceCard
      testID={`explore-venue-${v.name}`}
      accessibilityLabel={`${v.name}, ${tr.explore.typeLabel[type]}, ${tr.explore.buckets[v.bucket]}`}
      onPress={onPress}
      picture={<VenueThumb kind={type} size={VENUE_CARD_PICTURE} />}
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
      picture={<VenueThumb kind="kampus" size={VENUE_CARD_PICTURE} />}
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

// The one glass capsule (5.1): "Mekan ara" with the search icon, and the list/map switch at its
// right; 54 high, 48 once pinned (StickyField → shrink: it fills the height it is given).
function SearchCapsule({
  value,
  onChangeText,
  view,
  onChange,
}: {
  value: string;
  onChangeText: (text: string) => void;
  view: View_;
  onChange: (v: View_) => void;
}) {
  const { c } = useKit();
  const { colors } = useTheme();
  return (
    <Glass
      frost
      radius={X.capsule / 2}
      style={{
        flex: 1,
        borderRadius: X.capsule / 2,
        paddingLeft: X.capsulePadX,
        paddingRight: X.switchPad,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[2],
      }}
    >
      <CapIcon name="search" color={colors.placeholder} size={X.icon} />
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

// The list/map switch inside the capsule: two rounds 2 apart, the chosen one raised on the surface,
// its icon green (5.1); sized for the pinned capsule, so they sit in its middle at either height.
function ViewSwitch({ value, onChange }: { value: View_; onChange: (v: View_) => void }) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const round = X.capsulePinned - 2 * X.switchPad;
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={tr.explore.viewSwitch}
      style={{ flexDirection: 'row', alignItems: 'center', gap: X.switchGap }}
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
              width: round,
              height: round,
              borderRadius: round / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? c.segOn : undefined,
              boxShadow: on ? c.segShadow || undefined : undefined,
            }}
          >
            {/* In the dark on white 94 % with the light scheme's green. */}
            <CapIcon
              name={mode}
              color={on ? (scheme === 'dark' ? THEME_LIGHT_ACCENT : colors.accent) : c.muted}
              size={X.icon}
            />
          </Tap>
        );
      })}
    </View>
  );
}

// Kesfet `.dark .segx span.on .ci`: the light scheme's accent on the white part.
const THEME_LIGHT_ACCENT = THEME.palettes.light.accent;
