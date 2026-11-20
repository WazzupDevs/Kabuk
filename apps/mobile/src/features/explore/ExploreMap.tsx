import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  type GeoJSONSourceRef,
  Images,
  Layer,
  type LayerProps,
  Map,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import {
  type Bounds,
  MAP_ZOOM,
  mapPadding,
  venueBounds,
  venueCollection,
} from '@shared/exploreMap.ts';
import { router } from 'expo-router';
import { describeEventTime } from '@shared/explore.ts';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, Li, RowList, Round, T, Tag, useKit } from '@/aura/kit';
import { VenueThumb } from '@/aura/VenueThumb';
import { TYPE_PIN_IMAGES } from '@/components/Glyph';
import { tr } from '@/i18n/tr';
import { PopIn, Tap } from '@/motion';
import { useNarrow } from '@/lib/useNarrow';
import { useNow } from '@/lib/useNow';
import { KIT, VENUE_THUMB } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';
import { useTheme } from '@/theme/ThemeProvider';
import { MAP_FONTS, MAP_PIN, SPACING } from '@/theme/tokens';
import { venueType } from '@/lib/venueType';

import { kindLabel } from './kindLabel';
import { useMapStyle } from './mapStyle';
import type { ExploreVenue } from './useExploreVenues';
import { TICKET_PICTURE, VenueTicket } from './VenueTicket';

// OpenFreeMap by default: no API key in the app and no per-load cost (DECISIONS: map library). The
// dark theme draws a dark map (v46 §8, K-65), OpenFreeMap's own dark style; both repainted in
// skall's colours (mapStyle.ts).
const MAP_STYLE_URL = {
  light: process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
  dark: process.env.EXPO_PUBLIC_MAP_STYLE_URL_DARK ?? 'https://tiles.openfreemap.org/styles/dark',
} as const;

type SymbolLayer = Extract<LayerProps, { type: 'symbol' }>;
type CircleLayer = Extract<LayerProps, { type: 'circle' }>;
type Filter = NonNullable<SymbolLayer['filter']>;

// A cluster of venues, or a stack (venues at one address; @shared/exploreMap.ts → STACK_M): drawn
// alike, a count in a disc. A venue is neither.
const IS_CLUSTER: Filter = ['any', ['has', 'point_count'], ['has', 'stack']];
const IS_VENUE: Filter = ['all', ['!', ['has', 'point_count']], ['!', ['has', 'stack']]];
// How many venues a disc stands for (`['coalesce', ['get', 'venues'], ['get', 'count']]` below):
// a cluster adds up its points' counts, a stack counts all its venues.

// The venue's kind inside its white disc, in the capsule family's colours (the owner's call, 27
// Ekim), picked by the feature's `kind` ('cafe' | 'campus').
const MAP_IMAGES = {
  'pin-kafe': { source: TYPE_PIN_IMAGES.kafe },
  'pin-cay': { source: TYPE_PIN_IMAGES.cay },
  'pin-yemek': { source: TYPE_PIN_IMAGES.yemek },
  'pin-kampus': { source: TYPE_PIN_IMAGES.kampus },
};

// The pin's shadow (KesfetHarita `.pin .pc`).
const PIN_SHADOW = MAP_PIN.pinShadow;
const PIN_SHADOW_Y = MAP_PIN.shadowY;
const PIN_SHADOW_SPREAD = 11;
const PIN_SHADOW_BLUR = 0.6;
// A venue label's width in ems before it wraps: a venue's name on two lines at most.
const LABEL_WIDTH_EM = 14;

type PressedFeature = {
  geometry?: { type: string; coordinates?: unknown };
  properties?: { id?: unknown; cluster_id?: unknown } | null;
};

// Venues coloured by bucket, with an event mark, drawn by GL layers so they stay inside the map and
// under the header (native marker views were drawn over it). Clustered at low zoom; names show from
// MAP_ZOOM.labels on, or for the selected venue. A tap on a cluster zooms in; a tap on a venue
// selects it and opens a short card at the bottom (name, bucket, event, "Mekana git"); a tap on the
// empty map closes it. The user's own position is never shown (docs/arsiv/SPEC_V2.md §4, rule 6). The
// list view stays the screen reader path.

