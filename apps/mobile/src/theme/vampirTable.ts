import type { TextStyle } from 'react-native';

import { GLASS, type SandTone } from './vampirArt.ts';

// Vampir Köylü's capsule table (Aura v83: VampirRolun, VampirGece, VampirSabah, VampirOylama,
// VampirSonuc, VampirOylama12): the room and the table seen from above, everyone round it with
// their card and candle in front of them, the phase's content at the table's middle. Every value
// here is the panels'; the design is drawn on a 360 × 760 phone and the scene scales with the
// screen. The day's and the verdict's middle (VampirGunduz, VampirEleme, not redrawn) keep the
// hourglass and the medallion (TABLE_SHADOW.low, TABLE_MOTION, GLASS).

const F = {
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

// A text style: size and line (the face's own height, 1.26 of the size, where the file has none).
const t = (w: keyof typeof F, size: number, line: number, em = 0): TextStyle => ({
  fontFamily: F[w],
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

export { TABLE } from './vampirTableSize.ts';
export * from './vampirArt.ts';

export const TABLE_INK = {
  white: '#FFFFFF',
  ink: '#141016',
  cream: '#FFF0D2',
  // The seats' marks: the night's pick and the end's winners, a vampire's mates, the vote counts.
  pink: '#FF4F8B',
  ally: '#E0245E',
  amber: '#FFB547',
  amberInk: '#2A1404',
  // The name pill (the panels' .nm), and a dead person's name.
  namePill: 'rgba(20, 10, 4, 0.82)',
  nameEdge: 'rgba(201, 161, 90, 0.55)',
  name: '#F6E4B8',
  deadName: 'rgba(246, 228, 184, 0.5)',
  // A card's edge, the person's empty place while their card is at the middle.
  cardEdge: 'rgba(242, 230, 200, 0.55)',
  bigCardEdge: 'rgba(255, 255, 255, 0.25)',
  // The morning's dead at the middle (the panels' .vict).
  victimEdge: 'rgba(255, 240, 210, 0.4)',
  slotEdge: 'rgba(242, 230, 200, 0.45)',
  slot: 'rgba(0, 0, 0, 0.18)',
  // The stage's text, the dial's number, and its last seconds.
  stage: '#F6F1E4',
  stageNote: 'rgba(246, 241, 228, 0.78)',
  stageSoft: 'rgba(246, 241, 228, 0.7)',
  dial: '#FFF1D0',
  dialLow: '#FF7EA8',
  textShadow: 'rgba(0, 0, 0, 0.8)',
  // The phase's pill (the panels' .pill, .pill.sun/.day, .pill.end).
  pill: {
    night: { fill: 'rgba(255, 79, 139, 0.2)', ink: '#FFA8C4', edge: 'rgba(255, 79, 139, 0.5)' },
    day: { fill: 'rgba(255, 181, 71, 0.22)', ink: '#FFD08A', edge: 'rgba(255, 181, 71, 0.55)' },
    end: { fill: 'rgba(255, 79, 139, 0.26)', ink: '#FFB6CC', edge: 'rgba(255, 79, 139, 0.6)' },
  },
  // The round buttons at the top (the panels' .x), and the glass ones at the foot (.btn.sec).
  round: 'rgba(20, 10, 4, 0.7)',
  roundOn: 'rgba(60, 34, 14, 0.85)',
  roundEdge: 'rgba(201, 161, 90, 0.6)',
  roundInk: '#F6E4B8',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassEdge: 'rgba(255, 255, 255, 0.16)',
  // The foot's dark fall under the buttons (the panels' .foot).
  foot: 'linear-gradient(180deg, rgba(8, 5, 3, 0) 0%, rgba(8, 5, 3, 0.72) 60%, rgba(8, 5, 3, 0.72) 100%)',
  // Behind the scene where the screen is taller or wider than the design's phone.
  ground: '#140C08',
  danger: '#FFB4B4',
  medalLabel: 'rgba(255, 255, 255, 0.72)',
} as const;

export const TABLE_SHADOW = {
  face: '0px 3px 8px rgba(0, 0, 0, 0.5)',
  pick: '0px 0px 22px 6px rgba(255, 79, 139, 0.7)',
  pickOn: '0px 0px 30px 10px rgba(255, 79, 139, 0.9)',
  win: '0px 0px 18px 4px rgba(255, 79, 139, 0.6)',
  card: '0px 3px 6px rgba(0, 0, 0, 0.6)',
  vampirCard: '0px 0px 14px 0px rgba(255, 79, 139, 0.8)',
  bigCard: '0px 18px 30px rgba(0, 0, 0, 0.7)',
  bigCardGlow: '0px 0px 40px 0px rgba(255, 180, 90, 0.3)',
  voter: '0px 2px 4px rgba(0, 0, 0, 0.6)',
  candidate: '0px 4px 8px rgba(0, 0, 0, 0.6)',
  target: '0px 0px 22px 6px rgba(255, 79, 139, 0.6)',
  winner: '0px 0px 18px 0px rgba(255, 79, 139, 0.6)',
  round: '0px 3px 8px rgba(0, 0, 0, 0.4)',
  low: '0px 0px 34px 8px rgba(255, 77, 109, 0.45)',
} as const;

// The light running at the end of the medallion's edge, in the sand's colour.
export function sparkShadow(tone: SandTone): string {
  return `0px 0px 10px 3px ${GLASS.sand[tone].top}`;
}

const shade = { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 } };

export const TABLE_TYPE = {
  // The stage (the panels' .stage .pill, .h, .h.big, .s, .rdy, .mate).
  pill: t(800, 10, 18, 0.06),
  title: { ...t(800, 16, 19, -0.01), ...shade, textShadowRadius: 4 } as TextStyle,
  big: { ...t(800, 20, 24, -0.01), ...shade, textShadowRadius: 4 } as TextStyle,
  note: { ...t(500, 11, 15), ...shade, textShadowRadius: 3 } as TextStyle,
  ready: t(700, 11, 14),
  mate: t(600, 10, 13),
  // The dial's number (the panels' .num, .num.sm).
  dial: {
    ...t(800, 17, 22),
    fontVariant: ['tabular-nums'],
    ...shade,
    textShadowRadius: 3,
  } as TextStyle,
  dialSmall: {
    ...t(800, 13, 18),
    fontVariant: ['tabular-nums'],
    ...shade,
    textShadowRadius: 3,
  } as TextStyle,
  // The seats (the panels' .nm, .seat.sm .nm, .nm b, .cnt).
  name: t(800, 10, 17),
  nameSmall: t(800, 9, 15),
  count: t(800, 9.5, 13),
  // The night's target's name (.tn), the vote's candidates' names (.cl).
  tag: t(800, 11, 18),
  // The glass sign at the foot (.sign), the error over the buttons.
  sign: t(600, 14, 18),
  glassBtn: t(600, 16, 20),
  foot: t(700, 13, 17),
  medal: t(700, 11, 14),
} as const;

// How the table's parts move (the file's CSS, value for value).
export const TABLE_MOTION = {
  // The chosen seat's glow breathes (glow 2s ease-in-out infinite).
  pickMs: 2000,
  // The sand's stream (.32s linear: 6 along), the grains (.9s ease-in, the second .45s later).
  streamMs: 320,
  grainMs: 900,
  grainDelay: 450,
  grainShow: 0.15,
  grainFall: 30,
  // The last ten seconds: the glass shakes (.5s, 4°), the edge turns red (.4s), the medallion
  // throbs (1s).
  lowSeconds: 10,
  shakeMs: 500,
  shakeDeg: 4,
  rimRedMs: 400,
  pulseMs: 1000,
  // Time's up: the glass turns over (.8s, cubic-bezier(.6,-.35,.3,1.35)).
  flipMs: 800,
  flip: [0.6, -0.35, 0.3, 1.35] as const,
  easeIn: [0.42, 0, 1, 1] as const,
  // The role card turns over while held (as before).
  cardMs: 550,
  card: [0.34, 1.3, 0.64, 1] as const,
  // One phase's room crosses into the next (as before).
  groundMs: 450,
} as const;
