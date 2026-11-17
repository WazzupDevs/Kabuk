// A venue's page (the `kapak`), value for value from the board (yeni arayüz tuvali: MekanDetay,
// 390 × 844, the status bar 47 high) where docs/design/iskelet.md → 5.2 gives no value of its own.
// The cover, its fade, the card's round and the band's and the small title's ranges: KIT.venueCover.
// The location sheet (yeni arayüz tuvali, MekanKonum, MekanKonumIzin, MekanKonumDisari): the riso
// strip over its top edge 330 wide (the picture 1080 × 480), its notice's room and the gaps of its
// blocks; the gaps are the board's `.nb2`, `.cx` and `.go`.
export const LOCATE_SHEET = {
  peek: { width: 330, ratio: 480 / 1080 },
  noticeTop: 16,
  noticePad: { x: 16, y: 14 },
  noticeGap: 12,
  noticeIcon: 22,
  noticeLines: 2,
  bodyTop: 14,
  buttonTop: 20,
  buttonsGap: 10,
} as const;

export const VENUE_DETAIL = {
  // The card over the cover (yeni arayüz tuvali, MekanDetay `.vpan`): flat on the canvas, 22 in at
  // its top, 20 at its sides, no handle.
  padTop: 22,
  side: 20,
  // The info line: the kind's pill, the district and city, the bucket's pill at the right, 10 apart;
  // the pills 28 high, 12 in, the bucket's dot 7 and 6 from the words.
  infoGap: 10,
  pill: { height: 28, padX: 12 },
  bucket: { height: 28, padLeft: 12, padRight: 12, gap: 6, dot: 7 },
  // The name 12 under the info line, fading over 290–330 of the scroll; the main button 18 under
  // it (48 high, the kit's), its arrow 18 after the words; under it the line about the position:
  // 10 down, a 16 lock 6 before the words.
  titleTop: 12,
  titleFade: [290, 330] as const,
  buttonTop: 18,
  buttonIcon: 18,
  hintTop: 10,
  hint: { icon: 16, gap: 6 },
  // Etkinlikler 26 under the hint, its row 32 high; "Bu hafta" plain words 10 in from the left and
  // 4 from the right; the empty picture 150 wide, 2 under the row, its title and sentence 2 apart.
  eventsTop: 26,
  eventsBottom: 2,
  week: { height: 32, padLeft: 10, padRight: 4 },
  empty: { picture: 150, ratio: 540 / 900, gap: 2 },
  // The bar: the back button 16 from the sides, its middle where the board's 44 one has it (3 under
  // the status bar), 10 from the small title; the picture there a 30 round, 9 from the name, which
  // rises 8 as it comes in.
  barSide: 16,
  barTop: 2,
  barGap: 10,
  barThumb: 30,
  barNameGap: 9,
  barRise: 8,
  light: {
    barThumbShadow: '0px 2px 6px rgba(3, 27, 11, 0.15)',
  },
  dark: {
    barThumbShadow: '',
  },
} as const;
