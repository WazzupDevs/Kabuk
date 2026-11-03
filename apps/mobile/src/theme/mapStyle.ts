import type { ColorScheme } from './tokens';

// The map in skall's colours (the owner's call, 27 Ekim): OpenFreeMap's style, read once, with its
// ground, water, green, buildings, roads and labels repainted (Aura v65, U14). Layers are told apart by type and id, so a style update on
// OpenFreeMap's side keeps working; anything unknown keeps its own colour. Until the style is read
// (or when it cannot be) the map draws OpenFreeMap's own style from its address.
type Paint = Record<string, unknown>;
type StyleLayer = { id: string; type: string; paint?: Paint; layout?: Paint };
export type MapStyleJson = { layers?: StyleLayer[]; [key: string]: unknown };

export type MapColors = {
  ground: string;
  land: string;
  green: string;
  water: string;
  building: string;
  road: string;
  roadCasing: string;
  minor: string;
  rail: string;
  border: string;
  label: string;
  labelQuiet: string;
  halo: string;
};

// U14 (KesfetHarita, KesfetHaritaKoyu): ground, road, road edge, block, park and street name are the
// canvas's; the street names one tone, 11, upright. The canvas draws no water, rail, border or
// minor street: those are derived from its colours (water and minor as the park and the road,
// rail and border as the road edge), the land as the ground, the halo as the ground.
export const MAP_COLORS: Record<ColorScheme, MapColors> = {
  light: {
    ground: '#EAF3EC',
    land: '#EAF3EC',
    green: '#CFE8D6',
    water: '#CFE8D6',
    building: '#DDEBE0',
    road: '#FFFFFF',
    roadCasing: '#D2E4D6',
    minor: '#FFFFFF',
    rail: '#D2E4D6',
    border: '#D2E4D6',
    label: '#5C7A64',
    labelQuiet: '#5C7A64',
    halo: '#EAF3EC',
  },
  dark: {
    ground: '#101513',
    land: '#101513',
    green: '#14231B',
    water: '#14231B',
    building: '#171D1A',
    road: '#202825',
    roadCasing: '#2A332F',
    minor: '#202825',
    rail: '#2A332F',
    border: '#2A332F',
    label: '#8F9A94',
    labelQuiet: '#8F9A94',
    halo: '#101513',
  },
};

// U14: street names at 11, never italic (the style's water names are; the glyph server has no
// 600, its regular is the nearest).
const LABEL_SIZE = 11;
const UPRIGHT = ['Noto Sans Regular'];

const has = (id: string, ...words: string[]) => words.some((w) => id.includes(w));

function lineColor(id: string, c: MapColors): string | null {
  if (has(id, 'water', 'river', 'canal', 'stream')) return c.water;
  if (has(id, 'rail', 'transit')) return c.rail;
  if (has(id, 'boundary', 'admin')) return c.border;
  if (
    has(id, 'road', 'highway', 'street', 'tunnel', 'bridge', 'transportation', 'path', 'aeroway')
  ) {
    if (has(id, 'casing', 'outline')) return c.roadCasing;
    if (has(id, 'minor', 'service', 'path', 'track', 'pedestrian', 'footway')) return c.minor;
    return c.road;
  }
  return null;
}

function fillColor(id: string, c: MapColors): string | null {
  if (has(id, 'water', 'ocean', 'sea', 'lake')) return c.water;
  if (has(id, 'park', 'wood', 'forest', 'grass', 'green', 'garden', 'scrub', 'wetland', 'pitch')) {
    return c.green;
  }
  if (has(id, 'building')) return c.building;
  if (has(id, 'landuse', 'landcover', 'residential', 'land', 'earth', 'sand', 'ice')) return c.land;
  if (has(id, 'aeroway', 'road', 'highway', 'bridge')) return c.minor;
  return null;
}

// The style's own places (shops, schools, parking, bus stops) are left out: their names and icons
// collided with the venue pins and their blue P and bus are no colour of skall's (the owner's
// report, 2 Kasım, 4.2). The venues are the map's only places.
const isPoi = (layer: StyleLayer): boolean =>
  layer.type === 'symbol' && has(layer.id.toLowerCase(), 'poi', 'transit', 'parking', 'airport');

export function recolorStyle(style: MapStyleJson, c: MapColors): MapStyleJson {
  const layers = (style.layers ?? [])
    .filter((layer) => !isPoi(layer))
    .map((layer): StyleLayer => {
      const id = layer.id.toLowerCase();
      const paint: Paint = { ...layer.paint };
      switch (layer.type) {
        case 'background':
          paint['background-color'] = c.ground;
          break;
        case 'fill': {
          const color = fillColor(id, c);
          if (color) {
            paint['fill-color'] = color;
            delete paint['fill-pattern'];
            if ('fill-outline-color' in paint) paint['fill-outline-color'] = color;
          }
          break;
        }
        case 'fill-extrusion':
          paint['fill-extrusion-color'] = c.building;
          break;
        case 'line': {
          const color = lineColor(id, c);
          if (color) paint['line-color'] = color;
          break;
        }
        case 'symbol': {
          if ('text-color' in paint || layer.layout?.['text-field'] !== undefined) {
            paint['text-color'] = has(id, 'poi', 'housenumber', 'water', 'road')
              ? c.labelQuiet
              : c.label;
            paint['text-halo-color'] = c.halo;
            const layout: Paint = { ...layer.layout };
            if (has(id, 'road', 'street', 'transportation')) layout['text-size'] = LABEL_SIZE;
            const font = layout['text-font'];
            if (Array.isArray(font) && font.some((f) => String(f).includes('Italic'))) {
              layout['text-font'] = UPRIGHT;
            }
            return { ...layer, paint, layout };
          }
          break;
        }
        default:
          break;
      }
      return { ...layer, paint };
    });
  return { ...style, layers };
}
