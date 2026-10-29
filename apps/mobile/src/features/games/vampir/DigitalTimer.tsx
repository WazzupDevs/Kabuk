import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { VAMPIR_LOOK as L } from '@/theme/vampir';

// The game's clock as a digital display (the owner's call, 29 Ekim: in place of the bars): minutes
// and seconds in seven segments each, the segments skall's capsules, slanted a little, the unlit
// ones faint behind. A digit that changes fades over from the old one, the colon dips with each
// second; in the last seconds the display turns amber and gives a small beat. All on the native
// driver, still with reduce motion.
export type DigitalSize = 'sm' | 'lg';

const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;
type Segment = (typeof SEGMENTS)[number];

const LIT: Record<string, readonly Segment[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

export function DigitalTimer({ seconds, size }: { seconds: number; size: DigitalSize }) {
  const reduce = useReduceMotion();
  const low = seconds <= L.motion.lowSeconds && seconds > 0;
  const color = low ? L.barLow : L.tileOn;
  const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const [beat] = useState(() => new Animated.Value(1));
  const [colon] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduce) return undefined;
    const anims = [
      Animated.sequence([
        Animated.timing(colon, {
          toValue: COLON_DIP,
          duration: COLON_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(colon, {
          toValue: 1,
          duration: COLON_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ];
    if (low) {
      beat.setValue(BEAT);
      anims.push(
        Animated.spring(beat, {
          toValue: 1,
          useNativeDriver: true,
          speed: BEAT_SPEED,
          bounciness: BEAT_BOUNCE,
        }),
      );
    }
    const anim = Animated.parallel(anims);
    anim.start();
    return () => anim.stop();
  }, [seconds, low, reduce, beat, colon]);
  const d = L.size.digit[size];
  return (
    <Animated.View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={tr.vampir.timeLeftLabel(text)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: d.gap,
        transform: [{ scale: beat }, { skewX: SLANT }],
      }}
    >
      {[...text].map((c, i) =>
        c === ':' ? (
          <Animated.View key={i} style={{ opacity: colon, gap: d.height * 0.22 }}>
            <View style={[styles.dot, { width: d.t, height: d.t, backgroundColor: color }]} />
            <View style={[styles.dot, { width: d.t, height: d.t, backgroundColor: color }]} />
          </Animated.View>
        ) : (
          <Digit key={i} digit={c} size={size} color={color} reduce={reduce} />
        ),
      )}
    </Animated.View>
  );
}
const SLANT = '-6deg';
const COLON_DIP = 0.35;
const COLON_MS = 180;
const BEAT = 1.08;
const BEAT_SPEED = 14;
const BEAT_BOUNCE = 10;

// One digit: the new one fades in over the old (FADE_MS).
function Digit({
  digit,
  size,
  color,
  reduce,
}: {
  digit: string;
  size: DigitalSize;
  color: string;
  reduce: boolean;
}) {
  const [shown, setShown] = useState({ now: digit, before: digit });
  if (shown.now !== digit) setShown({ now: digit, before: shown.now });
  const [mix] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (shown.before === shown.now || reduce) {
      mix.setValue(1);
      return undefined;
    }
    mix.setValue(0);
    const anim = Animated.timing(mix, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [shown, mix, reduce]);
  const d = L.size.digit[size];
  return (
    <View style={{ width: d.width, height: d.height }}>
      <Segments digit="8" size={size} color={L.digitOff} />
      {shown.before !== shown.now ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: mix.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
          ]}
        >
          <Segments digit={shown.before} size={size} color={color} />
        </Animated.View>
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: mix }]}>
        <Segments digit={shown.now} size={size} color={color} />
      </Animated.View>
    </View>
  );
}
const FADE_MS = 220;

// The seven capsules of a digit: three across (a top, g middle, d bottom), four down (f and b at
// the top, e and c at the bottom).
function Segments({ digit, size, color }: { digit: string; size: DigitalSize; color: string }) {
  const { width: w, height: h, t } = L.size.digit[size];
  const lit = LIT[digit] ?? [];
  const across = w - t * 1.6;
  const down = h / 2 - t * 1.3;
  const place: Record<Segment, { x: number; y: number; w: number; h: number }> = {
    a: { x: t * 0.8, y: 0, w: across, h: t },
    g: { x: t * 0.8, y: h / 2 - t / 2, w: across, h: t },
    d: { x: t * 0.8, y: h - t, w: across, h: t },
    f: { x: 0, y: t * 0.8, w: t, h: down },
    b: { x: w - t, y: t * 0.8, w: t, h: down },
    e: { x: 0, y: h / 2 + t * 0.5, w: t, h: down },
    c: { x: w - t, y: h / 2 + t * 0.5, w: t, h: down },
  };
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      {SEGMENTS.filter((s) => lit.includes(s)).map((s) => (
        <Rect
          key={s}
          x={place[s].x}
          y={place[s].y}
          width={place[s].w}
          height={place[s].h}
          rx={t / 2}
          fill={color}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  dot: { borderRadius: 999 },
});
