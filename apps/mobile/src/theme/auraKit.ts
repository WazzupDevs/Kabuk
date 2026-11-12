// The airy look's component kit, value for value from docs/design/aura/project/aura.css (the
// canvas's classes: .display, .glass, .btn, .chip, .tag, .round, .av, .thumb, .li, .sec, .badge,
// .live). Light from `:root`, dark from `.night` (the canvas's dark side). Components in
// src/aura/kit/ read only these.
import type { TextStyle } from 'react-native';
import { BUTTON_GLASS } from './buttonGlass';

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
  // A profile's name and age (Profil: .display at 34).
  displaySm: t(500, 34, 43, -0.025),
  // Keşfet's question (.display at 34).
  displayLg: t(500, 34, 41, -0.025),
  // Mesajlar's title (.display at 36).
  displayXl: t(500, 36, 46, -0.025),
  // Keşfet's question (iskelet.md → 5.1: 36, 800; the board's -0.035em). The line stays the face's
  // own height (the board's 1.06 cut the tails off on Android, above).
  exploreTitle: t(800, 36, 46, -0.035),
  // Keşfet (tuval Kesfet, Harita): the line of the day (13, 700, 0.06em), the chips (14; 700 when
  // chosen), the place line (21, 800) and its count (13, 600), a venue's name (16, 700) and line
  // (13, 500), the bucket (12, 700), a map pin's name (11.5, 700).
  exploreEyebrow: t(700, 13, 17, 0.06),
  exploreChip: t(600, 14, 18),
  exploreChipOn: t(700, 14, 18),
  exploreSection: t(800, 21, 27, -0.02),
  exploreCount: t(600, 13, 17),
  exploreSort: t(600, 13, 17),
  placeName: t(700, 16, 20, -0.01),
  placeSub: t(500, 13, 17),
  bucket: t(700, 12, 16),
  // Semte Git on Keşfet: its eyebrow (11, 800, 0.1em), title (20, 800, 1.18) and note (13.5, 500,
  // 1.42).
  districtEyebrow: t(800, 11, 14, 0.1),
  districtTitle: t(800, 20, 24, -0.02),
  districtNote: t(500, 13.5, 19),
  // The small empty card (tuval Detay, Aktivite: 15.5/700, its sentence 13/500 at 1.4).
  emptyTitle: t(700, 15.5, 20),
  emptyNote: t(500, 13, 18),
  // A venue's page (tuval Detay): the name (31, 800, -0.03em; the line the face's own height, as
  // exploreTitle), the info line's pills (12.5, 700) and place (13.5, 600), the main button's words
  // (17, 800, -0.01em), the bar's name (15.5, 800, -0.015em).
  detailTitle: t(800, 31, 39, -0.03),
  detailPill: t(700, 12.5, 16),
  detailPlace: t(600, 13.5, 17),
  detailBtn: t(800, 17, 22, -0.01),
  barName: t(800, 15.5, 20, -0.015),
  // Aktiviteler (tuval Aktivite, Sohbet): the gift card's eyebrow (11, 800, 0.12em), title (21,
  // 800, 1.16 raised to the face's height) and button (14.5, 800); the tabs (15, 700); the game
  // sheet's title (22, 800, -0.025em), its note (13.5, 600, 1.42), its eyebrow (12, 800, 0.1em),
  // a person's line (12.5, 600), the small actions (13.5, 800; once pressed 700).
  giftEyebrow: t(800, 11, 14, 0.12),
  giftTitle: t(800, 21, 26, -0.02),
  giftBtn: t(800, 14.5, 18),
  tabsBoard: t(700, 15, 19),
  sheetGame: t(800, 22, 28, -0.025),
  sheetNote: t(600, 13.5, 19),
  sheetEyebrow: t(800, 12, 16, 0.1),
  personLine: t(600, 12.5, 16),
  actionSm: t(800, 13.5, 17),
  actionSmDone: t(700, 13.5, 17),
  // Mesajlar (tuval Mesajlar): a conversation's last line (14, 500); Bildirimler's line (15.5, 700;
  // what happened in it 500, `light`).
  inboxPreview: t(500, 14, 18),
  notice: t(700, 15.5, 20),
  // The DM (tuval Dm): a message (16, 500, 1.36), its time (11.5, 600), the day's pill (12.5, 700),
  // the bar's name (16.5, 800, -0.015em), the menu's rows (15.5, 600), the block's sheet: its title
  // (21, 800, -0.02em), its sentence (14, 500, 1.45) and its buttons (16.5, 800).
  msgDm: t(500, 16, 22),
  msgTime: t(600, 11.5, 15),
  dayPill: t(700, 12.5, 16),
  dmName: t(800, 16.5, 21, -0.015),
  menuRow: t(600, 15.5, 20),
  confirmTitle: t(800, 21, 27, -0.02),
  confirmNote: t(500, 14, 20),
  confirmBtn: t(800, 16.5, 21),
  // The profile pages (tuval Profil, Benim): the name (31, 800, -0.03em; the line the face's own
  // height, as detailTitle), "Arkadaşsınız" (13, 700), a badge (13.5, 700), Mesaj (17, 800), the
  // bar's name (16, 800, -0.015em); the own buttons' "+N" (10.5, 800); the ticket's number (13,
  // 700), its eyebrow (11.5, 800, 0.1em), the nick (20, 800, -0.02em) and its renewal (13, 600);
  // Set balonu's title (17, 800, -0.015em), its count (12.5, 800), its note (13.5, 500, 1.42) and a
  // slot's name (13, 700).
  profileName: t(800, 31, 39, -0.03),
  friendTag: t(700, 13, 17),
  badgeChip: t(700, 13.5, 17),
  profileBtn: t(800, 17, 22),
  personBar: t(800, 16, 20, -0.015),
  stackMore: t(800, 10.5, 13),
  ticketNo: t(700, 13, 17),
  ticketKicker: t(800, 11.5, 15, 0.1),
  ticketNick: t(800, 20, 25, -0.02),
  ticketNote: t(600, 13, 17),
  setTitle: t(800, 17, 22, -0.015),
  setCount: t(800, 12.5, 16),
  setNote: t(500, 13.5, 19),
  setSlot: t(700, 13, 17),
  // The `sayfa` pages on the boards (tuval Arkadaslar, Duzenle): the large title (34, 800,
  // -0.035em; the line the face's own height) and the line under it (14, 600); a friend's "since"
  // (13, 600); Profili düzenle's Kapak (13.5, 700), the birth date's row (15, 700), its note (12.5,
  // 500) and "Değiştirilemez" (13, 700); the fields' labels (13, 700), what is typed (16, 600; the
  // bio 16, 500, 1.4) and their note (12.5, 500, 1.45).
  pageTitle: t(800, 34, 42, -0.035),
  pageSub: t(600, 14, 18),
  friendSince: t(600, 13, 17),
  coverBtn: t(700, 13.5, 17),
  rowTitle: t(700, 15, 19),
  rowNote: t(500, 12.5, 17),
  rowLock: t(700, 13, 17),
  boxLabel: t(700, 13, 17),
  boxField: t(600, 16, 21),
  boxFieldMulti: t(500, 16, 22),
  boxNote: t(500, 12.5, 18),
  title: t(600, 21, 27, -0.015),
  // The first screen's line (Main: 36, 500, -0.03em) and its wordmark (24, 800).
  welcome: t(500, 36, 46, -0.03),
  wordmarkSm: t(800, 24, 28, -0.04),
  // A scene's title (Mekan: .title at 22).
  hero: t(600, 22, 28, -0.015),
  // Masa kur's title (.title at 24).
  sheetTitleLg: t(600, 24, 30, -0.015),
  // A digit of the code (Kod: 26, 600).
  code: t(600, 26, 33),
  // The phone number as it is typed (Telefon: 21, 600, 0.04em).
  phone: t(600, 21, 26, 0.04),
  // The incoming request's line (MasaIstek: .h3 at 17).
  requestTitle: t(600, 17, 23, -0.005),
  // A game's name on its card (Masa: 24, 700, -0.02em).
  gameName: t(700, 24, 31, -0.02),
  // A venue's name on its page (KesfetMekan: .display at 31).
  venueTitle: t(500, 31, 38, -0.025),
  // A venue's name on the check-in sheet (CheckIn: .title at 23).
  sheetTitle: t(600, 23, 29, -0.015),
  h3: t(600, 16, 22, -0.005),
  // The masked phone number on Hesap (`.h3.mono`: 0.04em).
  h3Mono: t(600, 16, 22, 0.04),
  // A section's heading (.sec .h3 at 18).
  sec: t(600, 18, 24, -0.005),
  // Keşfet's place line and Masa's lone note (.h3 at 19).
  secLg: t(600, 19, 24, -0.005),
  // Mekan's lobby headings (.sec .h3 at 21).
  secXl: t(600, 21, 27, -0.005),
  body: t(500, 15, 22),
  // Aura v71 YasalMetin (`.legal`): the long legal text.
  legal: t(500, 15, 24),
  // A venue's district under its name on its page (KesfetMekan: .body at 17).
  bodyLg: t(500, 17, 22),
  fine: t(500, 13, 18),
  // What is typed in Profili düzenle's fields (17/24).
  field: t(500, 17, 24),
  // A venue row's second line and its bucket (Keşfet: .fine at 14).
  fineLg: t(500, 14, 18),
  // A longer note at 14 (Mekan's scene, Masa kur's switch, Masa: .fine 14/20).
  note: t(500, 14, 20),
  eyebrow: t(600, 12, 16, 0.02),
  stamp: t(600, 11, 14),
  strong: { fontFamily: F[600] } as TextStyle,
  // A conversation's name and last line while unread (iskelet.md → 5.4).
  bold: { fontFamily: F[800] } as TextStyle,
  // "Henüz mesaj yok" (5.4): slanted (the face has no italic file; Android slants it).
  italic: { fontStyle: 'italic' } as TextStyle,
  // The plain part of a bold line (Bildirimler: "isteğini kabul etti" after the name).
  light: { fontFamily: F[500] } as TextStyle,
  btn: t(600, 16, 20),
  btnSm: t(600, 14, 18),
  // Mekan's "Masa kur" (44 high, 15).
  btnMid: t(600, 14, 18),
  chip: t(600, 13, 17),
  // U34: a field's label on a card (ProfilDuzenle `.lb`).
  fieldLabel: t(600, 13, 17),
  // Keşfet's kind chips (15).
  chipLg: t(600, 15, 19),
  // U19: Mekan's spot chip, 14.
  chipMd: t(600, 14, 18),
  tag: t(600, 12, 16),
  // A venue page's tags (14).
  // A venue page's tags over its scene (U17: 13).
  tagLg: t(600, 13, 17),
  badge: t(700, 11, 14),
  // The venue chat card's count (24 round, 12).
  badgeLg: t(700, 12, 15),
  live: t(600, 13, 17),
  // "şu an aktif" (500) and "Mekandasın" (15) on Mekan.
  liveSoft: t(500, 13, 17),
  // U19: Mekan's "Mekandasın", 14.
  liveLg: t(600, 14, 18),
  msg: t(500, 15, 21),
  // A message of emoji only, without a bubble (Telegram Android): one, and two or three. The
  // system's face (the emoji come from its colour font, not from ours) and a line 1.35 of the size:
  // with ours and 1.2, Android cut the emoji's top and right off (the owner's report, 6 Kasım).
  emojiOne: { fontSize: 40, lineHeight: 54 },
  emojiFew: { fontSize: 32, lineHeight: 44 },
  day: t(600, 12, 16),
  // A person's name under their face at Masa (`.mem`: 11/14 600).
  member: t(600, 11, 14),
  wordmark: t(800, 26, 30, -0.04),
  // iskelet.md → 5.11: Mekan's venue name alone, 23.
  venueName: t(800, 23, 28, -0.015),
  av: {
    xs: t(700, 9, 11),
    md: t(700, 15, 19),
    sm: t(700, 12, 16),
    member: t(700, 12, 16),
    list: t(700, 15, 19),
    seat: t(700, 20, 24),
    // A conversation's face in Mesajlar (52).
    row: t(700, 18, 22),
    // A conversation's face (tuval Mesajlar: 54) and the DM bar's (38).
    inbox: t(700, 19, 24),
    bar: t(700, 14, 18),
    lg: t(700, 22, 26),
    xl: t(700, 32, 38),
    // Profil's two faces (112).
    big: t(700, 40, 48),
    hero: t(700, 40, 48),
    edit: t(700, 30, 36),
  },
} as const;

