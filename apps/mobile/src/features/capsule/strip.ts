import type { Option, OptionGroup } from './options';

// The trying strip's lists (docs/design/iskelet.md → 5.10): the theme packs over the slots, the
// options a pack shows and the dots under the strip.

// The "boş" option's key (options.ts).
export const EMPTY_KEY = 'empty';

// The theme packs with something for the slot, by name in catalog order (iskelet.md → 5.10: the
// thin row over the slots after "Tümü"); a name two racks share is one pack.
export function packNames(groups: readonly OptionGroup[]): string[] {
  const names: string[] = [];
  for (const g of groups) if (g.pack !== null && !names.includes(g.pack)) names.push(g.pack);
  return names;
}

// The options the strip shows: every one for "Tümü" (`pack` null), else "boş" (where the slot has
// it) and that pack's.
export function packOptions(groups: readonly OptionGroup[], pack: string | null): Option[] {
  if (pack === null) return groups.flatMap((g) => g.options);
  return groups.flatMap((g) =>
    g.pack === pack
      ? g.options
      : g.pack === null
        ? g.options.filter((o) => o.key === EMPTY_KEY)
        : [],
  );
}

// The dot lit for option `at` of `count` among `dots` at most (the dots under the strip stand for
// the place along it); -1 for none.
export function dotAt(count: number, at: number, dots: number): number {
  if (at < 0 || count <= 0) return -1;
  const n = Math.min(count, dots);
  return count <= 1 ? 0 : Math.round((at / (count - 1)) * (n - 1));
}

export function dotCount(count: number, dots: number): number {
  return Math.min(Math.max(count, 0), dots);
}
