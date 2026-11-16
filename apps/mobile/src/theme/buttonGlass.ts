// No imports: the root typecheck reads it through contrast.test.ts (auraKit.ts brings React
// Native's types). The kit reads it as KIT.button.
// The buttons (docs/design/iskelet.md → 2.1; the new interface's canvas, 16 Kasım, skall.css `.btn`):
// `prominent` the main action in the ink (in the dark a 94 % white with the dark ink, no shadow),
// darker while pressed; `clear` the soft white (`.btn.soft`); `danger` the soft red (`.btn.danger`;
// in the dark the dialog's red at 12 %); `ghost` no fill, the text's colour ("Vazgeç"). `solid` is the
// fill with the system's "reduce transparency" on (iskelet.md → 6.6): opaque, the same tone over the
// scheme's ground. `off` is the disabled fill and words, no icon (`.btn.off`, `.btn.primary.off`).
// `green` is the old green glass the send rounds keep (Composer, the venue chat card's strip): the
// primary green stays for the send, a key, a badge and the live dot.
const SOFT_SHADOW = '0px 6px 16px rgba(4, 73, 35, 0.10)';
const GREEN = 'linear-gradient(180deg, rgba(40, 170, 100, 0.92), rgba(14, 135, 69, 0.92))';
const GREEN_SOLID = 'linear-gradient(180deg, #28AA64, #0E8745)';
const GREEN_INSET =
  'inset 0px 1px 0px rgba(255, 255, 255, 0.45), inset 0px -1px 0px rgba(0, 40, 15, 0.25), inset 0px 0px 0px 1px rgba(255, 255, 255, 0.18)';
const OFF_LIGHT = { fill: '#DCE9DE', ink: '#4A6550' } as const;

export const BUTTON_GLASS = {
  light: {
    prominent: {
      fill: '#031B0B',
      solid: '#031B0B',
      pressed: '#14301C',
      edge: 'transparent',
      inset: '',
      shadow: '0px 8px 18px rgba(3, 27, 11, 0.22)',
      ink: '#FFFFFF',
      off: OFF_LIGHT,
    },
    clear: {
      fill: 'rgba(255, 255, 255, 0.74)',
      solid: '#EFF7F1',
      pressed: '',
      edge: '#FFFFFF',
      inset: '',
      shadow: SOFT_SHADOW,
      ink: '#031B0B',
      off: OFF_LIGHT,
    },
    danger: {
      fill: '#FBE1DB',
      solid: '#FBE1DB',
      pressed: '',
      edge: 'transparent',
      inset: '',
      shadow: '',
      ink: '#A8301A',
      off: OFF_LIGHT,
    },
    ghost: {
      fill: 'transparent',
      solid: 'transparent',
      pressed: '',
      edge: 'transparent',
      inset: '',
      shadow: '',
      ink: '#031B0B',
      // No board draws a disabled ghost: it keeps no fill, its words the muted colour.
      off: { fill: 'transparent', ink: '#4A6550' },
    },
    green: {
      fill: GREEN,
      solid: GREEN_SOLID,
      pressed: '',
      edge: 'transparent',
      inset: GREEN_INSET,
      shadow: '0px 8px 20px rgba(14, 135, 69, 0.30)',
      ink: '#FFFFFF',
      off: OFF_LIGHT,
    },
  },
  dark: {
    prominent: {
      fill: 'rgba(255, 255, 255, 0.94)',
      // The 94 % white over the dark scheme's black ground.
      solid: '#F0F0F0',
      pressed: '#D6DED9',
      edge: 'transparent',
      inset: '',
      shadow: '',
      ink: '#0B0E0D',
      off: { fill: '#1B211F', ink: 'rgba(238, 243, 240, 0.4)' },
    },
    clear: {
      fill: 'rgba(18, 22, 20, 0.62)',
      solid: '#121614',
      pressed: '',
      edge: 'rgba(255, 255, 255, 0.10)',
      inset: '',
      shadow: '',
      ink: '#EEF3F0',
      off: { fill: '#1F2623', ink: '#A3AEA8' },
    },
    danger: {
      fill: 'rgba(255, 151, 126, 0.12)',
      // The 12 % red over the dialog's surface (#151A18).
      solid: '#312924',
      pressed: '',
      edge: 'transparent',
      inset: '',
      shadow: '',
      ink: '#FF977E',
      off: { fill: '#1F2623', ink: '#A3AEA8' },
    },
    ghost: {
      fill: 'transparent',
      solid: 'transparent',
      pressed: '',
      edge: 'transparent',
      inset: '',
      shadow: '',
      ink: '#EEF3F0',
      off: { fill: 'transparent', ink: '#A3AEA8' },
    },
    green: {
      fill: GREEN,
      solid: GREEN_SOLID,
      pressed: '',
      edge: 'transparent',
      inset: 'inset 0px -1px 0px rgba(0, 40, 15, 0.25)',
      shadow: '0px 10px 22px rgba(0, 0, 0, 0.35)',
      ink: '#FFFFFF',
      off: { fill: '#1F2623', ink: '#A3AEA8' },
    },
  },
} as const;
export type ButtonGlassKind = keyof typeof BUTTON_GLASS.light;
