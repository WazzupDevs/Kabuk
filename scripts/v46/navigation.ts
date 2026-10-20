// v46's navigation (v46 native, step 3c: Gezinme) as the app draws it: the tab bar with each tab
// selected (`nav.nav`: the inventory's alt-sekme-mekan/-mesajlar/-profil and the screen parts
// alt-sekme-kesfet/-aktiviteler), its unread dot (`.tdot`, the inventory's bildirim-noktasi), the
// tab screens' pinned heads (`.dhd`, `.apin`, `.mpin`) and a sub page's (`.fpin`), and Keşfet's
// list/map switch (`.vmode`). From the measurement (measured.ts) only what src/ui/TabBar.tsx,
// VenueGlyph.tsx, TopBar.tsx and ViewModeToggle.tsx read.
import { color, type Drawing, drawingOf, need, px, styled } from './buttons.ts';
import type { Inventory } from './inventory.ts';
import type { Element, Font, Look, MotionMatch, Part, SvgNode, Transition } from './measured.ts';

// The tabs in v46's order, by the app's route names.
export const TAB_KEYS = ['explore', 'activities', 'venue', 'messages', 'profile'] as const;
export type TabKey = (typeof TAB_KEYS)[number];

// The bar measured with each tab selected.
export const TAB_BARS: Record<TabKey, string> = {
  explore: 'alt-sekme-kesfet',
  activities: 'alt-sekme-aktiviteler',
  venue: 'alt-sekme-mekan',
  messages: 'alt-sekme-mesajlar',
  profile: 'alt-sekme-profil',
};

export type Text = { font: Font; color: string; letterSpacing: number };

export const text = (p: Part, what: string): Text => {
  if (!p.text) throw new Error(`${what}: no text`);
  return { font: p.text.font, color: p.text.color, letterSpacing: p.text.letterSpacing };
};

const classes = (p: Part) => p.part.split('.').slice(1);

// A box's own ground, edge and shadow (a pill, a switch's button).
export type Surface = {
  bg: string | null;
  gradient: string | null;
  border: { width: number; color: string } | null;
  shadow: string | null;
};
// A switch's button, which also fades when not chosen.
export type FadingSurface = Surface & { opacity: number };

const transparent = (c: string | undefined) => c === undefined || c === 'transparent';

// A shadow list apart: the ones outside the box and the ones inside it (`inset`). The bar draws
// what it blurs under its own ground, so its inner shadows go with the ground, above the blur.
export function splitShadow(shadow: string): { outer: string | null; inset: string | null } {
  const list = shadow.split(/,(?![^(]*\))/).map((s) => s.trim());
  const join = (l: string[]) => (l.length ? l.join(', ') : null);
  return {
    outer: join(list.filter((s) => !s.startsWith('inset'))),
    inset: join(list.filter((s) => s.startsWith('inset'))),
  };
}

// A transparent edge stays: it keeps the box's size (the tab's pill not selected, `border: 1px
// solid transparent`).
export function surface(p: Part): Surface {
  return {
    bg: transparent(p.bg) ? null : (p.bg ?? null),
    gradient: p.gradient ?? null,
    border: p.border ?? null,
    shadow: p.shadow ?? null,
  };
}

// One tab of a bar: the button, its pill (`.ic`), its icon, its label and the unread dot.
type TabParts = { button: Part; pill: Part; icon: Part; label: Part; dot: Part | null };

function tabParts(el: Element, id: string): TabParts[] {
  const tabs: TabParts[] = [];
  let current: Partial<TabParts> | null = null;
  const done = () => {
    if (!current) return;
    const { button, pill, icon, label } = current;
    if (!button || !pill || !icon || !label) throw new Error(`${id}: a tab without all its parts`);
    tabs.push({ button, pill, icon, label, dot: current.dot ?? null });
  };
  for (const p of el.parts) {
    if (p.depth === 1) {
      done();
      current = { button: p };
    } else if (!current) {
      throw new Error(`${id}: ${p.part} before the first tab`);
    } else if (p.depth === 2 && classes(p).includes('ic')) current.pill = p;
    else if (p.depth === 2 && p.text) current.label = p;
    else if (p.depth === 3 && p.svg) current.icon = p;
    else if (p.depth === 3 && classes(p).includes('tdot')) current.dot = p;
    else throw new Error(`${id}: unexpected ${p.part}`);
  }
  done();
  if (tabs.length !== TAB_KEYS.length) throw new Error(`${id}: ${tabs.length} tabs`);
  return tabs;
}

