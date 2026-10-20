// The v46 inventory (docs/design/v46/skall-v46-envanter.json; docs/SPEC_V4.md §4.C): the design
// session's measured values of v46, the primary source of the app's tokens. Every value in it is a
// computed one (live getComputedStyle at 360x740, light and dark), so the parsers below only turn CSS
// into React Native values; they never guess one.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const INVENTORY_FILE = 'docs/design/v46/skall-v46-envanter.json';

export type Scheme = 'light' | 'dark';

export type RawLook = {
  bg: string;
  color: string;
  border: string;
  radius: string;
  height: string;
  font: string;
  padding: string;
  shadow: string;
  opacity: string;
  letter_spacing: string;
};

export type RawComponent = {
  id: string;
  group: string;
  name: string;
  tag: string;
  class: string;
  selector_in_state: string;
  source_state: string;
  size: [number, number];
  variants: string[];
  light: RawLook;
  dark: RawLook;
  note: string;
};

export type RawTypeStyle = {
  family: string;
  size: string;
  weight: string;
  line_height: string;
  letter_spacing: string;
  count: number;
  examples: string[];
  groups: string[];
};

export type Inventory = {
  meta: { source: string; source_sha256: string; viewport_measured: string; generated: string };
  tokens: { declared: { name: string; light: string; dark: string }[]; font_family: string };
  type_styles: RawTypeStyle[];
  components: RawComponent[];
};

export function readInventory(root: string): Inventory {
  return JSON.parse(readFileSync(resolve(root, INVENTORY_FILE), 'utf8')) as Inventory;
}

const HEX = /^#([0-9A-Fa-f]{6})$/;

function hexToRgb(hex: string): [number, number, number] {
  const m = HEX.exec(hex);
  if (!m?.[1]) throw new Error(`not a colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// The inventory writes colours as `#RRGGBB`, `#RRGGBB/alpha` (an rgba() it shortened) or `rgba()`.
// Out: `#RRGGBB` (upper case), `rgba(r, g, b, a)`, or `transparent` for alpha 0.
export function parseColor(value: string): string {
  const v = value.trim();
  if (HEX.test(v)) return v.toUpperCase();
  const withAlpha = /^(#[0-9A-Fa-f]{6})\/([0-9.]+)$/.exec(v);
  if (withAlpha?.[1] && withAlpha[2] !== undefined) {
    const alpha = Number(withAlpha[2]);
    if (alpha === 0) return 'transparent';
    if (alpha === 1) return withAlpha[1].toUpperCase();
    return `rgba(${hexToRgb(withAlpha[1]).join(', ')}, ${alpha})`;
  }
  const rgba = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\s*\)$/.exec(v);
  if (rgba) {
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map(Number) as [number, number, number];
    const alpha = rgba[4] === undefined ? 1 : Number(rgba[4]);
    if (alpha === 0) return 'transparent';
    if (alpha === 1) {
      return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  throw new Error(`not a colour: ${value}`);
}

export function parsePx(value: string): number {
  const m = /^(-?[0-9.]+)px$/.exec(value.trim());
  if (!m?.[1]) throw new Error(`not a px length: ${value}`);
  return Number(m[1]);
}

// `normal` stays unset: React Native's default line height is the font's own, as CSS `normal` is.
export function parseLineHeight(value: string): number | null {
  return value === 'normal' ? null : parsePx(value);
}

export function parseLetterSpacing(value: string): number {
  return value === 'normal' ? 0 : parsePx(value);
}

// `999px`, `50%` (a circle: half the height) or four corners `28px 28px 0px 0px`.
export function parseRadius(
  value: string,
  height: number,
): number | readonly [number, number, number, number] {
  const v = value.trim();
  if (v === '50%') return height / 2;
  const parts = v.split(/\s+/);
  if (parts.length === 1) return parsePx(v);
  if (parts.length === 4) return parts.map(parsePx) as [number, number, number, number];
  throw new Error(`radius: ${value}`);
}

export type Border = { width: number; color: string };

export function parseBorder(value: string): Border | null {
  if (value === 'none') return null;
  const m = /^([0-9.]+)px\s+(.+)$/.exec(value.trim());
  if (!m?.[1] || !m[2]) throw new Error(`border: ${value}`);
  return { width: Number(m[1]), color: parseColor(m[2]) };
}

export type Font = { size: number; weight: number; lineHeight: number | null };

// `16px/700/normal`: size, weight and line height.
export function parseFont(value: string): Font {
  const [size, weight, lineHeight] = value.split('/');
  if (!size || !weight || !lineHeight) throw new Error(`font: ${value}`);
  return { size: parsePx(size), weight: Number(weight), lineHeight: parseLineHeight(lineHeight) };
}

// Top, right, bottom, left.
export function parsePadding(value: string): readonly [number, number, number, number] {
  const parts = value.trim().split(/\s+/).map(parsePx);
  if (parts.length !== 4) throw new Error(`padding: ${value}`);
  return parts as [number, number, number, number];
}

// Splits a list at its top-level commas (not the ones inside rgba()).
function splitTop(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      out.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(value.slice(start).trim());
  return out;
}

// A computed box-shadow (`rgba(…) 0px 10px 26px 0px inset, …`) as the CSS string React Native's
// `boxShadow` takes: each layer `[inset] x y blur spread colour`.
export function parseShadow(value: string): string | null {
  if (value === 'none') return null;
  return splitTop(value)
    .map((layer) => {
      const color = /rgba?\([^)]*\)|#[0-9A-Fa-f]{3,8}/.exec(layer)?.[0];
      if (!color) throw new Error(`shadow without a colour: ${layer}`);
      const rest = layer.replace(color, '').trim().split(/\s+/);
      const inset = rest.includes('inset');
      const lengths = rest.filter((p) => p !== 'inset');
      if (lengths.length !== 4) throw new Error(`shadow: ${layer}`);
      return [inset ? 'inset' : null, ...lengths, parseColor(color)].filter(Boolean).join(' ');
    })
    .join(', ');
}
