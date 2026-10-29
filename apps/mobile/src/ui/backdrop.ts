// What the tab bar shows behind it: skall's own glass (modules/skall-glass, theme/glass.ts), the
// screen behind drawn under the bar, frosted (0.9.0, the owner's call, 29 Ekim; 0.7.0 to 0.8.0 a
// liquid lens). It replaced expo-blur's frosted glass (Dimezis BlurView, which drew every tab screen
// a second time into its buffer and laid a grain over it): this one replays the screen's own
// drawing, small.
//
// Android draws the glass from 12 (API 31: RenderEffect). Below 12 nothing shows through, so the
// bar is drawn opaque there: v46's screen ground under its gradient (the owner's decision,
// docs/SPEC_V4.md §4.C).
export const ANDROID_BLUR_SDK = 31;

export function blursBehind(os: string, version: number | string): boolean {
  return os !== 'android' || Number(version) >= ANDROID_BLUR_SDK;
}

// One switch for the glass: false draws the bar on its solid ground everywhere, as below Android 12.
export const TAB_BAR_GLASS = true;
