// v46's `backdrop-filter: blur(<n>px)` as expo-blur's Android props. expo-blur turns `intensity`
// into two things there: the blur radius it gives Dimezis BlurView (`intensity /
// blurReductionFactor`) and a tint laid over the blur (alpha `intensity / 100` times the tint's
// own: `TintStyle.kt`). v46 has no tint (its ground is the bar's own gradient, drawn above), so the
// intensity is the least expo-blur takes and the radius comes from the reduction factor alone: the
// tint is 1/255. The radius is v46's number; saturate is not drawn (docs/SPEC_V4.md §4.C).
const LEAST_INTENSITY = 1;

export function androidBlur(cssBlur: number): { intensity: number; reductionFactor: number } {
  return { intensity: LEAST_INTENSITY, reductionFactor: LEAST_INTENSITY / cssBlur };
}