// The Mekan tab's mark (`svg.vt`): two capsules and their overlap, in the drawing's units. The
// group (`.vt-all`) moves both; the second capsule (`.vt-b`) moves against the first; the overlap
// (`.vt-x`) is the second capsule clipped to the first. Each with its own transitions as v46 eases
// the change into this state.
export type VenueGlyphState = {
  group: { at: readonly [number, number]; transitions: Transition[] };
  a: { fill: string; transitions: Transition[] };
  b: { at: readonly [number, number]; fill: string; transitions: Transition[] };
  x: { at: readonly [number, number]; fill: string; opacity: number; transitions: Transition[] };
};

export type VenueGlyph = {
  viewBox: readonly [number, number, number, number];
  capsule: { width: number; height: number; rx: number };
  inactive: VenueGlyphState;
  active: VenueGlyphState;
};

const num = (n: SvgNode, k: string) => {
  const v = n.attrs[k];
  if (typeof v !== 'number') throw new Error(`${n.cls} ${k}: ${String(v)}`);
  return v;
};

// `translate(0 0) matrix(1 0 0 1 x y) translate(0 0)` (measure.ts, about the node's origin): a move.
function moveOf(n: SvgNode): readonly [number, number] {
  const t = n.attrs.transform;
  if (t === undefined) return [0, 0];
  const m =
    /^translate\(([-0-9.]+) ([-0-9.]+)\) matrix\(([^)]+)\) translate\(([-0-9.]+) ([-0-9.]+)\)$/.exec(
      String(t),
    );
  const [a, b, c, d, e, f] = (m?.[3] ?? '').split(' ').map(Number);
  if (!m || a !== 1 || b !== 0 || c !== 0 || d !== 1 || e === undefined || f === undefined) {
    throw new Error(`${n.cls}: not a move: ${String(t)}`);
  }
  return [e, f];
}

function find(nodes: readonly SvgNode[], cls: string): SvgNode {
  for (const n of nodes) {
    if (n.cls === cls) return n;
    if (n.children) {
      try {
        return find(n.children, cls);
      } catch {
        // not in this subtree
      }
    }
  }
  throw new Error(`no .${cls}`);
}

const ownTransitions = (n: SvgNode) => n.transitions ?? [];

// The transitions of the mark's parts, as one state eases into itself.
export type VenueTransitions = Record<'group' | 'a' | 'b' | 'x', Transition[]>;

export function venueTransitions(p: Part): VenueTransitions {
  const nodes = p.svg?.nodes ?? [];
  return {
    group: ownTransitions(find(nodes, 'vt-all')),
    a: ownTransitions(find(nodes, 'vt-a')),
    b: ownTransitions(find(nodes, 'vt-b')),
    x: ownTransitions(find(nodes, 'vt-b vt-x')),
  };
}

function venueState(p: Part): VenueGlyphState {
  const nodes = p.svg?.nodes ?? [];
  const group = find(nodes, 'vt-all');
  const a = find(nodes, 'vt-a');
  const b = find(nodes, 'vt-b');
  const x = find(nodes, 'vt-b vt-x');
  return {
    group: { at: moveOf(group), transitions: ownTransitions(group) },
    a: { fill: color(a.fill, 'vt-a fill'), transitions: ownTransitions(a) },
    b: { at: moveOf(b), fill: color(b.fill, 'vt-b fill'), transitions: ownTransitions(b) },
    x: {
      at: moveOf(x),
      fill: color(x.fill, 'vt-x fill'),
      opacity: x.opacity ?? 1,
      transitions: ownTransitions(x),
    },
  };
}

