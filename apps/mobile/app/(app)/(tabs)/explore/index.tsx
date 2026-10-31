import {
  EXPLORE_KINDS,
  type ExploreCity,
  type ExploreKind,
  type ExplorePlace,
  type ExploreEmpty,
  exploreCities,
  exploreEmpty,
  explorePlace,
  filterVenues,
  sortVenues,
} from '@shared/explore.ts';
import { hasActiveTable } from '@shared/navigation.ts';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground, AuraBand } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Li, Live, RowList, T, useKit } from '@/aura/kit';
import { useTabFocus } from '@/aura/motion';
import { Reveal } from '@/aura/Reveal';
import { VenueThumb } from '@/aura/VenueThumb';
import { Button } from '@/components/Button';
import { Chips } from '@/components/Chips';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { PullScroll } from '@/components/PullScroll';
import { Sheet } from '@/components/Sheet';
import { useTabBarOverMap, useTabBarSpace } from '@/components/TabBar';
import { Text } from '@/components/Text';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { ExploreMap } from '@/features/explore/ExploreMap';
import { useExplorePlace } from '@/features/explore/placeStore';
import { type CityVenue, useCityVenues } from '@/features/explore/useExploreVenues';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { dayPart } from '@/lib/dayPart';
import { haptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { venueType } from '@/lib/venueType';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
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
  const { scheme, shape } = useTheme();
  const table = useActiveTable();
  const now = useNow(30_000);
  const { venues, cities, listed } = useCityVenues();
  const focus = useTabFocus();
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
          <AuraBand
            top={0}
            height={insets.top + headerHeight * MAP_SOLID}
            fade={headerHeight * (1 - MAP_SOLID) + SPACING[6]}
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
              gap: KIT.size.exploreGap,
            }}
          >
            <Reveal index={0} replay={focus.opened}>
              <T v="display" style={KIT_TYPE.displayLg} accessibilityRole="header">
                {tr.explore.question[dayPart(now)]}
              </T>
            </Reveal>
            {ready ? (
              <>
                <Reveal index={1} replay={focus.opened}>
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
                <Reveal index={2} replay={focus.opened}>
                  <View
                    accessibilityRole="radiogroup"
                    accessibilityLabel={tr.explore.kindsLabel}
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap }}
                  >
                    {EXPLORE_KINDS.map((k) => (
                      <Chip
                        key={k}
                        tall
                        testID={`explore-kind-${k}`}
                        label={tr.explore.kinds[k]}
                        on={kind === k}
                        onPress={() => {
                          if (k === kind) return;
                          setKind(k);
                          setKindRuns((n) => n + 1);
                        }}
                      />
                    ))}
                  </View>
                </Reveal>
              </>
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
            replay={focus.opened * REPLAY_BASE + kindRuns}
            onRefresh={() => Promise.all([venues.refetch(), cities.refetch()])}
          />
        ) : null}
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

