// The parts Keşfet is built from (v46 native, step 3d) as the app draws them: the search
// (`.dsearch`), the filter chips (`.cats.vcats`, the inventory's suzgec-cipleri), the city button
// with the count (`.vloc`), the venue list and its rows (`.vlist`, `.vrow`) with the venues' icons
// (`.vthumb`: cafe, tea garden, food, campus), "Şu an buradasın" (`.vhere`) and the live dot
// (`.live`). From the measurement (measured.ts) only what src/ui/SearchField.tsx, FilterChips.tsx,
// CityButton.tsx, VenueRow.tsx, VenueThumb.tsx, HereCard.tsx and LiveDot.tsx read.
import {
  type Animation,
  animation,
  color,
  type Drawing,
  drawingOf,
  px,
  styled,
} from './buttons.ts';
import type { Inventory } from './inventory.ts';
import type { Element, MotionMatch, Part, Pressed, SvgNode, Transition } from './measured.ts';
import { pressScale, text, type Text } from './navigation.ts';

type Sides = readonly [number, number, number, number];
type Edge = { width: number; color: string };

const classes = (p: Part) => p.part.split('.').slice(1);
const find = (el: Element, label: string, id: string) => {
  const p = el.parts.find((x) => x.part === label);
  if (!p) throw new Error(`${id}: no ${label}`);
  return p;
};
const edge = (e: Edge | null | undefined, what: string): Edge => {
  if (!e) throw new Error(`${what}: no edge`);
  return e;
};

// v46's `.va .card`: the list's card and "Şu an buradasın".
export type CardLook = { bg: string; border: Edge; radius: number; shadow: string };

function card(el: Element, id: string): CardLook {
  const l = el.look;
  if (!l.bg || l.radius === null || !l.shadow) throw new Error(`${id}: not a card`);
  return { bg: l.bg, border: edge(l.border, id), radius: l.radius, shadow: l.shadow };
}

// The list's card (`.card.vlist`): v46's card, padded above and below.
export function listScheme(el: Element): { card: CardLook; padding: Sides } {
  return { card: card(el, 'mekan-listesi'), padding: el.padding };
}

export type SearchScheme = {
  // Below the title's row (`.dsearch{margin-top:12px}`).
  marginTop: number;
  height: number;
  padding: Sides;
  gap: number;
  radius: number;
  bg: string;
  // Resting and while typing (`:focus-within`): the edge and the ring, eased.
  idle: { border: Edge; shadow: string | null };
  focus: { border: Edge; shadow: string | null };
  transitions: Transition[];
  icon: { size: readonly [number, number]; color: string };
  field: {
    height: number;
    font: Text['font'];
    letterSpacing: number;
    color: string;
    placeholderColor: string;
  };
};

export function searchScheme(idle: Element, focus: Element): SearchScheme {
  const icon = find(idle, 'svg.ico', 'arama');
  const input = find(idle, 'input', 'arama');
  if (!input.field || !icon.svg || !idle.look.bg || idle.look.radius === null) {
    throw new Error('arama: parts');
  }
  return {
    marginTop: idle.margin[0],
    height: idle.box[1],
    padding: idle.padding,
    gap: idle.gap,
    radius: idle.look.radius,
    bg: idle.look.bg,
    idle: { border: edge(idle.look.border, 'arama'), shadow: idle.look.shadow },
    focus: { border: edge(focus.look.border, 'arama-odak'), shadow: focus.look.shadow },
    transitions: styled(idle.transitions),
    icon: { size: icon.box, color: icon.svg.color },
    field: {
      height: input.box[1],
      font: input.field.font,
      letterSpacing: input.field.letterSpacing,
      color: input.field.color,
      placeholderColor: input.field.placeholderColor,
    },
  };
}

type ChipLook = { bg: string; border: Edge; color: string };

export type ChipsScheme = {
  margin: Sides;
  padding: Sides;
  gap: number;
  chip: {
    height: number;
    padding: Sides;
    gap: number;
    radius: number;
    hitSlop: { top: number; right: number; bottom: number; left: number };
    font: Text['font'];
    letterSpacing: number;
    pressedScale: number;
    on: ChipLook;
    off: ChipLook;
  };
};

