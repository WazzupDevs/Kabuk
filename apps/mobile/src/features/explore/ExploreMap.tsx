import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  type GeoJSONSourceRef,
  Images,
  Layer,
  type LayerProps,
  Map,
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
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TYPE_PIN_IMAGES } from '@/components/Glyph';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, MAP_FONTS, MAP_PIN, OPACITY, SPACING } from '@/theme/tokens';
import { venueType } from '@/lib/venueType';

import { useMapStyle } from './mapStyle';
import type { ExploreVenue } from './useExploreVenues';
import { BucketBadge, EventTag } from './VenueTags';

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

type PressedFeature = {
  geometry?: { type: string; coordinates?: unknown };
  properties?: { id?: unknown; cluster_id?: unknown } | null;
};

// Venues coloured by bucket, with an event mark, drawn by GL layers so they stay inside the map and
// under the header (native marker views were drawn over it). Clustered at low zoom; names show from
// MAP_ZOOM.labels on, or for the selected venue. A tap on a cluster zooms in; a tap on a venue
// selects it and opens a short card at the bottom (name, bucket, event, "Mekana git"); a tap on the
// empty map closes it. The user's own position is never shown (docs/SPEC_V2.md §4, rule 6). The
// list view stays the screen reader path.
export function ExploreMap({
  venues,
  headerHeight,
  tabBarHeight,
}: {
  venues: readonly ExploreVenue[];
  // What covers the map's top and bottom edges; the opening camera keeps the venues clear of them.
  headerHeight: number;
  tabBarHeight: number;
}) {
  const { colors, shape, scheme } = useTheme();
  const mapStyle = useMapStyle(MAP_STYLE_URL[scheme], scheme);
  const camera = useRef<CameraRef>(null);
  const source = useRef<GeoJSONSourceRef>(null);
  const [selected, setSelected] = useState<string | null>(null);
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
  const padding = mapPadding(headerHeight, tabBarHeight, SPACING[6]);
  // A venue that left the data (deactivated) closes its card.
  const card = selected ? (venues.find((v) => v.id === selected) ?? null) : null;

  // Nothing matches the search: the list's words, on the map too.
  if (!opening || venues.length === 0) {
    return (
      <View className="flex-1 items-center justify-center" style={{ gap: SPACING[1] }}>
        <Text variant="bodyStrong">{tr.explore.noMatch}</Text>
        <Text variant="fine">{tr.explore.noMatchHint}</Text>
      </View>
    );
  }
  // Pale pins on a pale map need a ring to stay findable (3:1 for UI shapes).
  const ring = shape.stroke.feature > 1 ? colors.border : colors.accent;
  const id = selected ?? '';
  const outer = MAP_PIN.ring + MAP_PIN.outline;
  // The venue's colour: quiet in the brand's purple, lively in the overlap's orange, crowded in pink.
  const live: NonNullable<CircleLayer['paint']>['circle-color'] = [
    'match',
    ['get', 'bucket'],
    'lively',
    colors.overlap,
    'buzzing',
    colors.buzz,
    colors.accent,
  ];
  const label: { layout: NonNullable<SymbolLayer['layout']>; paint: SymbolLayer['paint'] } = {
    layout: {
      'text-field': [
        'format',
        ['get', 'name'],
        {},
        '\n',
        {},
        ['get', 'status'],
        { 'font-scale': MAP_PIN.statusScale },
      ],
      'text-font': [...MAP_FONTS.bold],
      'text-size': MAP_PIN.labelSize,
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
        duration: 400,
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
        mapStyle={mapStyle}
        style={{ flex: 1 }}
        logo={false}
        // A TextureView, not MapLibre's default GLSurfaceView: a SurfaceView makes Android keep the
        // app's window translucent for good, and after the map a black strip stayed over the
        // navigation bar on every screen (0.6.0; the owner, 21 Oct). Its native side is in the APK.
        androidView="texture"
        attribution
        // Over the tab bar, not pressed against its edge (the owner's report, 28 Ekim).
        attributionPosition={{ bottom: tabBarHeight + SPACING[2], right: SPACING[4] }}
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
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['!', ['has', 'stack']],
              ['==', ['get', 'id'], id],
            ]}
            paint={{
              'circle-color': colors.border,
              'circle-radius': MAP_PIN.selectedRadius + outer,
              'circle-translate': [MAP_PIN.shadow, MAP_PIN.shadow],
            }}
          />
          <Layer
            id="venue-halo"
            type="circle"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['!', ['has', 'stack']],
              ['!=', ['get', 'bucket'], 'calm'],
            ]}
            paint={{
              'circle-color': live,
              'circle-opacity': MAP_PIN.haloOpacity,
              'circle-radius': [
                'case',
                ['==', ['get', 'id'], id],
                MAP_PIN.selectedRadius + outer + MAP_PIN.halo,
                MAP_PIN.radius + outer + MAP_PIN.halo,
              ],
            }}
          />
          <Layer
            id="venue-ring"
            type="circle"
            filter={IS_VENUE}
            paint={{
              'circle-color': ring,
              'circle-radius': [
                'case',
                ['==', ['get', 'id'], id],
                MAP_PIN.selectedRadius + outer,
                MAP_PIN.radius + outer,
              ],
            }}
          />
          <Layer
            id="venue-pins"
            type="circle"
            filter={IS_VENUE}
            paint={{
              // A white disc for the coloured glyph, ringed in the venue's colour.
              'circle-color': colors.surface,
              'circle-radius': [
                'case',
                ['==', ['get', 'id'], id],
                MAP_PIN.selectedRadius,
                MAP_PIN.radius,
              ],
              'circle-stroke-width': MAP_PIN.ring,
              'circle-stroke-color': live,
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
            paint={label.paint}
          />
        </GeoJSONSource>
      </Map>
      {card ? <VenueCard venue={card} bottom={tabBarHeight} /> : null}
      {stackVenues.length > 1 ? <StackCard venues={stackVenues} bottom={tabBarHeight} /> : null}
    </View>
  );
}

