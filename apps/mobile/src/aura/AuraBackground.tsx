import { useEffect, useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, type AuraBlob } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

// The colour clouds behind a screen (docs/design/aura/project/aura.css → `.aura`): five soft
// ellipses, each blurred by 64 px (drawn as a radial fade, so nothing is blurred at run time), that
// drift slowly around their places while `running`. Still when motion is reduced.
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

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  useEffect(() => {
    if (!moving) {
      cancelAnimation(x);
      cancelAnimation(y);
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    x.value = -blob.dx / 2;
    y.value = -blob.dy / 2;
    x.value = withRepeat(withTiming(blob.dx / 2, { duration: blob.ms, easing: ease }), -1, true);
    // The other axis on its own beat, so the cloud wanders instead of going back and forth.
    y.value = withRepeat(
      withTiming(blob.dy / 2, { duration: Math.round(blob.ms * 1.17), easing: ease }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
    };
  }, [moving, blob, x, y]);
  const drift = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: w, height: h }, drift]}>
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset={0} stopColor={blob.color} stopOpacity={1} />
            <Stop offset={inner} stopColor={blob.color} stopOpacity={1} />
            <Stop offset={edge} stopColor={blob.color} stopOpacity={0.5} />
            <Stop offset={1} stopColor={blob.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
