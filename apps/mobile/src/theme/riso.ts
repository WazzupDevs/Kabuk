import type { TextStyle } from 'react-native';

import type { ColorScheme } from './tokens';

// The riso game layout the card games share (Aura v85 Kinshi, v86 Krot): the top bar, the time
// strip with its capsule, the 3D deck with the two buddies peeking over it, the foot. The panels
// are 390 × 844; every number here is theirs. Each game adds its own (theme/kinshi.ts,
// theme/krot.ts).

const F800 = 'PlusJakartaSans_800ExtraBold';
export const risoType = (family: string, size: number, line: number, em = 0): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

export const RISO_TYPE = {
  // The time beside the capsule (`.strip .num`), tabular.
  clock: { ...risoType(F800, 30, 34), fontVariant: ['tabular-nums'] } as TextStyle,
} as const;

export const RISO = {
  // The panels' status bar: the safe area's top on the phone.
  statusBar: 47,
  // Top bar (`.top`): 54 from the panel's top (the status bar is 47), 20 in.
  barTop: 7,
  // Where the top bar ends on the panel (54 + 44).
  barBottom: 98,
  // The time strip (`.strip`): 106 from the top, 14 between the capsule and the words.
  stripGap: 14,
  stripLineGap: 6,
  stripWordGap: 8,
  capsule: { width: 60, height: 90 },
  // The capsule's drop shadow (`.kap`: drop-shadow(0 4px 8px rgba(0,0,0,.35))).
  capsuleShadow: { y: 4, blur: 8, color: 'rgba(0, 0, 0, 0.35)' },
  // The time capsule's last stage: the last 10 seconds (and the number in --buzz).
  lowSeconds: 10,
  // The faces in a line (`.stk`): 26, overlapping 6, ringed 2 in the canvas's colour.
  face: 26,
  faceOverlap: 6,
  faceRing: 2,
  // The deck (`.d3`): 296 × 395, 16 round; perspective(1100px) rotateX(13deg) rotateZ(-1.2deg)
  // from 50 % 60 %.
  card: { width: 296, height: 395, radius: 16 },
  deck: { perspective: 1100, rotateX: '13deg', rotateZ: '-1.2deg', originY: 0.6 },
  // Six paper edges under the card, each 2.2 lower (4.0 … 15.0): #D9D0BA, then every other one
  // #CFC5AD (`.edge:nth-of-type(odd)`).
  edges: [4.0, 6.2, 8.4, 10.6, 12.8, 15.0],
  edgeColors: ['#D9D0BA', '#CFC5AD'],
  edgeShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.18)',
  edgeOuter: '0px 1px 0px rgba(0, 0, 0, 0.12)',
  // The two backs fanned behind (`.f1`, `.f2`).
  fans: [
    { x: 14, y: 18, rotate: '5deg' },
    { x: -12, y: 12, rotate: '-4deg' },
  ],
  fanShadow: '0px 8px 18px rgba(0, 0, 0, 0.35)',
  fanEdge: 'inset 0px 0px 0px 1px rgba(255, 255, 255, 0.12)',
  cardEdge: 'inset 0px 0px 0px 1px rgba(255, 255, 255, 0.35)',
  cardOuter: '0px 1px 0px rgba(0, 0, 0, 0.2)',
  // The blurred shadow under the deck (`.dsh`): 6 % in on both sides, 34 below, 60 high, 18 blur;
  // black 55 % in the dark, #031B0B 28 % in the light.
  deckShadow: {
    inset: 0.06,
    below: 34,
    height: 60,
    blur: 18,
    color: { dark: 'rgba(0, 0, 0, 0.55)', light: 'rgba(3, 27, 11, 0.28)' } satisfies Record<
      ColorScheme,
      string
    >,
  },
  // The two buddies peeking from behind the card (`.peek`): 118 high (320 × 420), 78 above the
  // card, 58 in from the screen's sides (11 inside the card's, which is 47 in); the left one turned
  // −8°, the right one 7° and 6 lower.
  peek: { height: 118, above: 78, inset: 11, leftTurn: '-8deg', rightTurn: '7deg', rightDrop: 6 },
  buddyRatio: 320 / 420,
  // The foot (`.foot`): 34 from the bottom, 12 apart.
  footBottom: 34,
  footGap: 12,
  // The poster on the pre-game page: 84 × 56, 16 round, 14 beside its words; the person chip 32
  // high, 3/10 in; the boxes 12/14 in, 22 round.
  poster: { width: 84, height: 56, radius: 16, gap: 14 },
  person: { height: 32, padLeft: 3, padRight: 10, gap: 6, face: 26 },
  box: { padY: 12, padX: 14, gap: 10, radius: 22 },
  warn: { padY: 10, padX: 14, radius: 16, gap: 8 },
  // Between the parts of a page (`.k-content`: gap 12).
  gap: 12,
} as const;

// The deck at 320 dp and the largest text (Aura v95, kinshiSource; the project owner's decision of
// 5 Kasım, docs/decisions/kinshi-320dp.md): the card is the screen's width less 94 (296 on the 390
// panels; never wider than that), 3:4, and its edges, fanned backs, shadow and buddies scale with it.
export const RISO_CARD_SIDE = 94;

export function risoDeck(screenWidth: number) {
  const width = Math.max(0, Math.min(RISO.card.width, Math.round(screenWidth - RISO_CARD_SIDE)));
  const s = width / RISO.card.width;
  const z = (n: number) => n * s;
  return {
    scale: s,
    card: { width, height: Math.round((width * 4) / 3), radius: z(RISO.card.radius) },
    edges: RISO.edges.map(z),
    fans: RISO.fans.map((f) => ({ x: z(f.x), y: z(f.y), rotate: f.rotate })),
    shadow: {
      below: z(RISO.deckShadow.below),
      height: z(RISO.deckShadow.height),
      blur: z(RISO.deckShadow.blur),
    },
    peek: {
      height: z(RISO.peek.height),
      above: z(RISO.peek.above),
      inset: z(RISO.peek.inset),
      rightDrop: z(RISO.peek.rightDrop),
    },
  };
}
export type RisoDeck = ReturnType<typeof risoDeck>;

// The deck's box: its buddies, the card and the shadow under it, or, when what lies over it reaches
// lower than the card (its height measured), down to that.
export function risoDeckHeight(
  d: Pick<RisoDeck, 'peek' | 'card' | 'shadow'>,
  overlayBottom = 0,
): number {
  return Math.max(d.peek.above + d.card.height, overlayBottom) + d.shadow.below;
}

export const RISO_PANEL_WIDTH = 390;
