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

export const KIT_TYPE = {
  display: t(500, 32, 38, -0.025),
  // Keşfet's question (.display at 30).
  displaySm: t(500, 30, 36, -0.025),
  title: t(600, 21, 27, -0.015),
  // A scene's title (Mekan: .title at 20).
  hero: t(600, 20, 26, -0.015),
  // A digit of the code (Kod: 26, 600).
  code: t(600, 26, 32),
  // The phone number as it is typed (Telefon: 21, 600, 0.04em).
  phone: t(600, 21, 26, 0.04),
  // The incoming request's line (MasaIstek: .h3 at 17).
  requestTitle: t(600, 17, 23, -0.005),
  // A venue's name on its page (KesfetMekan: .display at 28).
  venueTitle: t(500, 28, 34, -0.025),
  // The table's name on Masa (.title at 26, 500).
  tableTitle: t(500, 26, 32, -0.015),
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
    sheet: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.88))',
    grab: 'rgba(20, 17, 43, 0.16)',
    scrim: 'rgba(20, 17, 43, 0.20)',
  },
  dark: {
    ink: '#F3F0FF',
    muted: '#C9C3E6',
    hair: 'rgba(255, 255, 255, 0.08)',
    glass: 'linear-gradient(180deg, rgba(40, 33, 82, 0.72), rgba(28, 24, 56, 0.56))',
    glassEdge: 'rgba(255, 255, 255, 0.14)',
    glassShadow: SHADOW.glassDark,
    raised: 'rgba(255, 255, 255, 0.10)',
    raisedRound: 'rgba(255, 255, 255, 0.10)',
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
    sheet: 'linear-gradient(180deg, rgba(40, 33, 82, 0.97), rgba(28, 24, 56, 0.95))',
    grab: 'rgba(255, 255, 255, 0.20)',
    scrim: 'rgba(8, 6, 20, 0.45)',
  },
  // The same in both schemes.
  primary: '#6A47F5',
  onPrimary: '#FFFFFF',
  primaryShadow: SHADOW.primary,
  primaryInset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.28)',
  // The lines beside "Yeni mesaj" in a chat.
  freshLine: 'rgba(255, 79, 139, 0.40)',
  // A new invite in Bildirimler: the brand's soft gradient.
  inviteGround: 'linear-gradient(135deg, rgba(123, 92, 255, 0.14), rgba(255, 79, 139, 0.10))',
  // The incoming request's card floats deeper (MasaIstek).
  requestShadow: '0px 30px 60px rgba(54, 36, 140, 0.22)',
  // A chosen row's ring (CheckIn: the spot).
  primaryRing: 'rgba(106, 71, 245, 0.14)',
  glassInset: 'inset 0px 1px 0px #FFFFFF',
  pink: '#FF4F8B',
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
  stage: { height: 330, radius: 36, disk: 140, diskRadius: 44, diskBottom: 54, frame: 390 },
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
