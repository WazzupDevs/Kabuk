import { type ReactNode, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AURA } from '@/theme/aura';
import { stopPaint } from '@/theme/svgStop';
import { useTheme } from '@/theme/ThemeProvider';

import { Buddy, Placed } from './Buddy';

// A scene's ground (docs/design/aura/project/aura.css → `.scene`, `.floor`): violet to pink, two
// soft glows at the top and a white floor glow at the bottom where buddies stand. Fills its parent;
// the parent rounds and clips it. `top` and `bottom`: its corners when they are not the scene's 26
// (Masa's header: square at the top, 36 at the bottom).
export function SceneGround({ top, bottom }: { top?: number; bottom?: number } = {}) {
  const { scheme } = useTheme();
  const c = AURA.scene[scheme];
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} {...stopPaint(c.top)} />
            <Stop offset={1} {...stopPaint(c.bottom)} />
          </LinearGradient>
          {c.glows.map((g, i) => (
            <RadialGradient key={i} id={`r${i}${id}`} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry}>
              <Stop offset={0} {...stopPaint(g.color)} />
              <Stop offset={GLOW_END} {...stopPaint(g.color, 0)} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#g${id})`} />
        {c.glows.map((_, i) => (
          <Rect key={i} x={0} y={0} width={100} height={100} fill={`url(#r${i}${id})`} />
        ))}
      </Svg>
      <Floor />
      {/* aura.css `.scene::after`: a light inner edge. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderWidth: AURA.card.edgeWidth,
            borderColor: c.edge,
            borderTopLeftRadius: top ?? AURA.scene.radius,
            borderTopRightRadius: top ?? AURA.scene.radius,
            borderBottomLeftRadius: bottom ?? AURA.scene.radius,
            borderBottomRightRadius: bottom ?? AURA.scene.radius,
          },
        ]}
      />
    </View>
  );
}

// A glow fades out by 70 % of its radius (aura.css `.scene`).
const GLOW_END = 0.7;

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
            <Stop offset={0} {...stopPaint(c.floor)} />
            <Stop offset={1} {...stopPaint(c.floor, 0)} />
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

export type GatheringKind = keyof typeof AURA.gatherings;

// Buddies standing around the middle of a scene `width` wide (docs/design/aura → Keşfet, Mekan
// sayfası, Mesajlar): the ones behind first, the disk (`center`, a round white-ringed frame) over
// them, the ones in front last; each arrives with a bounce, a step after the one before.
export function Gathering({
  kind,
  width,
  center,
  delay = 0,
}: {
  kind: GatheringKind;
  width: number;
  center?: ReactNode;
  delay?: number;
}) {
  const g = AURA.gatherings[kind];
  const k = width / g.frame;
  const place = (c: (typeof g.cast)[number], i: number) => (
    <View key={c.look + i} style={{ position: 'absolute', left: c.x * k, bottom: c.bottom * k }}>
      <Buddy look={c.look} height={c.height * k} delay={delay + i * 80} phase={i * 530} />
    </View>
  );
  const behind = g.cast.filter((c) => 'behind' in c && c.behind);
  const front = g.cast.filter((c) => !('behind' in c && c.behind));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {behind.map(place)}
      {g.disk && center ? (
        <View
          style={{
            position: 'absolute',
            left: g.disk.x * k,
            bottom: g.disk.bottom * k,
            width: g.disk.size * k,
            height: g.disk.size * k,
            borderRadius: ('radius' in g.disk ? g.disk.radius : g.disk.size) * k,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {center}
        </View>
      ) : null}
      {front.map((c, i) => place(c, i + behind.length))}
    </View>
  );
}
