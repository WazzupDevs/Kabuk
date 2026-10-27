// v46's `backdrop-filter: blur(<n>px)` as expo-blur's Android props. expo-blur turns `intensity`
// into two things there: the blur radius it gives Dimezis BlurView (`intensity /
// blurReductionFactor`) and a tint laid over the blur (alpha `intensity / 100` times the tint's
// own: `TintStyle.kt`). v46 has no tint (its ground is the bar's own gradient, drawn above), so the
// intensity is the least expo-blur takes and the radius comes from the reduction factor alone: the
// tint is 1/255. Saturate is not drawn (docs/SPEC_V4.md §4.C).
//
// CSS blurs by a standard deviation in dp; Android in physical pixels. Dimezis (set up with its
// default scale factor, 4) blurs by `RenderEffect.createBlurEffect(radius × 4)` from Android 12,
// and Android turns that radius into a standard deviation as Skia does: 0.57735 × radius + 0.5.
// So the radius is worked back from v46's deviation on this screen's pixels.
const LEAST_INTENSITY = 1;
const DIMEZIS_SCALE = 4;
const SIGMA_PER_RADIUS = 0.57735;
const SIGMA_OFFSET = 0.5;

export function androidBlur(
  cssBlur: number,
  pixelRatio: number,
): { intensity: number; reductionFactor: number } {
  const radius = (cssBlur * pixelRatio - SIGMA_OFFSET) / SIGMA_PER_RADIUS / DIMEZIS_SCALE;
  return { intensity: LEAST_INTENSITY, reductionFactor: LEAST_INTENSITY / radius };
}

// Android blurs from 12 (API 31: expo-blur's `dimezisBlurViewSdk31Plus`). Below it nothing is
// blurred, so the bar is drawn opaque there: v46's screen ground under its gradient, nothing
// behind showing through (the owner's decision, docs/SPEC_V4.md §4.C).
export const ANDROID_BLUR_SDK = 31;

export function blursBehind(os: string, version: number | string): boolean {
  return os !== 'android' || Number(version) >= ANDROID_BLUR_SDK;
}

// Whether the tab bar blurs the screen behind it at all (the owner's report, 27 Ekim: the app felt
// heavy). On Android the blur draws every tab screen a second time, into the blur's buffer, on each
// frame it changes (scrolling, every animation); off, the bar is its solid ground under the same
// gradient and edge, as below Android 12. One switch: true brings the frosted bar back.
export const TAB_BAR_BLUR = false;
