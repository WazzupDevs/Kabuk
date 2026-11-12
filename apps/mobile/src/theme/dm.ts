// The DM, value for value from the approved board (tuval: Dm.dc.html; `menu` its options, `confirm`
// the block's sheet; 390 × 844, the status bar 47 high) where docs/design/iskelet.md → 5.5 gives no
// value of its own. The bubbles' colours and their 20 / 7 corners, the runs' 3 / 12, the capsule's 52
// and its 38 send (5.5), the menu's 256 to 272, 26 round, 6 apart (3.5) and the buttons' heights
// (2.1) are iskelet's; the top bar's heights are the owner's (KIT.size.dmPill).
export const DM = {
  // The stream: 12 from the sides and each bubble 6 more; a bubble at most 78 % of the row.
  side: 18,
  share: 0.78,
  // A bubble: 8 above and under its words, 14 in at its left and 12 at its right; its corner at
  // the tail 4 (the tail covers it); the tail 6 out of the bubble, 16 high.
  bubble: { padTop: 8, padBottom: 8, padLeft: 14, padRight: 12, tailCorner: 4 },
  tail: { width: 6, height: 16 },
  // The time 11 from the bubble's right and 6 from its foot, the ticks 16 × 11, 3 from it.
  time: { right: 11, bottom: 6, gap: 3, ticks: 16 },
  // The day: a glass pill 28 high, 12 in, 6 under the previous message and 12 over the next.
  day: { height: 28, padX: 12, top: 6, bottom: 12 },
  // The top bar: 14 from the sides, the back and the capsule 8 apart; in the capsule the face 38,
  // 7 in, 10 from the name; the three dots 38 (icon 18), 6 from the capsule's right.
  bar: { side: 14, gap: 8, face: 38, faceIn: 7, nameGap: 10, more: 38, moreIcon: 18, moreIn: 6 },
  // The message bar: 14 from the sides, the words 20 in; the send arrow 18.
  composer: { side: 14, padLeft: 20, arrow: 18 },
  // The block's sheet: 20 inside, 22 under its last button; the face 64 in a 3 white ring, 18 under
  // the handle; the title 14 under it, the sentence 6 under the title, the buttons 20 and 12 apart.
  confirm: {
    padX: 20,
    padBottom: 22,
    face: 64,
    ring: 3,
    faceTop: 18,
    titleTop: 14,
    noteTop: 6,
    buttonsTop: 20,
    buttonsGap: 12,
  },
  // The menu: 6 inside above and under, its rows 50 high, 16 in, 12 between the icon (20) and the
  // words; the destructive group 6 under a 6 high band.
  menu: { width: 256, padY: 6, row: 50, padX: 16, gap: 12, icon: 20, bandGap: 6 },
  light: {
    // Another's bubble's soft shadow and the own one's (no line on the own: the board draws none).
    themShadow: '0px 4px 12px rgba(20, 60, 140, 0.18)',
    mineShadow: '0px 4px 12px rgba(3, 27, 11, 0.10)',
    mineTime: '#6B7E71',
    themTime: 'rgba(255, 255, 255, 0.82)',
    // The day's pill: `.glass` with its own shadow, the ink words.
    day: {
      fill: 'rgba(255, 255, 255, 0.62)',
      edge: 'rgba(255, 255, 255, 0.90)',
      inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.95)',
      shadow: '0px 4px 12px rgba(3, 27, 11, 0.10)',
    },
    dayInk: '#031B0B',
    // The message bar: the glass a shade whiter (78 %), its shadow; the hint and the send's shadow.
    composer: {
      fill: 'rgba(255, 255, 255, 0.78)',
      edge: 'rgba(255, 255, 255, 0.90)',
      inset: 'inset 0px 1px 0px rgba(255, 255, 255, 0.95)',
      shadow: '0px 8px 22px rgba(3, 27, 11, 0.12)',
    },
    hint: '#6F8276',
    sendShadow: '0px 4px 10px rgba(14, 135, 69, 0.30)',
    // The top bar's name.
    name: '#031B0B',
    // The menu: a whiter glass, its edge, shadow and scrim; the icons, the band, the red.
    menu: {
      fill: 'rgba(250, 252, 250, 0.86)',
      // Without the live blur (iskelet.md → 2.2): the same white laid on the canvas, opaque.
      solid: '#F9FBF9',
      edge: 'rgba(255, 255, 255, 0.95)',
      shadow: '0px 20px 50px rgba(3, 27, 11, 0.25)',
      scrim: 'rgba(3, 27, 11, 0.10)',
      icon: '#31443A',
      band: 'rgba(3, 27, 11, 0.05)',
      danger: '#C8331F',
    },
    // The block's sheet: its ground, the face's ring and shadow, the sentence.
    confirm: {
      ground: '#F7FAF7',
      ring: '#FFFFFF',
      faceShadow: '0px 6px 16px rgba(3, 27, 11, 0.18)',
      note: '#4A6550',
    },
  },
  // The dark scheme is not drawn on the board: the kit's dark surfaces, no shadows.
  dark: {
    themShadow: '',
    mineShadow: '0px 4px 12px rgba(0, 0, 0, 0.30)',
    mineTime: '#4A6550',
    themTime: 'rgba(255, 255, 255, 0.74)',
    day: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.09)', inset: '', shadow: '' },
    dayInk: '#E6EEE9',
    composer: { fill: '#121614', edge: 'rgba(255, 255, 255, 0.09)', inset: '', shadow: '' },
    hint: '#7E8A84',
    sendShadow: '',
    name: '#E6EEE9',
    menu: {
      fill: 'rgba(18, 22, 20, 0.92)',
      solid: '#121614',
      edge: 'rgba(255, 255, 255, 0.09)',
      shadow: '0px 20px 50px rgba(0, 0, 0, 0.45)',
      scrim: 'rgba(0, 0, 0, 0.20)',
      icon: '#A3AEA8',
      band: 'rgba(255, 255, 255, 0.05)',
      danger: '#FF6B57',
    },
    confirm: {
      ground: '#121614',
      ring: '#121614',
      faceShadow: '',
      note: '#A3AEA8',
    },
  },
} as const;
