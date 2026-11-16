import type { SkImage, SkSVG } from '@shopify/react-native-skia';
import { useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

import { DRAW_LAB } from '@/lib/drawLab';
import type { SkiaPlan } from '@/theme/capsuleSkia';

import { createArtStore } from './artStore';
import { createPrepQueue, type Deadline, type Priority, type PrepStats, SHOWN } from './prepQueue';

// Süsle's drawing resources (artStore.ts) and what makes them (prepQueue.ts), for the Skia drawing
// (components/FxSkia.tsx) and the screen (profile/capsule.tsx). A drawing reads only what is made:
// `useArts` gives the resources when all of them are, undefined until then, and asks for the
// missing ones meanwhile. Nothing here loads Skia: its types only.

// A picture at the screen's pixels; the SVG from its shapes when no picture could be made; a
// tile's PNG address; a motion's plan (null: it cannot be drawn on the canvas); what a look needs
// on the canvas (its plans and pictures); nothing (neither could be read: the picture way draws).
export type CapsuleArt =
  | { kind: 'image'; image: SkImage }
  | { kind: 'shapes'; svg: SkSVG }
  | { kind: 'uri'; uri: string }
  | { kind: 'plan'; plan: SkiaPlan | null }
  | { kind: 'needs'; needs: ArtNeed[] }
  | { kind: 'none' };
export type Made = { art: CapsuleArt; bytes: number };
// A resource's key (the same key, the same resource) and what makes it.
export type ArtNeed = { key: string; make: () => Made };

// Each kind's own limit: the tiles read ahead (the rest, last in the queue) never push out the
// stage's pictures read ahead (next to the chosen one).
// Pictures: their pixels × 4; about the earlier 32 at the stage's size (about 2 MB each at three
// pixels a point). An SVG kept for drawing from its shapes counts its text's length only: what
// Skia's parsed tree weighs natively is not measured (it is more than the text; it comes only when
// no surface could be made).
export const PICTURE_BUDGET_BYTES = 64 * 1024 * 1024;
// Tiles: their PNG addresses' length, and at most the 400 the earlier tile cache kept.
export const TILE_BUDGET_BYTES = 16 * 1024 * 1024;
export const TILE_ENTRIES = 400;
// Plans and what a look needs: their texts' length (keys and SVGs), a look's few at a time.
const META_BUDGET_BYTES = 8 * 1024 * 1024;
const META_ENTRIES = 400;
// A picture let go a little after it goes: a canvas's last frame may still be on its way.
const LET_GO_AFTER_MS = 500;
// A turn for what a drawing waits for: one frame's share.
const URGENT_SLICE_MS = 8;
// The longest an idle turn waits: Süsle's loops run all the time, and the JS thread may never be
// idle while they do; past this the turn runs anyway (one job: its deadline has no time left).
export const IDLE_TIMEOUT_MS = 300;

function kindOf(art: CapsuleArt): string {
  return art.kind === 'image' || art.kind === 'shapes'
    ? 'picture'
    : art.kind === 'uri'
      ? 'tile'
      : 'meta';
}

export const capsuleArt = createArtStore<CapsuleArt>({
  limits: {
    picture: { bytes: PICTURE_BUDGET_BYTES },
    tile: { bytes: TILE_BUDGET_BYTES, entries: TILE_ENTRIES },
    meta: { bytes: META_BUDGET_BYTES, entries: META_ENTRIES },
  },
  classOf: kindOf,
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
    else requestIdleCallback(slice, { timeout: IDLE_TIMEOUT_MS });
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

// The last tile picture each option showed (its slot and option), so that a strip opened again
// (another slot, another colour) shows it at once until its new one is made. As many as the tiles
// kept; written only in effects, emptied with the rest when Süsle closes.
const lastTiles = new Map<string, string>();
export function lastTile(id: string): string | null {
  return lastTiles.get(id) ?? null;
}
export function keepTile(id: string, uri: string): void {
  lastTiles.delete(id);
  lastTiles.set(id, uri);
  if (lastTiles.size > TILE_ENTRIES) {
    const oldest = lastTiles.keys().next();
    if (!oldest.done) lastTiles.delete(oldest.value);
  }
}

// Süsle closed (its last canvas went): everything nothing holds goes, pictures, tiles and plans,
// and what the queue remembers as done.
export function emptyArt(): void {
  capsuleArt.dropUnused(() => true);
  lastTiles.clear();
  capsulePrep.forget();
}

function allMade(needs: readonly ArtNeed[] | null): boolean {
  return needs === null || needs.every((n) => capsuleArt.has(n.key));
}

// Holds `needs` while the component shows them (a picture held is not thrown out over the limit).
// In a layout effect: held before anything else runs after the render that read them.
export function usePinned(needs: readonly ArtNeed[] | null): void {
  useLayoutEffect(() => {
    if (!needs) return undefined;
    for (const n of needs) capsuleArt.acquire(n.key);
    return () => {
      for (const n of needs) capsuleArt.release(n.key);
    };
  }, [needs]);
}

// True when every one of `needs` is made (null: nothing needed); holds them, and asks for the
// missing ones first. Told of its own keys only.
export function useArtsReady(needs: readonly ArtNeed[] | null): boolean {
  const subscribe = useCallback(
    (listener: () => void) => capsuleArt.watch(needs?.map((n) => n.key) ?? [], listener),
    [needs],
  );
  const ready = useSyncExternalStore(subscribe, () => allMade(needs));
  useLayoutEffect(() => {
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
  return { ...capsulePrep.stats(), bytes: capsuleArt.bytes(), entries: capsuleArt.size };
}
