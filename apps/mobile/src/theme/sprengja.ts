import type { TextStyle } from 'react-native';

import { risoType } from './riso';

// Sprengja's screens (Aura v99, the "Sprengja (elden ele bomba)" row: SprengjaOyuncular …
// SprengjaYarida; the acceptance report of 5 Kasım). The panels are 390 × 844, SprengjaDar8 320 ×
// 844 at 1.3× text; every number here is theirs. The bar, the deck, the buddies and the foot are
// the card games' (theme/riso.ts).

const F800 = 'PlusJakartaSans_800ExtraBold';
const F700 = 'PlusJakartaSans_700Bold';
const F600 = 'PlusJakartaSans_600SemiBold';
const F500 = 'PlusJakartaSans_500Medium';

export const SPRENGJA_TYPE = {
  // A seat's name (`.seat .nm`, 700/12/15; 15/19 at 1.3×).
  seat: risoType(F700, 12, 15),
  // The letter-group panel (`.hp`): the group (`.sy`, 800/44/48, 2 % apart), "Atışlar · n" (`.at`,
  // 800/21/27, tabular, one line).
  group: risoType(F800, 44, 48, 0.02),
  throws: { ...risoType(F800, 21, 27), fontVariant: ['tabular-nums'] } as TextStyle,
  // The card's "HARF GRUBU" (`.kick.long`, 800/10, 6 % apart) and its group (`.syl`, 800/60, 2 %).
  kick: risoType(F800, 10, 14, 0.06),
  syllable: risoType(F800, 60, 64, 0.02),
  // The rules sheet (`.rl`): 500/14/20, the examples 800; the number 800/12.
  rule: risoType(F500, 14, 20),
  ruleBold: risoType(F800, 14, 20),
  ruleNo: risoType(F800, 12, 15),
  // The order's numbers on the pre-game page (800/12).
  seatNo: { ...risoType(F800, 12, 15), fontVariant: ['tabular-nums'] } as TextStyle,
  // A score row (`.tr`, 600/15/20) and its points (`.pt`, 800/16, tabular).
  row: risoType(F600, 15, 20),
  points: { ...risoType(F800, 16, 20), fontVariant: ['tabular-nums'] } as TextStyle,
  // The halted note (`.nx span`, 500/13/18).
  note: risoType(F500, 13, 18),
  // The connection error card (`.err .et`, 700/15, 1.35).
  error: risoType(F700, 15, 20),
} as const;

