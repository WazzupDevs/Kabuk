import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  type PanResponderInstance,
} from 'react-native';

// A sheet pulled down closes (every partial-screen sheet: the owner's call, 27 Ekim). The pull
// starts anywhere on the sheet while its content is at the top, and only for a downward drag (a
// tap or a sideways swipe stays the content's). Past CLOSE_DY, or flicked, it closes; short of it,
// it springs back.
const START_DY = 8;
const CLOSE_DY = 96;
const CLOSE_VY = 0.9;

export type SheetDrag = {
  // Added to the sheet's slide (translateY), never above 0.
  offset: Animated.AnimatedInterpolation<number>;
  handlers: PanResponderInstance['panHandlers'];
  // The sheet's scroll: a pull starts only at its top.
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  // After the sheet is gone: the next opening starts unpulled.
  reset: () => void;
};

export function useSheetDrag(close: (() => void) | undefined): SheetDrag {
  const [drag] = useState(() => new Animated.Value(0));
  const atTop = useRef(true);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  return useMemo(() => {
    const back = () =>
      Animated.spring(drag, {
        toValue: 0,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }).start();
    // The responder's callbacks run on touches, never during render: they read the refs then.
    // eslint-disable-next-line react-hooks/refs
    const responder = PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        !!closeRef.current &&
        atTop.current &&
        g.dy > START_DY &&
        Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_e, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > CLOSE_DY || g.vy > CLOSE_VY) closeRef.current?.();
        else back();
      },
      onPanResponderTerminate: back,
      onPanResponderTerminationRequest: () => false,
    });
    return {
      offset: drag.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: 'clamp',
      }),
      handlers: responder.panHandlers,
      onScroll: (e) => {
        atTop.current = e.nativeEvent.contentOffset.y <= 0;
      },
      reset: () => drag.setValue(0),
    };
  }, [drag]);
}