export type KitTextVariant = Exclude<
  keyof typeof KIT_TYPE,
  'av' | 'strong' | 'bold' | 'italic' | 'light'
>;

// Aura v75 E4: in the narrow state (320 dp or the largest text, `lib/narrow.ts`) the eyebrow is 13,
// so it is the canvas's 17/22 at the largest text (1.3x).
export const EYEBROW_NARROW = t(600, 13, 17, 0.02);

// Aura v65 skall.css and ekran.css: green-tinted soft shadows (rgba(4, 73, 35) and the ink
// rgba(3, 27, 11)), the primary's glow in its own green in the light scheme. The dark scheme draws
// none, but under the primary a soft black one (the owner's report, 2 Kasım, 2.1: the green glow
// stood like neon on the black ground).
const SHADOW = {
  glass: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
  soft: '0px 6px 16px rgba(4, 73, 35, 0.10)',
  chip: '0px 6px 16px rgba(4, 73, 35, 0.10)',
  av: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  thumb: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  primary: '0px 12px 26px rgba(14, 135, 69, 0.34)',
  send: '0px 10px 22px rgba(3, 27, 11, 0.24)',
  me: '0px 10px 22px rgba(14, 135, 69, 0.24)',
  disk: '0px 14px 30px rgba(4, 73, 35, 0.22)',
  // skall.css --shadow-card: a riso picture standing on the screen (an empty state, a scene).
  card: '0px 10px 22px rgba(3, 27, 11, 0.07)',
} as const;