function venueGlyph(inactive: Part, active: Part): VenueGlyph {
  const svg = inactive.svg;
  if (!svg) throw new Error(`${inactive.part}: not a drawing`);
  const a = find(svg.nodes, 'vt-a');
  // The clip is the first capsule where it rests (`clipPath#vtA`), the same rect.
  const clip = svg.clips[0]?.[0];
  if (
    !clip ||
    clip.attrs.width !== a.attrs.width ||
    clip.attrs.height !== a.attrs.height ||
    clip.attrs.rx !== a.attrs.rx
  ) {
    throw new Error('the overlap is not clipped to the first capsule');
  }
  return {
    viewBox: svg.viewBox,
    capsule: { width: num(a, 'width'), height: num(a, 'height'), rx: num(a, 'rx') },
    inactive: venueState(inactive),
    active: venueState(active),
  };
}

// A tab's icon with its stroke and fill as `currentColor` where they are the icon's colour, so one
// drawing serves the tab selected and not (v46 changes only the colour).
function currentColor(nodes: readonly SvgNode[], c: string): SvgNode[] {
  const paint = (p: SvgNode['fill']) => (p === c ? 'currentColor' : p);
  return nodes.map((n) => ({
    ...n,
    ...(n.fill === undefined ? {} : { fill: paint(n.fill), stroke: paint(n.stroke) }),
    ...(n.children ? { children: currentColor(n.children, c) } : {}),
  }));
}

function tabIcon(p: Part): Drawing {
  const svg = p.svg;
  if (!svg) throw new Error(`${p.part}: not a drawing`);
  return drawingOf(p, currentColor(svg.nodes, svg.color));
}

// The press rule that shrinks a tab (`.va button:active`): the measurement's matches name it, the
// inventory holds its scale.
export function pressScale(
  inventory: Inventory,
  matches: readonly MotionMatch[],
  target: string,
): number {
  const scales = new Set(
    matches
      .filter((m) => m.kind === 'press' && m.target === target)
      .map((m) => {
        const t = inventory.interaction.press_feedback.find((r) => r.selector === m.selector)
          ?.effect.transform;
        const s = t && /^scale\((-?[0-9]*\.?[0-9]+)\)$/.exec(t)?.[1];
        if (!s) throw new Error(`${m.selector}: ${t}`);
        return Number(s);
      }),
  );
  if (scales.size !== 1) throw new Error(`${target}: ${scales.size} press scales`);
  return [...scales][0] ?? 1;
}

export type TabBarScheme = {
  height: number;
  // From the screen's sides, and the most it grows to.
  inset: number;
  maxWidth: number;
  padding: readonly [number, number, number, number];
  radius: number;
  gradient: string;
  border: { width: number; color: string };
  shadow: { outer: string | null; inset: string | null };
  // v46's `backdrop-filter`: what is behind the bar, blurred (its saturate is not drawn: §4.C).
  backdrop: { blur: number };
  tab: { gap: number; pressedScale: number };
  label: { inactive: Text; active: Text };
  pill: {
    size: readonly [number, number];
    radius: number;
    inactive: Surface;
    active: Surface;
    transitions: Transition[];
  };
  icon: { size: readonly [number, number]; inactive: string; active: string };
  venue: VenueGlyph;
  dot: {
    size: readonly [number, number];
    top: number;
    right: number;
    bg: string;
    shadow: string | null;
  };
};

export type BarReading = { el: Element; matches: readonly MotionMatch[] | null };

// The tabs' icons (Mekan's is its mark), in `currentColor`: the same drawing in both schemes, so
// written once (tokens.ts checks the two are equal).
export type TabIcons = Record<Exclude<TabKey, 'venue'>, Drawing>;

export function tabBarIcons(bars: Record<TabKey, BarReading>): TabIcons {
  const own = (k: Exclude<TabKey, 'venue'>) =>
    tabIcon((tabParts(bars[k].el, TAB_BARS[k])[TAB_KEYS.indexOf(k)] as TabParts).icon);
  return {
    explore: own('explore'),
    activities: own('activities'),
    messages: own('messages'),
    profile: own('profile'),
  };
}

// With the system asking for less motion (v46's `prefers-reduced-motion` rules: the mark's parts
// do not ease, `.vt-all,.vt-a,.vt-b,.vt-x{transition:none}`), from the bar with Mekan selected.
export type TabBarReduced = { pill: Transition[]; venue: VenueTransitions };

export function tabBarReduced(venueBar: Element): TabBarReduced {
  const venue = tabParts(venueBar, TAB_BARS.venue)[TAB_KEYS.indexOf('venue')] as TabParts;
  return { pill: styled(venue.pill.transitions), venue: venueTransitions(venue.icon) };
}

