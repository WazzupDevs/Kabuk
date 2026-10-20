// `pnpm tokens` (scripts/build-tokens.ts) → apps/mobile/src/theme/tokens.generated.ts: v46's
// tokens for the app, light and dark, from the inventory (scripts/v46/inventory.ts), the font's
// metrics for a CSS `normal` line height (scripts/v46/fontMetrics.ts) and, for the one thing the
// inventory does not write down (a gradient), scripts/v46/supplement.ts. The output is committed;
// tokens.test.ts fails while it is not what this script writes, so a value changes only by
// changing its source. Shadows and gradients stay CSS strings (React Native `boxShadow`, and
// `backgroundImage` behind theme/gradient.ts).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { format, resolveConfig } from 'prettier';

import {
  type Border,
  type Inventory,
  parseBorder,
  parseColor,
  parseFont,
  parseLetterSpacing,
  parseLineHeight,
  parsePadding,
  parsePx,
  parseRadius,
  parseShadow,
  type RawComponent,
  type RawLook,
  readInventory,
  type Scheme,
} from './inventory.ts';
import { bundledMetrics, normalLineHeight, type VerticalMetrics } from './fontMetrics.ts';
import {
  type ButtonMatches,
  BUTTONS_GROUP,
  buttonMotions,
  buttonNarrow,
  buttonScheme,
} from './buttons.ts';
import {
  chipsScheme,
  cityScheme,
  exploreIcons,
  exploreMotions,
  hereScheme,
  listScheme,
  liveScheme,
  rowScheme,
  searchScheme,
  THUMBS,
  venueThumb,
} from './explore.ts';
import { element, narrowBreakpoint, pressed, readMeasured } from './measured.ts';
import {
  type BarReading,
  headScheme,
  subHeadScheme,
  TAB_BARS,
  TAB_KEYS,
  tabBarIcons,
  tabBarReduced,
  tabBarScheme,
  type TabKey,
  viewModeIcons,
  viewModeScheme,
} from './navigation.ts';
import { SCREEN_PARTS } from './screenParts.ts';
import { type ColorRef, PALETTE_REFS } from './palette.ts';
import { COMPONENT_GRADIENTS, GRADIENTS } from './supplement.ts';

export const TOKENS_MODULE = 'apps/mobile/src/theme/tokens.generated.ts';
// What the measurement adds, only as much of it as the src/ui components read (buttons.ts …).
export const PARTS_MODULE = 'apps/mobile/src/theme/parts.generated.ts';

const SCHEMES: readonly Scheme[] = ['light', 'dark'];

export type Look = {
  bg: string | null;
  gradient: string | null;
  color: string;
  border: Border | null;
  radius: number | readonly [number, number, number, number];
  height: number;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  padding: readonly [number, number, number, number];
  shadow: string | null;
  opacity: number;
};

export function look(id: string, raw: RawLook, scheme: Scheme, metrics: VerticalMetrics): Look {
  const height = parsePx(raw.height);
  const font = parseFont(raw.font);
  const gradientKey = COMPONENT_GRADIENTS[id];
  if ((raw.bg === 'gradient') !== (gradientKey !== undefined)) {
    throw new Error(`${id}: a gradient background needs its value in supplement.ts`);
  }
  const gradient = gradientKey ? (GRADIENTS[gradientKey]?.value[scheme] ?? null) : null;
  return {
    bg: raw.bg === 'gradient' ? null : parseColor(raw.bg),
    gradient,
    color: parseColor(raw.color),
    border: parseBorder(raw.border),
    radius: parseRadius(raw.radius, height),
    height,
    fontSize: font.size,
    fontWeight: font.weight,
    lineHeight: font.lineHeight ?? normalLineHeight(font.size, metrics),
    letterSpacing: parseLetterSpacing(raw.letter_spacing),
    padding: parsePadding(raw.padding),
    shadow: parseShadow(raw.shadow),
    opacity: Number(raw.opacity),
  };
}

