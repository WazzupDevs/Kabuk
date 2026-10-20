// The measurement next to the inventory (docs/design/v46/olcum/skall-v46-olcum.json, written by
// scripts/v46/measure.ts): what v46 draws inside and around each component that the inventory does
// not write down. Read here into React Native values; like inventory.ts, the parsers only
// translate CSS, they never guess a value. What reaches the app is projected from these
// (scripts/v46/buttons.ts …) into parts.generated.ts: only what the components read.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalLineHeight, type VerticalMetrics } from './fontMetrics.ts';
import { parseColor, parseLineHeight, parsePx, parseShadow } from './inventory.ts';

export const MEASURED_FILE = 'docs/design/v46/olcum/skall-v46-olcum.json';

type RawTransition = { prop: string; ms: number; delayMs: number; ease: string };

type RawPaint = string | { gradient: number };

type RawGradient = {
  tag: string;
  attrs: Record<string, string>;
  stops: { offset: string; color: string; opacity: number }[];
};

type RawSvgNode = {
  tag: string;
  cls: string | null;
  attrs: Record<string, string>;
  clip?: number;
  fill?: RawPaint;
  stroke?: RawPaint;
  strokeWidth?: number;
  lineCap?: string;
  lineJoin?: string;
  opacity?: number;
  children?: RawSvgNode[];
  transitions?: RawTransition[];
};

type RawEdge = { width: number; color: string };

type RawPart = {
  part: string;
  depth: number;
  box: [number, number];
  display: string;
  opacity: number;
  transform?: string;
  transformOrigin?: string;
  transitions: RawTransition[];
  position?: string;
  inset?: (number | string)[];
  bg?: string;
  bgImage?: string;
  border?: RawEdge;
  radius?: string;
  shadow?: string;
  padding?: string;
  // A flex box: direction, justify-content, align-items, gap.
  flex?: [string, string, string, number | string];
  color?: string;
  text?: string;
  font?: string;
  letterSpacing?: string;
  viewBox?: string;
  clips?: RawSvgNode[][];
  gradients?: RawGradient[];
  nodes?: RawSvgNode[];
};

type RawElement = {
  self: {
    box: [number, number];
    at?: [number, number];
    bg?: string;
    bgImage?: string;
    border?: RawEdge;
    radius?: string;
    shadow?: string;
    backdrop?: string;
    after?: { height: number; top: number; bg: string; bgImage?: string };
    display: string;
    textAlign: string;
    padding: string;
    font: string;
    minHeight: string;
    gap: number | string;
    justifyContent: string;
    alignItems: string;
    transitions: RawTransition[];
    text?: string;
    color?: string;
    letterSpacing?: string;
  };
  parts: RawPart[];
};

type RawPressed = {
  transform: string;
  opacity: number;
  background: string;
  boxShadow: string;
  color: string;
  // The parts, in the order of RawElement.parts.
  parts: { transform: string; opacity: number }[];
};

// One of the inventory's motion rules that reaches an element in its real screen (measure.ts →
// readMatches): on the element itself (`self`) or a part, with the state class it needs, if any.
export type MotionMatch = {
  kind: 'transition' | 'animation' | 'press';
  selector: string;
  target: string;
  state: string | null;
};

type RawSchemeReading = RawElement & {
  pressed: RawPressed;
  // A button's loader while busy (`.ld.mini` put in it): its width and height.
  busyLoader: [number, number] | null;
  // The element with one of v46's state classes on (`ready` for the send button).
  states: Record<string, RawElement>;
};

export type Measured = {
  meta: { source_sha256: string };
  components: Record<
    string,
    {
      name: string;
      group: string;
      light: RawSchemeReading;
      dark: RawSchemeReading;
      narrow: RawElement | null;
      reduced: RawElement;
      // In the real screen (light, motion on): the element's transitions there and the motion rules
      // that reach it. Buttons only.
      real?: RawElement | null;
      matches?: MotionMatch[] | null;
    }
  >;
};

export function readMeasured(root: string): Measured {
  return JSON.parse(readFileSync(resolve(root, MEASURED_FILE), 'utf8')) as Measured;
}