export function chipsScheme(
  inventory: Inventory,
  el: Element,
  margin: Sides,
  matches: readonly MotionMatch[],
): ChipsScheme {
  const on = el.parts.find((p) => p.depth === 1 && classes(p).includes('on'));
  const off = el.parts.find((p) => p.depth === 1 && !classes(p).includes('on'));
  if (!on?.text || !off?.text || !on.bg || !off.bg || !on.flex) throw new Error('çipler: parts');
  return {
    margin,
    padding: el.padding,
    gap: el.gap,
    chip: {
      height: on.box[1],
      padding: on.padding ?? [0, 0, 0, 0],
      gap: on.flex.gap,
      radius: px(on.radius, 'chip radius'),
      hitSlop: on.hitSlop ?? { top: 0, right: 0, bottom: 0, left: 0 },
      font: on.text.font,
      letterSpacing: on.text.letterSpacing,
      pressedScale: pressScale(inventory, matches, on.part),
      on: { bg: on.bg, border: edge(on.border, 'chip'), color: on.text.color },
      off: { bg: off.bg, border: edge(off.border, 'chip'), color: off.text.color },
    },
  };
}

export type CityScheme = {
  margin: Sides;
  gap: number;
  rowGap: number;
  button: {
    minHeight: number;
    padding: Sides;
    gap: number;
    radius: number;
    bg: string;
    border: Edge;
    pressedScale: number;
    label: Text;
    pin: { size: readonly [number, number] };
    chevron: { size: readonly [number, number]; color: string };
  };
  count: Text;
};

export function cityScheme(
  inventory: Inventory,
  el: Element,
  matches: readonly MotionMatch[],
): CityScheme {
  const button = find(el, 'button.vloc-btn', 'şehir');
  const svgs = el.parts.filter((p) => p.depth === 2 && p.svg);
  const [pin, chevron] = svgs;
  const label = el.parts.find((p) => p.depth === 2 && p.text && p.part === 'span');
  const count = find(el, 'em', 'şehir');
  if (!pin || !chevron?.svg || !label || !button.bg || !button.flex || !el.wrap) {
    throw new Error('şehir: parts');
  }
  return {
    margin: el.margin,
    gap: el.gap,
    rowGap: el.wrap.rowGap,
    button: {
      minHeight: button.box[1],
      padding: button.padding ?? [0, 0, 0, 0],
      gap: button.flex.gap,
      radius: px(button.radius, 'city radius'),
      bg: button.bg,
      border: edge(button.border, 'city'),
      pressedScale: pressScale(inventory, matches, button.part),
      label: text(label, 'city label'),
      pin: { size: pin.box },
      chevron: { size: chevron.box, color: chevron.svg.color },
    },
    count: text(count, 'city count'),
  };
}

export type RowScheme = {
  minHeight: number;
  padding: Sides;
  gap: number;
  pressed: { bg: string; scale: number };
  transitions: Transition[];
  thumb: { size: readonly [number, number]; radius: number };
  middle: { gap: number };
  name: Text;
  sub: Text;
  live: {
    marginTop: number;
    gap: number;
    font: Text['font'];
    color: string;
    quiet: string;
    dot: number;
  };
  chevron: { size: readonly [number, number]; color: string };
};

