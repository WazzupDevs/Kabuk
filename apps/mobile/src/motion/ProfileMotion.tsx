import { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { barNameX, fadeAt, flightAt, flyFace, flyX, flyY, ramp, riseInContent } from './scrollMath';
import { useScreenScroll } from './ScrollScreen';

// The profile pages' scroll-driven parts (docs/design/iskelet.md → 5.6, 5.7): each follows the
// finger one to one, linear and clamped, on the UI thread (4.1). Nothing here is pressed.

// What fades over `fade` and shrinks to `scaleTo` over `shrink` of the scroll while it scrolls with
// the content (another person's photo, 5.6), from its centre.
export function ScrollFade({
  fade,
  shrink,
  scaleTo,
  origin,
  children,
}: {
  fade: readonly [number, number];
  shrink: readonly [number, number];
  scaleTo: number;
  // Where it shrinks from (tuval Profil: the photo from its top centre); its centre otherwise.
  origin?: string;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const [fadeFrom, fadeTo] = fade;
  const [shrinkFrom, shrinkTo] = shrink;
  const style = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    return {
      opacity: 1 - ramp(y, fadeFrom, fadeTo),
      transform: [{ scale: 1 + (scaleTo - 1) * ramp(y, shrinkFrom, shrinkTo) }],
    };
  });
  return (
    <Animated.View style={[origin ? { transformOrigin: origin } : null, style]}>
      {children}
    </Animated.View>
  );
}

// The own profile's upper part (5.7), in the scrolling content: it moves at -`speed` of the scroll,
// fades over `fade` and shrinks to `scaleTo` as it does; the panel after it rides over it. Its
// buttons take their touches where they are drawn.
export function RiseLayer({
  speed,
  fade,
  scaleTo,
  shrink,
  origin,
  height,
  children,
}: {
  speed: number;
  fade: readonly [number, number];
  scaleTo: number;
  // Over which part of the scroll it shrinks (tuval Benim: the whole flight), and from where; with
  // the fade and from its centre otherwise.
  shrink?: readonly [number, number];
  origin?: string;
  height: number;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const [from, to] = fade;
  const [shrinkFrom, shrinkTo] = shrink ?? fade;
  const style = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    const f = fadeAt(y, from, to, scaleTo);
    const s = fadeAt(y, shrinkFrom, shrinkTo, scaleTo);
    return {
      opacity: f.opacity,
      transform: [{ translateY: riseInContent(y, speed) }, { scale: s.scale }],
    };
  });
  return (
    <Animated.View style={[{ height }, origin ? { transformOrigin: origin } : null, style]}>
      {children}
    </Animated.View>
  );
}

// Where the photo and the name fly (5.7), in the screen's points: from their place on the upper
// part (riding it at `speed`) to the bar, over [0, arrive].
export type Flight = {
  arrive: number;
  speed: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

// The own photo flying into the bar: its white disc `side` → `sideTo` across, the ring `ring` →
// `ringTo`; `children` the face, drawn side − 2·ring across. One photo on the screen, no copy in the
// bar.
export function FlyingFace({
  flight,
  side,
  sideTo,
  ring,
  ringTo,
  ringColor,
  children,
}: {
  flight: Flight;
  side: number;
  sideTo: number;
  ring: number;
  ringTo: number;
  ringColor: string;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const { arrive, speed, from, to } = flight;
  const inner = side - 2 * ring;
  const place = () => {
    'worklet';
    const y = scroll ? scroll.y.get() : 0;
    const t = flightAt(y, arrive);
    return {
      x: flyX(t, from.x, to.x),
      y: flyY(y, t, from.y, to.y, speed),
      k: flyFace(t, side, sideTo, ring, ringTo),
    };
  };
  const discStyle = useAnimatedStyle(() => {
    const p = place();
    return {
      transform: [
        { translateX: p.x - side / 2 },
        { translateY: p.y - side / 2 },
        { scale: p.k.disc },
      ],
    };
  });
  const faceStyle = useAnimatedStyle(() => {
    const p = place();
    return {
      transform: [
        { translateX: p.x - inner / 2 },
        { translateY: p.y - inner / 2 },
        { scale: p.k.face },
      ],
    };
  });
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: side,
            height: side,
            borderRadius: side / 2,
            backgroundColor: ringColor,
          },
          discStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={[{ position: 'absolute', left: 0, top: 0 }, faceStyle]}
      >
        {children}
      </Animated.View>
    </>
  );
}

// The own name flying into the bar, its scale 1 → `scaleTo`; in the bar it keeps clear of the photo
// (`left`) and the button (`right`). Measured as it is laid out (hidden until then), never on a
// frame.
export function FlyingName({
  flight,
  scaleTo,
  left,
  right,
  maxWidth,
  children,
}: {
  flight: Flight;
  scaleTo: number;
  left: number;
  right: number;
  maxWidth: number;
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const { arrive, speed, from, to } = flight;
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    const t = flightAt(y, arrive);
    const width = w.get();
    const height = h.get();
    const x = flyX(t, from.x, barNameX(to.x, (width * scaleTo) / 2, left, right));
    return {
      opacity: width > 0 ? 1 : 0,
      transform: [
        { translateX: x - width / 2 },
        { translateY: flyY(y, t, from.y, to.y, speed) - height / 2 },
        { scale: 1 + (scaleTo - 1) * t },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      onLayout={(e) => {
        w.set(e.nativeEvent.layout.width);
        h.set(e.nativeEvent.layout.height);
      }}
      style={[{ position: 'absolute', left: 0, top: 0, maxWidth }, style]}
    >
      <View>{children}</View>
    </Animated.View>
  );
}
