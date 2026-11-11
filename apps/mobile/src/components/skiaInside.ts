import { useEffect, useState } from 'react';

import { useLabSkia } from '@/lib/drawLab';
import { CAPSULE_SKIA, capsulePainter } from '@/theme/capsuleSkia';

import type { InsidePainter } from './FxSvg';

// The capsule's Skia drawing, behind its switch (theme/capsuleSkia.ts → CAPSULE_SKIA, Çizim
// ölçümü's `skia` on a preview build). Skia is read only when it is on: the import is lazy, once for
// every drawing on the screen (one promise), so the app's launch never loads it. Undefined (the
// picture way) while it is off, while it loads, and when it does not load (a build without the
// native module, a test, web: the import throws or Skia is not there).
// Kept in an object: a function given to useState would be called as its initial value.
type Loaded = { painter: InsidePainter } | 'failed';
let loaded: Loaded | null = null;
let loading: Promise<Loaded> | null = null;

function load(): Promise<Loaded> {
  loading ??= Promise.all([import('@shopify/react-native-skia'), import('./FxSkia')]).then(
    ([lib, mod]): Loaded =>
      typeof lib.Skia === 'object' && lib.Skia !== null ? { painter: mod.SkiaInside } : 'failed',
    (): Loaded => 'failed',
  );
  return loading.then((l) => {
    loaded = l;
    return l;
  });
}

// `always`: loaded whatever the switch says (Kapsül ölçümü's side by side, a preview build only).
export function useSkiaInside(always = false): InsidePainter | undefined {
  const lab = useLabSkia();
  const on = always || capsulePainter(CAPSULE_SKIA, lab) === 'skia';
  const [painter, setPainter] = useState<Loaded | null>(loaded);
  useEffect(() => {
    if (!on || painter !== null) return undefined;
    let live = true;
    void load().then((l) => {
      if (live) setPainter(l);
    });
    return () => {
      live = false;
    };
  }, [on, painter]);
  if (!on || painter === null || painter === 'failed') return undefined;
  return painter.painter;
}
