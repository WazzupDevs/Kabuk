// skall's glass under the tab bar and the message bar: frosted (the owner's call, 29 Ekim: frosted
// instead of the liquid lens, everywhere the glass was; the native view is modules/skall-glass).
// The screen behind is blurred as docs/design/aura's `.glass` blurs it, backdrop-filter:
// blur(24px) saturate(170%): `blur` the deviation in dp, `saturation` the colours' strength. v46's
// gradient is drawn over it at `overlay` of its strength; the edge and its inner light stay whole.
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
// over it, the white edge and the inner light (parts.generated.ts → V46_TAB_BAR). A coloured one
// keeps its colour whole, so its label reads, with a gloss from the top, a light edge and the inner
// light. Drawn, not live: the ground behind an in-page button is still (only floating parts carry
// the live lens, ui/LiquidGlass.tsx).
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