function cssVar(inventory: Inventory, name: string, scheme: Scheme): string {
  const declared = inventory.tokens.declared.find((d) => d.name === name);
  if (!declared) throw new Error(`v46 declares no ${name}`);
  return parseColor(declared[scheme]);
}

function component(inventory: Inventory, id: string): RawComponent {
  const found = inventory.components.find((c) => c.id === id);
  if (!found) throw new Error(`no component ${id} in the inventory`);
  return found;
}

export function resolveColor(inventory: Inventory, ref: ColorRef, scheme: Scheme): string {
  if ('var' in ref) return cssVar(inventory, ref.var, scheme);
  const raw = component(inventory, ref.component)[scheme];
  const value =
    ref.prop === 'borderColor'
      ? parseBorder(raw.border)?.color
      : ref.prop === 'bg'
        ? raw.bg === 'gradient'
          ? null
          : parseColor(raw.bg)
        : parseColor(raw.color);
  if (!value) throw new Error(`${ref.component} has no ${ref.prop}`);
  return value;
}

function source(ref: ColorRef): string {
  return 'var' in ref ? `var(${ref.var})` : `${ref.component} → ${ref.prop}`;
}

// A type style's key: size, weight and line height (`t13w600l18`; `ln` for CSS `normal`), and the
// letter spacing when it has one (`sm0_3` for -0.3 px). A dot is `_`, a minus `m`.
export function typeKey(t: Inventory['type_styles'][number]): string {
  const lh = parseLineHeight(t.line_height);
  const ls = parseLetterSpacing(t.letter_spacing);
  const n = (v: number) => String(v).replace('-', 'm').replace('.', '_');
  return `t${n(parsePx(t.size))}w${t.weight}l${lh === null ? 'n' : n(lh)}${ls ? `s${n(ls)}` : ''}`;
}

const json = (value: unknown) => JSON.stringify(value);

const metricsLine = (m: VerticalMetrics) =>
  `hhea ${m.ascender} / ${m.descender} / ${m.lineGap} of ${m.unitsPerEm}`;

export async function buildTokensModule(root: string): Promise<string> {
  const inventory = readInventory(root);
  const metrics = bundledMetrics(root);
  const lines: string[] = [
    '// Generated by `pnpm tokens` (scripts/v46/tokens.ts) from docs/design/v46/skall-v46-envanter.json.',
    '// Do not edit by hand: change the inventory or scripts/v46/ and run `pnpm tokens`.',
    '',
    `export const V46_SOURCE = ${json({
      file: inventory.meta.source,
      sha256: inventory.meta.source_sha256,
      viewport: inventory.meta.viewport_measured,
      measured: inventory.meta.generated,
    })} as const;`,
    '',
    'export type V46Scheme = "light" | "dark";',
    '',
    '// The named colours (scripts/v46/palette.ts), each with where v46 shows it.',
    'export const V46_PALETTE = {',
  ];
  for (const scheme of SCHEMES) {
    lines.push(`${scheme}: {`);
    for (const [name, ref] of Object.entries(PALETTE_REFS)) {
      lines.push(`// ${source(ref)}`, `${name}: ${json(resolveColor(inventory, ref, scheme))},`);
    }
    lines.push('},');
  }
  lines.push('} as const;', '', 'export type V46ColorName = keyof (typeof V46_PALETTE)["light"];');

  lines.push(
    '',
    "// The type styles on v46's screens, most used first: size, weight, line height and letter",
    '// spacing, all in Plus Jakarta Sans. A CSS `normal` line height (`ln` in the key) is the',
    `// browser's number for it, from the font's metrics (${metricsLine(metrics)}).`,
    'export const V46_TYPE = {',
  );
  const seen = new Set<string>();
  for (const t of inventory.type_styles) {
    const key = typeKey(t);
    if (seen.has(key)) throw new Error(`two type styles share ${key}`);
    seen.add(key);
    lines.push(
      `// ${t.count} × ${t.examples.slice(0, 3).join(', ')}`,
      `${key}: ${json({
        size: parsePx(t.size),
        weight: Number(t.weight),
        lineHeight: parseLineHeight(t.line_height) ?? normalLineHeight(parsePx(t.size), metrics),
        letterSpacing: parseLetterSpacing(t.letter_spacing),
      })},`,
    );
  }
  lines.push('} as const;', '', 'export type V46TypeKey = keyof typeof V46_TYPE;');

  lines.push(
    '',
    '// Each component as v46 draws it (envanter `components`; the gallery shows each at',
    '// skall-masa-deneme-v46-galeri.html?page=galeri#<id>): its selector and screen, its measured',
    '// width, and its look in each scheme. Radius is one value or four corners (top-left first).',
    'export const V46_COMPONENTS = {',
  );
  for (const c of inventory.components) {
    const sourceLine = `${c.tag}.${c.class.split(/\s+/).filter(Boolean).join('.')} — ${c.selector_in_state} @ ${c.source_state}`;
    lines.push(
      ...(c.note ? [`// ${c.note}`] : []),
      `${json(c.id)}: {`,
      `name: ${json(c.name)},`,
      `group: ${json(c.group)},`,
      `source: ${json(sourceLine)},`,
      `width: ${c.size[0]},`,
      `variants: ${json(c.variants)},`,
      ...SCHEMES.map((s) => `${s}: ${json(look(c.id, c[s], s, metrics))},`),
      '},',
    );
  }
  lines.push('} as const;', '', 'export type V46ComponentId = keyof typeof V46_COMPONENTS;', '');

  const target = resolve(root, TOKENS_MODULE);
  const options = await resolveConfig(target);
  return format(lines.join('\n'), { ...options, filepath: target });
}

