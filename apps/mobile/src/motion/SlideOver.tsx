import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  makeMutable,
  runOnJS,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// A layer that slides in over the screen from the right on the UI thread, starting on the frame it
// is asked to (the DM surface, Telegram's chat opening; the owner's call, 25 Kasım): its content is
// built ahead, so nothing waits for a render before it moves. 0 out (off the screen at the right,
// drawing nothing), 1 in.
const slide = makeMutable(0);

export type SlideTiming = { inMs: number; outMs: number };

export function slideIn(t: SlideTiming, onIn: () => void): void {
  slide.set(
    withTiming(1, { duration: t.inMs, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(onIn)();
    }),
  );
}

export function slideOut(t: SlideTiming, onOut: () => void): void {
  slide.set(
    withTiming(0, { duration: t.outMs, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(onOut)();
    }),
  );
}

// `edge`: back with a swipe from the left edge (iskelet.md → 4.4), from `edgeTop` down (the top
// bar's back button keeps its taps), on the UI thread: let go past a third of the screen or with a
// flick past `flick` px/s it asks to close (`onEdgeClose`), otherwise it slides back in.
export function SlideOverLayer({
  open,
  timing,
  edge,
  onEdgeClose,
  children,
}: {
  open: boolean;
  timing: SlideTiming;
  edge: { width: number; top: number; flick: number };
  onEdgeClose: () => void;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    const p = slide.get();
    return { opacity: p > 0 ? 1 : 0, transform: [{ translateX: (1 - p) * width }] };
  });
  const back = Gesture.Pan()
    .activeOffsetX(10)
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      slide.set(Math.min(1, Math.max(0, 1 - e.translationX / width)));
    })
    .onEnd((e) => {
      if (e.translationX > width / 3 || e.velocityX > edge.flick) runOnJS(onEdgeClose)();
      else slide.set(withTiming(1, { duration: timing.inMs, easing: Easing.out(Easing.cubic) }));
    });
  return (
    <Animated.View
      pointerEvents={open ? 'box-none' : 'none'}
      style={[StyleSheet.absoluteFill, style]}
    >
      {children}
      {open ? (
        <GestureDetector gesture={back}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: edge.top,
              bottom: 0,
              width: edge.width,
              zIndex: 2,
            }}
          />
        </GestureDetector>
      ) : null}
    </Animated.View>
  );
}
