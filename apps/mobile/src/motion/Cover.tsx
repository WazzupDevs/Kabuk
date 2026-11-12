import type { ReactNode } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { coverShift } from './scrollMath';
import { useScreenScroll } from './ScrollScreen';

// A cover under the content (the `kapak` bar, docs/design/iskelet.md → 3.1 and 5.2): drawn once
// behind the scrolling body from the screen's top, `height` high; as the content scrolls over it it
// moves up at `speed` of the scroll (the parallax), one to one with the finger on the UI thread
// (4.1). Pulled past the top it stays. Nothing on it is pressed: the content's spacer over it takes
// the touches.
export function Cover({
  height,
  speed,
  children,
}: {
  height: number;
  speed: number;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: scroll ? coverShift(scroll.y.get(), speed) : 0 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, right: 0, top: 0, height, overflow: 'hidden' },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
