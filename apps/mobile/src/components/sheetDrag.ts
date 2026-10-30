import { Gesture } from 'react-native-gesture-handler';
import type Animated from 'react-native-reanimated';
import {
  type AnimatedRef,
  runOnJS,
  scrollTo,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// A sheet pulled down follows the finger and closes, as Telegram Android's sheets do (every
// partial-screen sheet: the owner's call, 27 Ekim; following the finger and from a scroll that
// reaches the top, 30 Ekim). The pull and the sheet's scroll share the finger: while the content is
// at its top a downward move takes the sheet down with it, also in the middle of a scroll that has
// just reached the top; moving back up brings the sheet up first, then scrolls the content. Let go
// past CLOSE_DY, or flicked down, it closes; short of it, it springs back.
const START = 6;
const CLOSE_DY = 96;
// Points a second.
const CLOSE_VY = 900;
const BACK = { damping: 22, stiffness: 260, mass: 0.9 } as const;

// `scroller`: the sheet's scroll view (kept at its top while the sheet is pulled).
export function useSheetDrag(
  close: (() => void) | undefined,
  scroller: AnimatedRef<Animated.ScrollView>,
) {
  const scrollY = useSharedValue(0);
  // How far the sheet is pulled down, and the finger's last place.
  const pull = useSharedValue(0);
  const last = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const native = Gesture.Native();
  const pan = Gesture.Pan()
    .enabled(!!close)
    .activeOffsetY([-START, START])
    .failOffsetX([-START * 2, START * 2])
    .simultaneousWithExternalGesture(native)
    .onStart((e) => {
      last.set(e.translationY);
    })
    .onUpdate((e) => {
      const delta = e.translationY - last.get();
      last.set(e.translationY);
      if (pull.get() <= 0 && (scrollY.get() > 0 || delta <= 0)) return;
      const next = Math.max(0, pull.get() + delta);
      pull.set(next);
      // The content stays at its top while the sheet is pulled.
      if (next > 0) scrollTo(scroller, 0, 0, false);
    })
    .onEnd((e) => {
      if (pull.get() <= 0) return;
      if (close && (pull.get() > CLOSE_DY || e.velocityY > CLOSE_VY)) runOnJS(close)();
      else pull.set(withSpring(0, BACK));
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: pull.get() }] }));
  return { pan, native, onScroll, style };
}
