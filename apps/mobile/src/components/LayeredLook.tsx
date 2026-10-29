import { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { eyeLayers } from '@/theme/capsuleLook';

import { CachedSvg } from './CachedSvg';

// A capsule that blinks and looks around without being drawn again (the owner's report, 29 Ekim:
// react-native-svg draws on the main thread on Android, so a blink redrawn every few seconds in
// every buddy on the screen cost a frame each time). Its layers (theme/capsuleLook.ts → eyeLayers)
// are drawn once; a blink swaps the open eyes for the closed ones and a look moves them, both on the
// native driver. `blink` is 0 open, 1 shut; `lookX` and `lookY` move the eyes in pixels. Set them
// with `snapTo` (a step, as the drawing posed: no in-between).
export function LayeredLook({
  xml,
  width,
  height,
  blink,
  lookX,
  lookY,
}: {
  xml: string;
  width: number;
  height: number;
  blink: Animated.Value;
  lookX?: Animated.Value;
  lookY?: Animated.Value;
}) {
  const layers = useMemo(() => eyeLayers(xml), [xml]);
  const open = useMemo(
    () => blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    [blink],
  );
  if (!layers) return <CachedSvg xml={xml} width={width} height={height} />;
  const box = { position: 'absolute' as const, left: 0, top: 0, width, height };
  const move =
    lookX || lookY
      ? [...(lookX ? [{ translateX: lookX }] : []), ...(lookY ? [{ translateY: lookY }] : [])]
      : undefined;
  return (
    <View style={{ width, height }}>
      <View style={box}>
        <CachedSvg xml={layers.below} width={width} height={height} />
      </View>
      <Animated.View style={[box, move ? { transform: move } : null]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: open }]}>
          <CachedSvg xml={layers.open} width={width} height={height} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: blink }]}>
          <CachedSvg xml={layers.closed} width={width} height={height} />
        </Animated.View>
      </Animated.View>
      {layers.above ? (
        <View style={box}>
          <CachedSvg xml={layers.above} width={width} height={height} />
        </View>
      ) : null}
    </View>
  );
}

// A step to a value on the native driver: no React render, no drawing again.
export function snapTo(value: Animated.Value, to: number): void {
  Animated.timing(value, { toValue: to, duration: 0, useNativeDriver: true }).start();
}
