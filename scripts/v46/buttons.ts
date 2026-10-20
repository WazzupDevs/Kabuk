// The buttons of v46 (gallery group Düğmeler; v46 native, step 3b) as the app draws them: from the
// measurement (measured.ts) only what src/ui/Button.tsx, RoundButton.tsx and SendButton.tsx read.
// The rest of a button's look (ground, edge, corner, height, shadow) is the inventory's
// (tokens.generated.ts → V46_COMPONENTS).
import type { Element, Font, Gradient, Part, Pressed, SvgNode, Transition } from './measured.ts';

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

export type ButtonIcon = {
  size: readonly [number, number];
  // While the button is pressed, the icon's own scale too (v46: `.nbell:active .nb-ic`).
  pressedScale: number;
  transitions: Transition[];
} & (
  | { bar: 'plus' | 'cross' | 'check'; fills: { a: string; b: string; x: string } }
  | {
      drawing: {
        viewBox: readonly [number, number, number, number];
        clips: SvgNode[][];
        gradients: Gradient[];
        nodes: SvgNode[];
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

function icon(p: Part, pressedScale: number): ButtonIcon {
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
  return {
    ...base,
    drawing: { viewBox: svg.viewBox, clips: svg.clips, gradients: svg.gradients, nodes: svg.nodes },
  };
}

const px = (v: string | undefined, what: string) => {
  const m = /^(-?[0-9.]+)px$/.exec(v ?? '');
  if (!m?.[1]) throw new Error(`${what}: ${v}`);
  return Number(m[1]);
};

export function buttonScheme(el: Element, pressed: Pressed): ButtonScheme {
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
      ? icon(iconPart, pressed.parts[el.parts.indexOf(iconPart)]?.transform?.scale ?? 1)
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
