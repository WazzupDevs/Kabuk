import { BADGE } from './gameColors';
import { BRAND } from './brand';

// The bar icon family (v43 report §5, the v45 file's .bi icons and the Mesajlar bell; docs/SPEC_V4.md
// §4.C): icons made of the logo's capsules, the same rounded bar, a second colour where two bars
// cross. They are several colours each, so they are drawn with react-native-svg
// (src/components/BarIcon.tsx), not rasterised to one-colour PNGs like scripts/icon/glyphs.ts.
// Pure, so barIcons.test.ts pins the geometry; the icons' springs are in playMotion.ts (step 4.2c).

// A bar's thickness in the 24-unit box: plus, cross and check are thinner than the lobby's bar.
export const BAR = { thin: 4.6, thick: 6.4 } as const;

// One bar: its centre, length and turn (degrees); a slot's opacity `o` and scale `k`.
export type BarState = {
  c: readonly [number, number];
  L: number;
  r: number;
  o?: number;
  k?: number;
};

export type BarIconKind = 'plus' | 'cross' | 'check' | 'lobby' | 'minus';

// The resting drawings (v45: IC → S). Two-bar icons have `a` and `b`; the lobby icon is one bar `a`
// and a dashed slot `s` (open to the lobby: the bar turns flat, the slot shrinks away).
export const BAR_ICONS = {
  plus: { a: { c: [12, 12], L: 18, r: 0 }, b: { c: [12, 12], L: 18, r: 90 } },
  cross: { a: { c: [12, 12], L: 18, r: 45 }, b: { c: [12, 12], L: 18, r: -45 } },
  check: { a: { c: [7.4, 15.1], L: 12, r: -45 }, b: { c: [14.6, 12.1], L: 19, r: 45 } },
  lobby: {
    a: { c: [9.4, 9.8], L: 15, r: 0 },
    s: { c: [14.6, 14.2], L: 15, r: 0, o: 0.8, k: 1 },
  },
  minus: {
    a: { c: [12, 12], L: 18, r: 90 },
    s: { c: [12, 12], L: 15, r: 90, o: 0, k: 0.3 },
  },
} as const satisfies Record<BarIconKind, Record<string, BarState>>;

// The two-bar icons' colours: bar a, bar b, and b where it crosses a (the same in both schemes).
export const BAR_ICON_COLORS = {
  plus: { a: '#1C8C4E', b: '#6FD69A', x: '#0F5C31' },
  cross: { a: '#E0402C', b: '#FF8A70', x: '#A8240F' },
  check: { a: '#2FAE68', b: '#137A3E', x: '#0B4F28' },
} as const;

// The lobby icon's bar once the table is open to the lobby (v45: .btn-room.is-open).
export const LOBBY_OPEN = '#E07B00';

// The slot's dashes (v45: .bi-slot).
export const SLOT = { stroke: 1.6, dash: [2.4, 1.9] } as const;

export type BarRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  // rotate(r cx cy)
  rotate: readonly [number, number, number];
};

// A bar as an SVG rect: `thickness` wide, `L` long, round ends, turned about its centre.
export function barRect(p: BarState, thickness: number): BarRect {
  const k = p.k ?? 1;
  const t = thickness * k;
  const L = p.L * k;
  return {
    x: p.c[0] - t / 2,
    y: p.c[1] - L / 2,
    width: t,
    height: L,
    rx: t / 2,
    rotate: [p.r, p.c[0], p.c[1]],
  };
}

// The Mesajlar bell (v43 → "Bildirim düğmesi"): the purple dome, the pink bar across its rim, a dark
// tone where they cross, the orange clapper. A new notification rings it (playMotion.ts → BELL_RING).
export const BELL = {
  dome: 'M5.2 16.2V9.6a6.8 6.8 0 0 1 13.6 0v6.6z',
  bar: { x: 2.4, y: 14, width: 19.2, height: 4.6, rx: 2.3 },
  clapper: { x: 9.6, y: 19.8, width: 4.8, height: 3.6, rx: 1.8 },
  colors: { dome: BRAND.purple, bar: BRAND.pink, overlap: '#3B25A6', clapper: BRAND.orange },
} as const;

// The unread count on the bell: the badge colour, a ring in the ground's colour around it.
export const BELL_BADGE = { color: BADGE, minWidth: 20, height: 20, ring: 2, lift: 4 } as const;
