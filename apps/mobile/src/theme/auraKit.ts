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
  btnMid: t(600, 14, 18),
  chip: t(600, 13, 17),
  // Keşfet's kind chips (15).
  chipLg: t(600, 15, 19),
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

// Aura v65 skall.css and ekran.css: green-tinted soft shadows (rgba(4, 73, 35) and the ink
// rgba(3, 27, 11)), the primary's glow in its own green. The dark scheme draws none.
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
} as const;

// Keşfet's venue icon: 52 with its 16 round (Keşfet: the list row's picture).
// U13: the venue's picture 56, 18 round, on its soft green shadow (Kesfet `.vbox`).
export const VENUE_THUMB = {
  size: 56,
  radius: 18,
  shadow: '0px 6px 14px rgba(4, 73, 35, 0.16)',
} as const;

export const KIT = {
  light: {
    ink: '#031B0B',
    muted: '#4A6550',
    hair: 'rgba(3, 27, 11, 0.07)',
    // A still placeholder for a line still loading (Mekan sohbeti kartı).
    placeholder: 'rgba(3, 27, 11, 0.08)',
    glass: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    // A glass card inside a sheet.
    glassInSheet: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    glassEdge: 'rgba(255, 255, 255, 0.86)',
    glassShadow: SHADOW.glass,
    // The light top edge of glass and of the primary (none in the dark: a white line on every
    // object, the owner's call, 28 Ekim).
    glassInset: 'inset 0px 1px 0px #FFFFFF',
    primaryInset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.28)',
    // A raised white (buttons, chips, round buttons, glassy tags).
    raised: 'rgba(255, 255, 255, 0.74)',
    raisedRound: 'rgba(255, 255, 255, 0.74)',
    raisedChip: 'rgba(255, 255, 255, 0.74)',
    raisedEdge: '#FFFFFF',
    raisedShadow: SHADOW.soft,
    chipShadow: SHADOW.chip,
    chipOn: '#031B0B',
    onChipOn: '#FFFFFF',
    day: 'rgba(255, 255, 255, 0.74)',
    field: '#FFFFFF',
    // Profili düzenle's fields.
    fieldLg: '#FFFFFF',
    // Masa's tabs: the chosen one raised white.
    segOn: '#FFFFFF',
    // The chosen part's words: the ink; in the dark #0B0E0D on the 94 % white.
    segOnInk: '#031B0B',
    segShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
    // The sheet (U8): the glass (`.glass.sheet`) over a blurred scrim. Laid on the canvas so it stays
    // opaque (the owner's call, 29 Ekim: Bildirimler and Ayarlar showed too much under them); its
    // top and bottom colours are what scrolls under its edges fades into.
    sheet: 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))',
    sheetBase: '#EFF7F1',
    // The sheet's top and bottom colours, for what scrolls under its edges to fade into.
    sheetFadeTop:
      'linear-gradient(180deg, rgba(251, 253, 252, 1) 0%, rgba(251, 253, 252, 1) 55%, rgba(251, 253, 252, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(247, 251, 248, 0), rgba(247, 251, 248, 1))',
    grab: '#C6E0CC',
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
  },
  dark: {
    ink: '#EEF3F0',
    muted: '#A3AEA8',
    hair: 'rgba(255, 255, 255, 0.07)',
    placeholder: 'rgba(255, 255, 255, 0.10)',
    glass: '#121614',
    // U2: the card inside a sheet.
    glassInSheet: '#1B211F',
    glassEdge: 'rgba(255, 255, 255, 0.09)',
    glassShadow: '',
    glassInset: '',
    primaryInset: '',
    raised: '#121614',
    // A shade stronger than the canvas: the round buttons on Masa's dark stage were hard to see.
    raisedRound: '#121614',
    raisedChip: '#121614',
    raisedEdge: 'rgba(255, 255, 255, 0.10)',
    raisedShadow: '',
    chipShadow: '',
    chipOn: '#EEF3F0',
    onChipOn: '#0B0E0D',
    day: '#121614',
    field: '#151A18',
    fieldLg: '#151A18',
    segOn: 'rgba(255, 255, 255, 0.94)',
    segOnInk: '#0B0E0D',
    segShadow: '',
    // A shade under the cards, as in the light (the cards' glass is the old sheet's colour).
    sheet: '#121614',
    sheetBase: '#121614',
    sheetFadeTop:
      'linear-gradient(180deg, rgba(18, 22, 20, 1) 0%, rgba(18, 22, 20, 1) 55%, rgba(18, 22, 20, 0) 100%)',
    sheetFadeBottom: 'linear-gradient(180deg, rgba(18, 22, 20, 0), rgba(18, 22, 20, 1))',
    grab: '#2A332F',
    scrim: 'rgba(0, 0, 0, 0.45)',
    switchOff: '#2A332F',
    switchInset: '',
    link: '#3DDC84',
    warn: '#FF977E',
    friendPill: '#173022',
    friendPillInk: '#8AD19F',
    disabled: '#1F2623',
    onDisabled: '#A3AEA8',
    // On a dark card the disabled fill is a step lighter (U10).
    disabledOnCard: '#2A332F',
    dangerSoft: '#3A1E22',
    onDangerSoft: '#FF977E',
  },
  // The same in both schemes.
  primary: '#0E8745',
  onPrimary: '#FFFFFF',
  primaryShadow: SHADOW.primary,
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
    mineInk: '#FFFFFF',
    mineMuted: 'rgba(255, 255, 255, 0.90)',
    mineShadow: '0px 10px 22px rgba(14, 135, 69, 0.24)',
    nameChip: { light: 'rgba(255, 255, 255, 0.56)', dark: 'rgba(0, 0, 0, 0.64)' },
  },
  // Message bubbles, never see-through (the owner's call, 29 Ekim): the person's own white (a soft
  // off-white in the dark) with ink words; the others' in the chat's colour, white words: the DM
  // blue, the venue chat green, the table chat purple (deeper in the dark). The venue chat draws
  // its own since Grup 3 (venueBubble).
  bubble: {
    light: {
      mine: '#0E8745',
      mineInk: '#FFFFFF',
      mineMuted: 'rgba(255, 255, 255, 0.90)',
      mineEdge: 'rgba(255, 255, 255, 0)',
      mineShadow: '0px 4px 12px rgba(14, 135, 69, 0.22)',
      dm: '#2F7CF6',
      mekan: '#1E9A5C',
      masa: '#FFFFFF',
      themInk: '#FFFFFF',
      themMuted: 'rgba(255, 255, 255, 0.80)',
      // A big emoji's time, on the wallpaper (Telegram Android's dark pill).
      stamp: 'rgba(3, 27, 11, 0.32)',
      stampInk: '#FFFFFF',
    },
    dark: {
      mine: '#0E8745',
      mineInk: '#FFFFFF',
      mineMuted: 'rgba(255, 255, 255, 0.90)',
      mineEdge: 'rgba(255, 255, 255, 0)',
      mineShadow: '',
      dm: '#1E56B8',
      mekan: '#146B42',
      masa: '#121614',
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
    masa: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  },
  // A photo opened large over the screen (Profil, a person's profile).
  // Profil fotoğrafı: the dark ground, the white card the photo lies on (22 from the sides, 30
  // round) and its shadow.
  photoScrim: 'rgba(3, 27, 11, 0.86)',
  photoCard: { side: 22, radius: 30, shadow: '0px 24px 60px rgba(0, 0, 0, 0.35)' },
  // A chosen row's ring (CheckIn: the spot).
  primaryRing: 'rgba(14, 135, 69, 0.14)',
  pink: '#FF4F8B',
  // Kapsülün's chosen empty tile (#F9EEF6) under its ring.
  partOn: '#E6F0E8',
  // Profili düzenle: the camera's white round at the face's corner.
  cameraShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
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
  // Today's event on Keşfet's card: a soft amber ground.
  eventGround: 'rgba(255, 181, 71, 0.14)',
  // A read message's double tick (Mesajlar, Dm).
  readTick: '#FFD48A',
  // The switch's knob (Masa kur).
  switchKnobShadow: '0px 2px 8px rgba(3, 27, 11, 0.08)',
  // A game card's corner tag: dark glass over its picture (Masa), and its shadow.
  artTag: 'rgba(3, 27, 11, 0.48)',
  // U17 (KesfetMekan `.htop`): over the venue's scene, in both schemes, the back button on light
  // glass and the tags light, the calm one in the calm green.
  sceneRound: { bg: 'rgba(255, 255, 255, 0.82)', edge: '#FFFFFF', ink: '#031B0B' },
  sceneTag: { bg: 'rgba(255, 255, 255, 0.82)', fg: '#031B0B' },
  sceneTagCalm: { bg: 'rgba(215, 238, 220, 0.92)', fg: '#055328' },
  // U17: the scene 300 high from the very top, its bottom corners 28.
  venueHero: { height: 300, radius: 28 },
  gameCardShadow: '0px 12px 26px rgba(4, 73, 35, 0.18)',
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
    glassRadiusSm: 22,
    pad: 18,
    padLg: 22,
    // Aura v65 Temel satır (normalleştirme, 1 Kas 02:41): two button heights, 56 and 40; the field
    // 56 (the many-line one 104, 22 round); the round 44; the sheet 8 from the edges, 28 round, its
    // handle 40 × 4; a chat's field and send button 56.
    btn: 56,
    // The tall button of a venue's page and of the check-in sheet (58).
    btnTall: 56,
    btnSm: 40,
    // Mekan's "Masa kur" (44, 18 inside) and Masa's "Bitir" beside the 48 rounds (18 inside).
    btnMid: 40,
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
    // The venue page's back button (48).
    roundLg: 44,
    // A list row's picture: 48 (the owner's call, 30 Ekim: the rows were too thick at 52).
    // `seat`: Masa's card when its people fit one row (58).
    av: { sm: 32, md: 44, row: 48, seat: 58, lg: 64, xl: 96, big: 112 },
    stackOverlap: 10,
    faceCard: 210,
    // Profil's two buttons and Kapsülün's (50).
    btnRow: 56,
    // The empty state: its sign 28 × 42, 6 apart, the title 10 under the sign; 26 above (the
    // lobby's 18), 8 inside.
    emptyMark: { width: 28, height: 42 },
    emptyTitleTop: 10,
    emptyTop: 26,
    emptyTopSm: 18,
    // Aktiviteler's history rows (U16): a 52 picture.
    historyThumb: 52,
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
    // A segmented control 44 high, its chosen part 36 (skall.css `.seg`).
    segItem: 36,
    // Mesajlar's tabs: 48 high in a 30 round.
    segLg: 48,
    segLgRadius: 30,
    // Mesajlar's bell (52) and its new message button (70, 26 from the right).
    bell: 52,
    newChat: 70,
    newChatRight: 26,
    // Mesajlar's rows: a 58 face, 12 above and under.
    inboxPadY: 12,
    sheetInset: 8,
    sheetRadius: 28,
    sheetPadTop: 12,
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
    grabH: 4,
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
    field: 56,
    // Profili düzenle's fields: 56 high (the bio 108, 24 round), 22 inside, 16 above the bio.
    fieldLg: 56,
    fieldLgTall: 104,
    fieldLgTallRadius: 22,
    fieldLgPadX: 22,
    fieldLgPadY: 16,
    // A chat's message field and its send button (docs/design/aura → Dm).
    composerField: 56,
    composerSend: 56,
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
    // The switch (skall.css `.toggle`): 52 × 32, the knob 26.
    switchW: 52,
    switchH: 32,
    switchKnob: 26,
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
