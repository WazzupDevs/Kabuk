// A small cache that drops the entry unused the longest when it is full (a Map keeps insertion
// order; a read moves its entry to the end).
export type Lru<V> = {
  get: (key: string) => V | undefined;
  set: (key: string, value: V) => void;
  readonly size: number;
};

export function createLru<V>(max: number): Lru<V> {
  const map = new Map<string, V>();
  return {
    get(key) {
      const hit = map.get(key);
      if (hit === undefined) return undefined;
      map.delete(key);
      map.set(key, hit);
      return hit;
    },
    set(key, value) {
      map.delete(key);
      map.set(key, value);
      if (map.size > max) {
        const oldest = map.keys().next();
        if (!oldest.done) map.delete(oldest.value);
      }
    },
    get size() {
      return map.size;
    },
  };
}

// Numbers calls so that a slow, older answer can be told from the newest: `next()` starts a call
// (or voids the ones in flight), `isLatest(n)` is true while no later `next()` has happened.
export function createOrder(): { next: () => number; isLatest: (n: number) => boolean } {
  let last = 0;
  return {
    next: () => ++last,
    isLatest: (n) => n === last,
  };
}