export function ExploreMap({
  venues,
  empty,
  headerHeight,
  tabBarHeight,
  initialSelected,
}: {
  // The venue chosen when it opens (the visual gate's card).
  initialSelected?: string;
  venues: readonly ExploreVenue[];
  // The list's words for an empty result, by its cause (kabul raporu §9.1).
  empty: { title: string; hint: string | null };
  // What covers the map's top and bottom edges; the opening camera keeps the venues clear of them.
  headerHeight: number;
  tabBarHeight: number;
}) {
  const { colors, scheme } = useTheme();
  const narrow = useNarrow();
  const mapStyle = useMapStyle(MAP_STYLE_URL[scheme], scheme);
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapRef>(null);
  const source = useRef<GeoJSONSourceRef>(null);
  const [selected, setSelected] = useState<string | null>(initialSelected ?? null);
  // E2E waits on this (testID below): the style, its glyphs and the venue layers are drawn.
  const [ready, setReady] = useState(false);

  const now = useNow(60_000);
  const { data, stacks } = useMemo(() => {
    const { stacks: byStack, ...collection } = venueCollection(
      venues.map((v) => ({
        id: v.id,
        name: v.name,
        lat: v.lat,
        lng: v.lng,
        bucket: v.bucket,
        hasEvent: v.event !== null,
        kind: v.kind,
      })),
    );
    // Under the name, what the list says of the venue: how lively, and its event's time.
    const status: Record<string, string> = Object.fromEntries(
      venues.map((v) => [
        v.id,
        v.event
          ? `${tr.explore.buckets[v.bucket]} · ${tr.explore.eventTime(describeEventTime(v.event.startsAt, v.event.endsAt, now))}`
          : tr.explore.buckets[v.bucket],
      ]),
    );
    const types: Record<string, string> = Object.fromEntries(
      venues.map((v) => [v.id, venueType(v)]),
    );
    return {
      stacks: byStack,
      data: {
        ...collection,
        features: collection.features.map((f) => ({
          ...f,
          properties: { ...f.properties, status: status[f.id] ?? '', type: types[f.id] ?? 'kafe' },
        })),
      },
    };
  }, [venues, now]);
  // The shown card's height (a venue's ticket, a stack's list), 96 until it is laid out.
  const [cardHeight, setCardHeight] = useState<number>(EXPLORE.map.cardMinHeight);
  // A tapped stack: its venues listed at the bottom.
  const [stack, setStack] = useState<string | null>(null);
  const stackVenues = stack
    ? (stacks[stack] ?? []).flatMap((id) => venues.find((v) => v.id === id) ?? [])
    : [];
  // The opening view only: later data refreshes do not move the map under the user's finger. It
  // is the first set with a venue in it: a search that matched nothing kept the map blank for
  // good (audit VEN-8).
  const [opening, setOpening] = useState<Bounds | null>(() => venueBounds(venues));
  if (!opening && venues.length > 0) {
    const first = venueBounds(venues);
    if (first) setOpening(first);
  }
  const padding = mapPadding(headerHeight, tabBarHeight, PIN_EDGE);
  const keyboard = useKeyboardState((k) => (k.isVisible ? k.height : 0));
  // A venue that left the data (deactivated) closes its card.
  const card = selected ? (venues.find((v) => v.id === selected) ?? null) : null;

  // Nothing to show: the list's words, on the map too, in the middle of what the head, the tab bar
  // and the keyboard leave (audit M15-17: its second line went under the keyboard).
  if (!opening || venues.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{
          gap: SPACING[1],
          paddingTop: headerHeight,
          paddingBottom: Math.max(tabBarHeight, keyboard + SPACING[4]),
          paddingHorizontal: KIT.size.side,
        }}
      >
        <T strong>{empty.title}</T>
        {empty.hint ? <T v="fine">{empty.hint}</T> : null}
      </View>
    );
  }
  const id = selected ?? '';
  const level = EXPLORE[scheme].level;
  // KesfetHarita `.pin .pc`: the ring in how lively the venue is (`--lv-s`, `--lv-m`, `--lv-c`).
  const live: NonNullable<CircleLayer['paint']>['circle-color'] = [
    'match',
    ['get', 'bucket'],
    'lively',
    level.lively,
    'buzzing',
    level.buzzing,
    level.calm,
  ];
  // The ring's outer radius: 28 (56 across), the chosen one 34 (68).
  const outerRadius: NonNullable<CircleLayer['paint']>['circle-radius'] = [
    'case',
    ['==', ['get', 'id'], id],
    MAP_PIN.selectedRadius + MAP_PIN.selectedRing,
    MAP_PIN.radius + MAP_PIN.ring,
  ];
  const label: { layout: NonNullable<SymbolLayer['layout']>; paint: SymbolLayer['paint'] } = {
    layout: {
      'text-field': [
        'format',
        ['get', 'name'],
        {},
        // The name on at most two lines of its own, how lively under it (the owner's report, 2
        // Kasım, 4.1: "Sessiz" stuck to the third line's end).
        '\n',
        {},
        ['get', 'status'],
        { 'font-scale': MAP_PIN.statusScale },
      ],
      'text-font': [...MAP_FONTS.bold],
      // The map does not follow the text size: 17 when narrow (Aura v75 KesfetHaritaDar).
      'text-size': narrow ? MAP_PIN.labelSizeNarrow : MAP_PIN.labelSize,
      'text-max-width': LABEL_WIDTH_EM,
      'text-anchor': 'top',
      'text-offset': [0, MAP_PIN.labelOffset],
    },
    paint: {
      'text-color': colors.text,
      'text-halo-color': colors.surface,
      'text-halo-width': MAP_PIN.labelHalo,
    },
  };

  async function onFeature(feature: PressedFeature | undefined) {
    const props = feature?.properties;
    const coords = feature?.geometry?.coordinates;
    if (typeof props?.cluster_id === 'number' && Array.isArray(coords)) {
      const zoom = await source.current?.getClusterExpansionZoom(props.cluster_id);
      camera.current?.flyTo({
        center: [Number(coords[0]), Number(coords[1])],
        zoom: zoom ?? MAP_ZOOM.labels,
        duration: CAMERA_MS,
      });
      return;
    }
    const id = typeof props?.id === 'string' ? props.id : null;
    if (id && stacks[id]) {
      setSelected(null);
      setStack(id);
      return;
    }
    setStack(null);
    if (id) setSelected(id);
  }

  return (
    <View
      style={{ flex: 1 }}
      collapsable={false}
      testID={ready ? 'explore-map-ready' : 'explore-map'}
    >
      <Map
        ref={map}
        mapStyle={mapStyle}
        style={{ flex: 1 }}
        logo={false}
        // A TextureView, not MapLibre's default GLSurfaceView: a SurfaceView makes Android keep the
        // app's window translucent for good, and after the map a black strip stayed over the
        // navigation bar on every screen (0.6.0; the owner, 21 Oct). Its native side is in the APK.
        androidView="texture"
        // The map's own (i) gives way to the glass column's (5.1), which opens the same dialog.
        attribution={false}
        tintColor={colors.muted}
        accessibilityLabel={tr.explore.mapLabel}
        onPress={() => {
          setSelected(null);
          setStack(null);
        }}
        onDidFinishRenderingMapFully={() => setReady(true)}
      >
        <Camera ref={camera} initialViewState={{ bounds: opening, padding }} />
        <Images images={MAP_IMAGES} />
        <GeoJSONSource
          id="venues"
          ref={source}
          data={data as GeoJSON.FeatureCollection}
          cluster
          clusterMaxZoom={MAP_ZOOM.clusterMax}
          clusterProperties={{ venues: ['+', ['get', 'count']] }}
          onPress={(event) => {
            event.stopPropagation();
            void onFeature(event.nativeEvent.features[0] as PressedFeature | undefined);
          }}
        >
          <Layer
            id="venue-clusters"
            type="circle"
            filter={IS_CLUSTER}
            paint={{
              'circle-color': colors.accent,
              'circle-radius': [
                'step',
                ['coalesce', ['get', 'venues'], ['get', 'count']],
                MAP_PIN.clusterRadius[0],
                MAP_PIN.clusterSteps[0],
                MAP_PIN.clusterRadius[1],
                MAP_PIN.clusterSteps[1],
                MAP_PIN.clusterRadius[2],
              ],
              'circle-stroke-width': MAP_PIN.ring,
              'circle-stroke-color': colors.surface,
            }}
          />
          <Layer
            id="venue-cluster-count"
            type="symbol"
            filter={IS_CLUSTER}
            layout={{
              'text-field': ['to-string', ['coalesce', ['get', 'venues'], ['get', 'count']]],
              'text-font': [...MAP_FONTS.bold],
              'text-size': MAP_PIN.countSize,
              'text-allow-overlap': true,
            }}
            paint={{ 'text-color': colors.onAccent }}
          />
          <Layer
            id="venue-shadow"
            type="circle"
            filter={IS_VENUE}
            paint={{
              // KesfetHarita `.pd`: 0 10 22, the GL circle's blur standing in for the spread.
              'circle-color': PIN_SHADOW[scheme],
              'circle-blur': PIN_SHADOW_BLUR,
              'circle-radius': [
                'case',
                ['==', ['get', 'id'], id],
                MAP_PIN.selectedRadius + MAP_PIN.selectedRing + PIN_SHADOW_SPREAD,
                MAP_PIN.radius + MAP_PIN.ring + PIN_SHADOW_SPREAD,
              ],
              'circle-translate': [0, PIN_SHADOW_Y],
            }}
          />
          <Layer
            id="venue-halo"
            type="circle"
            // `.pin.c .pc`: only a crowded venue glows, 6 in its pink at 22 %.
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['!', ['has', 'stack']],
              ['==', ['get', 'bucket'], 'buzzing'],
            ]}
            paint={{
              'circle-color': level.buzzing,
              'circle-opacity': MAP_PIN.haloOpacity,
              'circle-radius': [
                'case',
                ['==', ['get', 'id'], id],
                MAP_PIN.selectedRadius + MAP_PIN.selectedRing + MAP_PIN.halo,
                MAP_PIN.radius + MAP_PIN.ring + MAP_PIN.halo,
              ],
            }}
          />
          <Layer
            id="venue-ring"
            type="circle"
            filter={IS_VENUE}
            paint={{ 'circle-color': live, 'circle-radius': outerRadius }}
          />
          <Layer
            id="venue-pins"
            type="circle"
            filter={IS_VENUE}
            paint={{
              // The disc under the venue's picture, inside its white ring.
              'circle-color': colors.surface,
              'circle-radius': [
                'case',
                ['==', ['get', 'id'], id],
                MAP_PIN.selectedRadius,
                MAP_PIN.radius,
              ],
            }}
          />
          <Layer
            id="venue-kinds"
            type="symbol"
            filter={IS_VENUE}
            layout={{
              // The venue's type picture over the disc (the list's thumbs, the owner's call, 28 Ekim).
              'icon-image': [
                'match',
                ['get', 'type'],
                'cay',
                'pin-cay',
                'yemek',
                'pin-yemek',
                'kampus',
                'pin-kampus',
                'pin-kafe',
              ],
              'icon-size': [
                'case',
                ['==', ['get', 'id'], id],
                MAP_PIN.selectedGlyphScale,
                MAP_PIN.glyphScale,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            }}
          />
          <Layer
            id="venue-events"
            type="circle"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['!', ['has', 'stack']],
              ['to-boolean', ['get', 'event']],
            ]}
            paint={{
              'circle-color': colors.event,
              'circle-radius': MAP_PIN.eventDot,
              'circle-stroke-width': MAP_PIN.outline,
              'circle-stroke-color': colors.surface,
              'circle-translate': [MAP_PIN.eventOffset, -MAP_PIN.eventOffset],
            }}
          />
          <Layer
            id="venue-labels"
            type="symbol"
            minzoom={MAP_ZOOM.labels}
            filter={IS_VENUE}
            layout={label.layout}
            paint={label.paint}
          />
          <Layer
            id="venue-label-selected"
            type="symbol"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['!', ['has', 'stack']],
              ['==', ['get', 'id'], selected ?? ''],
            ]}
            layout={{ ...label.layout, 'text-allow-overlap': true }}
            // tuval Harita: the chosen pin's name white on the ink, the others' ink on white.
            paint={{
              'text-color': KIT.white,
              'text-halo-color': KIT.light.ink,
              'text-halo-width': MAP_PIN.labelHalo,
            }}
          />
        </GeoJSONSource>
      </Map>
      {/* KesfetHarita: no fades; the legend, the sources and the round stand over the card while
          one is shown (its own height) and come down over the tab bar when none is (the owner's
          report, 20 Kasım: with no card they were left in the middle). */}
      <MapControls
        bottom={
          cardBottom(tabBarHeight) +
          (card || stackVenues.length > 1 ? cardHeight + EXPLORE.map.controlOver : 0)
        }
        onRecentre={() => camera.current?.fitBounds(opening, { padding, duration: CAMERA_MS })}
        onInfo={() => void map.current?.showAttribution()}
        onZoom={(by) => {
          void map.current?.getZoom().then((zoom) => {
            camera.current?.zoomTo(zoom + by, { duration: ZOOM_MS });
          });
        }}
      />
      {/* 5.1: the selected venue's card comes up on a spring, again for each venue. */}
      {card ? (
        <MapCard bottom={cardBottom(tabBarHeight)} onHeight={setCardHeight}>
          <PopIn key={card.id}>
            <VenueCard venue={card} />
          </PopIn>
        </MapCard>
      ) : null}
      {stackVenues.length > 1 ? (
        <MapCard bottom={cardBottom(tabBarHeight)} onHeight={setCardHeight}>
          <PopIn key={stack ?? ''}>
            <StackCard venues={stackVenues} />
          </PopIn>
        </MapCard>
      ) : null}
    </View>
  );
}

