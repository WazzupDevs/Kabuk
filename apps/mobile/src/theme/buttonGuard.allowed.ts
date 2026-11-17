// buttonGuard.test.ts: the files that still import components/Button (13 on 16 Kasım). It is a thin
// wrapper of the kit's Btn (src/aura/kit.tsx); new code takes Btn. Only shrinks: a file moved to Btn
// leaves it.
export const BUTTON_ALLOWED: readonly string[] = [
  'app/(app)/design-preview.tsx',
  'src/components/RouteError.tsx',
  'src/features/design/capsuleMeasurePreview.tsx',
  'src/features/design/measurePreview.tsx',
  'src/features/design/motionPreview.tsx',
  'src/features/design/partsPreview.tsx',
  'src/features/design/previews.tsx',
  'src/features/design/workshop/WorkshopSet.tsx',
  'src/features/design/workshop/registry.tsx',
  'src/features/games/say/Say.tsx',
  'src/features/games/vampir/VampirGame.tsx',
  'src/features/games/vampir/VampirPlay.tsx',
];
