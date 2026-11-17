import { type ComponentType, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { ArtNeed } from '@/capsule/useArt';
import { useLabOff, useLabSkia, useLabWhole } from '@/lib/drawLab';
import type { FxInside, FxPlace } from '@/theme/capsuleFx';
import { capsulePainter, capsuleSkiaOn, capsuleWholeOn, ticketWholeOn } from '@/theme/capsuleSkia';

import type { InsidePainter, WholePainter } from './FxSvg';

// The capsule's Skia drawing, behind its switch (theme/capsuleSkia.ts → CAPSULE_SKIA, on for
// Süsle's big capsule on Android; Çizim ölçümü's `skia` on a preview build). Skia is read only when
// it is on: the import is lazy, once for every drawing on the screen (one promise), so the app's
// launch never loads it. Undefined (the
// picture way) while it is off, while it loads, and when it does not load (a build without the
// native module, a test, web: the import throws or Skia is not there).
// `prepare` reads a layer's plan and SVGs ahead (FxSkia.tsx → prepareInside), `Warm` is the canvas
// that makes Skia's drawing context ahead (SkiaWarm).
export type SkiaKit = {
  painter: InsidePainter;
  prepare: (layer: FxInside, place: FxPlace) => void;
  Warm: ComponentType;
  // The whole drawing on one canvas (FxSkia.tsx → SkiaWhole) and the resources a drawing needs on
  // it, itself made in the queue (FxSkia.tsx → lookNeed): nothing of it is made in a render.
  Whole: WholePainter;
  lookNeed: (xml: string, width: number, height: number, moving: boolean) => ArtNeed;
  // A small still drawing as a picture's address (FxSkia.tsx → tileNeed).
  tileNeed: (xml: string, size: number) => ArtNeed;
};
// Kept in an object: a function given to useState would be called as its initial value.
type Loaded = SkiaKit | 'failed';
let loaded: Loaded | null = null;
let loading: Promise<Loaded> | null = null;

function load(): Promise<Loaded> {
  loading ??= Promise.all([import('@shopify/react-native-skia'), import('./FxSkia')]).then(
    ([lib, mod]): Loaded =>
      typeof lib.Skia === 'object' && lib.Skia !== null
        ? {
            painter: mod.SkiaInside,
            prepare: mod.prepareInside,
            Warm: mod.SkiaWarm,
            Whole: mod.SkiaWhole,
            lookNeed: mod.lookNeed,
            tileNeed: mod.tileNeed,
          }
        : 'failed',
    (): Loaded => 'failed',
  );
  return loading.then((l) => {
    loaded = l;
    return l;
  });
}

// `stage`: Süsle's big capsule, the app's switch (the panel's while the panel is open). `lab`: the
// panel's switch only (Kapsül ölçümü's grid: small avatars are not the app's yet, P9). `always`:
// whatever the switches say (Kapsül ölçümü's side by side, a preview build only).
export type SkiaWhere = 'stage' | 'lab' | 'always';

// The loaded kit, undefined while the switch is off, while it loads and when it does not load.
export function useSkiaKit(where: SkiaWhere = 'stage'): SkiaKit | undefined {
  const lab = useLabSkia();
  const on =
    where === 'always' ||
    capsulePainter(where === 'stage' && capsuleSkiaOn(Platform.OS), lab) === 'skia';
  const [kit, setKit] = useState<Loaded | null>(loaded);
  useEffect(() => {
    if (!on || kit !== null) return undefined;
    let live = true;
    void load().then((l) => {
      if (live) setKit(l);
    });
    return () => {
      live = false;
    };
  }, [on, kit]);
  if (!on || kit === null || kit === 'failed') return undefined;
  return kit;
}

// The kit while the whole capsule is Skia's (theme/capsuleSkia.ts → capsuleWholeOn: its switch, or
// Çizim ölçümü's on a preview build); undefined while it is off, while Skia loads and when it does
// not load: the pictures draw then.
export function useWholeKit(): SkiaKit | undefined {
  const on = capsuleWholeOn(Platform.OS, useLabWhole());
  const kit = useSkiaKit(on ? 'always' : 'stage');
  return on ? kit : undefined;
}

// Skia read ahead, in idle time after the launch (features/profile/ahead.ts), so that the Profil
// tab's first opening finds its ticket's canvas ready. Nothing when it is read already.
export function preloadSkiaKit(): void {
  if (loaded === null) void load();
}

// The profile ticket's capsule on one canvas (theme/capsuleSkia.ts → ticketWholeOn; Çizim
// ölçümü's `biletsvg` off): its painter once Skia is read, and `waiting` while it is being read
// (the ticket keeps the capsule's place blank then: the picture way would make the views this
// canvas is for). Neither while it is off or Skia does not load: the pictures draw then.
export function useTicketWhole(): { whole: WholePainter | undefined; waiting: boolean } {
  const on = ticketWholeOn(Platform.OS, useLabOff('biletsvg'));
  const [kit, setKit] = useState<Loaded | null>(loaded);
  useEffect(() => {
    if (!on || kit !== null) return undefined;
    let live = true;
    void load().then((l) => {
      if (live) setKit(l);
    });
    return () => {
      live = false;
    };
  }, [on, kit]);
  if (!on || kit === 'failed') return { whole: undefined, waiting: false };
  if (kit === null) return { whole: undefined, waiting: true };
  return { whole: kit.Whole, waiting: false };
}

export function useSkiaInside(where: SkiaWhere = 'stage'): InsidePainter | undefined {
  return useSkiaKit(where)?.painter;
}
