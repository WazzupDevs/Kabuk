// The capsule's drawing resources' one owner (docs/decisions/skia-build-plani.md → "Bütün kapsül
// Skia'da"): Süsle's pictures, the SVGs drawn from their shapes when there is no picture, and the
// strips' tiles, in one cache whose limit is bytes, not entries. Kept in least recently used order;
// what goes over the limit goes oldest first, except what a drawing on the screen holds
// (`acquire`, counted). Reading (`peek`, `has`) changes nothing: a render only reads. Only `put`
// (a preparation finished) and `dropUnused` throw anything out, so nothing a screen still shows
// goes between its render and its effect; letting go of what goes (a Skia picture's `dispose`) is
// the owner's `drop`. No dependency: unit-tested (features/capsule/artStore.test.ts).

export type ArtStore<V> = {
  // The value kept for `key`, as it stands; its place in the order does not change.
  peek: (key: string) => V | undefined;
  has: (key: string) => boolean;
  // A prepared value, `bytes` its estimated size; the newest in the order.
  put: (key: string, value: V, bytes: number) => void;
  // A drawing on the screen holds `key` (before it is made too: it is held as it comes).
  acquire: (key: string) => void;
  release: (key: string) => void;
  // Everything nothing holds that `which` picks goes (Süsle closed).
  dropUnused: (which: (value: V) => boolean) => void;
  subscribe: (listener: () => void) => () => void;
  readonly bytes: number;
  readonly size: number;
  uses: (key: string) => number;
};

type Entry<V> = { value: V; bytes: number };

export function createArtStore<V>({
  budget,
  drop,
}: {
  budget: number;
  drop: (value: V, key: string) => void;
}): ArtStore<V> {
  // A Map keeps insertion order: the first entry is the one unused the longest.
  const entries = new Map<string, Entry<V>>();
  const held = new Map<string, number>();
  const listeners = new Set<() => void>();
  let total = 0;

  const notify = () => {
    for (const l of [...listeners]) l();
  };
  const remove = (key: string, e: Entry<V>) => {
    entries.delete(key);
    total -= e.bytes;
    drop(e.value, key);
  };
  const usesOf = (key: string) => held.get(key) ?? 0;
  // Over the limit: the oldest that nothing holds go until it is under (what is held stays, even
  // over the limit).
  const trim = () => {
    if (total <= budget) return;
    for (const [key, e] of [...entries]) {
      if (total <= budget) break;
      if (usesOf(key) > 0) continue;
      remove(key, e);
    }
  };

  return {
    peek: (key) => entries.get(key)?.value,
    has: (key) => entries.has(key),
    put(key, value, bytes) {
      const old = entries.get(key);
      if (old) {
        entries.delete(key);
        total -= old.bytes;
        if (old.value !== value) drop(old.value, key);
      }
      entries.set(key, { value, bytes });
      total += bytes;
      trim();
      notify();
    },
    acquire(key) {
      held.set(key, usesOf(key) + 1);
      // The newest in the order: what is shown is the last to go once it is let go.
      const e = entries.get(key);
      if (e) {
        entries.delete(key);
        entries.set(key, e);
      }
    },
    release(key) {
      const n = usesOf(key) - 1;
      if (n > 0) held.set(key, n);
      else held.delete(key);
      // Nothing goes here: a drawing that lets go and the one that takes the same key in the same
      // commit (a look shown by another canvas) must not lose it between them. The next `put` trims.
    },
    dropUnused(which) {
      let any = false;
      for (const [key, e] of [...entries]) {
        if (usesOf(key) > 0 || !which(e.value)) continue;
        remove(key, e);
        any = true;
      }
      if (any) notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get bytes() {
      return total;
    },
    get size() {
      return entries.size;
    },
    uses: usesOf,
  };
}
