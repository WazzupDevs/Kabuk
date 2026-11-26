import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useKit } from '@/aura/kit';
import { svgKey } from '@/lib/svgKey';
import { GIFT_BACKDROP } from '@/theme/gifts';
import { gradientStyle } from '@/theme/gradient';

import type { ShownPack } from './art';
import { MID_Y } from './PackRing';
import { BOARD_W, type Stage } from './stage';

// Hediye paketleri's ground (the owner's call, 26 Kasım, "Işın patlaması"): the scheme's ground,
// thin rays out of the front pack's middle fading toward the edges, a glow behind the pack and a
// few sparks, the rays and the glow in the front pack's colour. Still and drawn once for each pack
// and scheme (svgKey): one path for every ray, one gradient over it.
export function PackBackdrop({ pack, stage }: { pack: ShownPack; stage: Stage }) {
  const { scheme } = useKit();
  const { height } = useWindowDimensions();
  const B = GIFT_BACKDROP;
  const look = B[scheme];
  const tint = B.tint[pack];
  const w = stage.width;
  const cx = w / 2;
  const cy = stage.top(MID_Y);
  const reach = B.rays.reach * w;
  const rays = rayPath(cx, cy, reach, B.rays.count, B.rays.width);
  const glow = (B.glow.size * w) / 2;
  const spark = look.spark ?? tint;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, gradientStyle(look.ground)]} />
      <Svg
        width={w}
        height={height}
        style={StyleSheet.absoluteFill}
        nativeID={svgKey('gift-backdrop', pack, scheme, Math.round(w), Math.round(height))}
      >
        <Defs>
          <RadialGradient id="rays" cx={cx} cy={cy} r={reach} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor={tint} stopOpacity={look.ray} />
            <Stop offset={B.rays.solid} stopColor={tint} stopOpacity={look.ray} />
            <Stop offset={B.rays.fade} stopColor={tint} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow" cx={cx} cy={cy} r={glow} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor={tint} stopOpacity={look.glow} />
            <Stop offset={B.glow.mid} stopColor={tint} stopOpacity={look.glowMid} />
            <Stop offset={B.glow.end} stopColor={tint} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d={rays} fill="url(#rays)" />
        <Rect x={cx - glow} y={cy - glow} width={glow * 2} height={glow * 2} fill="url(#glow)" />
        {B.sparks.map(([x, y, size, strength], i) => (
          <Circle
            key={i}
            cx={(x * w) / BOARD_W}
            cy={stage.top(y)}
            r={(size * stage.s) / 2}
            fill={spark}
            opacity={strength}
          />
        ))}
      </Svg>
    </View>
  );
}

// Every ray as a thin wedge from the middle, `width` degrees wide, `count` round the circle.
function rayPath(cx: number, cy: number, r: number, count: number, width: number): string {
  const step = (2 * Math.PI) / count;
  const half = (width * Math.PI) / 180 / 2;
  const at = (a: number) =>
    `${(cx + r * Math.sin(a)).toFixed(1)} ${(cy - r * Math.cos(a)).toFixed(1)}`;
  return Array.from({ length: count }, (_, i) => {
    const mid = i * step;
    return `M${cx.toFixed(1)} ${cy.toFixed(1)}L${at(mid - half)}L${at(mid + half)}Z`;
  }).join('');
}
