// No imports: the root typecheck reads it through contrast.test.ts (auraKit.ts brings React
// Native's types). The kit reads it as KIT.button.
// The glass buttons (docs/design/iskelet.md → 2.1; the riso buttons of 8 Kasım are gone): no live
// blur, a translucent fill drawn through gradientStyle, a 1 px light top line, a 1 px dark bottom
// line and a 1 px white edge inside (inset shadows), and a soft outer shadow (NativeShadow).
// `solid` is the fill with the system's "reduce transparency" on (iskelet.md → 6.6): opaque, toned.
// The dark scheme is not drawn in the document: the same green and red glass with the dark
// primary's black shadow and no white lines (none in the dark, the owner's call, 28 Ekim), the
// clear one the dark scheme's raised fill (#121614) at the clear glass's 62 % and its edge.
const STRONG_INSET =
  'inset 0px 1px 0px rgba(255, 255, 255, 0.45), inset 0px -1px 0px rgba(0, 40, 15, 0.25), inset 0px 0px 0px 1px rgba(255, 255, 255, 0.18)';
const DARK_INSET = 'inset 0px -1px 0px rgba(0, 40, 15, 0.25)';
const GREEN = 'linear-gradient(180deg, rgba(40, 170, 100, 0.92), rgba(14, 135, 69, 0.92))';
const GREEN_SOLID = 'linear-gradient(180deg, #28AA64, #0E8745)';
const RED = 'linear-gradient(180deg, rgba(226, 78, 58, 0.92), rgba(200, 51, 31, 0.92))';
const RED_SOLID = 'linear-gradient(180deg, #E24E3A, #C8331F)';
const DARK_SHADOW = '0px 10px 22px rgba(0, 0, 0, 0.35)';

export const BUTTON_GLASS = {
  light: {
    prominent: {
      fill: GREEN,
      solid: GREEN_SOLID,
      edge: 'transparent',
      inset: STRONG_INSET,
      shadow: '0px 8px 20px rgba(14, 135, 69, 0.30)',
      ink: '#FFFFFF',
    },
    clear: {
      fill: 'rgba(255, 255, 255, 0.62)',
      solid: '#EFF7F1',
      edge: 'rgba(255, 255, 255, 0.90)',
      inset: 'inset 0px 1px 0px #FFFFFF',
      shadow: '0px 8px 22px rgba(3, 27, 11, 0.10)',
      ink: '#0B5A2D',
    },
    danger: {
      fill: RED,
      solid: RED_SOLID,
      edge: 'transparent',
      inset: STRONG_INSET,
      shadow: '0px 8px 20px rgba(200, 51, 31, 0.30)',
      ink: '#FFFFFF',
    },
  },
  dark: {
    prominent: {
      fill: GREEN,
      solid: GREEN_SOLID,
      edge: 'transparent',
      inset: DARK_INSET,
      shadow: DARK_SHADOW,
      ink: '#FFFFFF',
    },
    clear: {
      fill: 'rgba(18, 22, 20, 0.62)',
      solid: '#121614',
      edge: 'rgba(255, 255, 255, 0.10)',
      inset: '',
      shadow: '',
      ink: '#EEF3F0',
    },
    danger: {
      fill: RED,
      solid: RED_SOLID,
      edge: 'transparent',
      inset: DARK_INSET,
      shadow: DARK_SHADOW,
      ink: '#FFFFFF',
    },
  },
  // Disabled: the same button at 45 %, its touch off.
  offOpacity: 0.45,
} as const;
export type ButtonGlassKind = keyof typeof BUTTON_GLASS.light;
