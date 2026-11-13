// Kapsülün, value for value from the approved board (tuval: Kapsul2.dc.html, "deneme şeridi"; 390 ×
// 844) where docs/design/iskelet.md → 5.10 gives no value of its own. The strip's 84 options 96 apart
// at 1.14 and 0.9, the bar's Kaydet (2.1), the large title (3.1: 34, 800), the chips' 36, the small
// button's 36 and the round's 44 (CLAUDE.md → Ekran davranışı) are iskelet's and the kit's; the
// capsule's own size is its drawing's (KIT.size.capsuleStage).

export const CAPSULE_EDIT = {
  // The bar's row 16 from the sides, the title 6 more in; the scene 16 under the title's block.
  barSide: 16,
  titleIn: 6,
  padTop: 16,
  // The scene: 300 high on the page's ground (no card), a 270 riso disc in its middle; the
  // capsule's shadow's top 262 down; "Hepsini çıkar" and the die at its foot, 16 from the sides.
  // "Hepsini çıkar" 12 in at its left and 14 at its right, its arrow 16 and 6 from the words; the
  // die's icon 20.
  scene: { height: 300, disc: 270, shadowTop: 262, side: 16 },
  clear: { padLeft: 12, padRight: 14, gap: 6, icon: 16 },
  dieIcon: 20,
  // The shadow under the capsule: 120 by 16.
  shadow: { width: 120, height: 16 },
  // The disc's halftone: a dot 1.25 every 6 on the diagonal; its light from the middle, the second
  // stop at 70 %.
  dot: { cell: 6, r: 1.25 },
  discMid: '70%',
  // The panel 18 under the scene to the screen's foot: 34 round at its top. Its chips' row 16 under
  // its top, 22 in, fading over 22 at its left and 40 at its right, the chips 8 apart; a chip 12 in
  // at its left and 15 at its right, its icon 17, 6 from the words. The theme packs (iskelet.md →
  // 5.10, not drawn on the board) over the chips, 8 over them, the same 22 in.
  panel: { top: 18, radius: 34, padTop: 16, side: 22, fadeStart: 22, fadeEnd: 40, gap: 8 },
  chip: { padLeft: 12, padRight: 15, gap: 6, icon: 17 },
  packsGap: 8,
  // Under the chips: the strip 6 + 18 under them and 14 over the name (the options' middle 60 under
  // the strip's top); the name 4 under the strip, the dots 14 under the name, 6 apart, 6 high and
  // 3 round, the lit one 18 wide; 24 under them.
  strip: { top: 6 + 18, bottom: 14 },
  nameTop: 4,
  dots: { top: 14, gap: 6, side: 6, on: 18 },
  padBottom: 24,
  light: {
    disc: { mid: '#FFD6E5', edge: '#FFE3EC', dots: 'rgba(255, 79, 139, 0.22)' },
    shadow: 'rgba(58, 47, 92, 0.35)',
    panel: {
      fill: 'rgba(255, 255, 255, 0.72)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px -10px 30px rgba(3, 27, 11, 0.08)',
    },
    chip: {
      on: { fill: '#031B0B', ink: '#FFFFFF', shadow: '0px 6px 14px rgba(3, 27, 11, 0.18)' },
      off: {
        fill: 'rgba(255, 255, 255, 0.85)',
        ink: '#031B0B',
        inset: 'inset 0px 1px 0px #FFFFFF',
        shadow: '0px 4px 10px rgba(3, 27, 11, 0.06)',
      },
    },
    // The options' circle on the panel.
    tile: 'rgba(3, 27, 11, 0.05)',
    dot: { on: '#0E8745', off: 'rgba(3, 27, 11, 0.15)' },
  },
  // The dark scheme is not drawn on the board: the kit's dark sheet, chips and inks.
  dark: {
    disc: { mid: '#3A1F30', edge: '#2B1826', dots: 'rgba(255, 79, 139, 0.22)' },
    shadow: 'rgba(0, 0, 0, 0.40)',
    panel: { fill: 'rgba(27, 33, 31, 0.92)', inset: '', shadow: '' },
    chip: {
      on: { fill: '#EEF3F0', ink: '#0B0E0D', shadow: '' },
      off: { fill: '#1B211F', ink: '#EEF3F0', inset: '', shadow: '' },
    },
    tile: 'rgba(255, 255, 255, 0.06)',
    dot: { on: '#3DDC84', off: 'rgba(255, 255, 255, 0.15)' },
  },
} as const;
