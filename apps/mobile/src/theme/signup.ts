// Kayıt akışı (yeni arayüz tuvali, 16 Kasım; docs/design/yeni-arayuz/project: KayitAcilis,
// KayitOnay, KayitTelefon, KayitKod, KayitKodHatali, KayitKodYeniden, KayitKodCokDeneme, KayitAd,
// KayitDogum, KayitDogumOnay, KayitCinsiyet, KayitFoto, KayitMetinler, KayitYasAlti; 390 × 844, the
// status bar 47 high), value for value. Flat ground (the canvas), no cards: the fields and the
// code's boxes are the surface with a 1 px inset line, the rows lie on the ground with a hairline
// between them. Pure data: no React Native import.

const F = {
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

type Type = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

const type = (w: keyof typeof F, size: number, line: number, spacing = 0): Type => ({
  fontFamily: F[w],
  fontSize: size,
  lineHeight: line,
  letterSpacing: spacing,
});

export const SIGNUP = {
  // The page's side (`.kc`: 20); the top row's (`.ktop`: 16 left, 20 right) 5 under the status
  // bar, its height 48; the title stands 12 under the row (`.kc` top 112 on a row ending at 100).
  side: 20,
  barSide: 16,
  barTop: 5,
  topRow: 48,
  rowGap: 14,
  // Under the top row the page starts 8 under its foot (the bar's own 4 under the row, then 8: the
  // board's 12); without a top row (Metinler güncellendi: `.kc` top 76) 29 under the status bar.
  contentTop: 8,
  contentTopBare: 29,
  // The step bar (`.stp`): seven segments 4 high, 2 round, 5 apart.
  step: { height: 4, radius: 2, gap: 5 },
  // The title (`.kh`: 32 / 800, -0.8 px; the line the face's own height) and the line under it
  // (`.kd`: 15 / 500, 8 under the title); a field's label (`.lab`: 13 / 600, 24 over it, 8 under)
  // and note (`.kn`: 13 / 500, 10 under the field).
  titleGap: 8,
  labelTop: 24,
  labelGap: 8,
  noteTop: 10,
  fieldTop: 18,
  // The foot (`.kft`: the buttons 56 high, 8 apart; its note 12 / 500 above or under them).
  footGap: 8,
  // A field (`.fl`): 56 high, 18 round, 18 in, the line 1 px (focused 2); the prefix with its
  // divider (12 in, 1 px line).
  field: { height: 56, radius: 18, padX: 18, gap: 10, line: 1, lineOn: 2, prefixIn: 12 },
  // The code's boxes (`.otp`): 58 high, 16 round, 8 apart; 18 under the line above.
  code: { height: 58, radius: 16, gap: 8, top: 18, caret: { width: 2, height: 26 } },
  // The line under the code (`.rs`: 14 / 600, 16 under the boxes); an error (`.er`: 12 under, its
  // icon 18, 8 from the words).
  resendTop: 16,
  error: { top: 12, icon: 18, gap: 8 },
  // The consents' and the choices' rows (`.cr`: 60 high, `.big` 68; 14 between the mark and the
  // words; the hairline from 38 in, the mark 24).
  row: {
    minHeight: 60,
    big: 68,
    gap: 14,
    hairIn: 38,
    mark: 24,
    boxRadius: 7,
    radioOn: 7,
    check: 18,
    listTop: 20,
  },
  // An info row (`.ir`: 9 over and under, 12 between its icon (22) and its words); the list 18
  // under the part above (`.irs`).
  info: { padY: 9, gap: 12, icon: 22, top: 18 },
  // The first screen (`.acx`: centred under the scene, the title 14 under the wordmark).
  welcome: { titleTop: 14, bodyMax: 320 },
  light: {
    ink: '#031B0B',
    muted: '#4A6550',
    field: '#FFFFFF',
    line: 'rgba(3, 27, 11, 0.08)',
    lineOn: '#031B0B',
    divider: 'rgba(3, 27, 11, 0.12)',
    hair: 'rgba(3, 27, 11, 0.10)',
    stepDone: '#031B0B',
    stepTrack: 'rgba(3, 27, 11, 0.12)',
    link: 'rgba(3, 27, 11, 0.35)',
    markLine: 'rgba(3, 27, 11, 0.28)',
    markOn: '#031B0B',
    onMarkOn: '#FFFFFF',
    danger: '#A8301A',
  },
  dark: {
    ink: '#EEF3F0',
    muted: '#A3AEA8',
    field: '#121614',
    line: 'rgba(255, 255, 255, 0.08)',
    lineOn: 'rgba(255, 255, 255, 0.94)',
    divider: 'rgba(255, 255, 255, 0.12)',
    hair: 'rgba(255, 255, 255, 0.10)',
    stepDone: 'rgba(255, 255, 255, 0.94)',
    stepTrack: 'rgba(255, 255, 255, 0.14)',
    link: 'rgba(238, 243, 240, 0.40)',
    markLine: 'rgba(255, 255, 255, 0.30)',
    markOn: 'rgba(255, 255, 255, 0.94)',
    onMarkOn: '#0B0E0D',
    danger: '#FF977E',
  },
} as const;

export const SIGNUP_TYPE = {
  // `.kh`: the line is the face's own height (ascent 1.038 + descent 0.222 of the size), as the
  // kit's large lines.
  title: type(800, 32, 41, -0.8),
  body: type(500, 15, 22),
  bodyLink: type(700, 15, 22),
  stepCount: type(600, 13, 18),
  label: type(600, 13, 18),
  note: type(500, 13, 18),
  fieldText: type(600, 18, 24, 0.2),
  prefix: type(600, 16, 22),
  prefixSmall: type(700, 11, 14, 0.4),
  counter: type(500, 13, 18),
  code: type(700, 24, 30),
  resend: type(600, 14, 20),
  resendLink: type(700, 14, 20),
  error: type(600, 14, 20),
  rowTitle: type(600, 15, 21),
  rowNote: type(500, 12, 16),
  read: type(700, 14, 20),
  info: type(500, 14, 20),
  infoSub: type(500, 13, 18),
  foot: type(500, 12, 16),
} as const;

// "0:42": the seconds left, as minutes and seconds (`.rs b`).
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