export const SPRENGJA = {
  // The heading under the bar (`.hd`): 110 from the panel's top (12 under the bar), title and fine
  // 4 apart; what follows (the ring, the deck's buddies) starts 184 down, at least 20 under it
  // (SprengjaDar8: 214).
  head: { gap: 4, minHeight: 74, below: 20 },
  // The table ring (`.ring`): 20 in, 28 round, the b-masa picture filling it, a shadow under it.
  ring: { radius: 28, shadow: '0px 14px 30px rgba(0, 0, 0, 0.35)' },
  // The ring at 390 (n ≤ 6 and n ≥ 7) and at 320 (SprengjaDar8); between them it scales with the
  // screen (sprengjaRing). Seats on a circle, the face's middle on it; the name 4 under the face.
  wide: {
    width: 390,
    side: 350,
    few: { radius: 128, face: 52, label: 96 },
    many: { radius: 132, face: 44, label: 88 },
    // The bomb in the middle when it is the caller's (`.bombc`): 150 × 165, 86 down.
    bomb: { width: 150, height: 165, top: 86 },
    // The letter-group panel 16 under the ring.
    panelGap: 16,
  },
  narrow: {
    width: 320,
    side: 280,
    seat: { radius: 106, face: 40, label: 72 },
    bomb: { width: 120, height: 132, top: 69 },
    panelGap: 14,
  },
  // From seven players the ring's seats are smaller (`n ≥ 7`).
  manyFrom: 7,
  // A seat (`.seat`): 84 wide, the name 4 under the face.
  seat: { width: 84, gap: 4 },
  // The seat's rings: 3 white with a shadow; the holder's 3 --buzz with an 8 halo at 32 %; the
  // next one's 3 --signal; the caller's a 3 dashed white line 3 out; one who left grey and dim
  // with a 3 white ring at 35 %.
  seatRing: 3,
  seatInk: '#FFFFFF',
  seatShadow: '0px 6px 12px rgba(0, 0, 0, 0.35)',
  holdHalo: 8,
  holdHaloColor: 'rgba(255, 79, 139, 0.32)',
  holdShadow: '0px 8px 16px rgba(0, 0, 0, 0.4)',
  dashOut: 3,
  out: { brightness: 0.55, ring: 'rgba(255, 255, 255, 0.35)' },
  // The name's pill (`.nm`): rgba(20,16,22,.82), 7 round, 2/7 in, white; one who left's 60 % with
  // its words 70 % white, struck through. Long names fade at the end on Android.
  label: {
    fill: 'rgba(20, 16, 22, 0.82)',
    outFill: 'rgba(20, 16, 22, 0.6)',
    outInk: 'rgba(255, 255, 255, 0.7)',
    radius: 7,
    padY: 2,
    padX: 7,
    fade: 16,
  },
  // The throw's arc (`svg.arc`): on 0.75 of the seats' circle, 4 wide, dashes 2/9 round, ending in a
  // 6 dot with a 2 #141016 edge.
  arc: { at: 0.75, width: 4, dash: '2 9', dot: 6, dotEdge: 2, dotEdgeInk: '#141016' },
  // The bomb in front of another (`.bombs`): 56 × 62, its middle 0.4 of the way from the ring's
  // middle to the holder, its top 34 over that point.
  bombSmall: { width: 56, height: 62, at: 0.4, lift: 34 },
  bombShadow: { y: 10, blur: 14, color: 'rgba(0, 0, 0, 0.45)' },
  bombSmallShadow: { y: 6, blur: 8, color: 'rgba(0, 0, 0, 0.45)' },
  // The letter-group panel (`.hp`): 22 round, 12/16 in, 10 between its line and the button; the
  // group and "Atışlar" 14 apart with a hairline between.
  panel: { radius: 22, padY: 12, padX: 16, gap: 10, lineGap: 14 },
  // The line under the panel (`.mid` at 712, the panel ending at 682) and under the deck (700).
  ringNoteGap: 30,
  deckNoteGap: 9,
  // The card's face on the 296 card (scaled with the deck): "HARF GRUBU" 25 down, 20 high; the
  // group 104 down, 96 high; ink #141016.
  face: { kick: { top: 25, height: 20 }, syllable: { top: 104, height: 96 }, ink: '#141016' },
  // Patladı (SprengjaPatladi): the pink flash, the explosion 350 square 22 under the bar, 28 round,
  // the words 22 under it, 8 apart, the stamp turned −6°.
  flash: 'radial-gradient(circle at 50% 40%, rgba(255, 79, 139, 0.25), transparent 62%)',
  boom: { top: 22, radius: 28, below: 22, gap: 8 },
  stampTurn: '-6deg',
  // The scenes over Tur sonu (b-patlama, 250) and the end (b-masa, 300): 36 round at the foot, their
  // top shaded 110 down from black 55 %; the words at 322 and 372.
  scene: {
    summary: 250,
    end: 300,
    radius: 36,
    shade: 110,
    shadeFrom: 'rgba(0, 0, 0, 0.55)',
    summaryContent: 322,
    endContent: 372,
  },
  // The winners over the end's scene (`.hero-s`): 96 down, the tag 10 over them. One 72 in a 4
  // --signal ring; two 64, three or more 56, overlapping 14; everyone 48 overlapping 10; each of
  // those ringed 3 in #141016.
  hero: {
    top: 96,
    tagGap: 10,
    one: 72,
    oneRing: 4,
    oneShadow: '0px 10px 20px rgba(0, 0, 0, 0.4)',
    two: 64,
    many: 56,
    all: 48,
    overlap: 14,
    overlapAll: 10,
    ring: 3,
    ringInk: '#141016',
  },
  // Two buddies at the scene's foot: 120 high, 20 in, 14 under.
  endBuddies: [
    { buddy: 'd2fbb5', left: 20, height: 120, below: 14 },
    { buddy: 'f280a5', right: 20, height: 120, below: 14 },
  ],
  // The score table (`.tbl`): 22 round, 4/16 in; rows 8 apart vertically, 10 across, the face 32,
  // the bombs 18 two apart, the points at least 44 wide; one who left at 60 %.
  table: {
    radius: 22,
    padY: 4,
    padX: 16,
    rowPadY: 8,
    gap: 10,
    face: 32,
    bomb: 18,
    bombGap: 2,
    points: 44,
    outOpacity: 0.6,
    tagGap: 4,
  },
  // The halted note (`.nx`): 22 round, 12/16 in.
  halted: { radius: 22, padY: 12, padX: 16 },
  // The rules sheet: the number 26 round with a soft edge, 12 before the words, 12 between rules.
  rules: { no: 26, gap: 12 },
  // Oyuncular: the buddy at the foot 90 high, 16 in, 14 under, turned 6°; the order's numbers 14
  // wide.
  pregameBuddy: { buddy: '1a80a9', right: 16, below: 14, height: 90, turn: '6deg' },
  seatNo: 14,
  // The connection error (`.err`, Aura VampirHata in the game's colours): 40 in, 24 round, 22/20/20
  // in, the mark 40, its words 12 under it, the button 16 under them; the screen dimmed under it.
  error: { side: 40, radius: 24, padTop: 22, padX: 20, padBottom: 20, mark: 40, gap: 12 },
  dim: { dark: 'rgba(0, 0, 0, 0.6)', light: 'rgba(3, 27, 11, 0.4)' },
  // The bomb mark (the `bomb` capsule icon on a 24 grid): the body at half strength, the fuse and
  // its spark full.
  bombMark: {
    body: { cx: 10.6, cy: 14, r: 7.2 },
    fuse: { x: 12.3, y: 4.6, width: 3.2, height: 6.4, rx: 1.6, turn: 'rotate(40 13.9 7.8)' },
    spark: { cx: 18.6, cy: 4.6, r: 2 },
    soft: 0.5,
  },
} as const;

// The ring's sizes for this screen and table: the 390 panel's from 390 dp, the 320 panel's at 320,
// in between each value on the straight line between them (the ring is the screen less its 20
// sides at both).
export function sprengjaRing(screenWidth: number, players: number) {
  const W = SPRENGJA.wide;
  const N = SPRENGJA.narrow;
  const t = Math.max(0, Math.min(1, (screenWidth - N.width) / (W.width - N.width)));
  const at = (a: number, b: number) => a + (b - a) * t;
  const wide = players >= SPRENGJA.manyFrom ? W.many : W.few;
  return {
    side: at(N.side, W.side),
    radius: at(N.seat.radius, wide.radius),
    face: Math.round(at(N.seat.face, wide.face)),
    label: at(N.seat.label, wide.label),
    bomb: {
      width: at(N.bomb.width, W.bomb.width),
      height: at(N.bomb.height, W.bomb.height),
      top: at(N.bomb.top, W.bomb.top),
    },
    panelGap: at(N.panelGap, W.panelGap),
  };
}
export type SprengjaRing = ReturnType<typeof sprengjaRing>;
