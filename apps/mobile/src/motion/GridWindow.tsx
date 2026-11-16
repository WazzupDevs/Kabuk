import {
  memo,
  type ReactNode,
  type Ref,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { useWindowDimensions, View } from 'react-native';
import Reanimated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import {
  type GridRow,
  type GridSection,
  gridLayout,
  offsetOfSection,
  sectionIndexAt,
  windowOf,
  windowOfRows,
} from '@/lib/gridWindow';

// The rows bound either side of the screen (a flick finds them drawn).
const OVERSCAN_ROWS = 3;

// The options bound, first to last, as a section's key and the option's index in it.
export type GridVisible = {
  fromKey: string;
  fromIndex: number;
  toKey: string;
  toIndex: number;
};

export type GridWindowHandle = {
  // Scrolls so the section's title row is at the top; false when the key is not a section with
  // options.
  scrollToSection: (key: string, animated?: boolean) => boolean;
};

// The sectioned grid of "Tüm aksesuarlar" (docs/design/iskelet.md → 3.3, 4.2): a title row, then
// rows of `columns` options, section after section. Only the rows on the screen and `OVERSCAN_ROWS`
// either side are bound (lib/gridWindow.ts; the rest is the height of the grid, as SnapStrip's
// stretches are its width). The scroll is read on the UI thread; JS hears of it only when the
// bound rows change (`onWindow`) or the section at the top does (`onSection`).
// The scroll view is a list screen's: no scroll bar and no bounce (`Screen`). The grid brings its
// own scroll, so it is the screen's one scrolling body (`Screen` `list`), not inside another.
// `renderItem` and `renderHeader` are what the rows redraw on: keep their identity while the
// options do not change.
export function GridWindow({
  sections,
  columns,
  rowHeight,
  gap,
  paddingTop = 0,
  paddingBottom = 0,
  paddingHorizontal = 0,
  stickyPad = 0,
  renderItem,
  renderHeader,
  onWindow,
  onSection,
  ref,
  testID,
}: {
  sections: readonly GridSection[];
  columns: number;
  rowHeight: number;
  // The space between rows and between the options of a row.
  gap: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingHorizontal?: number;
  // The pinned title's height: the section whose top is within it of the screen's top is the one
  // `onSection` names.
  stickyPad?: number;
  renderItem: (sectionKey: string, index: number) => ReactNode;
  renderHeader: (sectionKey: string) => ReactNode;
  // The bound options when they change; null when there are none.
  onWindow?: (visible: GridVisible | null) => void;
  // The section at the top, when it changes.
  onSection?: (key: string) => void;
  ref?: Ref<GridWindowHandle>;
  testID?: string;
}) {
  const layout = useMemo(
    () => gridLayout({ sections, columns, rowHeight, gap, paddingTop, paddingBottom }),
    [sections, columns, rowHeight, gap, paddingTop, paddingBottom],
  );
  const scroll = useAnimatedRef<Reanimated.ScrollView>();
  const y = useSharedValue(0);
  const [viewport, setViewport] = useState(useWindowDimensions().height);
  const [bound, setBound] = useState(() => ({
    layout,
    viewport,
    range: windowOf(layout, 0, viewport, OVERSCAN_ROWS),
  }));
  // The sections or the viewport changed: the rows to bind are worked out again from where it is.
  let range = bound.range;
  if (bound.layout !== layout || bound.viewport !== viewport) {
    range = windowOf(layout, y.get(), viewport, OVERSCAN_ROWS);
    setBound({ layout, viewport, range });
  }
  const winFrom = useSharedValue(range.from);
  const winTo = useSharedValue(range.to);
  const section = useSharedValue(-1);
  useEffect(() => {
    winFrom.set(range.from);
    winTo.set(range.to);
    section.set(-1);
  }, [range, layout, winFrom, winTo, section]);

  const moveWindow = (from: number, to: number) =>
    setBound((b) =>
      b.range.from === from && b.range.to === to ? b : { ...b, range: { from, to } },
    );
  const reachSection = (at: number) => {
    const key = layout.sectionKeys[at];
    if (key !== undefined) onSection?.(key);
  };
  const { offsets, ends, sectionOffsets } = layout;
  const onScroll = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        const top = e.contentOffset.y;
        y.set(top);
        const w = windowOfRows(offsets, ends, top, viewport, OVERSCAN_ROWS);
        if (w.from !== winFrom.get() || w.to !== winTo.get()) {
          winFrom.set(w.from);
          winTo.set(w.to);
          runOnJS(moveWindow)(w.from, w.to);
        }
        const s = sectionIndexAt(sectionOffsets, top, stickyPad);
        if (s !== section.get()) {
          section.set(s);
          if (s >= 0) runOnJS(reachSection)(s);
        }
      },
    },
    [offsets, ends, sectionOffsets, viewport, stickyPad],
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToSection: (key, animated = true) => {
        const at = offsetOfSection(layout, key);
        if (at === null) return false;
        scroll.current?.scrollTo({ y: at, animated });
        return true;
      },
    }),
    [layout, scroll],
  );

  // What the bound rows hold, told to whoever prepares what is drawn (the preparation queue).
  useEffect(() => {
    if (!onWindow) return;
    let first: GridRow | null = null;
    let last: GridRow | null = null;
    for (let i = range.from; i <= range.to; i++) {
      const row = layout.rows[i];
      if (row?.kind !== 'items') continue;
      first ??= row;
      last = row;
    }
    if (!first || !last) return onWindow(null);
    onWindow({
      fromKey: first.key,
      fromIndex: first.first,
      toKey: last.key,
      toIndex: last.first + last.count - 1,
    });
  }, [range, layout, onWindow]);

  const rows: ReactNode[] = [];
  for (let i = range.from; i <= range.to; i++) {
    const row = layout.rows[i];
    if (!row) continue;
    rows.push(
      <Row
        key={`${row.kind}:${row.section}:${row.first}`}
        row={row}
        sectionKey={row.key}
        columns={layout.columns}
        gap={gap}
        left={paddingHorizontal}
        renderItem={renderItem}
        renderHeader={renderHeader}
      />,
    );
  }

  return (
    <Reanimated.ScrollView
      ref={scroll}
      testID={testID}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      onScroll={onScroll}
      scrollEventThrottle={16}
      onLayout={(e) => setViewport(Math.round(e.nativeEvent.layout.height))}
      style={{ flex: 1 }}
    >
      <View style={{ height: layout.total }}>{rows}</View>
    </Reanimated.ScrollView>
  );
}

const Row = memo(function Row({
  row,
  sectionKey,
  columns,
  gap,
  left,
  renderItem,
  renderHeader,
}: {
  row: GridRow;
  sectionKey: string;
  columns: number;
  gap: number;
  left: number;
  renderItem: (sectionKey: string, index: number) => ReactNode;
  renderHeader: (sectionKey: string) => ReactNode;
}) {
  const place = {
    position: 'absolute',
    top: row.offset,
    left,
    right: left,
    height: row.height,
  } as const;
  if (row.kind === 'header') return <View style={place}>{renderHeader(sectionKey)}</View>;
  return (
    <View style={[place, { flexDirection: 'row', columnGap: gap }]}>
      {Array.from({ length: columns }, (_, c) => (
        <View key={c} style={{ flex: 1 }}>
          {c < row.count ? renderItem(sectionKey, row.first + c) : null}
        </View>
      ))}
    </View>
  );
});
