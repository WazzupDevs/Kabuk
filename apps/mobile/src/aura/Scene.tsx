import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

import { Buddy, Placed } from './Buddy';

// A scene's ground (docs/design/aura/project/aura.css → `.scene`, `.floor`): violet to pink, two
// soft glows at the top and a white floor glow at the bottom where buddies stand. Fills its parent;
// the parent rounds and clips it.
export function SceneGround() {
  const { scheme } = useTheme();
  const c = AURA.scene[scheme];
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} stopColor={c.top} />
            <Stop offset={1} stopColor={c.bottom} />
          </LinearGradient>
          <RadialGradient id={`a${id}`} cx="18%" cy="0%" rx="70%" ry="60%">
            <Stop offset={0} stopColor={c.glowA} />
            <Stop offset={1} stopColor={c.glowA} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`b${id}`} cx="90%" cy="10%" rx="55%" ry="50%">
            <Stop offset={0} stopColor={c.glowB} />
            <Stop offset={1} stopColor={c.glowB} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#g${id})`} />
        <Rect x={0} y={0} width={100} height={100} fill={`url(#a${id})`} />
        <Rect x={0} y={0} width={100} height={100} fill={`url(#b${id})`} />
      </Svg>
      <Floor />
    </View>
  );
}

// The white floor glow under the buddies.
function Floor() {
  const { scheme } = useTheme();
  const c = AURA.scene[scheme];
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const h = AURA.scene.floorHeight;
  return (
    <View style={{ position: 'absolute', left: '-10%', right: '-10%', bottom: -h / 2, height: h }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={`f${id}`} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset={0} stopColor={c.floor} />
            <Stop offset={1} stopColor={c.floor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={50} cy={50} rx={50} ry={50} fill={`url(#f${id})`} />
      </Svg>
    </View>
  );
}

// The Mekan card's crew: three buddies at the right of a scene `height` high, arriving one after
// another (`delay` for the first).
export function Crew({ height, delay = 0 }: { height: number; delay?: number }) {
  const k = height / AURA.heroHeight;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {AURA.crew.map((b, i) => (
        <Placed key={b.look} right={b.right * k} bottom={b.bottom * k}>
          <Buddy look={b.look} height={b.height * k} delay={delay + i * 80} phase={b.phase} />
        </Placed>
      ))}
    </View>
  );
}