// v46's one small-screen breakpoint: every `max-width` media query in its CSS names the same width.
export function narrowBreakpoint(html: string): number {
  const widths = new Set([...html.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((m) => m[1]));
  if (widths.size !== 1) throw new Error(`v46 has ${widths.size} max-width breakpoints`);
  return Number([...widths][0]);
}

export type Bezier = readonly [number, number, number, number];

// CSS timing keywords as their cubic-bezier (CSS Easing 1 §2.2).
const KEYWORDS: Record<string, Bezier> = {
  ease: [0.25, 0.1, 0.25, 1],
  linear: [0, 0, 1, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

export function parseEase(value: string): Bezier {
  const keyword = KEYWORDS[value.trim()];
  if (keyword) return keyword;
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(value.trim());
  const parts = m?.[1]?.split(',').map((v) => Number(v.trim()));
  if (!parts || parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`easing: ${value}`);
  }
  return parts as unknown as Bezier;
}

export type Transition = { prop: string; ms: number; delayMs: number; ease: Bezier };

const transitions = (list: RawTransition[]): Transition[] =>
  list.map((t) => ({ prop: t.prop, ms: t.ms, delayMs: t.delayMs, ease: parseEase(t.ease) }));

export type Transform = {
  scale: number;
  rotate: number;
  translateX: number;
  translateY: number;
} | null;

const round = (v: number) => Math.round(v * 1000) / 1000;

// A computed transform: `none` or a 2D `matrix(a, b, c, d, e, f)` that only scales evenly, turns
// and moves (rotate in degrees; skew is not drawn by React Native the same way, so it stops here).
export function parseTransform(value: string | undefined): Transform {
  if (!value || value === 'none') return null;
  const m = /^matrix\(([^)]+)\)$/.exec(value.trim());
  const n = m?.[1]?.split(',').map((v) => Number(v.trim()));
  if (!n || n.length !== 6) throw new Error(`transform: ${value}`);
  const [a, b, c, d, e, f] = n as [number, number, number, number, number, number];
  if (Math.abs(a - d) > 1e-6 || Math.abs(b + c) > 1e-6) {
    throw new Error(`transform with skew or uneven scale: ${value}`);
  }
  return {
    scale: round(Math.hypot(a, b)),
    rotate: round((Math.atan2(b, a) * 180) / Math.PI),
    translateX: e,
    translateY: f,
  };
}

export type Paint = string | { gradient: number } | null;

// `none` (no paint) is null; a gradient is its index among the svg's gradients.
const NUMERIC = /^-?\d+(\.\d+)?$/;

const paint = (v: RawPaint | undefined): Paint =>
  v === undefined || v === 'none' ? null : typeof v === 'string' ? parseColor(v) : v;

export type Gradient = {
  tag: string;
  attrs: Record<string, string | number>;
  stops: { offset: number; color: string; opacity: number }[];
};

function gradient(g: RawGradient): Gradient {
  const attrs: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(g.attrs)) attrs[k] = NUMERIC.test(v) ? Number(v) : v;
  return {
    tag: g.tag,
    attrs,
    stops: g.stops.map((st) => ({
      offset: st.offset.endsWith('%') ? Number(st.offset.slice(0, -1)) / 100 : Number(st.offset),
      color: parseColor(st.color),
      opacity: st.opacity,
    })),
  };
}

// Padding as written by getComputedStyle: one to four lengths.
export function parseBoxSides(value: string): readonly [number, number, number, number] {
  const p = value.trim().split(/\s+/).map(parsePx);
  const [t, r = t, b = t, l = r] = p as [number, number?, number?, number?];
  if (p.length > 4 || t === undefined) throw new Error(`sides: ${value}`);
  return [t, r, b, l];
}

export type Font = { size: number; weight: number; lineHeight: number };

export function parseMeasuredFont(value: string, metrics: VerticalMetrics): Font {
  const [size, weight, lineHeight] = value.split('/');
  if (!size || !weight || !lineHeight) throw new Error(`font: ${value}`);
  const s = parsePx(size);
  return {
    size: s,
    weight: Number(weight),
    lineHeight: parseLineHeight(lineHeight) ?? normalLineHeight(s, metrics),
  };
}

export type SvgNode = {
  tag: string;
  cls: string | null;
  attrs: Record<string, string | number>;
  clip?: number;
  fill?: Paint;
  stroke?: Paint;
  strokeWidth?: number;
  lineCap?: string;
  lineJoin?: string;
  opacity?: number;
  children?: SvgNode[];
  transitions?: Transition[];
};

function svgNode(n: RawSvgNode): SvgNode {
  const attrs: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(n.attrs)) attrs[k] = NUMERIC.test(v) ? Number(v) : v;
  return {
    tag: n.tag,
    cls: n.cls,
    attrs,
    ...(n.clip === undefined ? {} : { clip: n.clip }),
    ...(n.fill === undefined
      ? {}
      : {
          fill: paint(n.fill),
          stroke: paint(n.stroke),
          strokeWidth: n.strokeWidth,
          lineCap: n.lineCap,
          lineJoin: n.lineJoin,
          opacity: n.opacity,
        }),
    ...(n.children ? { children: n.children.map(svgNode) } : {}),
    ...(n.transitions?.length ? { transitions: transitions(n.transitions) } : {}),
  };
}

