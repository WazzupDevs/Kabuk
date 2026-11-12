// Keşfet and its map, value for value from the approved boards (tuval: Kesfet.dc.html and
// Harita.dc.html, 390 × 844, the status bar 47 high) where docs/design/iskelet.md → 5.1 gives no
// value of its own. The kit's values (KIT.size.explore) are the parts both share.
const LIGHT_GLASS = {
  fill: 'rgba(255, 255, 255, 0.60)',
  edge: 'rgba(255, 255, 255, 0.90)',
  inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.95)',
  shadow: '0px 10px 30px rgba(3, 27, 11, 0.08)',
} as const;

// The dark scheme is not drawn on the boards: the kit's dark glass (#121614, a 9 % white edge, no
// shadow, no top light).
const DARK_GLASS = {
  fill: '#121614',
  edge: 'rgba(255, 255, 255, 0.09)',
  inset: '',
  shadow: '',
} as const;

export const EXPLORE = {
  // The list's head: 15 under the status bar (62 on the board), its parts 22 from the sides, the
  // cards 16; the line of the day 6 over the question, the capsule 26 under it, the chips 14 under
  // the capsule, Semte Git 22 under the chips, the place line 28 under it and 12 over the cards,
  // the cards 10 apart.
  top: 15,
  side: 16,
  headSide: 22,
  titleGap: 6,
  capsuleTop: 26,
  chipsTop: 14,
  districtTop: 22,
  sectionTop: 28,
  sectionBottom: 12,
  sectionGap: 8,
  cardsGap: 10,
  // The capsule: 18 in at its left, 5 at its right, 10 between the icon, the words and the switch;
  // the search icon 19; the switch a sunk track 3 in, 22 round, its two parts 40 × 38, 2 apart, the
  // icons 18.
  capsule: {
    padLeft: 18,
    padRight: 5,
    gap: 10,
    icon: 19,
    trackPad: 3,
    trackRadius: 22,
    segWidth: 40,
    segHeight: 38,
    segIcon: 18,
  },
  // The kind chips: 36 high (KIT.size.chip), 16 in.
  chipPadX: 16,
  // A venue's card: 14 between the picture and the words, its lines 5 apart, the arrow 18.
  card: { gap: 14, lineGap: 5, chevron: 18 },
  // The bucket's pill: 24 high, 8 in at its left and 10 at its right, its dot 6, 6 from the words.
  bucket: { height: 24, padLeft: 8, padRight: 10, gap: 6, dot: 6 },
  // The order's button: its arrow 14 after the words.
  sortIcon: 14,
  // Semte Git: 20 inside, 30 round, the words and the gate 12 apart, the lines 7 apart, the dot 7
  // and 6 from the eyebrow, the button 8 more under the note with its arrow 16. The gate a 106 ×
  // 128 sticker 16 round in a 3 white edge, turned 4°, in a 112 × 136 place; a 32 × 42 buddy 14 out
  // of its left and 6 under its foot.
  district: {
    pad: 20,
    radius: 30,
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
  // The map: the head 10 apart (the capsule, the chips); the glass column 46 wide, 20 under the
  // chips, its buttons 46, a hairline 10 in from its sides between them, the icons 19; the fades
  // 200 at the top and 280 at the bottom; the venue's card 16 above the tab bar, 16 from the
  // sides, 30 round, 12 inside, 14 apart, its picture 72 at 18 with a 26 × 34 buddy 8 out of its
  // right and 6 under it, the way to the venue a 44 green round.
  map: {
    headGap: 10,
    columnTop: 20,
    column: 46,
    dividerInset: 10,
    icon: 19,
    fadeTop: 200,
    fadeBottom: 280,
    cardBottom: 16,
    cardSide: 16,
    cardRadius: 30,
    cardPad: 12,
    cardGap: 14,
    picture: 72,
    pictureRadius: 18,
    buddy: { width: 26, height: 34, right: -8, bottom: -6 },
    goIcon: 18,
  },
  light: {
    // `.glass` on the list (the capsule, the chips, the order), and on the map a shade whiter.
    glass: LIGHT_GLASS,
    mapGlass: {
      fill: 'rgba(255, 255, 255, 0.66)',
      edge: 'rgba(255, 255, 255, 0.92)',
      inset: LIGHT_GLASS.inset,
      shadow: '0px 10px 30px rgba(3, 27, 11, 0.10)',
    },
    // `.card` (iskelet.md → 2.2): white 86 %, a white edge, two shadows and the top light.
    card: {
      fill: 'rgba(255, 255, 255, 0.86)',
      edge: 'rgba(255, 255, 255, 0.95)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 1px 2px rgba(3, 27, 11, 0.04), 0px 14px 34px rgba(3, 27, 11, 0.07)',
    },
    mapCard: 'rgba(255, 255, 255, 0.82)',
    pictureShadow: '0px 4px 12px rgba(3, 27, 11, 0.12)',
    chevron: '#9AAEA1',
    chipOnShadow: '0px 6px 14px rgba(3, 27, 11, 0.18)',
    track: 'rgba(3, 27, 11, 0.05)',
    segOnShadow: '0px 2px 8px rgba(3, 27, 11, 0.12)',
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
    divider: 'rgba(3, 27, 11, 0.08)',
    goShadow: '0px 6px 14px rgba(14, 135, 69, 0.35)',
    fadeTop:
      'linear-gradient(180deg, rgba(239, 247, 241, 0.92) 0%, rgba(239, 247, 241, 0.6) 55%, rgba(239, 247, 241, 0) 100%)',
    fadeBottom:
      'linear-gradient(180deg, rgba(239, 247, 241, 0) 0%, rgba(239, 247, 241, 0.55) 55%, rgba(239, 247, 241, 0.85) 100%)',
  },
  dark: {
    glass: DARK_GLASS,
    mapGlass: DARK_GLASS,
    card: DARK_GLASS,
    mapCard: '#121614',
    pictureShadow: '',
    chevron: '#A3AEA8',
    chipOnShadow: '',
    track: 'rgba(255, 255, 255, 0.06)',
    segOnShadow: '',
    calm: { bg: 'rgba(61, 220, 132, 0.14)', fg: '#93EBB9', dot: '#3DDC84' },
    // The dark scheme keeps its own feature card (theme.ts → feature).
    district: null,
    divider: 'rgba(255, 255, 255, 0.08)',
    goShadow: '',
    fadeTop:
      'linear-gradient(180deg, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.6) 55%, rgba(0, 0, 0, 0) 100%)',
    fadeBottom:
      'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 55%, rgba(0, 0, 0, 0.85) 100%)',
  },
} as const;

export type ExploreFace = { fill: string; edge: string; inset: string; shadow: string };
