// skall's liquid glass under the tab bar (the owner's call, 27 Ekim: as iOS draws it; the native
// view is modules/skall-glass). The screen behind is blurred a little, then bent through a rounded
// lens: within `depth` of the rim what is drawn comes from up to `refraction` away, its colours
// split by `dispersion`; a thin band at the rim takes the light (`highlight`, 0 to 1). v46's
// gradient is drawn over it at `overlay` of its strength, so the glass stays clear; the edge and
// its inner light stay whole. Lengths in dp.
//
// The refraction is negative: the rim draws from further in. Android hands the effect only what
// lies under the view, so a rim that drew from outside read nothing there and showed a cyan line
// where only the red went out (the owner's report, 27 Ekim; 0.7.0's native lens reads outward for
// a positive value).
export const TAB_GLASS = {
  blur: 4,
  refraction: -14,
  depth: 16,
  dispersion: 0.15,
  highlight: 0.7,
  overlay: 0.45,
} as const;

// The simpler glass of a screen's fixed parts (Kapsülün's capsule and its buttons, the owner's call,
// 27 Ekim): what scrolls under them only blurred, under the screen's ground at `tint` of its
// strength; no lens.
export const PANEL_GLASS = { blur: 14, tint: 0.78 } as const;