// How far the opening camera keeps a pin from the edges: the chosen pin's radius and ring and a 12 margin
// (24 cut the pins of two far venues in half at the screen's sides).
const PIN_EDGE = MAP_PIN.selectedRadius + MAP_PIN.selectedRing + SPACING[3];

// The map's camera moves (a cluster opened, the venues shown again).
const CAMERA_MS = 400;
// A step of the zoom buttons.
const ZOOM_MS = 200;

// Where the map's card stands: 26 over the tab bar's top (KesfetHarita `.vc`; the bar's room already
// holds the 16 over it).
function cardBottom(tabBarHeight: number) {
  return tabBarHeight - SPACING[4] + EXPLORE.map.cardBottom;
}

// KesfetHarita `.lg`, `.attr`, `.loc`: the legend of the pins' colours and the map's sources at the
// left, the round at the right, over the card's room. The round shows every venue again: it is the
// venues', never the phone's position (rule 6; the board's own position dot is not drawn). The
// sources open the map's attribution.
function MapControls({
  bottom,
  onRecentre,
  onInfo,
  onZoom,
}: {
  bottom: number;
  onRecentre: () => void;
  onInfo: () => void;
  // A step nearer (1) or farther (-1).
  onZoom: (by: number) => void;
}) {
  const { c, scheme } = useKit();
  const { colors } = useTheme();
  const m = EXPLORE.map;
  const e = EXPLORE[scheme];
  const g = m.legend;
  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', left: m.side, bottom }}>
        <Glass
          face={e.solid}
          radius={g.radius}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: g.gap,
            paddingHorizontal: g.padX,
            paddingVertical: g.padY,
          }}
        >
          {(['calm', 'lively', 'buzzing'] as const).map((b) => (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: g.itemGap }}>
              <View
                style={{
                  width: g.dot,
                  height: g.dot,
                  borderRadius: g.dot / 2,
                  backgroundColor: e.level[b],
                }}
              />
              <T v="mapLegend" color={c.muted}>
                {tr.explore.legend[b]}
              </T>
            </View>
          ))}
        </Glass>
      </View>
      {/* The map's sources as a round of their own over the recentre round (the owner's ask, 20
          Kasım; the written "© OpenStreetMap" line went): it opens the map's own sources notice. */}
      <View style={{ position: 'absolute', right: m.side, bottom, gap: m.controlGap }}>
        {/* Nearer and farther by a step (the owner's ask, 20 Kasım), for a thumb that cannot pinch. */}
        <Round
          side={m.control}
          label={tr.explore.zoomIn}
          testID="explore-map-zoom-in"
          onPress={() => onZoom(1)}
        >
          <CapIcon name="plus" color={c.ink} />
        </Round>
        <Round
          side={m.control}
          label={tr.explore.zoomOut}
          testID="explore-map-zoom-out"
          onPress={() => onZoom(-1)}
        >
          <CapIcon name="minus" color={c.ink} />
        </Round>
        <Round side={m.control} label={tr.explore.mapInfo} onPress={onInfo}>
          <CapIcon name="info" color={c.muted} />
        </Round>
        <Round side={m.control} label={tr.explore.recentre} onPress={onRecentre}>
          <CapIcon name="compass" color={colors.accent} />
        </Round>
      </View>
    </>
  );
}