// The selected venue, above the floating tab bar. Existing components for now; the design
// session replaces the look.
function VenueCard({ venue, bottom }: { venue: ExploreVenue; bottom: number }) {
  return (
    <View className="absolute inset-x-0" style={{ bottom, paddingHorizontal: SPACING[4] }}>
      <Card testID="explore-map-card">
        <Text variant="title">{venue.name}</Text>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          <BucketBadge bucket={venue.bucket} />
          {venue.event ? <EventTag event={venue.event} /> : null}
        </View>
        <View className="mt-3">
          <Button
            label={tr.explore.goToVenue}
            icon="arrow-forward"
            testID="explore-map-go"
            onPress={() =>
              router.push({ pathname: '/explore/[venueId]', params: { venueId: venue.id } })
            }
          />
        </View>
      </Card>
    </View>
  );
}

// A stack's venues (one address, one disc on the map): each a row to its page.
function StackCard({ venues, bottom }: { venues: readonly ExploreVenue[]; bottom: number }) {
  const { colors } = useTheme();
  return (
    <View className="absolute inset-x-0" style={{ bottom, paddingHorizontal: SPACING[4] }}>
      <Card testID="explore-map-stack">
        <Text variant="title">{tr.explore.stackTitle(venues.length)}</Text>
        <View className="mt-2">
          {venues.map((venue) => (
            <Pressable
              key={venue.id}
              accessibilityRole="button"
              accessibilityLabel={venue.name}
              onPress={() =>
                router.push({ pathname: '/explore/[venueId]', params: { venueId: venue.id } })
              }
            >
              {({ pressed }) => (
                <View
                  className="flex-row items-center"
                  style={{
                    gap: SPACING[3],
                    minHeight: SPACING[12],
                    opacity: pressed ? OPACITY.pressed : 1,
                  }}
                >
                  <View className="flex-1" style={{ gap: SPACING[1] }}>
                    <Text variant="label">{venue.name}</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      <BucketBadge bucket={venue.bucket} />
                      {venue.event ? <EventTag event={venue.event} /> : null}
                    </View>
                  </View>
                  <AppIcon name="chevron-forward" size={ICON.md} color={colors.muted} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </Card>
    </View>
  );
}
