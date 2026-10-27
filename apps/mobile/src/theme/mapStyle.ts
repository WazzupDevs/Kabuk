import type { ColorScheme } from './tokens';

// The map in skall's colours (the owner's call, 27 Ekim): OpenFreeMap's style, read once, with its
// ground, water, green, buildings, roads and labels repainted from skall's palette (skall.css: the
// canvas, the soft lavender, the ink). Layers are told apart by type and id, so a style update on
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

export const MAP_COLORS: Record<ColorScheme, MapColors> = {
  light: {
    ground: '#F5F3FC',
    land: '#EFECF9',
    green: '#DCEFE2',
    water: '#CFC5F7',
    building: '#E6E1F4',
    road: '#FFFFFF',
    roadCasing: '#DAD3F2',
    minor: '#FBFAFE',
    rail: '#D3CDE6',
    border: '#B9A6FF',
    label: '#3B3560',
    labelQuiet: '#6E6890',
    halo: '#F5F3FC',
  },
  dark: {
    ground: '#14112B',
    land: '#191536',
    green: '#17302A',
    water: '#2A2266',
    building: '#221D45',
    road: '#2E2858',
    roadCasing: '#1E1A3D',
    minor: '#252049',
    rail: '#3A3563',
    border: '#6A47F5',
    label: '#D9D4F2',
    labelQuiet: '#ADA8C8',
    halo: '#14112B',
  },
};

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

export function recolorStyle(style: MapStyleJson, c: MapColors): MapStyleJson {
  const layers = (style.layers ?? []).map((layer): StyleLayer => {
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
      case 'symbol':
        if ('text-color' in paint || layer.layout?.['text-field'] !== undefined) {
          paint['text-color'] = has(id, 'poi', 'housenumber', 'water', 'road')
            ? c.labelQuiet
            : c.label;
          paint['text-halo-color'] = c.halo;
        }
        break;
      default:
        break;
    }
    return { ...layer, paint };
  });
  return { ...style, layers };
}
