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
import { V46_PULL } from '@/theme/parts.generated';
import { pullIndicator, pullMark, pullOffset } from '@/theme/pullRefresh';
import { useTheme } from '@/theme/ThemeProvider';

type Props = Pick<
  ScrollViewProps,
  'contentContainerStyle' | 'keyboardShouldPersistTaps' | 'keyboardDismissMode'
> & {
  // Fetches the list again; the mark turns until it settles (and at least as long as a loader
  // stays, LOADER_MIN_VISIBLE_MS).
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
};

const p = V46_PULL;
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));
// A pull starts once the finger has gone this far down (v46: `d > 6`), and fails this far up.
const START = 6;

// v46's pull to refresh (`.ptr-ind` over `.dbody`; theme/pullRefresh.ts): at the top of the list a
// finger pulled down takes the list with it and brings the indicator's capsules together; at
// `lockAt` they are the mark, and a release there refreshes: the list rests `restAt` down and the
// mark turns (Dönüş, the loader). Let go earlier and the list settles back. The list settles with
// v46's transition (none with reduce motion); the indicator follows the finger and goes at once,
// as in v46. Only the list view has it (v46: `vm === 'list'`).
export function PullScroll({ onRefresh, children, contentContainerStyle, ...scroll }: Props) {
  const reduce = useReduceMotion();
  const scroller = useAnimatedRef<Animated.ScrollView>();
  const atTop = useSharedValue(true);
  const pulling = useSharedValue(false);
  const busy = useSharedValue(false);
  // The finger's pull (the indicator) and the list's offset (which settles).
  const finger = useSharedValue(0);
  const list = useSharedValue(0);
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
  });

  const native = Gesture.Native();
  const pan = Gesture.Pan()
    .activeOffsetY(START)
    .failOffsetY(-START)
    .simultaneousWithExternalGesture(native)
    .onStart(() => {
      pulling.set(atTop.get() && !busy.get());
    })
    // The animated ref is read on the UI thread when the finger moves, not while rendering
    // (Reanimated's scrollTo); the rule takes `useAnimatedRef` for a React ref.
    // eslint-disable-next-line react-hooks/refs
    .onUpdate((e) => {
      if (!pulling.get()) return;
      const y = pullOffset(e.translationY, p);
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
      pulling.set(false);
    });

  const listStyle = useAnimatedStyle(() => ({ transform: [{ translateY: list.get() }] }));
  const indicator = useAnimatedStyle(() => {
    const i = pullIndicator(finger.get(), p);
    return { opacity: i.opacity, transform: [{ translateY: i.y }] };
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
              <Animated.View style={[gaps, listStyle]}>{children}</Animated.View>
            </Animated.ScrollView>
          </GestureDetector>
        </View>
      </GestureDetector>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
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