export function tabBarScheme(
  inventory: Inventory,
  bars: Record<TabKey, BarReading>,
  roomy: Element,
): TabBarScheme {
  const parts = Object.fromEntries(
    TAB_KEYS.map((k) => [k, tabParts(bars[k].el, TAB_BARS[k])]),
  ) as Record<TabKey, TabParts[]>;
  const at = (k: TabKey) => TAB_KEYS.indexOf(k);
  // Each tab selected in its own bar, not selected in the Keşfet bar (Keşfet's in the Aktiviteler
  // bar).
  const on = (k: TabKey) => parts[k][at(k)] as TabParts;
  const off = (k: TabKey) => parts[k === 'explore' ? 'activities' : 'explore'][at(k)] as TabParts;
  const base = bars.explore.el;
  const look: Look = base.look;
  if (!look.at || look.radius === null) throw new Error('the bar has no position or corner');
  const [x] = look.at;
  const dotted = TAB_KEYS.flatMap((k) => parts[k].map((t) => t.dot)).find(
    (d): d is Part => d !== null && d.display !== 'none',
  );
  if (!dotted?.absolute || !dotted.bg) throw new Error('no unread dot');
  const matches = bars.explore.matches ?? [];
  const tab = on('explore');
  for (const k of TAB_KEYS) {
    const a = on(k);
    const b = off(k);
    if (a.icon.box.join() !== b.icon.box.join()) throw new Error(`${k}: icon sizes differ`);
    if (k !== 'venue' && JSON.stringify(tabIcon(a.icon)) !== JSON.stringify(tabIcon(b.icon))) {
      throw new Error(`${k}: the icon is drawn differently when selected`);
    }
  }
  return {
    height: base.box[1],
    inset: x,
    maxWidth: roomy.box[0],
    padding: base.padding,
    radius: look.radius,
    gradient: need(look.gradient ?? '', 'bar gradient'),
    border: look.border ?? { width: 0, color: 'transparent' },
    shadow: splitShadow(need(look.shadow ?? '', 'bar shadow')),
    backdrop: { blur: look.backdrop?.blur ?? 0 },
    tab: {
      gap: tab.button.flex?.gap ?? 0,
      pressedScale: pressScale(inventory, matches, tab.button.part),
    },
    label: { inactive: text(off('explore').label, 'label'), active: text(tab.label, 'label') },
    pill: {
      size: tab.pill.box,
      radius: px(tab.pill.radius, 'pill radius'),
      inactive: surface(off('explore').pill),
      active: surface(tab.pill),
      transitions: styled(tab.pill.transitions),
    },
    icon: {
      size: tab.icon.box,
      inactive: need(off('explore').icon.svg?.color ?? '', 'icon colour'),
      active: need(tab.icon.svg?.color ?? '', 'icon colour'),
    },
    venue: venueGlyph(off('venue').icon, on('venue').icon),
    dot: {
      size: dotted.box,
      top: dotted.absolute.top,
      right: dotted.absolute.right,
      bg: dotted.bg,
      shadow: dotted.shadow ?? null,
    },
  };
}

// A tab screen's pinned head (`.dhd`, `.apin`, `.mpin`): the ground, the padding, the fade below it
// (`::after`), the title, and the row it shares with the screen's own control on the right (the
// list/map switch, the bell) if it has one.
export type HeadScheme = {
  bg: string;
  padding: readonly [number, number, number, number];
  fade: { height: number; gradient: string };
  title: Text;
  row: { minHeight: number; justify: string; align: string } | null;
};

// A sub page's (`.fpin`): the back button and the title side by side, and a count after the title
// (`h1 small`).
export type SubHeadScheme = Omit<HeadScheme, 'row'> & {
  gap: number;
  align: string;
  count: Text & { marginLeft: number };
};

function headBase(el: Element, id: string) {
  const fade = el.look.after;
  if (!el.look.bg || !fade) throw new Error(`${id}: no ground or fade`);
  return { bg: el.look.bg, padding: el.padding, fade };
}

