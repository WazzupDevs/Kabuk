import { Image } from 'expo-image';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { photoCacheKey } from '@/lib/usePhoto';
import { useTheme } from '@/theme/ThemeProvider';
import { PROFILE_COVER } from '@/theme/profileCover';

// The profile cover (docs/SPEC_V4.md §4.W): the person's own picture, cut to fill; without one the
// riso scene (the own profile only; another person's profile shows no band then).
export function ProfileCover({
  url,
  height,
  radius = 0,
  accessibilityLabel,
}: {
  url: string | null;
  height: number;
  radius?: number;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={{ height, borderRadius: radius, overflow: 'hidden' }}
    >
      {url ? (
        <Image
          // Kept under the file's own path, not its signed address: a new signature never blinks it.
          source={{ uri: url, cacheKey: photoCacheKey(url) }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          style={{ width: '100%', height: '100%' }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <RisoCoverScene />
      )}
    </View>
  );
}

const { width: W, height: H } = PROFILE_COVER.scene;
const SUN = { x: 292, y: 62, r: 30 };
// Halftone dots in the sky: a loose grid that thins out away from the sun.
const DOTS: readonly { x: number; y: number; r: number }[] = (() => {
  const out: { x: number; y: number; r: number }[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 26; col++) {
      const x = col * 15 + (row % 2) * 7.5 + 4;
      const y = row * 13 + 8;
      const away = Math.hypot(x - SUN.x, y - SUN.y);
      if (away < SUN.r + 8) continue;
      const r = Math.max(0, 1.6 - away / 220);
      if (r > 0.35) out.push({ x, y, r });
    }
  }
  return out;
})();
const TREES: readonly { x: number; y: number; s: number }[] = [
  { x: 46, y: 132, s: 1 },
  { x: 64, y: 138, s: 0.8 },
  { x: 214, y: 126, s: 0.9 },
  { x: 334, y: 140, s: 1.1 },
  { x: 352, y: 146, s: 0.75 },
];

// The default scene, drawn on 390 × 190 and cut to the cover (slice): a day in the light scheme, a
// night in the dark.
export function RisoCoverScene() {
  const { scheme } = useTheme();
  const k = PROFILE_COVER.colors[scheme];
  const o = PROFILE_COVER.sunOffset;
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      importantForAccessibility="no-hide-descendants"
    >
      <Rect x={0} y={0} width={W} height={H} fill={k.sky} />
      {DOTS.map((d) => (
        <Circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.r} fill={k.dots} />
      ))}
      <Circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={k.sun} />
      <Circle cx={SUN.x + o.x} cy={SUN.y + o.y} r={SUN.r} fill={k.print} />
      <Path d="M0 120 C 70 92 140 96 210 112 S 330 96 390 108 V 190 H 0 Z" fill={k.hillFar} />
      <Path d="M0 142 C 60 122 120 124 180 138 S 300 128 390 136 V 190 H 0 Z" fill={k.hillMid} />
      {TREES.map((t) => (
        <Tree key={`${t.x}-${t.y}`} x={t.x} y={t.y} s={t.s} fill={k.tree} trunk={k.trunk} />
      ))}
      <Path d="M0 166 C 90 148 170 152 250 164 S 350 156 390 160 V 190 H 0 Z" fill={k.hillNear} />
    </Svg>
  );
}

function Tree({
  x,
  y,
  s,
  fill,
  trunk,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
  trunk: string;
}) {
  const h = 22 * s;
  const w = 7 * s;
  return (
    <>
      <Rect x={x - 1 * s} y={y - 2 * s} width={2 * s} height={6 * s} fill={trunk} />
      <Path d={`M${x} ${y - h} L${x + w} ${y} L${x - w} ${y} Z`} fill={fill} />
    </>
  );
}
