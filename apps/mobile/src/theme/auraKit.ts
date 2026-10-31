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
  // A profile's name and age (Profil: .display at 34).
  displaySm: t(500, 34, 43, -0.025),
  // Keşfet's question (.display at 34).
  displayLg: t(500, 34, 41, -0.025),
  // Mesajlar's title (.display at 36).
  displayXl: t(500, 36, 46, -0.025),
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
  // A section's heading (.sec .h3 at 18).
  sec: t(600, 18, 24, -0.005),
  // Keşfet's place line and Masa's lone note (.h3 at 19).
  secLg: t(600, 19, 24, -0.005),
  // Mekan's lobby headings (.sec .h3 at 21).
  secXl: t(600, 21, 27, -0.005),
  body: t(500, 15, 22),
  // A venue's district under its name on its page (KesfetMekan: .body at 17).
  bodyLg: t(500, 17, 22),
  fine: t(500, 13, 18),
  // The empty state's note (Aktiviteler, İstekler: .fine 15/21; the lobby's 14/20 is `note`).
  emptyNote: t(500, 15, 21),
  // What is typed in Profili düzenle's fields (17/24).
  field: t(500, 17, 24),
  // A venue row's second line and its bucket (Keşfet: .fine at 14).
  fineLg: t(500, 14, 18),
  // A longer note at 14 (Mekan's scene, Masa kur's switch, Masa: .fine 14/20).
  note: t(500, 14, 20),
  eyebrow: t(600, 12, 16, 0.02),
  stamp: t(600, 11, 14),
  strong: { fontFamily: F[600] } as TextStyle,
  btn: t(600, 16, 20),
  btnSm: t(600, 14, 18),
  // Mekan's "Masa kur" (44 high, 15).
  btnMid: t(600, 15, 19),
  chip: t(600, 13, 17),
  // Keşfet's kind chips (15).
  chipLg: t(600, 15, 19),
  tag: t(600, 12, 16),
  // A venue page's tags (14).
  tagLg: t(600, 14, 18),
  badge: t(700, 11, 14),
  // The venue chat card's count (24 round, 12).
  badgeLg: t(700, 12, 15),
  live: t(600, 13, 17),
  // "şu an aktif" (500) and "Mekandasın" (15) on Mekan.
  liveSoft: t(500, 13, 17),
  liveLg: t(600, 15, 19),
  msg: t(500, 15, 21),
  // A message of emoji only, without a bubble (Telegram Android): one, and two or three.
  emojiOne: t(500, 40, 48),
  emojiFew: t(500, 32, 40),
  day: t(600, 12, 16),
  wordmark: t(800, 26, 30, -0.04),
  av: {
    md: t(700, 15, 19),
    sm: t(700, 12, 16),
    seat: t(700, 20, 24),
    // A conversation's face in Mesajlar (52).
    row: t(700, 18, 22),
    lg: t(700, 22, 26),
    xl: t(700, 32, 38),
    // Profil's two faces (112).
    big: t(700, 40, 48),
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

// Keşfet's venue icon: 52 with its 16 round (Keşfet: the list row's picture).
export const VENUE_THUMB = { size: 52, radius: 16 } as const;

export const KIT = {
  light: {
    ink: '#14112B',
    muted: '#5E5878',
    hair: 'rgba(20, 17, 43, 0.07)',
    // A still placeholder for a line still loading (Mekan sohbeti kartı).
    placeholder: 'rgba(20, 17, 43, 0.08)',
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
    // Profili düzenle's fields.
    fieldLg: 'rgba(255, 255, 255, 0.90)',
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
    // The sheet's foot under the navigation bar: its gradient's last colour.
    sheetFoot: '#ECE9F7',
    grab: 'rgba(20, 17, 43, 0.16)',
    scrim: 'rgba(20, 17, 43, 0.30)',
    // Masa kur's switch off: a lilac track sunk a little.
    switchOff: '#E4DEF7',
    switchInset: 'inset 0px 1px 3px rgba(20, 17, 43, 0.10)',
  },
  dark: {
    ink: '#F3F0FF',
    muted: '#C9C3E6',
    hair: 'rgba(255, 255, 255, 0.08)',
    placeholder: 'rgba(255, 255, 255, 0.10)',
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
    fieldLg: 'rgba(255, 255, 255, 0.10)',
    segOn: 'rgba(255, 255, 255, 0.16)',
    segShadow: '',
    // A shade under the cards, as in the light (the cards' glass is the old sheet's colour).
    sheet: 'linear-gradient(180deg, rgba(30, 25, 64, 1), rgba(21, 18, 45, 1))',
    sheetBase: '#1B1739',
    sheetFadeTop:
      'linear-gradient(180deg, rgba(30, 25, 64, 1) 0%, rgba(30, 25, 64, 1) 55%, rgba(30, 25, 64, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(21, 18, 45, 0), rgba(21, 18, 45, 1))',
    sheetFoot: '#15122D',
    grab: 'rgba(255, 255, 255, 0.20)',
    scrim: 'rgba(8, 6, 20, 0.55)',
    switchOff: 'rgba(255, 255, 255, 0.16)',
    switchInset: '',
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
  // The venue chat's bubbles (Grup 3, P4; Aura v46 → MekanSohbeti, MekanSohbetiKoyu): the
  // person's own in the primary with white words, its time 90 % white; another's in the screen's
  // glass (its colours from the scheme: glass, glassEdge, ink, muted), the name over it in a soft
  // chip (white 56 %, the dark ground 64 % in the dark). docs/decisions/grup3-mekan-balonlari.md.
  venueBubble: {
    mineInk: '#FFFFFF',
    mineMuted: 'rgba(255, 255, 255, 0.90)',
    mineShadow: '0px 10px 22px rgba(106, 71, 245, 0.24)',
    nameChip: { light: 'rgba(255, 255, 255, 0.56)', dark: 'rgba(13, 11, 30, 0.64)' },
  },
  // Message bubbles, never see-through (the owner's call, 29 Ekim): the person's own white (a soft
  // off-white in the dark) with ink words; the others' in the chat's colour, white words: the DM
  // blue, the venue chat green, the table chat purple (deeper in the dark). The venue chat draws
  // its own since Grup 3 (venueBubble).
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
      // A big emoji's time, on the wallpaper (Telegram Android's dark pill).
      stamp: 'rgba(20, 17, 43, 0.32)',
      stampInk: '#FFFFFF',
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
      stamp: 'rgba(0, 0, 0, 0.40)',
      stampInk: '#FFFFFF',
    },
  },
  // Another's bubble's soft shadow, in its colour.
  chatShadow: {
    dm: '0px 4px 12px rgba(47, 124, 246, 0.22)',
    mekan: '0px 4px 12px rgba(30, 154, 92, 0.22)',
    masa: '0px 4px 12px rgba(106, 71, 245, 0.22)',
  },
  // A photo opened large over the screen (Profil, a person's profile).
  // Profil fotoğrafı: the dark ground, the white card the photo lies on (22 from the sides, 30
  // round) and its shadow.
  photoScrim: 'rgba(20, 17, 43, 0.86)',
  photoCard: { side: 22, radius: 30, shadow: '0px 24px 60px rgba(0, 0, 0, 0.35)' },
  // A chosen row's ring (CheckIn: the spot).
  primaryRing: 'rgba(106, 71, 245, 0.14)',
  pink: '#FF4F8B',
  // Kapsülün's chosen empty tile (#F9EEF6) under its ring.
  partOn: '#F9EEF6',
  // Profili düzenle: the camera's white round at the face's corner.
  cameraShadow: '0px 4px 12px rgba(54, 36, 140, 0.18)',
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
  // A read message's double tick (Mesajlar, Dm).
  readTick: '#4A5CE6',
  // The switch's knob (Masa kur).
  switchKnobShadow: '0px 2px 6px rgba(20, 17, 43, 0.20)',
  // A game card's corner tag: dark glass over its picture (Masa), and its shadow.
  artTag: 'rgba(20, 17, 43, 0.48)',
  gameCardShadow: '0px 12px 26px rgba(54, 36, 140, 0.18)',
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
    // The tall button of a venue's page and of the check-in sheet (58).
    btnTall: 58,
    btnSm: 38,
    // Mekan's "Masa kur" (44, 18 inside) and Masa's "Bitir" beside the 48 rounds (18 inside).
    btnMid: 44,
    btnPadXMid: 18,
    btnPadX: 24,
    btnPadXSm: 16,
    btnGap: 8,
    chip: 32,
    // Keşfet's kind chips: 38 high, 16 inside.
    chipTall: 38,
    chipTallPadX: 16,
    // Kapsülün's slot chips: 40 high, 18 inside.
    chipLg: 40,
    chipLgPadX: 18,
    chipPadX: 13,
    chipGap: 6,
    chipsGap: 8,
    tag: 24,
    // A venue page's tags over its scene: 30 high, 12 inside.
    tagLg: 30,
    tagLgPadX: 12,
    tagPadX: 9,
    tagGap: 4,
    round: 44,
    // The venue page's back button (48).
    roundLg: 48,
    // A list row's picture: 48 (the owner's call, 30 Ekim: the rows were too thick at 52).
    // `seat`: Masa's card when its people fit one row (58).
    av: { sm: 32, md: 44, row: 48, seat: 58, lg: 64, xl: 96, big: 112 },
    stackOverlap: 10,
    faceCard: 210,
    // Profil's two buttons and Kapsülün's (50).
    btnRow: 50,
    // The empty state: its sign 28 × 42, 6 apart, the title 10 under the sign; 26 above (the
    // lobby's 18), 8 inside.
    emptyMark: { width: 28, height: 42 },
    emptyGap: 6,
    emptyTitleTop: 10,
    emptyTop: 26,
    emptyTopSm: 18,
    emptyPadX: 8,
    // Aktiviteler's history rows: a 54 picture 14 from the words, 8 above and under.
    historyThumb: 54,
    historyGap: 14,
    historyPadY: 8,
    // Kapsülün: the empty part's tile (104, its capsule 70), a pack's tiles 70 high with the capsule
    // 10 down in them, the chosen one's ring (3) and a pack's block (16 inside, 12 apart).
    partTile: 104,
    partCapsule: 70,
    partTileHeight: 70,
    partCapsuleDrop: 10,
    partRing: 3,
    packPad: 16,
    packGap: 12,
    // Profil's list rows: 14 above and under, 18 inside.
    profilePadY: 14,
    profilePadX: 18,
    avRing: 2,
    avRingXl: 3,
    thumb: 60,
    thumbRadius: 18,
    badge: 20,
    badgeLg: 24,
    badgePadX: 6,
    dot: 8,
    dotRing: 4,
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
    disk: 4,
    seg: 26,
    // Mesajlar's tabs: 48 high in a 30 round.
    segLg: 48,
    segLgRadius: 30,
    // Mesajlar's bell (52) and its new message button (70, 26 from the right).
    bell: 52,
    newChat: 70,
    newChatRight: 26,
    // Mesajlar's rows: a 58 face, 12 above and under.
    inboxPadY: 12,
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
    // Chat bubbles as Telegram Android lays them (the owner's call, 30 Ekim): 18 round, 6 inside a
    // run on the author's side, the run's last one with a tail 7 × 12; tighter padding.
    bubbleRadius: 18,
    bubbleInner: 6,
    bubblePadX: 12,
    bubblePadY: 7,
    tailW: 7,
    tailH: 12,
    msgPadX: 15,
    msgPadY: 11,
    field: 54,
    // Profili düzenle's fields: 56 high (the bio 108, 24 round), 22 inside, 16 above the bio.
    fieldLg: 56,
    fieldLgTall: 108,
    fieldLgTallRadius: 24,
    fieldLgPadX: 22,
    fieldLgPadY: 16,
    // A chat's message field and its send button (docs/design/aura → Dm).
    composerField: 58,
    composerSend: 62,
    // Keşfet's search field (18 inside) and the round buttons of its list/map switch (46).
    searchPadX: 18,
    switchRound: 46,
    // Keşfet's blocks: 16 apart.
    exploreGap: 16,
    phoneField: 72,
    fieldPadX: 20,
    dayPadX: 12,
    dayPadY: 4,
    barPad: 8,
    barRadius: 30,
    barGap: 10,
    // The DM's top as Telegram Android draws it (the owner's call, 29 Ekim): the avatar this far
    // inside its pill, the pills all as tall as it.
    // The DM's name pill (docs/design/aura → Dm: 56).
    dmPill: 56,
    pill: 44,
    pillPadX: 14,
    eventCard: 210,
    // Mekan's scene (210) and the words in it (20 in, 180 wide).
    hero: 210,
    heroPad: 20,
    heroWords: 180,
    // Masa kur's switch: 56 × 34, the knob 28.
    switchW: 56,
    switchH: 34,
    switchKnob: 28,
    // Masa kur's icon row: 12 apart, 16 round, the ring 3 out.
    iconTileGap: 12,
    iconTileRadius: 16,
    // Masa's game cards: 24 round, the tag 8 in and 7 down.
    gameCardRadius: 24,
    gameTagX: 8,
    gameTagY: 7,
    // Mekan's and Masa's blocks: 14 apart.
    venueGap: 14,
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
