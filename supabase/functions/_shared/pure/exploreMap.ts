// Keşfet map (docs/arsiv/SPEC_V2.md §4): venues as GeoJSON points drawn by GL layers (clustered at low
// zoom), and the opening camera that fits every venue between the header and the tab bar.

import type { VenueKind } from './venueKind.ts';

export type MapVenue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  bucket: 'calm' | 'lively' | 'buzzing';
  hasEvent: boolean;
  // The glyph inside the pin (cafe or campus).
  kind: VenueKind;
};

export type VenuePoint = {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [lng: number, lat: number] };
  properties: {
    id: string;
    name: string;
    bucket: MapVenue['bucket'];
    event: boolean;
    kind: VenueKind;
    // How many venues the point stands for (clusters add these up); a stack is more than one.
    count: number;
    stack?: true;
  };
};

export type VenueCollection = { type: 'FeatureCollection'; features: VenuePoint[] };

// [west, south, east, north]
export type Bounds = [number, number, number, number];

export const MAP_ZOOM = {
  // Clusters form up to this zoom; above it every venue is its own pin.
  clusterMax: 14,
  // Names show from this zoom on (and for the selected venue at any zoom).
  labels: 15,
} as const;

// Venues closer than this (in degrees, about 400 m) are not zoomed in on further: a single venue,
// or a few next door, open at street level rather than at the map's maximum zoom.
export const MIN_BOUNDS_SPAN = 0.004;

// Venues this close (metres) share one point: two venues at one address (the owner's report, 30
// Ekim: one of them was hidden under the other's pin). The point is a stack: its count, and the
// venues in it (`stacks`), listed when it is tapped.
export const STACK_M = 15;

const BUCKETS: readonly MapVenue['bucket'][] = ['calm', 'lively', 'buzzing'];

function metresApart(a: Pick<MapVenue, 'lat' | 'lng'>, b: Pick<MapVenue, 'lat' | 'lng'>): number {
  const lat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const dy = (a.lat - b.lat) * 111_320;
  const dx = (a.lng - b.lng) * 111_320 * Math.cos(lat);
  return Math.hypot(dx, dy);
}

export const STACK_PREFIX = 'stack:';

export function venueCollection(venues: readonly MapVenue[]): VenueCollection & {
  // A stack's id to its venues' ids, in the list's order.
  stacks: Record<string, string[]>;
} {
  const groups: MapVenue[][] = [];
  for (const v of venues) {
    const near = groups.find((g) => g[0] !== undefined && metresApart(g[0], v) <= STACK_M);
    if (near) near.push(v);
    else groups.push([v]);
  }
  const stacks: Record<string, string[]> = {};
  const features = groups.map((g): VenuePoint => {
    const [v] = g as [MapVenue, ...MapVenue[]];
    if (g.length === 1) {
      return {
        type: 'Feature',
        id: v.id,
        geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
        properties: {
          id: v.id,
          name: v.name,
          bucket: v.bucket,
          event: v.hasEvent,
          kind: v.kind,
          count: 1,
        },
      };
    }
    const id = `${STACK_PREFIX}${v.id}`;
    stacks[id] = g.map((x) => x.id);
    const liveliest = g.reduce(
      (best, x) => (BUCKETS.indexOf(x.bucket) > BUCKETS.indexOf(best) ? x.bucket : best),
      v.bucket,
    );
    return {
      type: 'Feature',
      id,
      geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
      properties: {
        id,
        name: '',
        bucket: liveliest,
        event: g.some((x) => x.hasEvent),
        kind: v.kind,
        count: g.length,
        stack: true,
      },
    };
  });
  return { type: 'FeatureCollection', features, stacks };
}

// The box around every venue, widened to MIN_BOUNDS_SPAN on each axis; null without venues.
export function venueBounds(venues: readonly Pick<MapVenue, 'lat' | 'lng'>[]): Bounds | null {
  if (venues.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const v of venues) {
    west = Math.min(west, v.lng);
    east = Math.max(east, v.lng);
    south = Math.min(south, v.lat);
    north = Math.max(north, v.lat);
  }
  const widen = (lo: number, hi: number): [number, number] => {
    const missing = MIN_BOUNDS_SPAN - (hi - lo);
    return missing > 0 ? [lo - missing / 2, hi + missing / 2] : [lo, hi];
  };
  [west, east] = widen(west, east);
  [south, north] = widen(south, north);
  return [west, south, east, north];
}

// Camera padding: the header over the top of the map and the tab bar at its bottom, plus a margin
// so no pin sits on an edge.
export function mapPadding(headerHeight: number, tabBarHeight: number, margin: number) {
  return {
    top: headerHeight + margin,
    bottom: tabBarHeight + margin,
    left: margin,
    right: margin,
  };
}
