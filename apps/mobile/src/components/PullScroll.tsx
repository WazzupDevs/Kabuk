import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { type ScrollViewProps, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  scrollTo,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Loader } from '@/components/Loader';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { BRAND } from '@/theme/brand';
import { capsules, LOADER_MIN_VISIBLE_MS, MARK_WINDOW } from '@/theme/markMotion';
import { PULL, pullIndicator, pullMark, pullOffset } from '@/theme/pullRefresh';
import { useTheme } from '@/theme/ThemeProvider';

type Props = Pick<
  ScrollViewProps,
  | 'contentContainerStyle'
  | 'keyboardShouldPersistTaps'
  | 'keyboardDismissMode'
  | 'onContentSizeChange'
> & {
  // Fetches the list again; the mark turns until it settles (and at least as long as a loader
  // stays, LOADER_MIN_VISIBLE_MS).
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  // The list's offset, for a part that pins once it reaches the top (Aktiviteler's tabs).
  scrollY?: SharedValue<number>;
  // How far down the indicator starts: under a top bar drawn over the list (Screen → PageTop).
  indicatorTop?: number;
  // What stays in place while the list is pulled (the page's title, its pinned search or tabs): it
  // scrolls with the list, but the pull moves only what is under it, and the indicator comes out
  // between the two (the owner's call, 13 Kasım; docs/denetim/pano-fark-2026-11.md → PF-40).
  head?: ReactNode;
};

const p = PULL;

// Where the list starts under a head that stays: the content's top padding, the head and the gap.
function listTop(flat: { paddingTop?: unknown; gap?: unknown }, headHeight: number): number {
  const n = (v: unknown) => (typeof v === 'number' ? v : 0);
  return n(flat.paddingTop) + headHeight + n(flat.gap);
}
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));
// A pull starts once the finger has gone this far down (v46: `d > 6`), and fails this far up.
const START = 6;

// v46's pull to refresh (`.ptr-ind` over `.dbody`; theme/pullRefresh.ts): at the top of the list a
// finger pulled down takes the list with it and brings the indicator's capsules together; at
// `lockAt` they are the mark, and a release there refreshes: the list rests `restAt` down and the
// mark turns (Dönüş, the loader). Let go earlier and the list settles back. The list settles with
// v46's transition (none with reduce motion); the indicator follows the finger and goes at once,
// as in v46. Only the list view has it (v46: `vm === 'list'`).
export function PullScroll({
  onRefresh,
  children,
  contentContainerStyle,
  scrollY,
  indicatorTop = 0,
  head,
  ...scroll
}: Props) {
  const [headHeight, setHeadHeight] = useState(0);
  const reduce = useReduceMotion();
  const scroller = useAnimatedRef<Animated.ScrollView>();
  const atTop = useSharedValue(true);
  const pulling = useSharedValue(false);
  const busy = useSharedValue(false);
  // The finger's pull (the indicator) and the list's offset (which settles).
  const finger = useSharedValue(0);
  const list = useSharedValue(0);
  const from = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const still = reduce && p.settle.offWhenReduced;
  const flat = StyleSheet.flatten(contentContainerStyle) ?? {};
  const gaps = { gap: flat.gap, rowGap: flat.rowGap, columnGap: flat.columnGap };

  const settleTo = useCallback(
    (to: number) => {
      'worklet';
      list.set(
        still
          ? to
          : withTiming(to, { duration: p.settle.ms, easing: Easing.bezier(...p.settle.ease) }),
      );
    },
    [list, still],
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void Promise.allSettled([onRefresh(), wait(LOADER_MIN_VISIBLE_MS)]).then(() =>
      setRefreshing(false),
    );
  }, [onRefresh]);

  useEffect(() => {
    if (refreshing) return;
    busy.set(false);
    finger.set(0);
    settleTo(0);
  }, [refreshing, busy, finger, settleTo]);

  const onScroll = useAnimatedScrollHandler((e) => {
    atTop.set(e.contentOffset.y <= 0);
    scrollY?.set(e.contentOffset.y);
  });

  const native = Gesture.Native();
  const pan = Gesture.Pan()
    .activeOffsetY(START)
    .failOffsetY(-START)
    .simultaneousWithExternalGesture(native)
    .onStart((e) => {
      pulling.set(atTop.get() && !busy.get());
      // The pull is counted from where it was taken up: the way the finger had already gone was
      // put on the list in one frame (docs/denetim/pano-fark-2026-11.md → PF-43).
      from.set(e.translationY);
    })
    // The animated ref is read on the UI thread when the finger moves, not while rendering
    // (Reanimated's scrollTo); the rule takes `useAnimatedRef` for a React ref.
    // eslint-disable-next-line react-hooks/refs
    .onUpdate((e) => {
      if (!pulling.get()) return;
      const y = pullOffset(e.translationY - from.get(), p);
      finger.set(y);
      list.set(y);
      // The list does not scroll while it is pulled.
      if (y > 0) scrollTo(scroller, 0, 0, false);
    })
    .onEnd(() => {
      if (!pulling.get()) return;
      if (finger.get() >= p.lockAt) {
        busy.set(true);
        finger.set(p.restAt);
        settleTo(p.restAt);
        runOnJS(refresh)();
      } else {
        finger.set(0);
        settleTo(0);
      }
    })
    .onFinalize(() => {
      // A pull that ends any other way leaves nothing behind either.
      if (pulling.get() && !busy.get()) {
        finger.set(0);
        settleTo(0);
      }
      pulling.set(false);
    });

  const listStyle = useAnimatedStyle(() => ({ transform: [{ translateY: list.get() }] }));
  const indicator = useAnimatedStyle(() => {
    const i = pullIndicator(finger.get(), p);
    // Only while it is pulled or refreshing: a pull's leftover kept its two capsules over the list
    // (docs/denetim/pano-fark-2026-11.md → PF-42).
    const shown = pulling.get() || busy.get();
    return { opacity: shown ? i.opacity : 0, transform: [{ translateY: i.y }] };
  });

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }} collapsable={false}>
          <GestureDetector gesture={native}>
            <Animated.ScrollView
              showsHorizontalScrollIndicator={false}
              ref={scroller}
              onScroll={onScroll}
              scrollEventThrottle={16}
              // v46's list does not stretch at its ends; the pull is the only overscroll.
              overScrollMode="never"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={contentContainerStyle}
              {...scroll}
            >
              {/* The list moves as one view; the screen's gaps are between its children, so they
                  go on it (the content's own gap would sit around this one view only). */}
              {head ? (
                <View
                  // Over the list: a pinned field in it is drawn above what scrolls under it.
                  style={[gaps, { zIndex: 1 }]}
                  onLayout={(e) => setHeadHeight(e.nativeEvent.layout.height)}
                >
                  {head}
                </View>
              ) : null}
              <Animated.View style={[gaps, listStyle]}>{children}</Animated.View>
            </Animated.ScrollView>
          </GestureDetector>
        </View>
      </GestureDetector>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: head ? listTop(flat, headHeight) : indicatorTop,
            left: 0,
            right: 0,
            alignItems: 'center',
          },
          indicator,
        ]}
      >
        {refreshing ? (
          <Loader kind="spin" size={p.size} delay={0} />
        ) : (
          <PullMark finger={finger} busy={busy} />
        )}
      </Animated.View>
    </View>
  );
}