export type Part = {
  part: string;
  depth: number;
  box: readonly [number, number];
  display: string;
  opacity: number;
  transform: Transform;
  // Where a turn or scale of the part is centred, in px from its top left (computed).
  origin?: readonly [number, number];
  transitions: Transition[];
  absolute?: { top: number; right: number; bottom: number; left: number };
  bg?: string;
  // A CSS gradient, as React Native's background image takes it (theme/gradient.ts).
  gradient?: string;
  border?: { width: number; color: string };
  radius?: string;
  shadow?: string | null;
  padding?: readonly [number, number, number, number];
  flex?: { direction: string; justify: string; align: string; gap: number };
  text?: { sample: string; font: Font; color: string; letterSpacing: number };
  svg?: {
    viewBox: readonly [number, number, number, number];
    color: string;
    clips: SvgNode[][];
    gradients: Gradient[];
    nodes: SvgNode[];
  };
};

function part(p: RawPart, metrics: VerticalMetrics): Part {
  const base: Part = {
    part: p.part,
    depth: p.depth,
    box: p.box,
    display: p.display,
    opacity: p.opacity,
    transform: parseTransform(p.transform),
    transitions: transitions(p.transitions),
  };
  if (p.transformOrigin) {
    // px, or a percentage of the part's box.
    const [ox, oy] = p.transformOrigin
      .split(/\s+/)
      .map((v, i) => (v.endsWith('%') ? (parseFloat(v) / 100) * (p.box[i] ?? 0) : parsePx(v)));
    if (ox === undefined || oy === undefined) throw new Error(`origin: ${p.transformOrigin}`);
    base.origin = [ox, oy];
  }
  if (p.viewBox !== undefined && p.nodes && p.clips && p.color) {
    const vb = p.viewBox.split(/\s+/).map(Number);
    if (vb.length !== 4) throw new Error(`viewBox: ${p.viewBox}`);
    base.svg = {
      viewBox: vb as unknown as readonly [number, number, number, number],
      color: parseColor(p.color),
      clips: p.clips.map((c) => c.map(svgNode)),
      gradients: (p.gradients ?? []).map(gradient),
      nodes: p.nodes.map(svgNode),
    };
    return base;
  }
  if (p.position === 'absolute' && p.inset) {
    const [top = NaN, right = NaN, bottom = NaN, left = NaN] = p.inset.map((v) =>
      typeof v === 'number' ? v : NaN,
    );
    base.absolute = { top, right, bottom, left };
  }
  if (p.bg !== undefined) base.bg = parseColor(p.bg);
  if (p.bgImage) base.gradient = p.bgImage;
  if (p.border) base.border = { width: p.border.width, color: parseColor(p.border.color) };
  if (p.flex) {
    const [direction, justify, align, gap] = p.flex;
    base.flex = {
      direction,
      justify: JUSTIFY[justify] ?? justify,
      align: ALIGN[align] ?? align,
      gap: typeof gap === 'number' ? gap : 0,
    };
  }
  if (p.radius !== undefined) base.radius = p.radius;
  if (p.shadow !== undefined) base.shadow = parseShadow(p.shadow);
  if (p.padding !== undefined) base.padding = parseBoxSides(p.padding);
  if (p.text && p.font && p.color) {
    base.text = {
      sample: p.text,
      font: parseMeasuredFont(p.font, metrics),
      color: parseColor(p.color),
      letterSpacing:
        p.letterSpacing === 'normal' || !p.letterSpacing ? 0 : parsePx(p.letterSpacing),
    };
  }
  return base;
}

const ALIGN: Record<string, string> = {
  normal: 'stretch',
  stretch: 'stretch',
  center: 'center',
  'flex-start': 'flex-start',
  start: 'flex-start',
  'flex-end': 'flex-end',
  end: 'flex-end',
  baseline: 'baseline',
};

const JUSTIFY: Record<string, string> = {
  normal: 'flex-start',
  'flex-start': 'flex-start',
  start: 'flex-start',
  center: 'center',
  'space-between': 'space-between',
  'flex-end': 'flex-end',
  end: 'flex-end',
};

