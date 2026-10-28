import { useEffect, useId, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, type AuraBlob } from '@/theme/aura';
import { stopPaint } from '@/theme/svgStop';
import { useTheme } from '@/theme/ThemeProvider';

// The colour clouds behind a screen (docs/design/aura/project/aura.css → `.aura`): five soft
// ellipses, each blurred by 64 px (drawn as a radial fade, so nothing is blurred at run time), that
// drift slowly around their places while `running`. Still when motion is reduced. The drift loops
// on the native driver, as every motion that goes on by itself (loopGuard.test.ts).
export function AuraBackground({ running = true }: { running?: boolean }) {
  const { scheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const blobs = AURA[scheme].blobs;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {blobs.map((b, i) => (
        <Cloud key={i} blob={b} width={width} height={height} moving={running && !reduce} />
      ))}
    </View>
  );
}

function Cloud({
  blob,
  width,
  height,
  moving,
}: {
  blob: AuraBlob;
  width: number;
  height: number;
  moving: boolean;
}) {
  const id = `cloud${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const B = AURA.blur;
  const scale = width / AURA.frame;
  const left = (blob.side === 'left' ? blob.x * scale : width - blob.x * scale - blob.w) - B;
  const top = (blob.edge === 'top' ? blob.y : height - blob.y - blob.h) - B;
  const w = blob.w + 2 * B;
  const h = blob.h + 2 * B;
  // A blurred ellipse: full inside, half at its edge, nothing a blur's width outside it.
  const r = Math.min(blob.w, blob.h) / 2;
  const inner = Math.max(0, (r - B) / (r + B));
  const edge = r / (r + B);

  const [x] = useState(() => new Animated.Value(0));
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!moving) return undefined;
    const ease = Easing.inOut(Easing.sin);
    const swing = (v: Animated.Value, ms: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: ms, easing: ease, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: ms, easing: ease, useNativeDriver: true }),
        ]),
      );
    // The other axis on its own beat, so the cloud wanders instead of going back and forth.
    const loops = [swing(x, blob.ms), swing(y, Math.round(blob.ms * 1.17))];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [moving, blob, x, y]);
  const drift = {
    transform: [
      {
        translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-blob.dx / 2, blob.dx / 2] }),
      },
      {
        translateY: y.interpolate({ inputRange: [0, 1], outputRange: [-blob.dy / 2, blob.dy / 2] }),
      },
    ],
  };

  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: w, height: h }, drift]}>
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset={0} {...stopPaint(blob.color)} />
            <Stop offset={inner} {...stopPaint(blob.color)} />
            <Stop offset={edge} {...stopPaint(blob.color, 0.5)} />
            <Stop offset={1} {...stopPaint(blob.color, 0)} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