const PARTS_TYPES = [
  'export type V46Bezier = readonly [number, number, number, number];',
  'export type V46Transition = { prop: string; ms: number; delayMs: number; ease: V46Bezier };',
  'export type V46Font = { size: number; weight: number; lineHeight: number };',
  'export type V46Paint = string | { gradient: number } | null;',
  'export type V46Gradient = {',
  '  tag: string;',
  '  attrs: Record<string, string | number>;',
  '  stops: { offset: number; color: string; opacity: number }[];',
  '};',
  'export type V46SvgNode = {',
  '  tag: string;',
  '  attrs: Record<string, string | number>;',
  '  clip?: number;',
  '  fill?: V46Paint;',
  '  stroke?: V46Paint;',
  '  strokeWidth?: number;',
  '  lineCap?: string;',
  '  lineJoin?: string;',
  '  opacity?: number;',
  '  children?: V46SvgNode[];',
  '};',
  'export type V46Drawing = {',
  '  viewBox: readonly [number, number, number, number];',
  '  clips: V46SvgNode[][];',
  '  gradients: V46Gradient[];',
  '  nodes: V46SvgNode[];',
  '};',
  "// One bar of the send icon, in its drawing's units: turned about its own middle.",
  'export type V46SendBar = {',
  '  x: number;',
  '  y: number;',
  '  width: number;',
  '  height: number;',
  '  rx: number;',
  '  fill: string;',
  '  translateX: number;',
  '  translateY: number;',
  '  rotate: number;',
  '};',
  'export type V46ButtonIcon = {',
  '  size: readonly [number, number];',
  '  pressedScale: number;',
  '  transitions: V46Transition[];',
  '} & (',
  "  | { bar: 'plus' | 'cross' | 'check'; fills: { a: string; b: string; x: string } }",
  '  | { drawing: V46Drawing; clap: V46Drawing | null; origin: readonly [number, number] }',
  '  | {',
  '      send: {',
  '        viewBox: readonly [number, number, number, number];',
  '        waiting: V46SendBar[];',
  '        ready: V46SendBar[];',
  '      };',
  '    }',
  ');',
  'export type V46ButtonScheme = {',
  '  gap: number;',
  '  justify: string;',
  '  padding: readonly [number, number, number, number];',
  '  pressedScale: number;',
  '  transitions: V46Transition[];',
  '  label: {',
  '    font: V46Font;',
  '    color: string;',
  '    letterSpacing: number;',
  '    opacity: number;',
  '    translateY: number;',
  '    transitions: V46Transition[];',
  '  } | null;',
  '  icon: V46ButtonIcon | null;',
  '  loader: {',
  '    size: readonly [number, number];',
  '    fills: { a: string; b: string; overlap: string };',
  '    transitions: V46Transition[];',
  '  } | null;',
  '  loaderSize: readonly [number, number] | null;',
  '  badge: {',
  '    size: readonly [number, number];',
  '    bg: string;',
  '    color: string;',
  '    font: V46Font;',
  '    radius: number;',
  '    shadow: string | null;',
  '    padding: readonly [number, number, number, number];',
  '    top: number;',
  '    right: number;',
  '  } | null;',
  '};',
  'export type V46ButtonNarrow = {',
  '  width: number;',
  '  gap: number;',
  '  padding: readonly [number, number, number, number];',
  '  font: V46Font;',
  '  iconShown: boolean;',
  '};',
  'export type V46ButtonParts = {',
  '  light: V46ButtonScheme;',
  '  dark: V46ButtonScheme;',
  "  // At v46's narrow width (V46_NARROW_MAX_WIDTH and below), light; null if v46 does not show it there.",
  '  narrow: V46ButtonNarrow | null;',
  '};',
  "export type V46Channel = 'translateX' | 'translateY' | 'rotate' | 'scale' | 'opacity';",
  'export type V46ChannelSteps = { from: number; steps: { to: number; ms: number }[] };',
  "// A keyframe animation as v46 runs it: each channel's steps, eased one by one.",
  'export type V46KeyframeMotion = {',
  '  selector: string;',
  '  keyframes: string;',
  '  ms: number;',
  '  delayMs: number;',
  '  ease: V46Bezier;',
  '  channels: Partial<Record<V46Channel, V46ChannelSteps>>;',
  '  offWhenReduced: boolean;',
  '  // The buttons the rule reaches in v46.',
  '  looks: V46ButtonId[];',
  '};',
  'export type V46RuleTransition = {',
  '  selector: string;',
  '  transitions: V46Transition[];',
  '  reduced: V46Transition[];',
  '};',
  'export type V46ButtonMotions = {',
  '  nope: V46KeyframeMotion;',
  '  shoot: V46KeyframeMotion;',
  '  bellRing: V46KeyframeMotion;',
  '  bellClap: V46KeyframeMotion;',
  '  badgeBump: V46KeyframeMotion;',
  '  sendBars: V46RuleTransition;',
  '  barFill: V46RuleTransition;',
  '};',
  'export type V46Text = { font: V46Font; color: string; letterSpacing: number };',
  'export type V46Edge = { width: number; color: string };',
  'export type V46Surface = {',
  '  bg: string | null;',
  '  gradient: string | null;',
  '  border: V46Edge | null;',
  '  shadow: string | null;',
  '};',
  'export type V46FadingSurface = V46Surface & { opacity: number };',
  'export type V46Insets = { top: number; right: number; bottom: number; left: number };',
  "export type V46TabKey = 'explore' | 'activities' | 'venue' | 'messages' | 'profile';",
  "// The Mekan tab's mark in one state, in its drawing's units: the group, the first capsule, the",
  '// second one against it and their overlap (the second clipped to the first).',
  'export type V46VenueGlyphState = {',
  '  group: { at: readonly [number, number]; transitions: V46Transition[] };',
  '  a: { fill: string; transitions: V46Transition[] };',
  '  b: { at: readonly [number, number]; fill: string; transitions: V46Transition[] };',
  '  x: { at: readonly [number, number]; fill: string; opacity: number; transitions: V46Transition[] };',
  '};',
  'export type V46TabBarScheme = {',
  '  height: number;',
  '  inset: number;',
  '  bottom: number;',
  '  maxWidth: number;',
  '  padding: readonly [number, number, number, number];',
  '  radius: number;',
  '  gradient: string;',
  '  border: V46Edge;',
  '  shadow: { outer: string | null; inset: string | null };',
  '  backdrop: { blur: number };',
  '  tab: { gap: number; pressedScale: number };',
  '  label: { inactive: V46Text; active: V46Text };',
  '  pill: {',
  '    size: readonly [number, number];',
  '    radius: number;',
  '    inactive: V46Surface;',
  '    active: V46Surface;',
  '    transitions: V46Transition[];',
  '  };',
  '  icon: { size: readonly [number, number]; inactive: string; active: string };',
  '  venue: {',
  '    viewBox: readonly [number, number, number, number];',
  '    capsule: { width: number; height: number; rx: number };',
  '    inactive: V46VenueGlyphState;',
  '    active: V46VenueGlyphState;',
  '  };',
  '  dot: {',
  '    size: readonly [number, number];',
  '    top: number;',
  '    right: number;',
  '    bg: string;',
  '    shadow: string | null;',
  '  };',
  '};',
  'export type V46VenueTransitions = Record<"group" | "a" | "b" | "x", V46Transition[]>;',
  "export type V46Justify = 'flex-start' | 'center' | 'space-between' | 'flex-end';",
  "export type V46Align = 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline';",
  'export type V46HeadScheme = {',
  '  bg: string;',
  '  padding: readonly [number, number, number, number];',
  '  fade: { height: number; gradient: string };',
  '  title: V46Text;',
  '  row: { minHeight: number; justify: V46Justify; align: V46Align } | null;',
  '};',
  'export type V46SubHeadScheme = Omit<V46HeadScheme, "row"> & {',
  '  gap: number;',
  '  align: V46Align;',
  '  count: V46Text & { marginLeft: number };',
  '};',
  'export type V46ViewModeScheme = {',
  '  size: readonly [number, number];',
  '  padding: readonly [number, number, number, number];',
  '  gap: number;',
  '  radius: number;',
  '  bg: string;',
  '  button: {',
  '    size: readonly [number, number];',
  '    radius: number;',
  '    pressedScale: number;',
  '    hitSlop: V46Insets;',
  '    on: V46FadingSurface;',
  '    off: V46FadingSurface;',
  '    transitions: V46Transition[];',
  '  };',
  '  icon: { size: readonly [number, number] };',
  '};',
  'export type V46Sides = readonly [number, number, number, number];',
  'export type V46Card = { bg: string; border: V46Edge; radius: number; shadow: string };',
  'export type V46ChipLook = { bg: string; border: V46Edge; color: string };',
  'export type V46ExploreScheme = {',
  '  list: { card: V46Card; padding: V46Sides };',
  '  search: {',
  '    marginTop: number;',
  '    height: number;',
  '    padding: V46Sides;',
  '    gap: number;',
  '    radius: number;',
  '    bg: string;',
  '    idle: { border: V46Edge; shadow: string | null };',
  '    focus: { border: V46Edge; shadow: string | null };',
  '    transitions: V46Transition[];',
  '    icon: { size: readonly [number, number]; color: string };',
  '    field: { height: number; font: V46Font; letterSpacing: number; color: string; placeholderColor: string };',
  '  };',
  '  chips: {',
  '    margin: V46Sides;',
  '    padding: V46Sides;',
  '    gap: number;',
  '    chip: {',
  '      height: number;',
  '      padding: V46Sides;',
  '      gap: number;',
  '      radius: number;',
  '      hitSlop: V46Insets;',
  '      font: V46Font;',
  '      letterSpacing: number;',
  '      pressedScale: number;',
  '      on: V46ChipLook;',
  '      off: V46ChipLook;',
  '    };',
  '  };',
  '  city: {',
  '    margin: V46Sides;',
  '    gap: number;',
  '    rowGap: number;',
  '    button: {',
  '      minHeight: number;',
  '      padding: V46Sides;',
  '      gap: number;',
  '      radius: number;',
  '      bg: string;',
  '      border: V46Edge;',
  '      pressedScale: number;',
  '      label: V46Text;',
  '      pin: { size: readonly [number, number] };',
  '      chevron: { size: readonly [number, number]; color: string };',
  '    };',
  '    count: V46Text;',
  '  };',
  '  row: {',
  '    minHeight: number;',
  '    padding: V46Sides;',
  '    gap: number;',
  '    pressed: { bg: string; scale: number };',
  '    transitions: V46Transition[];',
  '    thumb: { size: readonly [number, number]; radius: number };',
  '    middle: { gap: number };',
  '    name: V46Text;',
  '    sub: V46Text;',
  '    live: { marginTop: number; gap: number; font: V46Font; color: string; quiet: string; dot: number };',
  '    chevron: { size: readonly [number, number]; color: string };',
  '  };',
  '  here: {',
  '    card: V46Card;',
  '    margin: V46Sides;',
  '    padding: V46Sides;',
  '    label: { gap: number; font: V46Font; color: string; dot: number };',
  '    row: { marginTop: number; gap: number };',
  '    middle: { gap: number };',
  '    name: V46Text;',
  '    sub: V46Text;',
  '    button: { marginTop: number };',
  '  };',
  '  live: { bg: string; halo: { bg: string; opacity: number } };',
  '};',
  "export type V46ThumbKind = 'kafe' | 'cay' | 'yemek' | 'kampus';",
  'export type V46SteamBar = { x: number; y: number; width: number; height: number; rx: number; fill: string; delayMs: number };',
  "// A keyframe animation as v46's rule plays it; `iterations` null: for ever; `holdsBefore`: its",
  '// first keyframe holds during the delay (`animation-fill-mode: backwards`).',
  'export type V46Animation = {',
  '  delayMs: number;',
  '  ease: V46Bezier;',
  '  channels: Partial<Record<V46Channel, V46ChannelSteps>>;',
  '  offWhenReduced: boolean;',
  '  iterations: number | null;',
  '  holdsBefore: boolean;',
  '};',
];