function MapCard({
  bottom,
  onHeight,
  children,
}: {
  bottom: number;
  // The card's height as laid out: what stands over it keeps clear of it.
  onHeight: (height: number) => void;
  children: ReactNode;
}) {
  return (
    <View
      pointerEvents="box-none"
      onLayout={(e) => onHeight(e.nativeEvent.layout.height)}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        paddingHorizontal: EXPLORE.map.side,
      }}
    >
      {children}
    </View>
  );
}

// The map's card (KesfetHarita `.vc`): white on the board's glass edge and shadow, 22 round, 14
// inside, 96 at least (the map's GL surface cannot be blurred).
function MapFace({
  testID,
  row,
  children,
}: {
  testID: string;
  row?: boolean;
  children: ReactNode;
}) {
  const { scheme } = useKit();
  const m = EXPLORE.map;
  return (
    <Glass
      testID={testID}
      face={EXPLORE[scheme].solid}
      radius={m.cardRadius}
      style={{
        minHeight: m.cardMinHeight,
        padding: m.cardPad,
        gap: row ? m.cardGap : SPACING[3],
        flexDirection: row ? 'row' : 'column',
        alignItems: row ? 'center' : undefined,
      }}
    >
      {children}
    </Glass>
  );
}

function openVenue(id: string) {
  router.push({ pathname: '/explore/[venueId]', params: { venueId: id } });
}

