// The buttons of v46 (gallery group Düğmeler; v46 native, step 3b) as the app draws them: from the
// measurement (measured.ts) only what src/ui/Button.tsx, RoundButton.tsx and SendButton.tsx read.
// The rest of a button's look (ground, edge, corner, height, shadow) is the inventory's
// (tokens.generated.ts → V46_COMPONENTS).
import type { Inventory } from './inventory.ts';
import { type Channel, type ChannelSteps, keyframeChannels, parseKeyframes } from './keyframes.ts';
import {
  type Bezier,
  type Element,
  type Font,
  type Gradient,
  type MotionMatch,
  type Paint,
  type Part,
  parseEase,
  parseTransform,
  type Pressed,
  type SvgNode,
  type Transition,
} from './measured.ts';

export const BUTTONS_GROUP = 'Düğmeler';

// The properties a button animates that React Native has a style for.
const STYLED = new Set([
  'background-color',
  'border-color',
  'box-shadow',
  'color',
  'opacity',
  'transform',
]);
const styled = (list: Transition[]) => list.filter((t) => STYLED.has(t.prop));

// A drawing as the app draws it: v46's nodes without their class names (the components never read
// them; the projection below uses them to find parts).
export type DrawingNode = Omit<SvgNode, 'cls' | 'children'> & { children?: DrawingNode[] };

export type Drawing = {
  viewBox: readonly [number, number, number, number];
  clips: DrawingNode[][];
  gradients: Gradient[];
  nodes: DrawingNode[];
};

// One bar of the send icon (`.send-ic rect`), in the drawing's units: where it is, its fill and its
// turn about its own middle (v46: `transform-box: fill-box; transform-origin: 50% 50%`).
export type SendBar = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  fill: string;
  translateX: number;
  translateY: number;
  rotate: number;
};

export type ButtonIcon = {
  size: readonly [number, number];
  // While the button is pressed, the icon's own scale too (v46: `.nbell:active .nb-ic`).
  pressedScale: number;
  transitions: Transition[];
} & (
  | { bar: 'plus' | 'cross' | 'check'; fills: { a: string; b: string; x: string } }
  // The bell keeps its clapper apart (`.nb-clap` swings on its own) and the point it turns about
  // (`.nb-ic`'s transform-origin, px from its top left).
  | { drawing: Drawing; clap: Drawing | null; origin: readonly [number, number] }
  // The send icon: its bars waiting (`.send:not(.ready)`) and ready (`.send.ready`).
  | {
      send: {
        viewBox: readonly [number, number, number, number];
        waiting: SendBar[];
        ready: SendBar[];
      };
    }
);

export type ButtonScheme = {
  gap: number;
  justify: string;
  padding: readonly [number, number, number, number];
  pressedScale: number;
  transitions: Transition[];
  label: {
    font: Font;
    color: string;
    letterSpacing: number;
    opacity: number;
    translateY: number;
    transitions: Transition[];
  } | null;
  icon: ButtonIcon | null;
  loader: {
    size: readonly [number, number];
    fills: { a: string; b: string; overlap: string };
    transitions: Transition[];
  } | null;
  // The loader's size in this button while busy (v46: `.ld.mini`, smaller in `.hb`).
  loaderSize: readonly [number, number] | null;
  badge: {
    size: readonly [number, number];
    bg: string;
    color: string;
    font: Font;
    radius: number;
    shadow: string | null;
    padding: readonly [number, number, number, number];
    top: number;
    right: number;
  } | null;
};

export type ButtonNarrow = {
  // The button's width there (the gallery and the visual gate draw it in the same box).
  width: number;
  gap: number;
  padding: readonly [number, number, number, number];
  font: Font;
  iconShown: boolean;
};

export type ButtonParts = { light: ButtonScheme; dark: ButtonScheme; narrow: ButtonNarrow | null };

const BARS: Record<string, 'plus' | 'cross' | 'check'> = {
  'bi-plus': 'plus',
  'bi-close': 'cross',
  'bi-check': 'check',
};

