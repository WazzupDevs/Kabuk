// The layout of a sectioned grid (a title row, then rows of `columns` options, section after
// section) and the rows a scroll position needs bound (motion/GridWindow.tsx). Pure: the grid binds
// the rows on the screen and a few either side, the rest is an empty stretch of the grid's height.
// `windowOfRows` and `sectionIndexAt` run on the UI thread, from the scroll handler, and read flat
// number arrays only (a worklet copies what it closes over, and 5000 options are 1250 rows).

export type GridSection = { key: string; count: number; headerHeight: number };

export type GridRow = {
  kind: 'header' | 'items';
  // The section's index in the sections passed in, and its key.
  section: number;
  key: string;
  // The first option's index in its section (items rows), 0 for a header row.
  first: number;
  // The options in the row (items rows), 0 for a header row.
  count: number;
  offset: number;
  height: number;
};

export type GridLayout = {
  rows: GridRow[];
  // Each row's top and bottom, in row order (rows never overlap; `gap` lies between them).
  offsets: number[];
  ends: number[];
  // The top and key of each section that has rows (a section with no options has none), in order.
  sectionOffsets: number[];
  sectionKeys: string[];
  total: number;
  columns: number;
};

// The rows to bind, first and last (to < from when there are none). Two numbers, so a scroll that
// stays inside the same rows compares equal.
export type GridWindowRange = { from: number; to: number };

export type GridLayoutInput = {
  sections: readonly GridSection[];
  columns: number;
  rowHeight: number;
  // The space between rows (the grid's own columns take theirs from the same value).
  gap: number;
  paddingTop: number;
  paddingBottom: number;
};

export function gridLayout(input: GridLayoutInput): GridLayout {
  const { sections, rowHeight, gap, paddingTop, paddingBottom } = input;
  const columns = Math.max(1, Math.floor(input.columns));
  const rows: GridRow[] = [];
  const offsets: number[] = [];
  const ends: number[] = [];
  const sectionOffsets: number[] = [];
  const sectionKeys: string[] = [];
  let y = paddingTop;
  const push = (row: GridRow) => {
    rows.push(row);
    offsets.push(row.offset);
    ends.push(row.offset + row.height);
    y = row.offset + row.height + gap;
  };
  sections.forEach((section, s) => {
    if (section.count <= 0) return;
    sectionOffsets.push(y);
    sectionKeys.push(section.key);
    if (section.headerHeight > 0)
      push({
        kind: 'header',
        section: s,
        key: section.key,
        first: 0,
        count: 0,
        offset: y,
        height: section.headerHeight,
      });
    for (let first = 0; first < section.count; first += columns)
      push({
        kind: 'items',
        section: s,
        key: section.key,
        first,
        count: Math.min(columns, section.count - first),
        offset: y,
        height: rowHeight,
      });
  });
  // The last row's gap is not content.
  const total = rows.length === 0 ? paddingTop + paddingBottom : y - gap + paddingBottom;
  return { rows, offsets, ends, sectionOffsets, sectionKeys, total, columns };
}

// The first index in `values` (ascending) that is greater than `x`; values.length when none.
function firstAbove(values: readonly number[], x: number): number {
  'worklet';
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((values[mid] ?? Infinity) > x) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// The rows to bind for a scroll of `scrollY` in a viewport `viewportHeight` high: the rows that
// touch the screen and `overscanRows` either side. A binary search over the rows' tops and bottoms:
// no scan of the rows.
export function windowOfRows(
  offsets: readonly number[],
  ends: readonly number[],
  scrollY: number,
  viewportHeight: number,
  overscanRows: number,
): GridWindowRange {
  'worklet';
  const n = offsets.length;
  if (n === 0 || viewportHeight <= 0) return { from: 0, to: -1 };
  const top = Math.max(0, scrollY);
  // The first row that ends below the screen's top, the last that starts above its bottom.
  const first = Math.min(firstAbove(ends, top), n - 1);
  const last = Math.max(firstAbove(offsets, top + viewportHeight) - 1, first);
  return {
    from: Math.max(0, first - overscanRows),
    to: Math.min(n - 1, last + overscanRows),
  };
}

export function windowOf(
  layout: GridLayout,
  scrollY: number,
  viewportHeight: number,
  overscanRows: number,
): GridWindowRange {
  return windowOfRows(layout.offsets, layout.ends, scrollY, viewportHeight, overscanRows);
}

// Where a section starts (its title row's top), for a category chip's scroll; null for a key that is
// not there or whose section has no options.
export function offsetOfSection(layout: GridLayout, key: string): number | null {
  const at = layout.sectionKeys.indexOf(key);
  if (at < 0) return null;
  return layout.sectionOffsets[at] ?? null;
}

// The position (in `sectionOffsets`) of the section that owns the screen's top: the last whose top
// is at or above `scrollY + stickyPad` (the pinned title's height); the first when the scroll is
// above them all; -1 when there are none.
export function sectionIndexAt(
  sectionOffsets: readonly number[],
  scrollY: number,
  stickyPad: number,
): number {
  'worklet';
  if (sectionOffsets.length === 0) return -1;
  return Math.max(0, firstAbove(sectionOffsets, scrollY + stickyPad) - 1);
}

export function sectionAt(layout: GridLayout, scrollY: number, stickyPad: number): string | null {
  const at = sectionIndexAt(layout.sectionOffsets, scrollY, stickyPad);
  return layout.sectionKeys[at] ?? null;
}