// The indicator while it is pulled (v46's `geo`): the loaders' mark at this size (MARK_SMALL), its
// capsules apart and the pair small, coming together as the finger pulls. Drawn as Mark.tsx draws
// the mark (the overlap a copy of the second capsule inside the first), moved only by transforms.
function PullMark({ finger, busy }: { finger: SharedValue<number>; busy: SharedValue<boolean> }) {
  const { colors } = useTheme();
  const k = p.size / MARK_WINDOW;
  const [a, b] = capsules(p.capsule);
  // Each capsule moves half the change of the offset from the mark (the lock), the pair staying
  // centred; the overlap inside the first moves by the whole change.
  const first = useAnimatedStyle(() => {
    const m = pullMark(busy.get() ? p.lockAt : finger.get(), p);
    return {
      transform: [
        { translateX: (-(m.dx - p.capsule.dx) / 2) * k },
        { translateY: (-(m.dy - p.capsule.dy) / 2) * k },
      ],
    };
  });
  const second = useAnimatedStyle(() => {
    const m = pullMark(busy.get() ? p.lockAt : finger.get(), p);
    return {
      transform: [
        { translateX: ((m.dx - p.capsule.dx) / 2) * k },
        { translateY: ((m.dy - p.capsule.dy) / 2) * k },
      ],
    };
  });
  const overlap = useAnimatedStyle(() => {
    const m = pullMark(busy.get() ? p.lockAt : finger.get(), p);
    return {
      transform: [
        { translateX: (m.dx - p.capsule.dx) * k },
        { translateY: (m.dy - p.capsule.dy) * k },
      ],
    };
  });
  const pair = useAnimatedStyle(() => ({
    transform: [{ scale: pullMark(busy.get() ? p.lockAt : finger.get(), p).scale }],
  }));
  const box = (r: { x: number; y: number; w: number; h: number }) =>
    ({
      position: 'absolute',
      left: r.x * k,
      top: r.y * k,
      width: r.w * k,
      height: r.h * k,
      borderRadius: (r.w * k) / 2,
    }) as const;
  return (
    <Animated.View style={[{ width: p.size, height: p.size }, pair]}>
      <Animated.View style={[box(b), { backgroundColor: BRAND.pink }, second]} />
      <Animated.View style={[box(a), { backgroundColor: BRAND.purple, overflow: 'hidden' }, first]}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: (b.x - a.x) * k,
              top: (b.y - a.y) * k,
              width: b.w * k,
              height: b.h * k,
              borderRadius: (b.w * k) / 2,
              backgroundColor: colors.overlap,
            },
            overlap,
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
}