function fill(nodes: readonly SvgNode[], cls: string): string {
  for (const n of nodes) {
    if (n.cls === cls && typeof n.fill === 'string') return n.fill;
    const inner = n.children ? fill(n.children, cls) : '';
    if (inner) return inner;
  }
  return '';
}

function need(value: string, what: string): string {
  if (!value) throw new Error(`no ${what}`);
  return value;
}

const classes = (p: Part) => p.part.split('.').slice(1);
const isLoader = (p: Part) => p.svg !== undefined && classes(p).includes('ld');

const strip = (nodes: readonly SvgNode[]): DrawingNode[] =>
  nodes.map(({ children, ...n }) => {
    const node: DrawingNode & { cls?: string | null } = { ...n };
    delete node.cls;
    return children ? { ...node, children: strip(children) } : node;
  });

// The nodes with class `cls` (and their subtrees) apart from the others.
function pick(nodes: readonly SvgNode[], cls: string): [SvgNode[], SvgNode[]] {
  const rest: SvgNode[] = [];
  const picked: SvgNode[] = [];
  for (const n of nodes) {
    if (n.cls === cls) picked.push(n);
    else if (n.children) {
      const [r, p] = pick(n.children, cls);
      picked.push(...p);
      rest.push({ ...n, children: r });
    } else rest.push(n);
  }
  return [rest, picked];
}

const color = (p: Paint | undefined, what: string): string => {
  if (typeof p !== 'string') throw new Error(`${what}: not a plain colour`);
  return p;
};

// `translate(cx cy) matrix(…) translate(-cx -cy)` (measure.ts) about the bar's own middle, read
// back as a move and a turn.
function sendBar(n: SvgNode): SendBar {
  const a = n.attrs;
  const num = (k: string) => {
    const v = a[k];
    if (typeof v !== 'number') throw new Error(`send bar ${k}: ${String(v)}`);
    return v;
  };
  const [x, y, width, height, rx] = [num('x'), num('y'), num('width'), num('height'), num('rx')];
  const m = /^translate\(([-0-9.]+) ([-0-9.]+)\) (matrix\([^)]+\))/.exec(String(a.transform ?? ''));
  const t = m?.[3] ? parseTransform(m[3].replace(/ /g, ', ')) : null;
  const near = (u: number, v: number) => Math.abs(u - v) < 1e-6;
  const centred = m && near(Number(m[1]), x + width / 2) && near(Number(m[2]), y + height / 2);
  if (!t || !centred || t.scale !== 1)
    throw new Error(`send bar transform: ${String(a.transform)}`);
  return {
    x,
    y,
    width,
    height,
    rx,
    fill: color(n.fill, 'send bar fill'),
    translateX: t.translateX,
    translateY: t.translateY,
    rotate: t.rotate,
  };
}

const rects = (nodes: readonly SvgNode[]): SvgNode[] =>
  nodes.flatMap((n) => (n.tag === 'rect' ? [n] : rects(n.children ?? [])));

function icon(p: Part, pressedScale: number, ready: Part | undefined): ButtonIcon {
  const svg = p.svg;
  if (!svg) throw new Error(`${p.part} is not a drawing`);
  const bar = classes(p)
    .map((c) => BARS[c])
    .find((b) => b !== undefined);
  const base = { size: p.box, pressedScale, transitions: styled(p.transitions) };
  // A bar icon is drawn at rest from theme/barIcons.ts (v46 draws it with a spring, and the
  // measurement can hold a frame of it): only its fills are taken.
  if (bar) {
    return {
      ...base,
      bar,
      fills: {
        a: need(fill(svg.nodes, 'bi-a'), `${p.part} bi-a`),
        b: need(fill(svg.nodes, 'bi-b'), `${p.part} bi-b`),
        x: need(fill(svg.nodes, 'bi-x'), `${p.part} bi-x`),
      },
    };
  }
  if (classes(p).includes('send-ic')) {
    if (!ready?.svg) throw new Error('send icon without its ready look');
    return {
      ...base,
      send: {
        viewBox: svg.viewBox,
        waiting: rects(svg.nodes).map(sendBar),
        ready: rects(ready.svg.nodes).map(sendBar),
      },
    };
  }
  const [rest, clap] = pick(svg.nodes, 'nb-clap');
  const drawingOf = (nodes: readonly SvgNode[]): Drawing => ({
    viewBox: svg.viewBox,
    clips: svg.clips.map(strip),
    gradients: svg.gradients,
    nodes: strip(nodes),
  });
  return {
    ...base,
    drawing: drawingOf(rest),
    clap: clap.length ? drawingOf(clap) : null,
    origin: p.origin ?? [p.box[0] / 2, p.box[1] / 2],
  };
}

