// Keşfet and its map as the new board draws them (yeni arayüz tuvali, 16 Kasım:
// docs/design/yeni-arayuz/project/ Kesfet, KesfetAra, KesfetAraBos, KesfetBos, KesfetKaydir,
// KesfetHarita; 390 × 844, the status bar 47 high), value for value. The glass and card faces below
// are also read by Mesajlar, Profil and the venue's empty card.
const LIGHT_GLASS = {
  fill: 'rgba(255, 255, 255, 0.60)',
  edge: 'rgba(255, 255, 255, 0.90)',
  inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.95)',
  shadow: '0px 10px 30px rgba(3, 27, 11, 0.08)',
} as const;

// The dark scheme's flat glass (koyu.css: #121614, a 9 % white edge, no shadow, no top light).
const DARK_GLASS = {
  fill: '#121614',
  edge: 'rgba(255, 255, 255, 0.09)',
  inset: '',
  shadow: '',
} as const;

export const EXPLORE = {
  // The list (`.content`: 60 from the board's top, 13 under the status bar; 20 from the sides): the
  // line of the day 4 over the question (`.kh`), the search row 66 under it (the buddy looks over
  // it), the kind chips 10 under it, Semte Git 20 under them, the place line 24 under it and the
  // rows 4 under that.
  list: {
    top: 13,
    side: 20,
    titleTop: 4,
    fieldTop: 66,
    // KesfetAra, KesfetAraBos `.sr{margin-top:56}`: with something typed the line, the question and
    // the buddies are gone and the search stands 56 under the content's top.
    searchTop: 56,
    chipsTop: 10,
    districtTop: 20,
    sectionTop: 24,
    rowsTop: 4,
    // "Şu an buradasın" under Semte Git (the board does not draw it; the rows' own 12).
    hereTop: 12,
  },
  // The search (`.sr .field`): 20 in, 8 between the icon and the words, the icon 20; the clear
  // button (`.clr`) 36 round, its icon 20, 10 into the field's right padding; the map button 8 to
  // its right.
  field: { padX: 20, gap: 8, icon: 20, clear: 36, clearIcon: 20, clearOut: -10, rowGap: 8 },
  // The buddies over the search (`.sr .kk`): 178 wide (the picture's 600 × 340), 64 from the right,
  // their foot 22 over the field's foot, under the field.
  peek: { width: 178, height: 101, right: 64, bottom: 22 },
  // The empty list and the search that finds nothing (KesfetBos, KesfetAraBos `.emp`): 10 under the
  // place line, 24 from the sides; the riso 100 × 82 and 120 × 98; the title 12 under it, the
  // sentence 4 under that and 240 wide at most.
  empty: {
    // 6 here and the rows' 4 over it: the board's 10 under the place line.
    top: 6,
    // KesfetAraBos `.emp{padding:0 24px 150px}`: the search that finds nothing stands in the
    // middle of what is left above this much.
    bottom: 150,
    side: 24,
    list: { width: 100, height: 82 },
    search: { width: 120, height: 98 },
    titleTop: 12,
    noteTop: 4,
    noteWidth: 240,
  },
  // Semte Git as the board draws it (Kesfet, KesfetSemtIcerde `.semt`): the riso scene under it,
  // 200 high at least, 18 inside, 22 round; the words in its left 58 %; the dot 8, 6 from the
  // eyebrow; the title 6 under it, the note 4 under that, the time 8 under the title with its 18
  // clock 6 from the words; the button at the foot on its 0 4 10 shadow. In the room the eyebrow
  // and its dot are pink, the dot in a 4 ring.
  scene: {
    minHeight: 200,
    pad: 18,
    radius: 24,
    words: '58%',
    dot: 8,
    dotRing: 4,
    eyebrowGap: 6,
    titleTop: 6,
    noteTop: 4,
    metaTop: 8,
    metaGap: 6,
    metaIcon: 18,
    // The button's 18 at either side (`.semt .btn`: padding 0 18).
    buttonPadX: 18,
    eyebrow: '#7CF0B0',
    roomEyebrow: '#FF8FB8',
    roomDot: '#FF4F8B',
    roomDotRing: 'rgba(255, 79, 139, 0.28)',
    title: '#FFFFFF',
    note: 'rgba(255, 255, 255, 0.8)',
    meta: 'rgba(255, 255, 255, 0.86)',
  },
  // The head pinned once scrolled (KesfetKaydir `.sbar2`): the search, the chips and, once Semte Git's
  // card has gone under it, its small strip (`.ssm`: 60 high, 18 round, 0 10 0 16 in, 10 between its
  // parts; its eyebrow's dot 7; the button's 14 in), 10 under the chips. The strip comes in over
  // `from` to `to` px past the pin: the card (20 under the chips, 200 high) is under the band by
  // `to`.
  sticky: {
    stripGap: 10,
    stripHeight: 60,
    stripRadius: 20,
    stripPadLeft: 16,
    stripPadRight: 10,
    stripGapIn: 10,
    stripDot: 7,
    stripButtonPadX: 14,
    // `.ssm img{object-position:0% 12%}`.
    stripPicturePos: 0.12,
    from: 140,
    to: 200,
  },
  // The kind chips (`.ch .chip`): 14 in, 8 apart, each growing to share the row.
  chip: { padX: 14, gap: 8 },
  // The place button (`.cty`): 10 in at its left, 8 at its right, 6 between its parts, the pin 18,
  // its arrow 18 pulled 2 closer; the count 10 after it; the order (`.srt`) 32 high, 10 in at its
  // left, 4 at its right, its arrow 18, 2 from the words.
  place: { padLeft: 10, padRight: 8, gap: 6, icon: 18, chevron: 18, chevronIn: -2, countGap: 10 },
  sort: { height: 32, padLeft: 10, padRight: 4, gap: 2, chevron: 18 },
  // A venue row (`.rw.vr`): on the ground with no card and no hairline, 10 above and under, 20 from
  // the sides, 12 between its parts, 76 at least; the picture 56, 16 round; the lines 2 apart; how
  // lively 6 from its dot (7); the arrow 18, 4 closer.
  row: {
    padY: 10,
    padX: 20,
    gap: 12,
    minHeight: 76,
    picture: 56,
    pictureRadius: 16,
    lineGap: 2,
    statusGap: 6,
    dot: 7,
    chevron: 18,
    chevronIn: -4,
  },
  // The bucket's pill (the campus sheet): 24 high, 8 in at its left and 10 at its right, its dot 6,
  // 6 from the words.
  bucket: { height: 24, padLeft: 8, padRight: 10, gap: 6, dot: 6 },
  // Semte Git: 20 inside, 30 round, the words and the gate 12 apart, the lines 7 apart, the dot 7
  // and 6 from the eyebrow, the button 8 more under the note with its arrow 16. The gate a 106 ×
  // 128 sticker 16 round in a 3 white edge, turned 4°, in a 112 × 136 place; a 32 × 42 buddy 14 out
  // of its left and 6 under its foot.
  district: {
    pad: 20,
    radius: 28,
    gap: 12,
    lineGap: 7,
    dot: 7,
    eyebrowGap: 6,
    buttonTop: 8,
    chevron: 16,
    art: { width: 112, height: 136 },
    door: { width: 106, height: 128, radius: 16, edge: 3, tilt: '4deg' },
    buddy: { width: 32, height: 42, left: -14, bottom: -6 },
    // At 320 dp or the largest text (lib/narrow.ts) the art at this share.
    narrowArt: 0.68,
  },
  // The map (KesfetHarita): the head 20 from the sides, the chips 10 under the search; no fades. The
  // venue's card (`.vc`) 26 over the tab bar's top, 20 from the sides, 22 round, 14 inside, 18
  // between its parts, 96 at least, its picture 56 at 16; the round to the venue 44. The round over
  // the card (`.loc`) 48, 12 over the card's room, 20 from the right; the sources' line (`.attr`)
  // 22 from the left at the round's foot; the legend (`.lg`) 20 over it, 20 from the left, 12 in
  // and 6 above and under, 10 between its parts, each dot 9 and 5 from its word.
  map: {
    headGap: 10,
    side: 20,
    cardBottom: 26,
    cardRadius: 24,
    cardPad: 14,
    cardGap: 18,
    cardMinHeight: 96,
    picture: 56,
    pictureRadius: 16,
    // The card as a ticket (`.vc .bl`, `.pf`): the picture's block 94 wide at the left edge, 6 and
    // then the 18 gap before the 56 picture; the perforation 104 from the left: a notch of 10.5 at
    // top and foot and a dashed 2 line between them, 14 in from both.
    ticket: {
      block: 94,
      blockGap: 6,
      cut: 104,
      notch: 10.5,
      line: 2,
      lineIn: 14,
      dash: [6, 4],
      lineLight: 'rgba(3, 27, 11, 0.35)',
      lineDark: 'rgba(255, 255, 255, 0.3)',
    },
    goIcon: 18,
    control: 48,
    controlOver: 12,
    attrSide: 22,
    legendOver: 20,
    legend: { padX: 12, padY: 6, gap: 10, itemGap: 5, dot: 9, radius: 12 },
  },
  light: {
    // `.glass` (the venue page's empty card, Mesajlar's tabs).
    glass: LIGHT_GLASS,
    // `.card` (iskelet.md → 2.2): white 86 %, a white edge, two shadows and the top light.
    card: {
      fill: 'rgba(255, 255, 255, 0.86)',
      edge: 'rgba(255, 255, 255, 0.95)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 1px 2px rgba(3, 27, 11, 0.04), 0px 14px 34px rgba(3, 27, 11, 0.07)',
    },
    // The search field, the map's chips and its card (`.sr .field`, `.ch .chip` on the map, `.vc`):
    // white on the board's glass edge, top light and shadow.
    solid: {
      fill: '#FFFFFF',
      edge: 'rgba(255, 255, 255, 0.86)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 18px 44px rgba(4, 73, 35, 0.10), 0px 2px 6px rgba(4, 73, 35, 0.05)',
    },
    pictureShadow: '0px 4px 12px rgba(3, 27, 11, 0.12)',
    calm: { bg: '#E3F4E9', fg: '#0B5E30', dot: '#0E8745' },
    // Semte Git's ink ground: a deep green to the ink, a green glow at its top right.
    district: {
      ground: 'linear-gradient(160deg, #0B2B17 0%, #031B0B 100%)',
      glow: 'radial-gradient(90% 120% at 100% 0%, #1E5C36 0%, rgba(30, 92, 54, 0) 60%)',
      shadow: '0px 18px 40px rgba(3, 27, 11, 0.28)',
      inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.12)',
      eyebrow: '#3DDC84',
      title: '#FFFFFF',
      note: 'rgba(255, 255, 255, 0.72)',
      doorShadow: '0px 12px 26px rgba(0, 0, 0, 0.35)',
    },
    // The map's pins by how lively (`--lv-s`, `--lv-m`, `--lv-c`), the crowded one's glow, the
    // sources' line (`--m-lab`).
    level: { calm: '#C3D0C7', lively: '#FFB547', buzzing: '#FF4F8B' },
    mapLabel: '#4A6550',
  },
  dark: {
    glass: DARK_GLASS,
    card: DARK_GLASS,
    solid: DARK_GLASS,
    pictureShadow: '',
    calm: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9', dot: '#3DDC84' },
    // The dark scheme keeps its own feature card (theme.ts → feature).
    district: null,
    level: { calm: '#4A5550', lively: '#FFB547', buzzing: '#FF4F8B' },
    mapLabel: '#7D8C85',
  },
} as const;

export type ExploreFace = { fill: string; edge: string; inset: string; shadow: string };
