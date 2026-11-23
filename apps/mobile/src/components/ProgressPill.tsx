import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { T, useKit } from '@/aura/kit';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { gradientStyle } from '@/theme/gradient';
import { PROGRESS_PILL } from '@/theme/progressPill';

// A count's progress as a capsule that fills with colour from the left (theme/progressPill.ts):
// `value` of `total` filled, `label` its words on it. It fills step by step (the owner's call, 22
// Kasım): from what it showed to the new count one step at a time, and from empty when it first
// shows; at once with reduce motion. The fill is measured against the whole pill (a layer of its
// own, so the pill's padding for the words does not shorten it). `tone: 'warn'` fills it in the
// warning colour (a count that is full but does not count, as three pieces from two sets).
export function ProgressPill({
  value,
  total,
  label,
  tone,
  accessibilityLabel,
}: {
  value: number;
  total: number;
  label: string;
  tone?: 'warn';
  accessibilityLabel?: string;
}) {
  const { scheme, c } = useKit();
  const reduce = useReduceMotion();
  const P = PROGRESS_PILL;
  const steps = Math.max(total, 1);
  const level = Math.min(Math.max(value, 0), steps);
  const fill = useSharedValue(reduce ? level / steps : 0);
  const shown = useRef(reduce ? level : 0);
  useEffect(() => {
    const from = shown.current;
    shown.current = level;
    if (reduce || from === level) {
      fill.value = level / steps;
      return;
    }
    const dir = level > from ? 1 : -1;
    const moves = Array.from({ length: Math.abs(level - from) }, (_, i) =>
      withTiming((from + dir * (i + 1)) / steps, {
        duration: P.stepMs,
        easing: Easing.out(Easing.cubic),
      }),
    );
    const [first, ...rest] = moves;
    if (first) fill.value = rest.length > 0 ? withSequence(first, ...rest) : first;
  }, [level, steps, reduce, fill, P.stepMs]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const onFill = level / steps >= P.inkOnFillFrom;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityValue={{ min: 0, max: total, now: level }}
      style={{
        height: P.height,
        minWidth: P.minWidth,
        paddingHorizontal: P.padX,
        borderRadius: P.height / 2,
        overflow: 'hidden',
        backgroundColor: P[scheme].track,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 1,
      }}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Reanimated.View
          style={[
            { height: '100%', borderRadius: P.height / 2 },
            tone === 'warn' ? { backgroundColor: c.warn } : gradientStyle(P.fill),
            fillStyle,
          ]}
        />
      </View>
      <T v="setCount" color={onFill ? P.onFill : c.ink} tabular lines={1} fit>
        {label}
      </T>
    </View>
  );
}
