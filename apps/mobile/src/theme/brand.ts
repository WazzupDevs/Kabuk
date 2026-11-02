// The logo's colours (the skall design system → `brand-*`): only in the mark, the wordmark, the
// loaders and the Mekan tab's mark, never as an interface fill. Fixed, the same in both schemes; the app
// icon draws with the same values (scripts/icon/mark.ts → COLORS, checked by brand.test.ts).
export const BRAND = {
  purple: '#7B5CFF', // the first capsule
  pink: '#FF4F8B', // the second capsule
  ink: '#14112B', // the splash ground
  orange: '#FFB547', // the overlap on a light ground
  white: '#FFFFFF', // the overlap and the wordmark's letters on ink
} as const;

// The launch curtain's light (src/features/launch/LaunchCurtain.tsx): the glow behind the mark and
// the flash's middle where the capsules meet.
export const LAUNCH_LIGHT = { glow: '#3B2B92', flash: '#FFD3E4' } as const;