export function rowScheme(live: Element, quiet: Element, pressed: Pressed): RowScheme {
  const thumb = find(live, 'span.vthumb', 'satır');
  const middle = find(live, 'span.cmid', 'satır');
  const name = find(live, 'b', 'satır');
  const sub = find(live, 'small', 'satır');
  const line = find(live, 'span.vlive', 'satır');
  const dot = find(live, 'i.live', 'satır');
  const still = find(quiet, 'span.vlive.quiet', 'satır sessiz');
  const chevron = find(live, 'svg.ico.pchev', 'satır');
  if (!line.text || !line.flex || !still.text || !middle.flex || !chevron.svg) {
    throw new Error('satır: parts');
  }
  return {
    minHeight: live.box[1],
    padding: live.padding,
    gap: live.gap,
    pressed: { bg: pressed.bg, scale: pressed.transform?.scale ?? 1 },
    transitions: styled(live.transitions),
    thumb: { size: thumb.box, radius: px(thumb.radius, 'thumb radius') },
    middle: { gap: middle.flex.gap },
    name: text(name, 'row name'),
    sub: text(sub, 'row sub'),
    live: {
      marginTop: line.margin?.[0] ?? 0,
      gap: line.flex.gap,
      font: line.text.font,
      color: line.text.color,
      quiet: still.text.color,
      dot: dot.box[0],
    },
    chevron: { size: chevron.box, color: chevron.svg.color },
  };
}

export type HereScheme = {
  card: CardLook;
  margin: Sides;
  padding: Sides;
  label: { gap: number; font: Text['font']; color: string; dot: number };
  row: { marginTop: number; gap: number };
  middle: { gap: number };
  name: Text;
  sub: Text;
  button: { marginTop: number };
};

export function hereScheme(el: Element): HereScheme {
  const label = find(el, 'span.vh-lbl', 'buradasın');
  const dot = find(el, 'i.live', 'buradasın');
  const row = find(el, 'div.vh-row', 'buradasın');
  const middle = find(el, 'span.cmid', 'buradasın');
  const button = find(el, 'button.btn.btn-soft.vh-go', 'buradasın');
  if (!label.text || !label.flex || !row.flex || !middle.flex) throw new Error('buradasın: parts');
  return {
    card: card(el, 'buradasın'),
    margin: el.margin,
    padding: el.padding,
    label: { gap: label.flex.gap, font: label.text.font, color: label.text.color, dot: dot.box[0] },
    row: { marginTop: row.margin?.[0] ?? 0, gap: row.flex.gap },
    middle: { gap: middle.flex.gap },
    name: text(find(el, 'b', 'buradasın'), 'here name'),
    sub: text(find(el, 'small', 'buradasın'), 'here sub'),
    button: { marginTop: button.margin?.[0] ?? 0 },
  };
}

// The live dot's own look: its colour and its halo (`::after`, over it in the same colour).
export type LiveScheme = { bg: string; halo: { bg: string; opacity: number } };

export function liveScheme(el: Element): LiveScheme {
  if (!el.look.bg || !el.look.halo) throw new Error('canlı nokta: no ground or halo');
  return { bg: el.look.bg, halo: el.look.halo };
}

export type ExploreScheme = {
  list: { card: CardLook; padding: Sides };
  search: SearchScheme;
  chips: ChipsScheme;
  city: CityScheme;
  row: RowScheme;
  here: HereScheme;
  live: LiveScheme;
};

// A tab's icons that take the colour of where they are (`currentColor`).
function inColor(nodes: readonly SvgNode[], c: string): SvgNode[] {
  const paint = (p: SvgNode['fill']) => (p === c ? 'currentColor' : p);
  return nodes.map((n) => ({
    ...n,
    ...(n.fill === undefined ? {} : { fill: paint(n.fill), stroke: paint(n.stroke) }),
    ...(n.children ? { children: inColor(n.children, c) } : {}),
  }));
}

const tinted = (p: Part): Drawing => {
  if (!p.svg) throw new Error(`${p.part}: not a drawing`);
  return drawingOf(p, inColor(p.svg.nodes, p.svg.color));
};

// The search's magnifier, the city's pin and its arrow, the row's arrow: the same in both schemes
// (tokens.ts checks), the plain-coloured ones in `currentColor`.
export type ExploreIcons = { search: Drawing; pin: Drawing; down: Drawing; chevron: Drawing };

export function exploreIcons(search: Element, city: Element, row: Element): ExploreIcons {
  const [pin, down] = city.parts.filter((p) => p.depth === 2 && p.svg);
  if (!pin || !down) throw new Error('şehir: icons');
  return {
    search: tinted(find(search, 'svg.ico', 'arama')),
    pin: drawingOf(pin),
    down: tinted(down),
    chevron: tinted(find(row, 'svg.ico.pchev', 'satır')),
  };
}

