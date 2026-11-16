// The capsule's drawing resources' one owner (docs/decisions/skia-build-plani.md → "Bütün kapsül
// Skia'da"): Süsle's pictures, the SVGs drawn from their shapes when there is no picture, the
// strips' tiles and the plans that say what a look needs, each kind (`classOf`) under its own
// limit in bytes (and, if given, entries): the tiles read ahead never push out the pictures read
// ahead. Kept in least recently used order; what goes over a limit goes oldest first within its
// kind, except what a drawing on the screen holds (`acquire`, counted). Reading (`peek`, `has`)
// changes nothing: a render only reads. Only `put` (a preparation finished) and `dropUnused`
// throw anything out; letting go of what goes (a Skia picture's `dispose`) is the owner's `drop`.
// A listener hears of its own keys only (`watch`). No dependency: unit-tested
// (features/capsule/artStore.test.ts).

export type ArtLimit = { bytes: number; entries?: number };

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
  // Told when one of `keys` comes or goes.
  watch: (keys: readonly string[], listener: () => void) => () => void;
  // Bytes kept: all of them, or one kind's.
  bytes: (kind?: string) => number;
  readonly size: number;
  uses: (key: string) => number;
};

type Entry<V> = { value: V; bytes: number; kind: string };

export function createArtStore<V>({
  limits,
  classOf,
  drop,
}: {
  limits: Readonly<Record<string, ArtLimit>>;
  classOf: (value: V) => string;
  drop: (value: V, key: string) => void;
}): ArtStore<V> {
  // A Map keeps insertion order: the first entry is the one unused the longest.
  const entries = new Map<string, Entry<V>>();
  const held = new Map<string, number>();
  const listeners = new Map<string, Set<() => void>>();
  const kindBytes = new Map<string, number>();
  const kindCount = new Map<string, number>();
  let total = 0;

  const count = (kind: string, bytes: number, n: number) => {
    kindBytes.set(kind, (kindBytes.get(kind) ?? 0) + bytes);
    kindCount.set(kind, (kindCount.get(kind) ?? 0) + n);
    total += bytes;
  };
  const tell = (keys: Iterable<string>) => {
    const out = new Set<() => void>();
    for (const k of keys) for (const l of listeners.get(k) ?? []) out.add(l);
    for (const l of out) l();
  };
  const remove = (key: string, e: Entry<V>) => {
    entries.delete(key);
    count(e.kind, -e.bytes, -1);
    drop(e.value, key);
  };
  const usesOf = (key: string) => held.get(key) ?? 0;
  const over = (kind: string) => {
    const l = limits[kind];
    if (!l) return false;
    return (
      (kindBytes.get(kind) ?? 0) > l.bytes ||
      (l.entries !== undefined && (kindCount.get(kind) ?? 0) > l.entries)
    );
  };
  // Over its kind's limit: that kind's oldest that nothing holds go until it is under (what is
  // held stays, even over the limit).
  const trim = (kind: string): string[] => {
    const gone: string[] = [];
    if (!over(kind)) return gone;
    for (const [key, e] of [...entries]) {
      if (!over(kind)) break;
      if (e.kind !== kind || usesOf(key) > 0) continue;
      remove(key, e);
      gone.push(key);
    }
    return gone;
  };

  return {
    peek: (key) => entries.get(key)?.value,
    has: (key) => entries.has(key),
    put(key, value, bytes) {
      const old = entries.get(key);
      if (old) {
        entries.delete(key);
        count(old.kind, -old.bytes, -1);
        if (old.value !== value) drop(old.value, key);
      }
      const kind = classOf(value);
      entries.set(key, { value, bytes, kind });
      count(kind, bytes, 1);
      const gone = trim(kind);
      tell([key, ...gone]);
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
      const gone: string[] = [];
      for (const [key, e] of [...entries]) {
        if (usesOf(key) > 0 || !which(e.value)) continue;
        remove(key, e);
        gone.push(key);
      }
      tell(gone);
    },
    watch(keys, listener) {
      for (const k of keys) {
        let set = listeners.get(k);
        if (!set) {
          set = new Set();
          listeners.set(k, set);
        }
        set.add(listener);
      }
      return () => {
        for (const k of keys) {
          const set = listeners.get(k);
          if (!set) continue;
          set.delete(listener);
          if (set.size === 0) listeners.delete(k);
        }
      };
    },
    bytes: (kind) => (kind === undefined ? total : (kindBytes.get(kind) ?? 0)),
    get size() {
      return entries.size;
    },
    uses: usesOf,
  };
}
