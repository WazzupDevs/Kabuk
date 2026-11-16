import type { SkImage, SkSVG } from '@shopify/react-native-skia';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { DRAW_LAB } from '@/lib/drawLab';

import { createArtStore } from './artStore';
import { createPrepQueue, type Deadline, type Priority, type PrepStats, SHOWN } from './prepQueue';

// Süsle's drawing resources (artStore.ts) and what makes them (prepQueue.ts), for the Skia drawing
// (components/FxSkia.tsx) and the screen (profile/capsule.tsx). A drawing reads only what is made:
// `useArts` gives the resources when all of them are, undefined until then, and asks for the
// missing ones meanwhile. Nothing here loads Skia: its types only.

// A picture at the screen's pixels; the SVG from its shapes when no picture could be made; a
// tile's PNG address; nothing (neither could be read: the picture way draws).
export type CapsuleArt =
  | { kind: 'image'; image: SkImage }
  | { kind: 'shapes'; svg: SkSVG }
  | { kind: 'uri'; uri: string }
  | { kind: 'none' };
export type Made = { art: CapsuleArt; bytes: number };
// A resource's key (the same key, the same resource) and what makes it.
export type ArtNeed = { key: string; make: () => Made };

// The one limit, in bytes: a picture its pixels × 4, an SVG or a PNG address its text's length.
// About the earlier 32 pictures at the stage's size (about 2 MB each at three pixels a point),
// the tiles' addresses within it.
export const ART_BUDGET_BYTES = 64 * 1024 * 1024;
// A picture let go a little after it goes: a canvas's last frame may still be on its way.
const LET_GO_AFTER_MS = 500;
// A turn for what a drawing waits for: one frame's share.
const URGENT_SLICE_MS = 8;

export const capsuleArt = createArtStore<CapsuleArt>({
  budget: ART_BUDGET_BYTES,
  drop: (art) => {
    // A picture's pixels are not the JS heap's: let go by hand (docs/perf/akicilik-denetimi.md →
    // 4.5). A read SVG and a text are the collector's, as before.
    if (art.kind !== 'image') return;
    const { image } = art;
    setTimeout(() => image.dispose(), LET_GO_AFTER_MS);
  },
});

function frameDeadline(): Deadline {
  const end = performance.now() + URGENT_SLICE_MS;
  return { timeRemaining: () => Math.max(0, end - performance.now()) };
}

export const capsulePrep = createPrepQueue({
  isDone: (key) => capsuleArt.has(key),
  schedule: (slice, urgent) => {
    if (urgent) setTimeout(() => slice(frameDeadline()), 0);
    else requestIdleCallback(slice);
  },
  now: DRAW_LAB ? () => performance.now() : undefined,
});

function made(need: ArtNeed): () => void {
  return () => {
    if (capsuleArt.has(need.key)) return;
    const m = need.make();
    capsuleArt.put(need.key, m.art, m.bytes);
  };
}

// Made here unless made already, outside the queue's own jobs (a job that finds its text first).
export function makeArt(need: ArtNeed): void {
  made(need)();
}

// Read ahead in generation `gen` (capsulePrep.next()), each its own job.
export function prepAhead(needs: readonly ArtNeed[], priority: Priority, gen: number): void {
  for (const n of needs) capsulePrep.ahead(n.key, made(n), priority, gen);
}

// Made here and now, the ones not made yet (a drawing with nothing to show: in its layout effect,
// before the frame, as the drawing read them before).
export function prepNow(needs: readonly ArtNeed[]): void {
  for (const n of needs) capsulePrep.now(n.key, made(n));
}

function allMade(needs: readonly ArtNeed[] | null): boolean {
  return needs === null || needs.every((n) => capsuleArt.has(n.key));
}

// Holds `needs` while the component shows them (a picture held is not thrown out over the limit).
export function usePinned(needs: readonly ArtNeed[] | null): void {
  useEffect(() => {
    if (!needs) return undefined;
    for (const n of needs) capsuleArt.acquire(n.key);
    return () => {
      for (const n of needs) capsuleArt.release(n.key);
    };
  }, [needs]);
}

// True when every one of `needs` is made (null: nothing needed); holds them, and asks for the
// missing ones first.
export function useArtsReady(needs: readonly ArtNeed[] | null): boolean {
  const ready = useSyncExternalStore(capsuleArt.subscribe, () => allMade(needs));
  useEffect(() => {
    if (!needs) return undefined;
    // Held before it is asked for: made, it is not thrown out before it is shown.
    for (const n of needs) capsuleArt.acquire(n.key);
    const unwant = needs
      .filter((n) => !capsuleArt.has(n.key))
      .map((n) => capsulePrep.want(n.key, made(n), SHOWN));
    return () => {
      for (const u of unwant) u();
      for (const n of needs) capsuleArt.release(n.key);
    };
  }, [needs]);
  return ready;
}

// `needs`' resources in their order once all of them are made, undefined until then.
export function useArts(needs: readonly ArtNeed[] | null): readonly CapsuleArt[] | undefined {
  const ready = useArtsReady(needs);
  return useMemo(() => {
    if (!ready || !needs) return undefined;
    const out: CapsuleArt[] = [];
    for (const n of needs) {
      const a = capsuleArt.peek(n.key);
      if (!a) return undefined;
      out.push(a);
    }
    return out;
  }, [ready, needs]);
}

export function useArt(need: ArtNeed | null): CapsuleArt | undefined {
  const needs = useMemo(() => (need ? [need] : null), [need]);
  return useArts(needs)?.[0];
}

// The queue's counts and the cache's size, for the drawing lab (read nowhere else).
export function artStats(): PrepStats & { bytes: number; entries: number } {
  return { ...capsulePrep.stats(), bytes: capsuleArt.bytes, entries: capsuleArt.size };
}