const px = (v: string | undefined, what: string) => {
  const m = /^(-?[0-9.]+)px$/.exec(v ?? '');
  if (!m?.[1]) throw new Error(`${what}: ${v}`);
  return Number(m[1]);
};

export function buttonScheme(
  el: Element,
  pressed: Pressed,
  extra: { busyLoader: readonly [number, number] | null; ready: Element | null },
): ButtonScheme {
  const labelPart = el.parts.find((p) => p.text !== undefined && p.absolute === undefined);
  const badgePart = el.parts.find((p) => p.text !== undefined && p.absolute !== undefined);
  const iconPart = el.parts.find((p) => p.svg !== undefined && !isLoader(p));
  const loaderPart = el.parts.find(isLoader);
  const label = labelPart?.text
    ? {
        font: labelPart.text.font,
        color: labelPart.text.color,
        letterSpacing: labelPart.text.letterSpacing,
        opacity: labelPart.opacity,
        translateY: labelPart.transform?.translateY ?? 0,
        transitions: styled(labelPart.transitions),
      }
    : el.text
      ? {
          font: el.font,
          color: el.text.color,
          letterSpacing: el.text.letterSpacing,
          opacity: 1,
          translateY: 0,
          transitions: [],
        }
      : null;
  return {
    gap: el.gap,
    justify: el.justify,
    padding: el.padding,
    pressedScale: pressed.transform?.scale ?? 1,
    transitions: styled(el.transitions),
    label,
    icon: iconPart
      ? icon(
          iconPart,
          pressed.parts[el.parts.indexOf(iconPart)]?.transform?.scale ?? 1,
          extra.ready?.parts[el.parts.indexOf(iconPart)],
        )
      : null,
    loader: loaderPart?.svg
      ? {
          size: loaderPart.box,
          fills: {
            a: need(fill(loaderPart.svg.nodes, 'pa'), 'loader pa'),
            b: need(fill(loaderPart.svg.nodes, 'pb'), 'loader pb'),
            overlap: need(fill(loaderPart.svg.nodes, 'px'), 'loader px'),
          },
          transitions: styled(loaderPart.transitions),
        }
      : null,
    loaderSize: extra.busyLoader,
    badge:
      badgePart?.text && badgePart.absolute
        ? {
            size: badgePart.box,
            bg: need(badgePart.bg ?? '', 'badge ground'),
            color: badgePart.text.color,
            font: badgePart.text.font,
            radius: px(badgePart.radius, 'badge radius'),
            shadow: badgePart.shadow ?? null,
            padding: badgePart.padding ?? [0, 0, 0, 0],
            top: badgePart.absolute.top,
            right: badgePart.absolute.right,
          }
        : null,
  };
}

export function buttonNarrow(el: Element): ButtonNarrow {
  const iconPart = el.parts.find((p) => p.svg !== undefined && !isLoader(p));
  return {
    width: el.box[0],
    gap: el.gap,
    padding: el.padding,
    font: el.font,
    iconShown: iconPart ? iconPart.display !== 'none' : false,
  };
}

// A keyframe animation of a button part, as v46's CSS runs it (the inventory's keyframes and the
// rule that plays them): its time, easing and each channel's steps (keyframes.ts). `offWhenReduced`:
// v46 drops it when the system asks for less motion. `looks`: the buttons the rule reaches in v46
// (the measurement's matches: a disabled `.endbtn` does not shake, a `.btn` does).
export type KeyframeMotion = {
  selector: string;
  keyframes: string;
  ms: number;
  delayMs: number;
  ease: Bezier;
  channels: Partial<Record<Channel, ChannelSteps>>;
  offWhenReduced: boolean;
  looks: string[];
};