// Keşfet's venue icon: 52 with its 16 round (Keşfet: the list row's picture).
// U13: the venue's picture 56, 18 round, on its soft green shadow (Kesfet `.vbox`).
export const VENUE_THUMB = {
  size: 56,
  radius: 18,
  shadow: '0px 6px 14px rgba(4, 73, 35, 0.16)',
} as const;

export type { ButtonGlassKind } from './buttonGlass';

// A prominent and a danger button's words: 800 (iskelet.md → 2.1).
export const BTN_STRONG: TextStyle = { fontFamily: F[800] };

export const KIT = {
  // The buttons are glass (theme/buttonGlass.ts; iskelet.md → 2.1).
  button: BUTTON_GLASS,
  light: {
    ink: '#031B0B',
    muted: '#4A6550',
    hair: 'rgba(3, 27, 11, 0.07)',
    // A still placeholder for a line still loading (Mekan sohbeti kartı).
    placeholder: 'rgba(3, 27, 11, 0.08)',
    glass: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    // A card inside a sheet: plain white with a hairline, apart from the sheet's own white glass
    // (the owner's report, 2 Kasım, 8.1: the card and its buttons melted into the sheet).
    glassInSheet: 'linear-gradient(180deg, #FFFFFF, #FFFFFF)',
    glassInSheetEdge: 'rgba(3, 27, 11, 0.09)',
    // U21: a sheet's still information row (--surface2; MekanSecenekler `.srow.info`).
    infoRow: '#E6F0E8',
    glassEdge: 'rgba(255, 255, 255, 0.86)',
    glassShadow: SHADOW.glass,
    // The light top edge of glass and of the primary (none in the dark: a white line on every
    // object, the owner's call, 28 Ekim).
    glassInset: 'inset 0px 1px 0px #FFFFFF',
    primaryInset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.28)',
    // A raised white (buttons, chips, round buttons, glassy tags).
    raised: 'rgba(255, 255, 255, 0.74)',
    // A raised button inside a sheet: the sheet's card colour, apart from the sheet (8.1).
    raisedInSheet: '#FFFFFF',
    raisedRound: 'rgba(255, 255, 255, 0.74)',
    raisedChip: 'rgba(255, 255, 255, 0.74)',
    raisedEdge: '#FFFFFF',
    raisedShadow: SHADOW.soft,
    primaryShadow: SHADOW.primary,
    cardShadow: SHADOW.card,
    chipShadow: SHADOW.chip,
    chipOn: '#031B0B',
    onChipOn: '#FFFFFF',
    day: 'rgba(255, 255, 255, 0.74)',
    field: '#FFFFFF',
    // Profili düzenle's fields.
    fieldLg: '#FFFFFF',
    // U34: a field on a card: the surface, 1 divider inside.
    fieldOnCard: '#FFFFFF',
    fieldOnCardEdge: '#D6E6DA',
    // Masa's tabs: the chosen one raised white.
    segOn: '#FFFFFF',
    // The chosen part's words: the ink; in the dark #0B0E0D on the 94 % white.
    segOnInk: '#031B0B',
    segShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
    // In a sheet the track is sunk, so the chosen white shows (the owner's report, 10 Kasım:
    // Ayarlar's two switches were white on white).
    segTrackInSheet: 'linear-gradient(180deg, #E0EDE2, #E0EDE2)',
    // An empty step on a light ground (Paketler's page dots, the login bar's parts): --track
    // vanished on the pale canvas.
    emptyMark: 'rgba(3, 27, 11, 0.18)',
    // The sheet (U8): the glass (`.glass.sheet`) over a blurred scrim. Laid on the canvas so it stays
    // opaque (the owner's call, 29 Ekim: Bildirimler and Ayarlar showed too much under them); its
    // top and bottom colours are what scrolls under its edges fades into.
    sheet: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    sheetBase: '#EFF7F1',
    // The sheet and the menu on the live glass (iskelet.md → 2.2): the same face, over the frost.
    sheetFrost: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    // The sheet's top and bottom colours, for what scrolls under its edges to fade into.
    sheetFadeTop:
      'linear-gradient(180deg, rgba(251, 253, 252, 1) 0%, rgba(251, 253, 252, 1) 55%, rgba(251, 253, 252, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(247, 251, 248, 0), rgba(247, 251, 248, 1))',
    grab: '#C6E0CC',
    // A sheet's handle and its shadow (tuval Mesajlar, Dm, Sohbet, Ayarlar, Mekan: 40 × 5, ink 14 %;
    // 0 -8 40, ink 22 %).
    sheetGrab: 'rgba(3, 27, 11, 0.14)',
    sheetShadow: '0px -8px 40px rgba(3, 27, 11, 0.22)',
    scrim: 'rgba(3, 27, 11, 0.20)',
    // The switch off: --control.
    switchOff: '#C6E0CC',
    switchInset: 'inset 0px 1px 3px rgba(3, 27, 11, 0.10)',
    // Masa kur (aura v47): a text link and a note's warning on the sheet, at 4.5:1 or more.
    link: '#0B783D',
    warn: '#A8301A',
    // "Arkadaşsınız" on another person's profile (aura v50, ProfilBaskasi): a soft green pill.
    friendPill: '#CDEFD9',
    friendPillInk: '#0F5C31',
    // A disabled button (U10): the neutral fill and its label, never faded; on a card the same.
    disabled: '#DCE9DE',
    onDisabled: '#4A6550',
    disabledOnCard: '#DCE9DE',
    // .btn.danger: the soft red and its ink.
    dangerSoft: '#FBE1DB',
    onDangerSoft: '#A8301A',
    // Aura v71: the step dots of the sign-up (`--step-dot`).
    stepDot: 'rgba(17, 23, 20, 0.16)',
  },
  dark: {
    ink: '#EEF3F0',
    muted: '#A3AEA8',
    hair: 'rgba(255, 255, 255, 0.07)',
    placeholder: 'rgba(255, 255, 255, 0.10)',
    glass: '#121614',
    // U2: the card inside a sheet.
    glassInSheet: '#1B211F',
    glassInSheetEdge: 'rgba(255, 255, 255, 0.09)',
    infoRow: '#1B211F',
    glassEdge: 'rgba(255, 255, 255, 0.09)',
    glassShadow: '',
    glassInset: '',
    primaryInset: '',
    raised: '#121614',
    raisedInSheet: '#1B211F',
    // A shade stronger than the canvas: the round buttons on Masa's dark stage were hard to see.
    raisedRound: '#121614',
    raisedChip: '#121614',
    raisedEdge: 'rgba(255, 255, 255, 0.10)',
    raisedShadow: '',
    primaryShadow: '0px 10px 22px rgba(0, 0, 0, 0.35)',
    cardShadow: '',
    chipShadow: '',
    chipOn: '#EEF3F0',
    onChipOn: '#0B0E0D',
    day: '#121614',
    field: '#151A18',
    fieldLg: '#151A18',
    fieldOnCard: '#1B211F',
    fieldOnCardEdge: 'rgba(255, 255, 255, 0.08)',
    segOn: 'rgba(255, 255, 255, 0.94)',
    segOnInk: '#0B0E0D',
    segShadow: '',
    // As before: the sheet's card colour.
    segTrackInSheet: '#1B211F',
    emptyMark: '#1B211F',
    // A shade under the cards, as in the light (the cards' glass is the old sheet's colour).
    sheet: '#121614',
    sheetBase: '#121614',
    sheetFrost: 'linear-gradient(180deg, rgba(18, 22, 20, 0.80), rgba(18, 22, 20, 0.54))',
    sheetFadeTop:
      'linear-gradient(180deg, rgba(18, 22, 20, 1) 0%, rgba(18, 22, 20, 1) 55%, rgba(18, 22, 20, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(18, 22, 20, 0), rgba(18, 22, 20, 1))',
    grab: '#2A332F',
    sheetGrab: '#2A332F',
    sheetShadow: '',
    scrim: 'rgba(0, 0, 0, 0.45)',
    switchOff: '#2A332F',
    switchInset: '',
    link: '#3DDC84',
    warn: '#FF977E',
    // U31 (ProfilBaskasi, dark): the green at 14 % and its light ink.
    friendPill: 'rgba(61, 220, 132, 0.14)',
    friendPillInk: '#93EBB9',
    disabled: '#1F2623',
    onDisabled: '#A3AEA8',
    // On a dark card the disabled fill is a step lighter (U10).
    disabledOnCard: '#2A332F',
    dangerSoft: '#3A1E22',
    onDangerSoft: '#FF977E',
    stepDot: 'rgba(255, 255, 255, 0.18)',
  },
  // The same in both schemes.
  primary: '#0E8745',
  onPrimary: '#FFFFFF',
  // The dark ink on a filled box or radio in the dark scheme (the accent's ground): #0B0E0D.
  checkInk: '#0B0E0D',
  // The lines beside "Yeni mesaj" in a chat.
  freshLine: 'rgba(255, 79, 139, 0.40)',
  // A new invite in Bildirimler: the brand's soft gradient.
  inviteGround: 'linear-gradient(135deg, rgba(14, 135, 69, 0.14), rgba(255, 79, 139, 0.10))',
  // The incoming request's card floats deeper (MasaIstek).
  requestShadow: '0px 30px 60px rgba(4, 73, 35, 0.22)',
  // The venue chat's bubbles (Grup 3, P4; Aura v46 → MekanSohbeti, MekanSohbetiKoyu): the
  // person's own in the primary with white words, its time 90 % white; another's in the screen's
  // glass (its colours from the scheme: glass, glassEdge, ink, muted), the name over it in a soft
  // chip (white 56 %, the dark ground 64 % in the dark). docs/decisions/grup3-mekan-balonlari.md.
  venueBubble: {
    nameChip: { light: 'rgba(255, 255, 255, 0.56)', dark: 'rgba(0, 0, 0, 0.64)' },
  },
  // Message bubbles, never see-through (the owner's call, 29 Ekim): the person's own white (a soft
  // off-white in the dark) with ink words; the others' in the chat's colour, white words: the DM
  // blue, the venue chat green, the table chat pink (deeper in the dark). The venue chat draws
  // the same since 4 Kasım (the owner's call: the own white, the others' solid like it, not glass).
  bubble: {
    light: {
      mine: '#FFFFFF',
      mineInk: '#031B0B',
      mineMuted: '#4A6550',
      mineEdge: 'rgba(3, 27, 11, 0.06)',
      mineShadow: '0px 4px 12px rgba(3, 27, 11, 0.10)',
      // Deeper than the first #2F7CF6 (3.9:1) so its white words read at 4.5:1 (the owner's
      // call, 4 Kasım); the same hue.
      dm: '#2670E0',
      // Darker than the venue chat's old glass-era green so its white words read at 4.5:1.
      mekan: '#17834D',
      // Pink, not the old purple (Aura v65 has no violet in the interface), until K-83's palette.
      masa: '#C2185B',
      themInk: '#FFFFFF',
      themMuted: 'rgba(255, 255, 255, 0.80)',
      // A big emoji's time, on the wallpaper (Telegram Android's dark pill).
      stamp: 'rgba(3, 27, 11, 0.32)',
      stampInk: '#FFFFFF',
    },
    dark: {
      mine: '#E6EEE9',
      mineInk: '#031B0B',
      mineMuted: '#4A6550',
      mineEdge: 'rgba(255, 255, 255, 0)',
      mineShadow: '0px 4px 12px rgba(0, 0, 0, 0.30)',
      dm: '#1E56B8',
      mekan: '#146B42',
      masa: '#8E1446',
      themInk: '#FFFFFF',
      themMuted: 'rgba(255, 255, 255, 0.74)',
      stamp: 'rgba(0, 0, 0, 0.40)',
      stampInk: '#FFFFFF',
    },
  },
  // Another's bubble's soft shadow, in its colour.
  chatShadow: {
    dm: '0px 4px 12px rgba(38, 112, 224, 0.22)',
    mekan: '0px 4px 12px rgba(30, 154, 92, 0.22)',
    masa: '0px 4px 12px rgba(194, 24, 91, 0.22)',
  },
  // A photo opened large over the screen (Profil, a person's profile).
  // Profil fotoğrafı: the dark ground, the white card the photo lies on (22 from the sides, 30
  // round) and its shadow.
  // A neutral dark under a photo (Telegram Android's black), not the ink's green (18.1).
  photoScrim: 'rgba(0, 0, 0, 0.82)',
  // Under the status bar over a picture or a sheet's scrim (audit M15-12): a dark fade 40 below the
  // bar, so its light icons read on a light picture.
  statusScrim: 'linear-gradient(180deg, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0))',
  statusScrimBelow: 40,
  photoCard: { side: 22, radius: 30, shadow: '0px 24px 60px rgba(0, 0, 0, 0.35)' },
  // A chosen row's ring (CheckIn: the spot).
  primaryRing: 'rgba(14, 135, 69, 0.14)',
  // docs/design/iskelet.md → 5.8: Profili düzenle's focused field (3 px, the primary at 18 %), the
  // bar's Kaydet with nothing to save (its words), and a settings row's icon square (32, 10 round).
  primaryHalo: 'rgba(14, 135, 69, 0.18)',
  saveIdle: '#9AAEA1',
  rowIcon: { side: 32, radius: 10 },
  // Ayarlar's rows (iskelet.md → 5.9, 2.4): each row's square in its own colour, the icon white.
  rowIconTone: {
    notifications: '#FF4F8B',
    privacy: '#0E8745',
    account: '#2670E0',
    test: '#7A8A80',
  },
  // The bar's Kaydet keeps one width as its words change (iskelet.md → 2.1).
  saveMinWidth: 96,
  pink: '#FF4F8B',
  // Profili düzenle: the camera's white round at the face's corner.
  cameraShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  pinkRing: 'rgba(255, 79, 139, 0.18)',
  success: '#1C8C4E',
  successRing: 'rgba(28, 140, 78, 0.16)',
  danger: '#C8331F',
  white: '#FFFFFF',
  sendShadow: SHADOW.send,
  diskShadow: SHADOW.disk,
  diskRing: 'rgba(255, 255, 255, 0.90)',
  avShadow: SHADOW.av,
  thumbShadow: SHADOW.thumb,
  // .av c1 … c5: a face without a photo, a colour from its name.
  avColors: [
    'linear-gradient(145deg, #12984F, #0E8745)',
    'linear-gradient(145deg, #FF7EA8, #E83C78)',
    'linear-gradient(145deg, #FFC66E, #F09A1F)',
    'linear-gradient(145deg, #5FC6A0, #1C8C4E)',
    'linear-gradient(145deg, #6FB7E8, #2F7FC0)',
  ],
  // .tag colours: ground and text.
  tags: {
    purple: { bg: '#D7EEDC', fg: '#055328' },
    pink: { bg: 'rgba(255, 79, 139, 0.12)', fg: '#B0124F' },
    amber: { bg: '#FFE6C7', fg: '#7A4300' },
    // U16: `.tag.ok` (success-soft) and `.tag.lively` (lively); in the dark Aktiviteler's own.
    green: { bg: '#CDEFD9', fg: '#0F5C31' },
  },
  tagsDark: {
    purple: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9' },
    pink: { bg: 'rgba(255, 126, 168, 0.20)', fg: '#FFD0E0' },
    amber: { bg: 'rgba(255, 181, 71, 0.16)', fg: '#FFD8A3' },
    green: { bg: 'rgba(61, 220, 132, 0.16)', fg: '#93EBB9' },
  },
  // A read message's double tick (Mesajlar, Dm).
  // On the viewer's own white bubble (a soft off-white in the dark): the light read blue in both.
  readTick: '#2C63D6',
  // The switch's knob (Masa kur).
  switchKnobShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  // A game card's corner tag: dark glass over its picture (Masa), and its shadow.
  artTag: 'rgba(3, 27, 11, 0.55)',
  // U17 (KesfetMekan `.htop`): over the venue's scene, in both schemes, the back button on light
  // glass and the tags light, the calm one in the calm green.
  sceneRound: { bg: 'rgba(255, 255, 255, 0.82)', edge: '#FFFFFF', ink: '#031B0B' },
  sceneTag: { bg: 'rgba(255, 255, 255, 0.82)', fg: '#031B0B' },
  // Aura v75 AktivitelerEtkinlik (`.tag.lively.gl`, `.tag.gl`): an event card's two tags over its
  // riso scene, the same in both schemes.
  eventTag: { bg: '#FFE7C2', fg: '#7A4300' },
  eventTimeTag: { bg: 'rgba(255, 255, 255, 0.86)', fg: '#031B0B' },
  // U19: the words over Mekan's riso "Henüz masan yok" scene, in both schemes (Mekan `.rtext`).
  risoScene: {
    title: '#031B0B',
    note: '#2B3A30',
    words: 176,
    radius: 28,
    gap: 6,
    buttonTop: 8,
    // The dark scheme's dim over the light scene (the owner's report, 2 Kasım, 6.2).
    darkVeil: 'rgba(0, 0, 0, 0.22)',
  },
  // U20 (MekanMasali `.mcard`): the person's table on glass 28 round, 6 in; its wide riso card 168
  // high, 22 round; the name on dark glass 12 in from the card's bottom left (`.mname`: 14 × 8 in,
  // 16 round, blur 10), the people 12 in from its bottom right; under it 12 / 16 / 16 in, 12 apart.
  tableCard: {
    pad: 6,
    radius: 28,
    // iskelet.md → 5.11: the picture on the card's whole width, 210 high.
    height: 210,
    // The same dark fade under the name on every card, over the picture's lower part.
    shade: 'linear-gradient(180deg, rgba(3, 27, 11, 0) 0%, rgba(3, 27, 11, 0.64) 100%)',
    shadeHeight: 110,
    // The glass state tag at the picture's corner (no live blur, 2.2).
    status: {
      fill: 'rgba(255, 255, 255, 0.62)',
      edge: 'rgba(255, 255, 255, 0.90)',
      ink: '#031B0B',
      padX: 10,
      padY: 5,
    },
    // The faces apart on the card's ground (2.4: 2.5 and a soft shadow), an empty seat dashed.
    face: { ring: 2.5, overlap: 8, shadow: '0px 2px 6px rgba(3, 27, 11, 0.16)', dash: 1.5 },
    ground: { light: '#F7FBF8', dark: '#121614' },
    // The thin fill under the faces: green while there is room, pink once full.
    meter: { height: 4, free: '#1C8C4E', full: '#FF4F8B' },
    // The strip it folds into: its picture 52, 14 round, 10 in.
    stripPad: 10,
    stripRadius: 14,
    // No table: the riso picture against the card's right, the words on the paper's fade.
    paper: '#ECE4CE',
    paperFade:
      'linear-gradient(90deg, rgba(236, 228, 206, 1) 0%, rgba(236, 228, 206, 1) 44%, rgba(236, 228, 206, 0) 74%)',
    paperPicture: 0.68,
    imageRadius: 22,
    inset: 12,
    name: {
      padX: 14,
      padY: 8,
      radius: 16,
      fill: 'rgba(3, 27, 11, 0.42)',
      blur: 10,
      eyebrow: 'rgba(255, 255, 255, 0.8)',
    },
    body: { top: 12, x: 16, bottom: 16, gap: 12 },
  },
  sceneTagCalm: { bg: 'rgba(215, 238, 220, 0.92)', fg: '#055328' },
  // U22 (Masa `.mcard`, `.mem`, `.game`, `.fadebot`): the table's card on glass 28 round, 6 in,
  // its wide riso card a 96 strip 22 round (seen at 40 % down); under it 12 / 14 / 14 in, 12 apart,
  // the name and its line 2 apart. The people four a row, 10 / 4 apart, faces 36 (`av.member`; an
  // anonymous one's capsule as the app draws it, §9.2), the name 4 under. The bar's rounds and
  // Bitir 44; the games fade into the canvas over the bottom 90 (solid from 80 %).
  table: {
    pad: 6,
    radius: 28,
    strip: 96,
    stripRadius: 22,
    stripFocus: 0.4,
    body: { top: 12, x: 14, bottom: 14, gap: 12 },
    lineGap: 2,
    rowGap: 10,
    colGap: 4,
    nameGap: 4,
    // MasaCekmece: the people's drawer. Closed, the faces 32 on a 2 white ring overlap by 45 % in a
    // row 44 high, the round button (44) 8 to their right; open, the grid reaches 8 past the body on
    // each side, no column gap, 8 between rows, the faces 32 (36 narrow), the names 2 under them,
    // the button 8 under the grid at the right.
    drawer: {
      face: 32,
      faceNarrow: 36,
      overlap: 0.45,
      row: 44,
      gap: 8,
      out: 8,
      rowGap: 8,
      nameGap: 2,
    },
    bar: 44,
    fade: 90,
    fadeSolid: 0.8,
  },
  // U23 (MasaDavet `.srow`, `.warn`): a friend's row 64 high, 8 / 12 / 8 / 14 in, on glass sm; the
  // full table's note above the list, warn-soft 16 round, 12 / 14 in, its icon 10 from the words.
  inviteRow: { height: 64, padY: 8, padLeft: 14, padRight: 12 },
  warnBox: {
    light: { bg: '#FFF1D6', fg: '#5C3A00' },
    dark: { bg: 'rgba(255, 181, 71, 0.14)', fg: '#FFE2B3' },
    radius: 16,
    padX: 14,
    padY: 12,
    gap: 10,
  },
  // U26 (MekanSohbetiBos `.ecard`, `.disc`): the empty venue chat's glass card 18 × 20 in, 8
  // apart; its 48 disc on a soft green, the chat icon in the accent with the pink body (.55).
  venueChatEmpty: {
    padX: 20,
    padY: 18,
    gap: 8,
    disc: 48,
    discGround: 'rgba(18, 152, 79, 0.12)',
    ink: { light: '#0B783D', dark: '#1FDC75' },
    body: '#FF4F8B',
    bodySoft: 0.55,
  },
  // Who the viewer writes as, in the chat's top bar (the owner's call, 8 Kasım: the strip over the
  // message bar went): two 30 slots 2 apart in a sunk track 2 in, the chosen one white and raised in
  // a 2 accent ring, the other dimmed; a spent change locks it (a 14 badge, its icon 10).
  // While the change is on its way the whole toggle at `busy`.
  identityToggle: {
    slot: 30,
    pad: 2,
    gap: 2,
    ring: 2,
    dim: 0.45,
    busy: 0.6,
    lock: 14,
    lockIcon: 10,
  },
  // U25 (MasaSohbeti `.veil`): the table chat's curtain over its wall, darker at the top and the
  // foot, clear between 22 % and 70 %; the board's header pill 20 in at its left.
  chatVeil: {
    light:
      'linear-gradient(rgba(3, 27, 11, 0.38), rgba(3, 27, 11, 0) 22%, rgba(3, 27, 11, 0) 70%, rgba(3, 27, 11, 0.42))',
    dark: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.18) 22%, rgba(0, 0, 0, 0.18) 70%, rgba(0, 0, 0, 0.55))',
  },
  chatPillPadX: 20,
  // Its empty note (`.day`): a glass pill 14 × 6 in, 13/17 600.
  chatEmptyPad: { x: 14, y: 6 },
  // U24 (Masadakiler `.sh`, `.srow`): the sheet 84 from the top; a person's row 56 high, 6 / 14 in,
  // their face 40 (`av.list`).
  peopleSheet: { top: 84, height: 56, padY: 6, padX: 14 },
  // docs/design/iskelet.md → 5.3: the game sheet's green-toned note (16 round, 12 in; 2.4: the
  // sheet's card less its inset), its words in the clear button's green.
  historyNote: {
    light: { fill: 'rgba(14, 135, 69, 0.10)', ink: '#0B5A2D' },
    dark: { fill: 'rgba(31, 220, 117, 0.14)', ink: '#1FDC75' },
    radius: 16,
    pad: 12,
  },
  // docs/design/iskelet.md → 5.2 (the `kapak` bar): the cover 360 high, moving at 0.45 of the
  // scroll; a 130 dark fade over its top (#031B0B at 38 % to clear); the content riding over its
  // foot as a card 34 round; the band coming in over 240–280, the venue's small picture (32, 10
  // round: 2.4) and name beside the back button over 300–330.
  venueCover: {
    height: 360,
    speed: 0.45,
    shadeHeight: 130,
    shade: 'linear-gradient(180deg, rgba(3, 27, 11, 0.38) 0%, rgba(3, 27, 11, 0) 100%)',
    cardRadius: 34,
    band: [240, 280],
    barTitle: [300, 330],
    barThumb: 32,
    barThumbRadius: 10,
  },
  gameCardShadow: '0px 12px 26px rgba(4, 73, 35, 0.18)',
  // A nick's colour in a line of the venue chat (Mekan: kapsul-sn19 in amber's ink).
  nickInk: '#9A4A00',
  nameInk: '#B0124F',
  size: {
    glassRadius: 28,
    glassRadiusSm: 22,
    pad: 18,
    padLg: 22,
    // The button scale (the owner's call, 2 Kasım, B1): every main button 48, every small one 36,
    // a round icon button 44, a form field 48, a chip 36; a screen never picks its own (the many-line
    // field 104, 22 round; the sheet 8 from the edges, 28 round, its handle 40 × 4). The glass
    // buttons (docs/design/iskelet.md → 2.1): a main button in a screen's body 50 to 56 (52, the
    // venue page's and the check-in sheet's 56), a small one in a line 36 to 40.
    btn: 52,
    btnTall: 56,
    btnSm: 36,
    // Mekan's "Masa kur" and Masa's "Bitir": the small height, 18 inside.
    btnMid: 36,
    btnPadXMid: 18,
    btnPadXSnug: 16,
    btnPadX: 24,
    btnPadXSm: 16,
    btnGap: 8,
    // Every chip 36 high (B1); Keşfet's kind chips 16 inside, Kapsülün's slot chips 18.
    chip: 36,
    chipTall: 36,
    chipTallPadX: 16,
    chipLg: 36,
    // Aura v75 E4 (narrow): a chip 46, a field 56, a segment 52.
    chipNarrow: 46,
    fieldNarrow: 56,
    segItemNarrow: 52,
    chipLgPadX: 18,
    // U19: Mekan's spot chip, 40 high and 16 in.
    chipMdPadX: 16,
    chipPadX: 12,
    chipGap: 6,
    chipsGap: 8,
    tag: 24,
    // A venue page's tags over its scene: 30 high, 12 inside.
    tagLg: 28,
    tagLgPadX: 12,
    tagPadX: 8,
    tagGap: 4,
    round: 44,
    // iskelet.md → 2.1 and 3.1: every top bar button 46 (the glass back button); a sticky field
    // pins `stickyTop` under the top of its screen's scrolling body (top 52 to 54 on the canvas's 47
    // status bar) and the band reaches `stickyBandPad` under it.
    topBtn: 46,
    stickyTop: 6,
    stickyBandPad: 8,
    // iskelet.md → 5.1 (Keşfet): the search and list/map capsule 54, 48 once pinned, its switch's
    // rounds 3 in; a venue's card 26 round and 12 inside, its picture 76 at 14 (2.4: the card's 26
    // less its 12), the words 14 from it, the cards 10 apart (tuval Kesfet); the empty card's riso
    // 104x72. The rest of the boards' values: theme/explore.ts.
    explore: {
      capsule: 54,
      capsulePinned: 48,
      capsulePadX: 18,
      switchPad: 3,
      switchGap: 2,
      icon: 20,
      card: { radius: 26, pad: 12, picture: 76, pictureRadius: 14, gap: 14, lineGap: 5 },
      cardsGap: 10,
      empty: { width: 104, height: 72, radius: 14 },
    },
    // The venue page's back button (48).
    roundLg: 44,
    // A list row's picture: 48 (the owner's call, 30 Ekim: the rows were too thick at 52).
    // `seat`: Masa's card when its people fit one row (58).
    // member: Masa's people (U22); list: Masadakiler's rows (U24).
    av: {
      // The venue chat's last writers under its title (the owner's call, 8 Kasım).
      xs: 18,
      sm: 32,
      member: 36,
      // The DM's top bar (tuval Dm: 38).
      bar: 38,
      list: 40,
      md: 44,
      row: 48,
      // A conversation in Mesajlar (tuval Mesajlar: 54).
      inbox: 54,
      seat: 58,
      lg: 64,
      xl: 96,
      big: 112,
      // U31: another person's profile (ProfilBaskasi `.herow .av.xl`).
      hero: 120,
      // U34: Profili düzenle's face (ProfilDuzenle `.avw .av.xl`).
      edit: 88,
    },
    stackOverlap: 10,
    // Profil's two buttons and Kapsülün's: the main height (B1).
    btnRow: 48,
    // The empty state: its sign 28 × 42, 6 apart, the title 10 under the sign; 26 above (the
    // lobby's 18), 8 inside.
    emptyMark: { width: 28, height: 42 },
    emptyTitleTop: 10,
    emptyTop: 26,
    emptyTopSm: 18,
    // U36 (GaleriKesfet, GaleriProfil `.disc`): the error and icon state's disc 64, its icon 26,
    // the disc, the note and the button 12 apart. Loading (MekanYukleniyor): the meeting capsules
    // 40, 18 above, the note 10 under them.
    stateDisc: 64,
    stateIcon: 26,
    // Aura v75 E4: a tag when narrow (320 dp or the largest text, src/lib/narrow.ts).
    tagNarrow: 30,
    // Aura v75 AktivitelerHal `.erc .ci`.
    stateIconPage: 28,
    stateGap: 12,
    stateLoader: 40,
    stateLoadTop: 18,
    stateLoadGap: 10,
    // Aktiviteler's history rows (iskelet.md → 5.3): a 56 picture.
    historyThumb: 56,
    // Kapsülün (U35): the capsule's 4 ring; the chosen option's 2 ring 2 out round its capsule; a
    // chip's close icon 10 in.
    capsuleRing: 4,
    // Kapsülünü süsle (iskelet.md → 5.10): the capsule 220 on its riso scene, a breathing shadow
    // under it (60 % of its width, 14 high); a part put on drops it 18 onto its feet. The trying
    // strip: 84 round options, 96 apart, the centred one 1.14 and ringed in green, the others 0.9;
    // its art 60 inside, its two ends fading over 28; at most 7 dots under it.
    capsuleStage: 220,
    capsuleShadowW: 0.6,
    capsuleShadowH: 14,
    capsuleDrop: 18,
    stripItem: 84,
    stripStep: 96,
    stripOn: 1.14,
    stripOff: 0.9,
    stripArt: 60,
    stripFade: 28,
    stripDots: 7,
    boxRing: 2,
    boxRingGap: 2,
    chipIconPadLeft: 10,
    avRing: 2,
    avRingXs: 1.5,
    avRingXl: 3,
    avRingHero: 4,
    thumb: 60,
    thumbRadius: 18,
    badge: 20,
    badgeLg: 24,
    badgePadX: 6,
    dot: 8,
    dotRing: 4,
    focusHalo: 3,
    // Telegram Android's thin rows (the owner's call, 30 Ekim): 48 picture, 9 above and under.
    liPadY: 9,
    liPadX: 16,
    liGap: 12,
    listPadY: 4,
    secPadTop: 4,
    secPadX: 2,
    rowGap: 12,
    side: 20,
    icon: 22,
    iconSm: 18,
    iconSnug: 20,
    disk: 4,
    seg: 26,
    // A segmented control 44 high, its chosen part 36 (skall.css `.seg`).
    segItem: 36,
    // Mesajlar's tabs: 48 high in a 30 round.
    // U27: Mesajlar's tabs 48 in all (40 tabs 4 in), a pill.
    segLg: 40,
    segLgRadius: 24,
    // Mesajlar's bell (52) and its new message button (70, 26 from the right).
    // U27: the bell 44 (round soft).
    bell: 44,
    // iskelet.md → 5.4: the new chat button a prominent round, a body's main button (2.1: 50 to
    // 56), 20 from the right.
    newChat: 56,
    newChatRight: 20,
    // Mesajlar's rows: a 58 face, 12 above and under.
    // U27 (`.list .li`): a conversation 72 high, 12 / 16 in; the hairline from 72.
    inboxPadY: 12,
    inboxRow: 72,
    // iskelet.md → 3.5: the sheet 8 in from the edges, 40 round; its close button 38 at the title's
    // right, 10 under the handle; what scrolls fades out over `sheetFade` at its edges (no band).
    sheetInset: 8,
    sheetRadius: 40,
    sheetClose: 38,
    sheetHeadGap: 10,
    sheetFade: 24,
    // iskelet.md → 3.5: a menu grown from its button, 256 to 272 wide, 26 round, 8 from its button
    // and the screen's edges; a destructive row 6 apart under the others.
    menuMinW: 256,
    menuMaxW: 272,
    menuRadius: 26,
    menuGap: 8,
    menuDangerGap: 6,
    // The handle 10 under the sheet's top edge (tuval Mesajlar, Dm, Sohbet, Ayarlar, Mekan).
    sheetPadTop: 10,
    sheetPadX: 20,
    // Under the sheet's content: its 38 (SablonSheet) is the bottom safe area (34) and 4 more, so
    // its buttons sit 12 above the safe area as everywhere (U9).
    sheetPadBottom: 4,
    // At least the `.sheet`'s own 24 under its content (no safe area).
    sheetPadBottomMin: 24,
    sheetGap: 16,
    // Masa kur (aura v47): what scrolls fades into the footer's top edge, only while it overflows.
    sheetFooterFade: 32,
    grabW: 40,
    // The handle 5 high (tuval: every sheet and Profil's panel).
    grabH: 5,
    msgRadius: 22,
    msgTail: 8,
    // Chat bubbles (iskelet.md → 5.5): 20 round, 7 where a run's bubbles face each other, the run's
    // last one with a tail 7 × 12; a run's bubbles 3 apart, 12 when the writer changes.
    bubbleRadius: 20,
    bubbleInner: 7,
    runGap: 3,
    runApart: 12,
    bubblePadX: 12,
    bubblePadY: 7,
    tailW: 7,
    tailH: 12,
    field: 48,
    // Aura v71 (GaleriEklenen): a boxed field 60 (the birth date), the name's 72 with 22 inside.
    fieldBox: 60,
    fieldBig: 72,
    fieldBigPad: 22,
    // The empty photo picker (KayitFoto `.pick`): 120 across, its dashed line 3.
    photoPick: 120,
    photoPickLine: 3,
    // The check box and the radio: 24, the box 8 round (`.check`, `.radio`).
    checkBox: 24,
    checkRadius: 8,
    // A choice or consent row: 56 and 64 at least (the consents, `.opt`), 10 or 12 above and under.
    optMin: 56,
    optPadY: 10,
    consentPadY: 12,
    // A settings row (`.lr`): 64 at least, 12 above and under, its icon 24 and chevron 20.
    lrMin: 64,
    lrPadY: 12,
    lrIcon: 24,
    lrChevron: 20,
    // A person's row: the face 44 (`.av`).
    avPerson: 44,
    // The warning strip: 14 above and under, 16 in, 4 between its title and words.
    warnPadY: 14,
    warnPadX: 16,
    warnGap: 4,
    // A sheet's title icon, in the line, and the gap to the words.
    titleIcon: 24,
    titleIconGap: 10,
    // Profili düzenle's fields: 48 high (B1; the bio 104, 22 round), 22 inside.
    fieldLg: 48,
    fieldLgTall: 104,
    fieldLgTallRadius: 22,
    fieldLgPadX: 22,
    fieldLgPadY: 16,
    // A chat's message field and its send button (docs/design/aura → Dm).
    composerField: 44,
    composerSend: 44,
    // iskelet.md → 5.5: the DM's message bar one glass capsule 52, its send a 38 green round inside
    // it at the right, `composerSendInset` from its edge.
    composerCapsule: 52,
    composerSendIn: 38,
    composerSendInset: 7,
    phoneField: 72,
    fieldPadX: 20,
    dayPadX: 12,
    dayPadY: 4,
    barPad: 8,
    barRadius: 30,
    barGap: 10,
    // The DM's top as Telegram Android draws it (the owner's call, 29 Ekim): the avatar this far
    // inside its pill, the pills all as tall as it.
    // The DM's name pill: as tall as the rounds beside it, 44 (the owner's call, 2 Kasım, 13.1).
    dmPill: 44,
    pill: 44,
    eventCard: 210,
    // Mekan's scene (210) and the words in it (20 in, 180 wide).
    hero: 210,
    heroPad: 20,
    // The switch (skall.css `.toggle`): 52 × 32, the knob 26.
    switchW: 52,
    switchH: 32,
    switchKnob: 26,
    // Masa kur's icon row: 12 apart, 16 round, the ring 3 out.
    iconTileGap: 12,
    iconTileRadius: 16,
    // Masa's game cards: 24 round, the tag 8 in and 7 down.
    gameCardRadius: 22,
    gameTagX: 8,
    gameTagY: 8,
    // Mekan's and Masa's blocks: 14 apart.
    venueGap: 14,
    eventPad: 12,
    segPad: 4,
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
