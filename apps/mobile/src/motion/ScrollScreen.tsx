import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useMemo,
  useState,
} from 'react';
import { type ScrollView, type ScrollViewProps, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { MOTION } from '@/theme/aura';

import { tabShrinks } from './scrollMath';
import { useTabShrink } from './TabBar';

// A screen's scroll as one shared value (docs/design/iskelet.md → 4.1): the scrolling body writes
// its offset on the UI thread, and the top bar (TopBar), a sticky field (StickyField) and the tab
// bar (TabBar, through useTabShrink) read it there; nothing goes to JS on a frame. A screen that does
// not scroll (Screen's fixed body) has none: its top bar shows no band and its title stays.
export type ScreenScroll = {
  y: SharedValue<number>;
  // The sticky field's offset at which it pins (-1: none), and how much further down the band
  // reaches under it once pinned (set once when the field is measured, not on a frame).
  stickyAt: SharedValue<number>;
  reach: number;
  setReach: (px: number) => void;
  // The scrolling body's top in the window and its content's height, for the field to place itself
  // in the content (again when the content changes size).
  viewportTop: SharedValue<number>;
  contentHeight: SharedValue<number>;
};

const ScreenScrollContext = createContext<ScreenScroll | null>(null);

export function useScreenScroll(): ScreenScroll | null {
  return useContext(ScreenScrollContext);
}

// The screen's offset: the one given (a screen that reads it itself, Aktiviteler) or its own.
export function useScrollOffset(given?: SharedValue<number>): SharedValue<number> {
  const own = useSharedValue(0);
  return given ?? own;
}

// The holder: `y` null for a screen that does not scroll. Inside the tabs the offset also folds the
// tab bar (MOTION.tabMin), decided on the UI thread frame by frame.
export function ScrollScreen({
  y,
  children,
}: {
  y: SharedValue<number> | null;
  children: ReactNode;
}) {
  const stickyAt = useSharedValue(-1);
  const viewportTop = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const [reach, setReach] = useState(0);
  const shrink = useTabShrink();
  const t = MOTION.tabMin;
  useAnimatedReaction(
    () => (y ? y.get() : 0),
    (now, before) => {
      if (!y || !shrink || before === null) return;
      const was = shrink.get() === 1;
      const next = tabShrinks(was, now, now - before, t.thresholdPx, t.speedPx, t.openPx);
      if (next !== was) shrink.set(next ? 1 : 0);
    },
    [y, shrink],
  );
  const value = useMemo(
    () => (y ? { y, stickyAt, reach, setReach, viewportTop, contentHeight } : null),
    [y, stickyAt, reach, viewportTop, contentHeight],
  );
  return <ScreenScrollContext.Provider value={value}>{children}</ScreenScrollContext.Provider>;
}

// A scrolling view's `onContentSizeChange`: the content's height for the sticky field.
export function useContentHeightFeed(): (width: number, height: number) => void {
  const scroll = useScreenScroll();
  return (_w, h) => scroll?.contentHeight.set(h);
}

// The scrolling body's box: measures its top in the window once it is laid out (StickyField).
export function ScrollViewport({ children }: { children: ReactNode }) {
  const scroll = useScreenScroll();
  const [box, setBox] = useState<View | null>(null);
  return (
    <View
      ref={setBox}
      style={{ flex: 1 }}
      onLayout={() => box?.measureInWindow((_x, top) => scroll?.viewportTop.set(top))}
    >
      {children}
    </View>
  );
}

type BodyProps = Pick<
  ScrollViewProps,
  'contentContainerStyle' | 'keyboardShouldPersistTaps' | 'stickyHeaderIndices'
> & {
  y: SharedValue<number>;
  scrollRef?: RefObject<ScrollView | null>;
  children: ReactNode;
};

// A list's scrolling view that writes its offset to `y` on the UI thread. `scrollRef` reaches the
// scroll view itself (a screen that moves its own scroll).
export function ScrollBody({
  y,
  scrollRef,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  stickyHeaderIndices,
  children,
}: BodyProps) {
  const onScroll = useAnimatedScrollHandler((e) => {
    y.set(e.contentOffset.y);
  });
  const onContentSizeChange = useContentHeightFeed();
  return (
    <Animated.ScrollView
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onContentSizeChange={onContentSizeChange}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      stickyHeaderIndices={stickyHeaderIndices}
    >
      {children}
    </Animated.ScrollView>
  );
}