export function headScheme(el: Element, id: string): HeadScheme {
  const title = el.parts.find((p) => p.part === 'h1');
  if (!title) throw new Error(`${id}: no title`);
  const row = title.depth === 2 ? el.parts.find((p) => p.depth === 1) : undefined;
  let r: HeadScheme['row'] = null;
  if (row?.flex) {
    // The row's own children: the parts after it, one level down, until the next row.
    const from = el.parts.indexOf(row) + 1;
    const end = el.parts.findIndex((p, i) => i >= from && p.depth <= row.depth);
    const kids = el.parts.slice(from, end < 0 ? undefined : end).filter((p) => p.depth === 2);
    const last = kids.at(-1);
    // The control is at the row's end: v46 spreads the two (`justify-content: space-between`) or
    // pushes the last with its own margin (`margin-left: auto`, the bell).
    const pushed =
      last !== undefined &&
      Math.abs(kids.reduce((w, k) => w + k.box[0], 0) + (last.margin?.[3] ?? 0) - row.box[0]) < 0.5;
    r = {
      minHeight: row.box[1],
      justify: pushed ? 'space-between' : row.flex.justify,
      align: row.flex.align,
    };
  }
  return { ...headBase(el, id), title: text(title, `${id} title`), row: r };
}

export function subHeadScheme(el: Element, counted: Element, id: string): SubHeadScheme {
  const title = el.parts.find((p) => p.part === 'h1');
  const count = counted.parts.find((p) => p.part === 'small');
  if (!title || !count) throw new Error(`${id}: no title or count`);
  return {
    ...headBase(el, id),
    gap: el.gap,
    align: el.align,
    title: text(title, `${id} title`),
    count: { ...text(count, `${id} count`), marginLeft: count.margin?.[3] ?? 0 },
  };
}

// Keşfet's list/map switch (`.vmode`): the box, its two buttons on and off, the touch each takes
// above and below (`button::after`) and the two icons (list first).
export type ViewModeScheme = {
  size: readonly [number, number];
  padding: readonly [number, number, number, number];
  gap: number;
  radius: number;
  bg: string;
  button: {
    size: readonly [number, number];
    radius: number;
    pressedScale: number;
    hitSlop: { top: number; right: number; bottom: number; left: number };
    on: FadingSurface;
    off: FadingSurface;
    transitions: Transition[];
  };
  icon: { size: readonly [number, number] };
};

// The switch's two icons, list first: v46 draws them in their own colours, the same in both
// schemes (tokens.ts checks).
export function viewModeIcons(listOn: Element): { list: Drawing; map: Drawing } {
  const [list, map] = listOn.parts.filter((p) => p.depth === 2 && p.svg);
  if (!list || !map) throw new Error('liste-harita: icons');
  return { list: drawingOf(list), map: drawingOf(map) };
}

export function viewModeScheme(
  inventory: Inventory,
  listOn: BarReading,
  mapOn: Element,
): ViewModeScheme {
  const matches = listOn.matches ?? [];
  const buttons = (el: Element) => el.parts.filter((p) => p.depth === 1);
  const icons = (el: Element) => el.parts.filter((p) => p.depth === 2 && p.svg);
  const [on, off] = buttons(listOn.el);
  const [list, map] = icons(listOn.el);
  const [list2, map2] = icons(mapOn);
  if (!on || !off || !list || !map || !list2 || !map2) throw new Error('liste-harita: parts');
  if (
    JSON.stringify(drawingOf(list)) !== JSON.stringify(drawingOf(list2)) ||
    JSON.stringify(drawingOf(map)) !== JSON.stringify(drawingOf(map2))
  ) {
    throw new Error('liste-harita: an icon changes with the selection');
  }
  const el = listOn.el;
  if (!el.look.bg || el.look.radius === null) throw new Error('liste-harita: no ground');
  return {
    size: el.box,
    padding: el.padding,
    gap: el.gap,
    radius: el.look.radius,
    bg: el.look.bg,
    button: {
      size: on.box,
      radius: px(on.radius, 'button radius'),
      pressedScale: pressScale(inventory, matches, on.part),
      hitSlop: on.hitSlop ?? { top: 0, right: 0, bottom: 0, left: 0 },
      on: { ...surface(on), opacity: on.opacity },
      off: { ...surface(off), opacity: off.opacity },
      transitions: styled(on.transitions),
    },
    icon: { size: list.box },
  };
}
