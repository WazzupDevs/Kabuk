// renderGuard.test.ts: the files that still open a Modal (a window of their own). A layer that
// opens over a screen is drawn in the app's layer (motion/menuLayer.tsx) instead (CLAUDE.md →
// Çizim bütçesi, 21 Kasım). A ratchet: a new file fails, a listed file that no longer opens one must
// leave the list. motion/menuLayer.tsx → Layer holds the one fallback outside the layer; the sheet, the dialog, the photo
// and the request still open their own (21 Kasım: moved back, their motion was built on it).
export const MODAL_ALLOWED: readonly string[] = [
  'src/components/OverlayHost.tsx',
  'src/components/PhotoPreview.tsx',
  'src/features/games/FirstGameIntro.tsx',
  'src/features/rooms/IncomingRequest.tsx',
  'src/motion/Sheet.tsx',
  'src/motion/menuLayer.tsx',
];
