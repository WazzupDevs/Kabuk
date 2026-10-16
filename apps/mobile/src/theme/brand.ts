// The logo's colours (the skall design system → `brand-*`): only in the mark, the wordmark, the
// loaders and the Mekan tab, never as an interface fill. Fixed, the same in both schemes; the app
// icon draws with the same values (scripts/icon/mark.ts → COLORS, checked by brand.test.ts).
export const BRAND = {
  purple: '#7B5CFF', // the first capsule
  pink: '#FF4F8B', // the second capsule
  ink: '#14112B', // the Mekan tab's square, the splash ground
  orange: '#FFB547', // the overlap on a light ground
  white: '#FFFFFF', // the overlap and the wordmark's letters on ink
} as const;

// The Mekan tab's tile lifts off the bar with this shadow, in both schemes.
export const VENUE_TILE_SHADOW = '0px 6px 10px rgba(20, 17, 43, 0.28)';
// The tile's edge: a white line at this opacity.
export const VENUE_TILE_EDGE_OPACITY = 0.16;

// The launch curtain's light (src/features/launch/LaunchCurtain.tsx): the glow behind the mark and
// the flash's middle where the capsules meet.
export const LAUNCH_LIGHT = { glow: '#3B2B92', flash: '#FFD3E4' } as const;