// A transition of a button part that the measurement of its resting look cannot show (the part's
// look only changes in a state): the inventory's rule, and its own with reduce motion.
export type RuleTransition = { selector: string; transitions: Transition[]; reduced: Transition[] };

export type ButtonMotions = {
  // A disabled button pressed (`aria-disabled`): it shakes (v46 `.nope`).
  nope: KeyframeMotion;
  // The send button as a message goes (`.send.shoot .sg`).
  shoot: KeyframeMotion;
  // The bell as a new notice comes (`.nbell.ring`): the bell turns, the clapper swings.
  bellRing: KeyframeMotion;
  bellClap: KeyframeMotion;
  // The bell's count as it grows (`.nb-bdg.bump`).
  badgeBump: KeyframeMotion;
  // The send bars between waiting and ready, and a bar icon's fills between two states.
  sendBars: RuleTransition;
  barFill: RuleTransition;
};

const seconds = (v: string | undefined) => {
  if (!v) return 0;
  const m = /^(-?[0-9]*\.?[0-9]+)(ms|s)$/.exec(v.trim());
  if (!m?.[1]) throw new Error(`time: ${v}`);
  return Math.round(Number(m[1]) * (m[2] === 's' ? 1000 : 1));
};

const REDUCED = /prefers-reduced-motion:\s*reduce/;

// Each button's matched motion rules (the measurement of its real states: measured.ts).
export type ButtonMatches = Record<string, readonly MotionMatch[]>;

function keyframeMotion(
  inventory: Inventory,
  matches: ButtonMatches,
  name: string,
  selector: string,
): KeyframeMotion {
  const kf = inventory.motion.keyframes.find((k) => k.name === name);
  const use = kf?.usages.find((u) => u.selector === selector && !REDUCED.test(u.media));
  if (!kf || !use) throw new Error(`no keyframes ${name} on ${selector}`);
  const ms = seconds(use.duration);
  const own = selector.split(',').map((x) => x.trim());
  const offWhenReduced = inventory.motion.reduced_motion.some(
    (r) =>
      r.parts.some((p) => p.name === 'none' || p.name === '?') &&
      r.selector
        .split(',')
        .map((x) => x.trim())
        .some((x) => own.includes(x)),
  );
  return {
    selector,
    keyframes: name,
    ms,
    delayMs: seconds(use.delay),
    ease: parseEase(use.easing || 'ease'),
    channels: keyframeChannels(parseKeyframes(kf.keyframes_css), ms),
    offWhenReduced,
    looks: Object.keys(matches).filter((id) =>
      matches[id]?.some((m) => m.kind === 'animation' && m.selector === selector),
    ),
  };
}

function ruleTransition(inventory: Inventory, selector: string): RuleTransition {
  const rules = inventory.motion.transitions.filter((r) => r.selector === selector);
  const of = (reduced: boolean) =>
    (rules.find((r) => REDUCED.test(r.media) === reduced)?.parts ?? []).map((p) => ({
      prop: p.prop,
      ms: seconds(p.dur),
      delayMs: seconds(p.delay),
      ease: parseEase(p.ease || 'ease'),
    }));
  const transitions = of(false);
  if (!transitions.length) throw new Error(`no transition rule ${selector}`);
  return { selector, transitions, reduced: of(true) };
}

export function buttonMotions(inventory: Inventory, matches: ButtonMatches): ButtonMotions {
  const motion = (name: string, selector: string) =>
    keyframeMotion(inventory, matches, name, selector);
  return {
    nope: motion('nope', '.va .btn.nope,.ntf-chip.nope,.anon-sw.nope'),
    shoot: motion('shoot', '.send.shoot .sg'),
    bellRing: motion('nbRing', '.nbell.ring .nb-ic'),
    bellClap: motion('nbClap', '.nbell.ring .nb-clap'),
    badgeBump: motion('vbump', '.nb-bdg.bump'),
    sendBars: ruleTransition(inventory, '.send-ic rect'),
    barFill: ruleTransition(inventory, '.bi-a'),
  };
}