// "Şu an buradasın" (v46 `.vhere`): the own check-in and the way back to Mekan. The phone's own
// data; nobody else sees it.
function HereNow({ here }: { here: Here }) {
  // A thin row (the owner's report, 30 Ekim: the card stood tall with its right side empty): the
  // live dot, the venue and the spot on the left, "Mekana dön" on the right. A long venue name
  // wraps under itself rather than squeezing the button.
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
        <T v="fine">{tr.explore.hereAt(here.spot)}</T>
      </View>
      <Btn
        sm
        icon="forward"
        label={tr.explore.backToVenue}
        onPress={() => router.navigate('/venue')}
      />
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
  onRefresh: () => Promise<unknown>;
}) {
  const side = KIT.size.side;
  const [placeSheet, setPlaceSheet] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const cityList = useMemo(() => exploreCities(listed), [listed]);
  return (
    // Pulled down at its top it fetches the list again (v46's `.ptr-ind`).
    <PullScroll
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        paddingHorizontal: side,
        paddingTop: KIT.size.exploreGap,
        paddingBottom: SPACING[8] + bottomSpace,
        gap: KIT.size.exploreGap,
      }}
    >
      {here ? <HereNow here={here} /> : null}
      {/* The city and district, and how many venues (K-38): a section's head. */}
      <Reveal index={SECTION_AT} replay={replay}>
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
            paddingHorizontal: KIT.size.secPadX,
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
              <T v="secLg">{tr.explore.place(place.city, place.district)}</T>
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
        <EmptyState icon="cafe-outline" body={tr.explore.empty} />
      ) : venues.length === 0 ? (
        // Keşfet: boş: a filter or a search that finds nothing, said by its cause.
        <Reveal index={ROWS_AT} step={ROW_STEP} replay={replay}>
          <Glass pad="lg" testID="explore-no-match" style={{ gap: SPACING[1] }}>
            <T v="sec">{emptyCopy(empty, kind).title}</T>
            <T v="body">{emptyCopy(empty, kind).hint}</T>
          </Glass>
        </Reveal>
      ) : (
        <RowList inset={KIT.size.liGap + VENUE_ROW_PICTURE}>
          {venues.map((v, i) => {
            const type = venueType(v);
            const calm = v.bucket === 'calm';
            return (
              <Reveal key={v.id} index={ROWS_AT + i} step={ROW_STEP} replay={replay}>
                <Li
                  testID={`explore-venue-${v.name}`}
                  accessibilityLabel={`${v.name}, ${tr.explore.typeLabel[type]}, ${tr.explore.buckets[v.bucket]}`}
                  onPress={() =>
                    router.push({ pathname: '/explore/[venueId]', params: { venueId: v.id } })
                  }
                >
                  <VenueThumb kind={type} size={VENUE_ROW_PICTURE} />
                  <View style={{ flex: 1, gap: SPACING[0.5] }}>
                    <T v="sec">{v.name}</T>
                    <T v="fineLg">{tr.explore.venueSub(tr.explore.typeLabel[type], v.district)}</T>
                  </View>
                  {calm ? (
                    <T v="fineLg">{tr.explore.buckets[v.bucket]}</T>
                  ) : (
                    <Live
                      label={tr.explore.buckets[v.bucket]}
                      color={KIT.pink}
                      ring={KIT.pinkRing}
                    />
                  )}
                </Li>
              </Reveal>
            );
          })}
        </RowList>
      )}
      <T v="fine" center style={{ marginTop: SPACING[3] }}>
        {tr.checkin.osmAttribution}
      </T>
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
        <Text variant="label">{tr.explore.city}</Text>
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
        <Text variant="label">{tr.explore.district}</Text>
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
      <View className="gap-2.5">
        <Button
          size="lg"
          label={tr.explore.showPlace}
          testID="place-show"
          onPress={() => {
            choose(pick);
            onClose();
          }}
        />
        <Button size="lg" variant="neutral" label={tr.common.cancel} onPress={onClose} />
      </View>
    </Sheet>
  );
}

// Over the map: the question and the search row on the plain ground, the fade only round the
// chips (the owner's report, 30 Ekim: street names showed through the question).
const MAP_SOLID = 0.74;

// The place line comes after the head's three parts (the question, the search, the chips), 70 ms
// apart; the rows after it, 60 ms apart (hareket.json → stagger).
const SECTION_AT = 3;
const ROWS_AT = 5;
const ROW_STEP = 60;
// A tab opened again and a kind chosen both play the list's arrival: one number for the two.
const REPLAY_BASE = 1000;

// A venue row's picture (Keşfet: 52).
const VENUE_ROW_PICTURE = 52;

const SEARCH_GAP = 10;

// "Mekan ara" on glass (Keşfet: 54 high, 27 round, the search icon first).
function SearchGlass({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const { c } = useKit();
  const h = KIT.size.field;
  return (
    <Glass
      frost
      radius={h / 2}
      style={{
        flex: 1,
        height: h,
        borderRadius: h / 2,
        paddingHorizontal: KIT.size.searchPadX,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SEARCH_GAP,
      }}
    >
      <CapIcon name="search" color={c.muted} size={KIT.size.iconSm} />
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
            <T v="body" color={c.muted}>
              {tr.explore.search}
            </T>
          </View>
        ) : null}
      </View>
    </Glass>
  );
}

// The list/map switch (Keşfet): two round buttons in a glass capsule, the chosen one raised white.
function ViewSwitch({ value, onChange }: { value: View_; onChange: (v: View_) => void }) {
  const { c } = useKit();
  const h = KIT.size.field;
  const round = KIT.size.switchRound;
  return (
    <Glass
      frost
      radius={h / 2}
      style={{
        height: h,
        borderRadius: h / 2,
        padding: (h - round) / 2 - KIT.size.edge,
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
              <CapIcon name={mode} color={on ? c.ink : c.muted} size={KIT.size.iconSm} />
            </Pressable>
          );
        })}
      </View>
    </Glass>
  );
}
