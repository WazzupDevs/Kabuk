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
import { BUTTONS_GROUP, buttonNarrow, buttonScheme } from './buttons.ts';
import { element, narrowBreakpoint, pressed, readMeasured } from './measured.ts';
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
  '  cls: string | null;',
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
  'export type V46ButtonIcon = {',
  '  size: readonly [number, number];',
  '  pressedScale: number;',
  '  transitions: V46Transition[];',
  '} & (',
  "  | { bar: 'plus' | 'cross' | 'check'; fills: { a: string; b: string; x: string } }",
  '  | { drawing: V46Drawing }',
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
  for (const id of buttons) {
    const m = measured.components[id];
    if (!m) throw new Error(`no measurement of ${id}`);
    const scheme = (s: 'light' | 'dark') =>
      buttonScheme(element(m[s], metrics), pressed(m[s].pressed));
    lines.push(
      `${json(id)}: {`,
      `light: ${json(scheme('light'))},`,
      `dark: ${json(scheme('dark'))},`,
      `narrow: ${json(m.narrow ? buttonNarrow(element(m.narrow, metrics)) : null)},`,
      '},',
    );
  }
  lines.push('};', '');
  const target = resolve(root, PARTS_MODULE);
  const options = await resolveConfig(target);
  return format(lines.join('\n'), { ...options, filepath: target });
}
