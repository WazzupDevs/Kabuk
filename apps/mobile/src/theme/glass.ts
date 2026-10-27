// skall's liquid glass under the tab bar (the owner's call, 27 Ekim: as iOS draws it; the native
// view is modules/skall-glass). The screen behind is blurred a little, then bent through a rounded
// lens: within `depth` of the rim what lies just outside is drawn in, at most `refraction` away,
// its colours split by `dispersion`; a thin band at the rim takes the light (`highlight`, 0 to 1).
// v46's gradient is drawn over it at `overlay` of its strength, so the glass stays clear; the edge
// and its inner light stay whole. Lengths in dp.
export const TAB_GLASS = {
  blur: 4,
  refraction: 14,
  depth: 16,
  dispersion: 0.15,
  highlight: 0.7,
  overlay: 0.45,
} as const;