// The measurement (scripts/v46/measured.ts) as parts.generated.ts: per component only the values its
// src/ui component reads (buttons.ts for the buttons), in both schemes and at v46's narrow width.
export async function buildPartsModule(root: string): Promise<string> {
  const measured = readMeasured(root);
  const inventory = readInventory(root);
  if (measured.meta.source_sha256 !== inventory.meta.source_sha256) {
    throw new Error('the measurement and the inventory are of different v46 files');
  }
  const metrics = bundledMetrics(root);
  const html = readFileSync(resolve(root, 'docs/design/v46', inventory.meta.source), 'utf8');
  const buttons = inventory.components.filter((c) => c.group === BUTTONS_GROUP).map((c) => c.id);
  const lines: string[] = [
    '// Generated by `pnpm tokens` (scripts/v46/tokens.ts) from docs/design/v46/olcum/skall-v46-olcum.json',
    '// (scripts/v46/measure.ts). Do not edit by hand: measure again and run `pnpm tokens`.',
    '',
    ...PARTS_TYPES,
    '',
    "// v46's one small-screen breakpoint (`@media (max-width: …px)` in its CSS).",
    `export const V46_NARROW_MAX_WIDTH = ${narrowBreakpoint(html)};`,
    '',
    `export type V46ButtonId = ${buttons.map(json).join(' | ')};`,
    '',
    `// v46's buttons (gallery group ${BUTTONS_GROUP}): scripts/v46/buttons.ts.`,
    'export const V46_BUTTONS: Record<V46ButtonId, V46ButtonParts> = {',
  ];
  const matches: ButtonMatches = {};
  for (const id of buttons) {
    const m = measured.components[id];
    if (!m) throw new Error(`no measurement of ${id}`);
    if (!m.matches) throw new Error(`no real state of ${id} (states.json)`);
    matches[id] = m.matches;
    const scheme = (s: 'light' | 'dark') => {
      const ready = m[s].states.ready;
      return buttonScheme(element(m[s], metrics), pressed(m[s].pressed), {
        busyLoader: m[s].busyLoader,
        ready: ready ? element(ready, metrics) : null,
      });
    };
    lines.push(
      `${json(id)}: {`,
      `light: ${json(scheme('light'))},`,
      `dark: ${json(scheme('dark'))},`,
      `narrow: ${json(m.narrow ? buttonNarrow(element(m.narrow, metrics)) : null)},`,
      '},',
    );
  }
  lines.push(
    '};',
    '',
    "// v46's button motions that play in a state (scripts/v46/buttons.ts → buttonMotions), by the",
    "// inventory's rule for each.",
    `export const V46_BUTTON_MOTION: V46ButtonMotions = ${json(buttonMotions(inventory, matches))};`,
    '',
  );

  // The navigation (scripts/v46/navigation.ts).
  const reading = (id: string) => {
    const m = measured.components[id];
    if (!m) throw new Error(`no measurement of ${id}`);
    return m;
  };
  const bars = (s: 'light' | 'dark') =>
    Object.fromEntries(
      TAB_KEYS.map((k) => {
        const m = reading(TAB_BARS[k]);
        return [k, { el: element(m[s], metrics), matches: m.matches ?? null }];
      }),
    ) as Record<TabKey, BarReading>;
  const roomy = reading(TAB_BARS.explore).roomy;
  if (!roomy) throw new Error('no roomy reading of the tab bar');
  const head = (id: string, s: 'light' | 'dark') =>
    headScheme(element(reading(id)[s], metrics), id);
  // A drawing the same in both schemes, written once.
  const once = <T>(what: string, of: (s: 'light' | 'dark') => T): T => {
    const light = of('light');
    if (json(light) !== json(of('dark'))) throw new Error(`${what} differ between the schemes`);
    return light;
  };
  lines.push(
    `export type V46ScreenPartId = ${SCREEN_PARTS.map((p) => json(p.id)).join(' | ')};`,
    '',
    "// The parts of v46's screens the inventory does not list (scripts/v46/screenParts.ts): their",
    "// name, group and measured box, for the app's v46 gallery.",
    'export const V46_SCREEN_PARTS: Record<V46ScreenPartId, { name: string; group: string; width: number; height: number }> = {',
    ...SCREEN_PARTS.map((p) => {
      const box = reading(p.id).light.self.box;
      return `${json(p.id)}: ${json({ name: p.name, group: p.group, width: box[0], height: box[1] })},`;
    }),
    '};',
    '',
    "// v46's tab bar (`nav.nav`), each tab as it is selected and not (scripts/v46/navigation.ts).",
    "export const V46_TAB_BAR: { light: V46TabBarScheme; dark: V46TabBarScheme; icons: Record<Exclude<V46TabKey, 'venue'>, V46Drawing>; reduced: { pill: V46Transition[]; venue: V46VenueTransitions } } = {",
    ...(['light', 'dark'] as const).map(
      (s) => `${s}: ${json(tabBarScheme(inventory, bars(s), element(roomy, metrics)))},`,
    ),
    `icons: ${json(once('tab icons', (s) => tabBarIcons(bars(s))))},`,
    `reduced: ${json(tabBarReduced(element(reading(TAB_BARS.venue).reduced, metrics)))},`,
    '};',
    '',
    "// The tab screens' pinned heads and a sub page's (`.dhd`, `.apin`, `.mpin`, `.fpin`).",
    'export const V46_TOP_BARS: Record<"light" | "dark", { explore: V46HeadScheme; activities: V46HeadScheme; messages: V46HeadScheme; sub: V46SubHeadScheme }> = {',
    ...(['light', 'dark'] as const).map(
      (s) =>
        `${s}: ${json({
          explore: head('ust-kesfet', s),
          activities: head('ust-aktiviteler', s),
          messages: head('ust-mesajlar', s),
          sub: subHeadScheme(
            element(reading('ust-alt')[s], metrics),
            element(reading('ust-alt-sayili')[s], metrics),
            'ust-alt',
          ),
        })},`,
    ),
    '};',
    '',
    "// Keşfet's list/map switch (`.vmode`).",
    'export const V46_VIEW_MODE: Record<"light" | "dark", V46ViewModeScheme> & { icons: { list: V46Drawing; map: V46Drawing } } = {',
    ...(['light', 'dark'] as const).map(
      (s) =>
        `${s}: ${json(
          viewModeScheme(
            inventory,
            {
              el: element(reading('liste-harita')[s], metrics),
              matches: reading('liste-harita').matches ?? null,
            },
            element(reading('liste-harita-harita')[s], metrics),
          ),
        )},`,
    ),
    `icons: ${json(
      once('list/map icons', (s) => viewModeIcons(element(reading('liste-harita')[s], metrics))),
    )},`,
    '};',
    '',
  );

  // Keşfet's parts (scripts/v46/explore.ts).
  const el = (id: string, s: 'light' | 'dark') => element(reading(id)[s], metrics);
  const explore = (s: 'light' | 'dark') => {
    const chips = reading('suzgec-cipleri');
    return {
      list: listScheme(el('mekan-listesi', s)),
      search: searchScheme(el('arama', s), el('arama-odak', s)),
      chips: chipsScheme(
        inventory,
        el('suzgec-cipleri', s),
        chips.real ? element(chips.real, metrics).margin : [0, 0, 0, 0],
        chips.matches ?? [],
      ),
      city: cityScheme(inventory, el('sehir-secici', s), reading('sehir-secici').matches ?? []),
      row: rowScheme(
        el('mekan-satiri', s),
        el('mekan-satiri-sessiz', s),
        pressed(reading('mekan-satiri')[s].pressed),
      ),
      here: hereScheme(el('su-an-buradasin', s)),
      live: liveScheme(el('canli-nokta', s)),
    };
  };
  lines.push(
    '// Keşfet\'s parts: search, filter chips, city, the venue list and rows, "Şu an buradasın", the live dot.',
    'export const V46_EXPLORE: Record<"light" | "dark", V46ExploreScheme> = {',
    `light: ${json(explore('light'))},`,
    `dark: ${json(explore('dark'))},`,
    '};',
    '',
    "// The search's, city's and row's icons; the venues' icons (their steam bars apart).",
    'export const V46_EXPLORE_ICONS: { search: V46Drawing; pin: V46Drawing; down: V46Drawing; chevron: V46Drawing } = ' +
      `${json(once('Keşfet icons', (s) => exploreIcons(el('arama', s), el('sehir-secici', s), el('mekan-satiri', s))))};`,
    '',
    'export const V46_VENUE_THUMBS: Record<V46ThumbKind, { drawing: V46Drawing; steam: V46SteamBar[] }> = {',
    ...Object.entries(THUMBS).map(
      ([kind, id]) => `${kind}: ${json(once(id, (s) => venueThumb(el(id, s), id)))},`,
    ),
    '};',
    '',
    "// Keşfet's motions: rows coming in, steam, the live dot (scripts/v46/explore.ts).",
    'export const V46_EXPLORE_MOTION: { rowIn: V46Animation; rowStaggerMs: number; steam: V46Animation; livePulse: V46Animation; liveHalo: V46Animation; liveFade: V46Animation } = ' +
      `${json(exploreMotions(inventory, el('mekan-listesi', 'light')))};`,
    '',
  );
  const target = resolve(root, PARTS_MODULE);
  const options = await resolveConfig(target);
  return format(lines.join('\n'), { ...options, filepath: target });
}