// The selected venue, over the floating tab bar (KesfetHarita `.vc`): its 56 picture with a buddy
// at its corner, the name (wrapping, never cut) over the type, district and how lively, the event
// when there is one, and the round to the venue.
function VenueCard({ venue }: { venue: ExploreVenue }) {
  const type = venueType(venue);
  const { c } = useKit();
  const { colors } = useTheme();
  const m = EXPLORE.map;
  const now = useNow(60_000);
  const when = venue.event
    ? describeEventTime(venue.event.startsAt, venue.event.endsAt, now)
    : null;
  return (
    <Tap accessibilityLabel={venue.name} onPress={() => openVenue(venue.id)}>
      <VenueTicket testID="explore-map-card" picture={TICKET_PICTURE[type]}>
        <View style={{ flex: 1, minWidth: 0, gap: EXPLORE.row.lineGap }}>
          <T v="mapName">{venue.name}</T>
          <T v="kesfetSub" color={c.muted}>
            {tr.explore.mapSub(
              kindLabel(venue.kind),
              venue.district,
              tr.explore.buckets[venue.bucket],
            )}
          </T>
          {venue.event && when ? (
            <View style={{ flexDirection: 'row', marginTop: SPACING[1] }}>
              <Tag
                tone="amber"
                label={tr.explore.eventTag(tr.explore.eventTime(when), venue.event.title)}
              />
            </View>
          ) : null}
        </View>
        <Round
          label={tr.explore.goToVenue}
          testID="explore-map-go"
          onPress={() => openVenue(venue.id)}
        >
          <CapIcon name="forward" color={colors.accent} size={m.goIcon} />
        </Round>
      </VenueTicket>
    </Tap>
  );
}

// A stack's venues (one address, one disc on the map): each a row to its page.
function StackCard({ venues }: { venues: readonly ExploreVenue[] }) {
  const { c } = useKit();
  return (
    <MapFace testID="explore-map-stack">
      <T v="sec">{tr.explore.stackTitle(venues.length)}</T>
      <RowList plain inset={KIT.size.liGap + VENUE_THUMB.size}>
        {venues.map((venue) => {
          const type = venueType(venue);
          return (
            <Li key={venue.id} accessibilityLabel={venue.name} onPress={() => openVenue(venue.id)}>
              <VenueThumb kind={type} size={VENUE_THUMB.size} />
              <View style={{ flex: 1, gap: SPACING[0.5] }}>
                <T v="sec">{venue.name}</T>
                <T v="fineLg">{tr.explore.venueSub(kindLabel(venue.kind), venue.district)}</T>
              </View>
              <CapIcon name="forward" color={c.muted} />
            </Li>
          );
        })}
      </RowList>
    </MapFace>
  );
}
