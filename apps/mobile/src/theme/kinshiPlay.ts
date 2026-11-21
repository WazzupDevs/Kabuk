import { KIT } from './auraKit';
import type { ColorScheme } from './tokens';

// Kinshi's describer turn and its end, as the new interface boards draw them (yeni arayüz tuvali,
// 17 Kasım: KinshiAnlatici 143, KinshiSonuc 144; 390 × 844, the status bar 47 high). The
// buttons' heights are the kit's (KIT.size): the boards' 56 high Pas, Doğru, Masaya dön and
// Yeniden oyna are the long one.
const F = {
  500: 'PlusJakartaSans_500Medium',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

const t = (w: keyof typeof F, size: number, line: number, em = 0) => ({
  fontFamily: F[w],
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

export const KINSHI_PLAY = {
  // The bar (`.gt`): 5 under the status bar, 16 from the sides (4 outside the page's 20), its
  // parts 10 apart; the game's logo 56 × 40, 12 round.
  bar: { top: 5, side: 16, gap: 10, logoW: 56, logoH: 40, logoRadius: 12 },
  // The timer (`.tmr`): 40 high, 8 in on the icon's side and 12 on the other, the icon 22, 4 to the
  // time.
  timer: { height: 40, padLeft: 8, padRight: 12, gap: 4, icon: 22 },
  // The stage (`.gs`): 20 under the bar, its parts 12 apart.
  stage: { top: 20, gap: 12 },
  // The team scores (`.sc`): 36 high, the dot 10, 6 to the words, 8 apart.
  score: { height: 36, dot: 10, gap: 6, between: 8 },
  // The word's card (`.card`, `.wcard`): 24 over, 20 in; the word 6 under its label, 14 over the
  // forbidden words (`.fb`): 40 high, 14 round, 6 apart.
  card: { padTop: 24, padX: 20, padBottom: 24, wordTop: 6, wordBottom: 14 },
  forbidden: { height: 40, radius: 14, gap: 6 },
  // The counts (`.stat`): the small tags 8 apart.
  stat: { gap: 8 },
  // The foot (`.gf`): the buttons 8 apart.
  foot: { gap: 8 },
  // The end (`.rs-h`, `.rl`, `.rr`): the heading and its line 4 apart; the stage 16 between its
  // parts; a row 56 high at least, 12 between its parts, the face 40, the hairline from 52 (the
  // face's 40 and 12).
  end: { gap: 16, headGap: 4, row: 56, rowGap: 12, face: 40, hairIn: 52, secTop: 4 },
  type: {
    // `.gn b` and `.gn span`.
    title: t(700, 17, 22),
    line: t(500, 13, 18),
    // `.tmr`.
    clock: { ...t(700, 15, 20), fontVariant: ['tabular-nums'] as 'tabular-nums'[] },
    // `.sc span`.
    score: t(700, 14, 18),
    // `.kick`.
    kick: t(700, 12, 16, 0.4 / 12),
    // `.wcard .w`.
    word: t(800, 34, 40, 0.5 / 34),
    // `.fb span`.
    forbidden: t(700, 15, 20),
    // `.rs-h h1`.
    heading: t(800, 30, 36, -0.6 / 30),
    // `.rs-h p`.
    headLine: t(500, 14, 20),
    // `.sec`.
    sec: t(700, 12, 16, 0.24 / 12),
    // `.rr p` and its line.
    rowName: t(700, 15, 20),
    rowLine: t(500, 13, 17),
  },
} as const;

// The forbidden words' ground and ink (`.fb span`; the light's from --danger).
export const KINSHI_FORBIDDEN: Record<ColorScheme, { bg: string; ink: string }> = {
  light: { bg: 'rgba(214, 64, 40, 0.08)', ink: KIT.danger },
  dark: { bg: 'rgba(255, 151, 126, 0.10)', ink: '#FF977E' },
};
