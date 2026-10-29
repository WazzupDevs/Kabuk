import type { VampirRole } from '../../../../supabase/functions/_shared/pure/vampir.ts';
import type { TextStyle } from 'react-native';

import { GLASS, type SandTone } from './vampirArt.ts';

// Vampir Köylü's round table (the owner's choice, 29 Ekim: docs/design/vampir/yuvarlak-masa.html,
// "birebir, animations too"): the table seen from above with everyone round it, picks and votes as
// lines across it, the time in an hourglass in a medallion at its middle. Every value here is the
// file's; the design is drawn on a 360 dp wide phone and the table scales with the screen.

const F = {
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
  ink: '#14112B',
  round: 'rgba(255, 255, 255, 0.14)',
  roundOn: 'rgba(255, 255, 255, 0.3)',
  namePill: 'rgba(12, 8, 22, 0.66)',
  pick: '#FFD58A',
  ally: '#E0245E',
  count: '#FFB547',
  fang: '#E0245E',
  tick: '#2FBF7F',
  cross: '#4A4458',
  mainFill: '#FFF4E2',
  mainInk: '#2A1A4A',
  ghostEdge: 'rgba(255, 255, 255, 0.5)',
  cardEdge: '#FFF4E2',
  // The lines: a vampire's mate's pick, the person's own pick at night, the day's votes, the
  // person's vote before "Oyumu ver".
  line: { mate: '#FF5C8A', mine: '#FFD58A', vote: '#FF9F5A', myVote: '#FFE3A6' },
  medalLabel: 'rgba(255, 255, 255, 0.72)',
  danger: '#FFB4B4',
  // Each role's colour on the table (the file's ROLE).
  roles: {
    vampir: '#E0245E',
    doktor: '#1FA463',
    gozcu: '#1990BE',
    koylu: '#6E4FF0',
    soytari: '#E07F12',
  } satisfies Record<VampirRole, string>,
} as const;

export const TABLE_SHADOW = {
  button: '0px 8px 22px rgba(0, 0, 0, 0.3)',
  card: '0px 24px 48px rgba(0, 0, 0, 0.55)',
  pick: '0px 0px 22px 6px rgba(255, 213, 138, 0.65)',
  pickOn: '0px 0px 30px 10px rgba(255, 213, 138, 0.9)',
  low: '0px 0px 34px 8px rgba(255, 77, 109, 0.45)',
} as const;

// The light running at the end of the medallion's edge, in the sand's colour.
export function sparkShadow(tone: SandTone): string {
  return `0px 0px 10px 3px ${GLASS.sand[tone].top}`;
}

export const TABLE_TYPE = {
  bar: t(800, 16, 20),
  title: {
    ...t(800, 21, 26, -0.01),
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  } as TextStyle,
  note: { ...t(600, 13, 18), opacity: 0.82 } as TextStyle,
  roleName: t(800, 22, 28),
  name: t(800, 10, 13),
  role: t(800, 10, 13),
  badge: t(800, 11, 14),
  foot: { ...t(700, 13, 17), opacity: 0.88 } as TextStyle,
  medal: t(700, 11, 14),
  btn: t(800, 16, 20),
} as const;

// How the table's parts move (the file's CSS, value for value).
export const TABLE_MOTION = {
  // The chosen seat's glow breathes (glow 2s ease-in-out infinite).
  pickMs: 2000,
  // The person's own line before it counts flows towards its end (flow 1.2s linear: 28 along).
  flowMs: 1200,
  flowRun: 28,
  flowDash: 2,
  flowGap: 8,
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
  // One time of day crosses into the next.
  groundMs: 450,
} as const;