export type Element = {
  box: readonly [number, number];
  gap: number;
  justify: string;
  padding: readonly [number, number, number, number];
  font: Font;
  minHeight: number | null;
  sample: string | null;
  // The element's own text colour and spacing, when it holds text itself (`<button>Kaydet</button>`).
  text: { color: string; letterSpacing: number } | null;
  transitions: Transition[];
  // Its own look, where the inventory has none (a screen part: scripts/v46/screenParts.ts).
  look: Look;
  parts: Part[];
};

// The backdrop a part blurs (v46 `backdrop-filter: blur(20px) saturate(1.9)`).
export type Backdrop = { blur: number; saturate: number };

export type Look = {
  at: readonly [number, number] | null;
  bg: string | null;
  gradient: string | null;
  border: { width: number; color: string } | null;
  radius: number | null;
  shadow: string | null;
  backdrop: Backdrop | null;
  // A pseudo-element drawn below it (a pinned head's fade: `.dhd::after`).
  after: { height: number; gradient: string } | null;
};

export function parseBackdrop(value: string): Backdrop {
  const blur = /blur\(([0-9.]+)px\)/.exec(value);
  const saturate = /saturate\(([0-9.]+)\)/.exec(value);
  const rest = value.replace(/blur\([^)]*\)|saturate\([^)]*\)/g, '').trim();
  if (!blur || rest) throw new Error(`backdrop-filter: ${value}`);
  return { blur: Number(blur[1]), saturate: saturate ? Number(saturate[1]) : 1 };
}

function look(raw: RawElement['self']): Look {
  const transparent = (c: string | undefined) => !c || parseColor(c) === 'transparent';
  const radius = raw.radius === undefined ? null : parseFloat(raw.radius);
  return {
    at: raw.at ?? null,
    bg: transparent(raw.bg) ? null : parseColor(raw.bg ?? ''),
    gradient: raw.bgImage ?? null,
    border: raw.border ? { width: raw.border.width, color: parseColor(raw.border.color) } : null,
    radius: radius === null || Number.isNaN(radius) ? null : radius,
    shadow: raw.shadow === undefined ? null : parseShadow(raw.shadow),
    backdrop: raw.backdrop ? parseBackdrop(raw.backdrop) : null,
    after:
      raw.after?.bgImage !== undefined
        ? { height: raw.after.height, gradient: raw.after.bgImage }
        : null,
  };
}

// Where a block button (not a flex box: v46's `.sheet .close`) puts its text: its text-align (the
// browser's own for a button is center).
const TEXT_ALIGN: Record<string, string> = {
  center: 'center',
  '-webkit-center': 'center',
  left: 'flex-start',
  start: 'flex-start',
  right: 'flex-end',
  end: 'flex-end',
};

export function element(raw: RawElement, metrics: VerticalMetrics): Element {
  const flex = raw.self.display === 'flex' || raw.self.display === 'inline-flex';
  const justify = flex ? JUSTIFY[raw.self.justifyContent] : TEXT_ALIGN[raw.self.textAlign];
  if (!justify) {
    throw new Error(
      flex ? `justify-content: ${raw.self.justifyContent}` : `text-align: ${raw.self.textAlign}`,
    );
  }
  return {
    box: raw.self.box,
    gap: typeof raw.self.gap === 'number' ? raw.self.gap : 0,
    justify,
    padding: parseBoxSides(raw.self.padding),
    font: parseMeasuredFont(raw.self.font, metrics),
    minHeight: raw.self.minHeight === 'auto' ? null : parsePx(raw.self.minHeight),
    sample: raw.self.text ?? null,
    text: raw.self.color
      ? {
          color: parseColor(raw.self.color),
          letterSpacing:
            !raw.self.letterSpacing || raw.self.letterSpacing === 'normal'
              ? 0
              : parsePx(raw.self.letterSpacing),
        }
      : null,
    transitions: transitions(raw.self.transitions),
    look: look(raw.self),
    parts: raw.parts.map((p) => part(p, metrics)),
  };
}

export type Pressed = {
  transform: Transform;
  opacity: number;
  bg: string;
  shadow: string | null;
  color: string;
  parts: { transform: Transform; opacity: number }[];
};

export function pressed(raw: RawPressed): Pressed {
  return {
    transform: parseTransform(raw.transform),
    opacity: raw.opacity,
    bg: parseColor(raw.background),
    shadow: parseShadow(raw.boxShadow),
    color: parseColor(raw.color),
    parts: raw.parts.map((p) => ({ transform: parseTransform(p.transform), opacity: p.opacity })),
  };
}