// A venue's icon: v46's drawing, and its steam bars apart (`.th-steam`: they rise and fade, each
// with its own delay), drawn over it.
export type SteamBar = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  fill: string;
  delayMs: number;
};
export type VenueThumb = { drawing: Drawing; steam: SteamBar[] };

const num = (n: SvgNode, k: string) => {
  const v = n.attrs[k];
  if (typeof v !== 'number') throw new Error(`${n.cls ?? n.tag} ${k}: ${String(v)}`);
  return v;
};

export function venueThumb(el: Element, id: string): VenueThumb {
  const svg = el.parts.find((p) => p.svg)?.svg;
  if (!svg) throw new Error(`${id}: no drawing`);
  const steam = svg.nodes.filter((n) => n.cls === 'th-steam');
  const rest = svg.nodes.filter((n) => n.cls !== 'th-steam');
  const part = el.parts.find((p) => p.svg) as Part;
  return {
    drawing: drawingOf(part, rest),
    steam: steam.map((n) => {
      if (!n.animation) throw new Error(`${id}: a steam bar that does not rise`);
      return {
        x: num(n, 'x'),
        y: num(n, 'y'),
        width: num(n, 'width'),
        height: num(n, 'height'),
        rx: num(n, 'rx'),
        fill: color(n.fill, `${id} steam fill`),
        delayMs: n.animation.delayMs,
      };
    }),
  };
}

export const THUMBS = {
  kafe: 'mekan-simgesi-kafe',
  cay: 'mekan-simgesi-cay',
  yemek: 'mekan-simgesi-yemek',
  kampus: 'mekan-simgesi-kampus',
} as const;

// The rows coming in (`.vrow`: rowIn, each a step later than the one above: v46 writes the delays
// into the list), the steam rising (`.th-steam`), the live dot beating and its halo spreading
// (`.live`, `.live::after`), and the dot fading instead with reduce motion (`liveFade`).
// What the components read of each: when and how it plays, how often, whether it holds its first
// keyframe before it starts. Which rule and keyframes it is (`selector`, `keyframes`) and its
// length (in the steps) stay here.
export type Played = Omit<Animation, 'selector' | 'keyframes' | 'ms'>;

export type ExploreMotions = {
  rowIn: Played;
  rowStaggerMs: number;
  steam: Played;
  livePulse: Played;
  liveHalo: Played;
  liveFade: Played;
};

const played = (a: Animation): Played => ({
  delayMs: a.delayMs,
  ease: a.ease,
  channels: a.channels,
  offWhenReduced: a.offWhenReduced,
  iterations: a.iterations,
  holdsBefore: a.holdsBefore,
});

export function exploreMotions(inventory: Inventory, list: Element): ExploreMotions {
  const delays = list.parts
    .filter((p) => p.depth === 1)
    .map((p) => {
      if (!p.animation) throw new Error(`${p.part}: a row that does not come in`);
      return p.animation.delayMs;
    })
    .sort((a, b) => a - b);
  const step = (delays[1] ?? 0) - (delays[0] ?? 0);
  if (delays.length < 2 || delays.some((d, i) => d !== i * step)) {
    throw new Error(`rows do not come in at even steps: ${delays.join(', ')}`);
  }
  return {
    rowIn: played(animation(inventory, 'rowIn', '.vrow')),
    rowStaggerMs: step,
    steam: played(animation(inventory, 'steam', '.th-steam')),
    livePulse: played(animation(inventory, 'livePulse', '.live')),
    liveHalo: played(animation(inventory, 'liveHalo', '.live::after')),
    // v46 plays it only with reduce motion (its `.live` rule comes after the `animation: none`
    // that stops the beat), so reduce motion does not turn it off.
    liveFade: { ...played(animation(inventory, 'liveFade', '.live', true)), offWhenReduced: false },
  };
}
