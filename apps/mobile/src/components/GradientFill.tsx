import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { svgGradient } from '@/theme/gradient';

// A theme's CSS linear gradient (theme/gradient.ts → svgGradient) filling its parent, drawn with
// react-native-svg once the box has a size, its corners rounded to `radius`. For the buttons'
// glass and bars; React Native's own background-image gradient crashed there (theme/gradient.ts).
export function GradientFill({ css, radius = 0 }: { css: string; radius?: number }) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const g = useMemo(() => svgGradient(css), [css]);
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((b) => (b && b.width === width && b.height === height ? b : { width, height }));
      }}
    >
      {g && box && box.width > 0 && box.height > 0 ? (
        <Svg width={box.width} height={box.height}>
          <Defs>
            <LinearGradient id="fill" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
              {g.stops.map((s, i) => (
                <Stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect
            width={box.width}
            height={box.height}
            rx={Math.min(radius, box.width / 2, box.height / 2)}
            fill="url(#fill)"
          />
        </Svg>
      ) : null}
    </View>
  );
}
