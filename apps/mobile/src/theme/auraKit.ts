// The airy look's component kit, value for value from docs/design/aura/project/aura.css (the
// canvas's classes: .display, .glass, .btn, .chip, .tag, .round, .av, .thumb, .li, .sec, .badge,
// .live). Light from `:root`, dark from `.night` (the canvas's dark side). Components in
// src/aura/kit/ read only these.
import type { TextStyle } from 'react-native';

const F = {
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

// A text style: the canvas's size and line, its weight's file, letter spacing in em.
const t = (w: keyof typeof F, size: number, line: number, em = 0): TextStyle => ({
  fontFamily: F[w],
  fontSize: size,
  lineHeight: line,
  letterSpacing: em * size,
});

// The large lines are at least the face's own height (ascent 1.038 + descent 0.222 of the size):
// lower, Android cut the tails off (j, g, y, ş, ç; "Mesajlar", the owner's report, 28 Ekim).
export const KIT_TYPE = {
  display: t(500, 32, 42, -0.025),
  // Keşfet's question (.display at 30).
  displaySm: t(500, 30, 38, -0.025),
  title: t(600, 21, 27, -0.015),
  // The first screen's line (Main: 36, 500, -0.03em) and its wordmark (24, 800).
  welcome: t(500, 36, 46, -0.03),
  wordmarkSm: t(800, 24, 28, -0.04),
  // A scene's title (Mekan: .title at 20).
  hero: t(600, 20, 26, -0.015),
  // A digit of the code (Kod: 26, 600).
  code: t(600, 26, 33),
  // The phone number as it is typed (Telefon: 21, 600, 0.04em).
  phone: t(600, 21, 26, 0.04),
  // The incoming request's line (MasaIstek: .h3 at 17).
  requestTitle: t(600, 17, 23, -0.005),
  // A game's name on its card (Masa: 24, 700, -0.02em).
  gameName: t(700, 24, 31, -0.02),
  // A venue's name on its page (KesfetMekan: .display at 28).
  venueTitle: t(500, 28, 36, -0.025),
  // The table's name on Masa (.title at 26, 500).
  tableTitle: t(500, 26, 33, -0.015),
  h3: t(600, 16, 22, -0.005),
  // A section's heading (.sec .h3 at 18).
  sec: t(600, 18, 24, -0.005),
  body: t(500, 15, 22),
  fine: t(500, 13, 18),
  eyebrow: t(600, 12, 16, 0.02),
  stamp: t(600, 11, 14),
  strong: { fontFamily: F[600] } as TextStyle,
  btn: t(600, 16, 20),
  btnSm: t(600, 14, 18),
  chip: t(600, 13, 17),
  tag: t(600, 12, 16),
  badge: t(700, 11, 14),
  live: t(600, 13, 17),
  msg: t(500, 15, 21),
  day: t(600, 12, 16),
  wordmark: t(800, 26, 30, -0.04),
  av: {
    md: t(700, 15, 19),
    sm: t(700, 12, 16),
    // A conversation's face in Mesajlar (52).
    row: t(700, 18, 22),
    lg: t(700, 22, 26),
    xl: t(700, 32, 38),
    // Profil's two faces (104).
    big: t(700, 38, 44),
  },
} as const;

export type KitTextVariant = Exclude<keyof typeof KIT_TYPE, 'av' | 'strong'>;

const SHADOW = {
  glass: '0px 18px 44px rgba(54, 36, 140, 0.10), 0px 2px 6px rgba(54, 36, 140, 0.05)',
  glassDark: '0px 18px 44px rgba(0, 0, 0, 0.35)',
  soft: '0px 6px 16px rgba(54, 36, 140, 0.10)',
  chip: '0px 4px 12px rgba(54, 36, 140, 0.07)',
  av: '0px 4px 12px rgba(54, 36, 140, 0.14)',
  thumb: '0px 6px 14px rgba(54, 36, 140, 0.16)',
  primary: '0px 12px 26px rgba(106, 71, 245, 0.34)',
  send: '0px 10px 22px rgba(20, 17, 43, 0.24)',
  me: '0px 10px 22px rgba(106, 71, 245, 0.24)',
  disk: '0px 14px 30px rgba(54, 36, 140, 0.22)',
} as const;

export const KIT = {
  light: {
    ink: '#14112B',
    muted: '#5E5878',
    hair: 'rgba(20, 17, 43, 0.07)',
    glass: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    glassEdge: 'rgba(255, 255, 255, 0.86)',
    glassShadow: SHADOW.glass,
    // The light top edge of glass and of the primary (none in the dark: a white line on every
    // object, the owner's call, 28 Ekim).
    glassInset: 'inset 0px 1px 0px #FFFFFF',
    primaryInset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.28)',
    // A raised white (buttons, chips, round buttons, glassy tags).
    raised: 'rgba(255, 255, 255, 0.74)',
    raisedRound: 'rgba(255, 255, 255, 0.72)',
    raisedChip: 'rgba(255, 255, 255, 0.70)',
    raisedEdge: '#FFFFFF',
    raisedShadow: SHADOW.soft,
    chipShadow: SHADOW.chip,
    chipOn: '#14112B',
    onChipOn: '#FFFFFF',
    day: 'rgba(255, 255, 255, 0.60)',
    field: 'rgba(255, 255, 255, 0.74)',
    // Masa's tabs: the chosen one raised white.
    segOn: '#FFFFFF',
    segShadow: '0px 4px 12px rgba(54, 36, 140, 0.12)',
    // .sheet over .scrim (Masa kur, Giriş): a frosted white card floating 10 from the edges.
    // Opaque (the owner's call, 29 Ekim: Bildirimler and Ayarlar showed too much of the screen
    // under them); sheetBase under the gradient keeps it so.
    // A soft lilac, a shade under white (the owner's report, 29 Ekim: on a white sheet its white
    // cards, lists and buttons ran together): the glass in it stands out as on a screen.
    sheet: 'linear-gradient(180deg, rgba(244, 242, 251, 1), rgba(236, 233, 247, 1))',
    sheetBase: '#F0EEF9',
    // The sheet's top and bottom colours, for what scrolls under its edges to fade into.
    sheetFadeTop:
      'linear-gradient(180deg, rgba(244, 242, 251, 1) 0%, rgba(244, 242, 251, 1) 55%, rgba(244, 242, 251, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(236, 233, 247, 0), rgba(236, 233, 247, 1))',
    grab: 'rgba(20, 17, 43, 0.16)',
    scrim: 'rgba(20, 17, 43, 0.30)',
  },
  dark: {
    ink: '#F3F0FF',
    muted: '#C9C3E6',
    hair: 'rgba(255, 255, 255, 0.08)',
    glass: 'linear-gradient(180deg, rgba(40, 33, 82, 0.72), rgba(28, 24, 56, 0.56))',
    glassEdge: 'rgba(255, 255, 255, 0.14)',
    glassShadow: SHADOW.glassDark,
    glassInset: '',
    primaryInset: '',
    raised: 'rgba(255, 255, 255, 0.10)',
    // A shade stronger than the canvas: the round buttons on Masa's dark stage were hard to see.
    raisedRound: 'rgba(255, 255, 255, 0.14)',
    raisedChip: 'rgba(255, 255, 255, 0.10)',
    raisedEdge: 'rgba(255, 255, 255, 0.16)',
    raisedShadow: '',
    chipShadow: '',
    chipOn: '#F3F0FF',
    onChipOn: '#14112B',
    day: 'rgba(255, 255, 255, 0.10)',
    field: 'rgba(255, 255, 255, 0.10)',
    segOn: 'rgba(255, 255, 255, 0.16)',
    segShadow: '',
    // A shade under the cards, as in the light (the cards' glass is the old sheet's colour).
    sheet: 'linear-gradient(180deg, rgba(30, 25, 64, 1), rgba(21, 18, 45, 1))',
    sheetBase: '#1B1739',
    sheetFadeTop:
      'linear-gradient(180deg, rgba(30, 25, 64, 1) 0%, rgba(30, 25, 64, 1) 55%, rgba(30, 25, 64, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(21, 18, 45, 0), rgba(21, 18, 45, 1))',
    grab: 'rgba(255, 255, 255, 0.20)',
    scrim: 'rgba(8, 6, 20, 0.55)',
  },
  // The same in both schemes.
  primary: '#6A47F5',
  onPrimary: '#FFFFFF',
  primaryShadow: SHADOW.primary,
  // The send button's arrow on the ink (Dm: send-capsule.svg).
  sendA: '#B9A6FF',
  sendB: '#FF8FB6',
  // The lines beside "Yeni mesaj" in a chat.
  freshLine: 'rgba(255, 79, 139, 0.40)',
  // A new invite in Bildirimler: the brand's soft gradient.
  inviteGround: 'linear-gradient(135deg, rgba(123, 92, 255, 0.14), rgba(255, 79, 139, 0.10))',
  // The incoming request's card floats deeper (MasaIstek).
  requestShadow: '0px 30px 60px rgba(54, 36, 140, 0.22)',
  // Message bubbles, never see-through (the owner's call, 29 Ekim): the person's own white (a soft
  // off-white in the dark) with ink words; the others' in the chat's colour, white words: the DM
  // blue, the venue chat green, the table chat purple (deeper in the dark).
  bubble: {
    light: {
      mine: '#FFFFFF',
      mineInk: '#14112B',
      mineMuted: '#6E6890',
      mineEdge: 'rgba(20, 17, 43, 0.06)',
      mineShadow: '0px 4px 12px rgba(54, 36, 140, 0.10)',
      dm: '#2F7CF6',
      mekan: '#1E9A5C',
      masa: '#6A47F5',
      themInk: '#FFFFFF',
      themMuted: 'rgba(255, 255, 255, 0.80)',
    },
    dark: {
      mine: '#ECE9F8',
      mineInk: '#14112B',
      mineMuted: '#5E5878',
      mineEdge: 'rgba(255, 255, 255, 0)',
      mineShadow: '0px 4px 12px rgba(0, 0, 0, 0.30)',
      dm: '#1E56B8',
      mekan: '#146B42',
      masa: '#4B33B8',
      themInk: '#FFFFFF',
      themMuted: 'rgba(255, 255, 255, 0.74)',
    },
  },
  // Another's bubble's soft shadow, in its colour.
  chatShadow: {
    dm: '0px 4px 12px rgba(47, 124, 246, 0.22)',
    mekan: '0px 4px 12px rgba(30, 154, 92, 0.22)',
    masa: '0px 4px 12px rgba(106, 71, 245, 0.22)',
  },
  // A photo opened large over the screen (Profil, a person's profile).
  photoScrim: 'rgba(8, 6, 20, 0.90)',
  // A chosen row's ring (CheckIn: the spot).
  primaryRing: 'rgba(106, 71, 245, 0.14)',
  pink: '#FF4F8B',
  pinkRing: 'rgba(255, 79, 139, 0.18)',
  success: '#1C8C4E',
  successRing: 'rgba(28, 140, 78, 0.16)',
  danger: '#C8331F',
  white: '#FFFFFF',
  sendShadow: SHADOW.send,
  meShadow: SHADOW.me,
  diskShadow: SHADOW.disk,
  diskRing: 'rgba(255, 255, 255, 0.90)',
  avShadow: SHADOW.av,
  thumbShadow: SHADOW.thumb,
  // .av c1 … c5: a face without a photo, a colour from its name.
  avColors: [
    'linear-gradient(145deg, #8F75FF, #6A47F5)',
    'linear-gradient(145deg, #FF7EA8, #E83C78)',
    'linear-gradient(145deg, #FFC66E, #F09A1F)',
    'linear-gradient(145deg, #5FC6A0, #1C8C4E)',
    'linear-gradient(145deg, #6FB7E8, #2F7FC0)',
  ],
  // .tag colours: ground and text.
  tags: {
    purple: { bg: 'rgba(123, 92, 255, 0.12)', fg: '#4A2FD0' },
    pink: { bg: 'rgba(255, 79, 139, 0.12)', fg: '#B0124F' },
    amber: { bg: 'rgba(255, 181, 71, 0.18)', fg: '#7A4300' },
    green: { bg: 'rgba(28, 140, 78, 0.12)', fg: '#0F5C31' },
  },
  tagsDark: {
    purple: { bg: 'rgba(156, 134, 255, 0.20)', fg: '#D9D0FF' },
    pink: { bg: 'rgba(255, 126, 168, 0.20)', fg: '#FFD0E0' },
    amber: { bg: 'rgba(255, 181, 71, 0.22)', fg: '#FFE2B8' },
    green: { bg: 'rgba(95, 198, 160, 0.20)', fg: '#C9F2DF' },
  },
  // Today's event on Keşfet's card: a soft amber ground.
  eventGround: 'rgba(255, 181, 71, 0.14)',
  // Bitir and Ayrıl on Masa's bar.
  endInk: '#A8301A',
  endInkDark: '#FF9B8A',
  // Masa's header: the stage's height (under the status bar), its bottom corners and the table.
  stage: { height: 250, radius: 36, disk: 140, diskRadius: 44, diskBottom: 54, frame: 390 },
  // A nick's colour in a line of the venue chat (Mekan: kapsul-sn19 in amber's ink).
  nickInk: '#9A4A00',
  nameInk: '#B0124F',
  size: {
    glassRadius: 28,
    glassRadiusSm: 20,
    pad: 18,
    padLg: 22,
    btn: 54,
    btnSm: 38,
    btnPadX: 24,
    btnPadXSm: 16,
    btnGap: 8,
    chip: 32,
    chipPadX: 13,
    chipGap: 6,
    chipsGap: 8,
    tag: 24,
    tagPadX: 9,
    tagGap: 4,
    round: 44,
    av: { sm: 32, md: 44, row: 52, lg: 64, xl: 96, big: 104 },
    stackOverlap: 10,
    faceCard: 196,
    avRing: 2,
    avRingXl: 3,
    thumb: 60,
    thumbRadius: 18,
    badge: 20,
    badgePadX: 6,
    dot: 8,
    dotRing: 4,
    liPadY: 12,
    liPadX: 16,
    liGap: 12,
    listPadY: 4,
    secPadTop: 4,
    secPadX: 2,
    rowGap: 12,
    side: 20,
    icon: 22,
    iconSm: 18,
    disk: 4,
    seg: 26,
    sheetInset: 10,
    sheetRadius: 36,
    sheetPadTop: 12,
    sheetPadX: 20,
    sheetPadBottom: 22,
    sheetGap: 14,
    grabW: 40,
    grabH: 5,
    msgRadius: 22,
    msgTail: 8,
    msgPadX: 15,
    msgPadY: 11,
    field: 54,
    phoneField: 72,
    fieldPadX: 20,
    dayPadX: 12,
    dayPadY: 4,
    barPad: 8,
    barRadius: 30,
    barGap: 10,
    pill: 44,
    pillPadX: 14,
    eventCard: 210,
    eventPad: 12,
    segPad: 5,
    segGap: 4,
    hair: 1,
    edge: 1,
  },
} as const;

// Shadows in one `boxShadow`, the empty ones left out (a scheme without a top edge).
export function shadowList(...parts: (string | undefined)[]): string | undefined {
  const list = parts.filter((p): p is string => !!p);
  return list.length > 0 ? list.join(', ') : undefined;
}
