// A venue's page (the `kapak`), value for value from the approved board (tuval: Detay.dc.html,
// DetayUst at y 0 and DetayToplanmis at y 330; 390 × 844, the status bar 47 high) where
// docs/design/iskelet.md → 5.2 gives no value of its own. The cover, its fade, the card's 34 round,
// the band's and the small title's ranges are iskelet's (KIT.venueCover).
export const VENUE_DETAIL = {
  // The card over the cover: 26 in at its top, 22 at its sides; its handle 40 × 5, 12 under its
  // top edge and 16 over the info line.
  padTop: 26,
  side: 22,
  handle: { width: 40, height: 5, radius: 2.5, top: -14, bottom: 16 },
  // The info line: the kind's pill, the district and city, the bucket's pill at the right, 8 apart;
  // the pills 26 high, the kind's 10 in, the bucket's 8 at its left and 10 at its right, its dot 6
  // and 6 from the words.
  infoGap: 8,
  pill: { height: 26, padX: 10 },
  bucket: { height: 26, padLeft: 8, padRight: 10, gap: 6, dot: 6 },
  // The name 12 under the info line, fading over 290–330 of the scroll; the main button 22 under
  // it, its arrow 18 after the words.
  titleTop: 12,
  titleFade: [290, 330] as const,
  buttonTop: 22,
  buttonIcon: 18,
  // Etkinlikler 32 under the button and 12 over its card; "Bu hafta" a glass pill 32 high, 12 in.
  eventsTop: 32,
  eventsBottom: 12,
  week: { height: 32, padX: 12 },
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
    // The card's ground: a pink light at its top right, a green one at its left, on the canvas.
    ground:
      'radial-gradient(90% 40% at 100% 0%, #F6DCE6 0%, rgba(246, 220, 230, 0) 70%), radial-gradient(90% 50% at 0% 20%, #D3EEDD 0%, rgba(211, 238, 221, 0) 70%)',
    shadow: '0px -10px 30px rgba(3, 27, 11, 0.10)',
    handle: 'rgba(3, 27, 11, 0.12)',
    pill: 'rgba(3, 27, 11, 0.06)',
    week: {
      fill: 'rgba(255, 255, 255, 0.62)',
      edge: 'rgba(255, 255, 255, 0.90)',
      inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.95)',
      shadow: '',
    },
    barThumbShadow: '0px 2px 6px rgba(3, 27, 11, 0.15)',
  },
  // The dark scheme is not drawn on the board: the canvas's ground, no shadow, the kit's dark glass.
  dark: {
    ground: '',
    shadow: '',
    handle: 'rgba(255, 255, 255, 0.14)',
    pill: 'rgba(255, 255, 255, 0.08)',
    week: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.09)', inset: '', shadow: '' },
    barThumbShadow: '',
  },
} as const;
