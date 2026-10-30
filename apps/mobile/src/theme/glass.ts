// What the tab bar shows behind it: skall's own glass (modules/skall-glass), the screen behind
// drawn under the bar, frosted (0.9.0, the owner's call, 29 Ekim; 0.7.0 to 0.8.0 a liquid lens).
// It replaced expo-blur's frosted glass (Dimezis BlurView, which drew every tab screen a second
// time into its buffer and laid a grain over it): this one replays the screen's own drawing, small.
//
// Android draws the glass from 12 (API 31: RenderEffect). Below 12 nothing shows through, so the
// bar is drawn opaque there: the screen ground under its gradient (the owner's decision,
// docs/SPEC_V4.md §4.C).
export const ANDROID_BLUR_SDK = 31;

export function blursBehind(os: string, version: number | string): boolean {
  return os !== 'android' || Number(version) >= ANDROID_BLUR_SDK;
}

// One switch for the glass: false draws the bar on its solid ground everywhere, as below Android 12.
export const TAB_BAR_GLASS = true;

// skall's glass under the tab bar and the message bar: frosted (the owner's call, 29 Ekim: frosted
// instead of the liquid lens, everywhere the glass was; the native view is modules/skall-glass).
// The screen behind is blurred as docs/design/aura's `.glass` blurs it, backdrop-filter:
// blur(24px) saturate(170%): `blur` the deviation in dp, `saturation` the colours' strength. The
// face's gradient (GLASS_FACE) is drawn over it at `overlay` of its strength; the edge and its inner
// light stay whole.
export const TAB_GLASS = {
  blur: 24,
  saturation: 1.7,
  overlay: 0.45,
} as const;

// The glass of a screen's fixed parts (Kapsülün's capsule and its buttons, the owner's call, 27
// Ekim): what scrolls under them blurred (`blur` the deviation in dp), under the screen's ground at
// `tint` of its strength.
export const PANEL_GLASS = { blur: 14, tint: 0.78 } as const;

// Every button's glass look (the owner's call, 27 Ekim: one design language). A clear button (on
// the screen's ground) takes the tab bar's glass: its own fill at `clearFill`, v46's light gradient
// over it, the white edge and the inner light (GLASS_FACE). A coloured one keeps its colour whole,
// so its label reads, with a gloss from the top, a light edge and the inner light. Drawn, not live:
// the ground behind an in-page button is still (only floating parts carry the live glass,
// components/LiquidGlass.tsx).
export const BUTTON_GLASS = {
  clearFill: 0.55,
  gloss: {
    light: 'linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0) 58%)',
    // No gloss in the dark (the owner's call, 28 Ekim: no white shine on objects).
    dark: 'linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0) 58%)',
  },
  edge: { light: 'rgba(255, 255, 255, 0.42)', dark: 'rgba(255, 255, 255, 0.16)' },
  inner: {
    light: 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.55)',
    dark: 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0)',
  },
} as const;

// The face drawn over the frosted glass of the message bar and the clear buttons: a light gradient,
// the edge and the inner light (v46's tab bar, kept as it was when v46 was removed, 30 Ekim).
export const GLASS_FACE = {
  light: {
    gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.2))',
    border: { width: 1, color: 'rgba(255, 255, 255, 0.78)' },
    inset: 'inset 0px 1.5px 1px 0px rgba(255, 255, 255, 0.95)',
  },
  dark: {
    gradient: 'linear-gradient(135deg, rgba(28, 24, 56, 0.62), rgba(28, 24, 56, 0.2))',
    border: { width: 1, color: 'rgba(28, 24, 56, 0.78)' },
    inset: 'inset 0px 1.5px 1px 0px rgba(255, 255, 255, 0.067)',
  },
} as const;
