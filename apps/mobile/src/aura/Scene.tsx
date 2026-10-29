import { type ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AURA } from '@/theme/aura';
import { gradientStyle } from '@/theme/gradient';
import { floorCss, sceneCss } from '@/theme/sceneGradient';
import { useTheme } from '@/theme/ThemeProvider';

import { Buddy, Placed } from './Buddy';

// A scene's ground (docs/design/aura/project/aura.css → `.scene`, `.floor`): violet to pink, two
// soft glows at the top and a white floor glow at the bottom where buddies stand. Fills its parent;
// the parent rounds and clips it. `top` and `bottom`: its corners when they are not the scene's 26
// (Masa's header: square at the top, 36 at the bottom).
export function SceneGround({ top, bottom }: { top?: number; bottom?: number } = {}) {
  const { scheme } = useTheme();
  const c = AURA.scene[scheme];
  // The ground and its glows as React Native's own gradients, on the GPU (theme/sceneGradient.ts).
  const ground = useMemo(() => gradientStyle(sceneCss(c)), [c]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, ground]} />
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

// The white floor glow under the buddies.
function Floor() {
  const { scheme } = useTheme();
  const c = AURA.scene[scheme];
  const h = AURA.scene.floorHeight;
  const glow = useMemo(() => gradientStyle(floorCss(c.floor)), [c.floor]);
  return (
    <View
      style={[
        { position: 'absolute', left: '-10%', right: '-10%', bottom: -h / 2, height: h },
        glow,
      ]}
    />
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
