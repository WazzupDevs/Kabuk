import type { TabKey } from '@shared/navigation.ts';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { TAB_GLASS } from '@/theme/glass';
import { useTheme } from '@/theme/ThemeProvider';
import { TAB_BAR_GLASS, blursBehind } from '@/ui/backdrop';
import { boxShadowParts, shadowParts } from '@/components/NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { LiquidGlass } from '@/ui/LiquidGlass';

import { ARRIVE_RN, springConfig } from './motion';
import { TabGlyph } from './TabGlyph';

export type AuraTabItem = {
  key: TabKey;
  label: string;
  unread?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

type Props = {
  items: readonly AuraTabItem[];
  selected: TabKey | null;
  onPress: (key: TabKey) => void;
  // The screen the liquid glass shows (the focused tab's GlassTarget).
  glassTarget?: string | null;
  // Nothing behind that the glass can show (the Keşfet map): drawn without the glass.
  opaque?: boolean;
};

// The tab bar of the airy look (docs/design/aura → `.tabbar`): a glass capsule 18 in from each
// side, five round tabs and a white disc under the selected one. Switching, the disc slides to the
// new tab with its leading edge faster than its trailing edge, so it stretches on the way and
// gathers again (MOTION.springs.tabLead, tabTrail); the old icon fades to its outline and the new
// one pops in filled (TabGlyph). A pressed tab sinks and springs back.
const s = AURA.tabBar;

export function AuraTabBar({ items, selected, onPress, glassTarget, opaque = false }: Props) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const a = AURA[scheme].tab;
  const width = useWindowDimensions().width - 2 * s.inset;
  const step = (width - 2 * s.padding - s.tab) / Math.max(1, items.length - 1);
  const index = items.findIndex((i) => i.key === selected);
  const at = (i: number) => s.padding + i * step;

  // The disc's two edges, each on its own spring (native driver): the disc is drawn as wide as a
  // tab and stretched between them.
  const [left] = useState(() => new Animated.Value(at(Math.max(0, index))));
  const [right] = useState(() => new Animated.Value(at(Math.max(0, index)) + s.tab));
  const [shown] = useState(() => new Animated.Value(index < 0 ? 0 : 1));
  const was = useRef(index);
  useEffect(() => {
    const fade = Animated.timing(shown, {
      toValue: index < 0 ? 0 : 1,
      duration: MOTION.dissolve.outMs,
      easing: ARRIVE_RN,
      useNativeDriver: true,
    });
    fade.start();
    if (index < 0) return () => fade.stop();
    const L = s.padding + index * step;
    const R = L + s.tab;
    const from = was.current;
    was.current = index;
    if (reduce || from < 0 || from === index) {
      left.setValue(L);
      right.setValue(R);
      return () => fade.stop();
    }
    // The edge that leads is the fast one.
    const toRight = index > from;
    const move = Animated.parallel([
      Animated.spring(left, {
        ...springConfig(toRight ? MOTION.springs.tabTrail : MOTION.springs.tabLead),
        toValue: L,
      }),
      Animated.spring(right, {
        ...springConfig(toRight ? MOTION.springs.tabLead : MOTION.springs.tabTrail),
        toValue: R,
      }),
    ]);
    move.start();
    return () => {
      fade.stop();
      move.stop();
    };
  }, [index, step, reduce, left, right, shown]);

  const width2 = Animated.subtract(right, left);
  const disc = {
    opacity: shown,
    transform: [
      { translateX: Animated.add(Animated.multiply(Animated.add(left, right), 0.5), -s.tab / 2) },
      { scaleX: Animated.multiply(width2, 1 / s.tab) },
      {
        scaleY: width2.interpolate({
          inputRange: [s.tab, s.tab + s.stretchFull],
          outputRange: [1, 1 - s.squash],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const shadowOff = useLabOff('golge');
  const glassOff = useLabOff('cam');
  const barShadow = shadowParts(shadowOff, a.shadow || undefined, undefined, s.height / 2);
  // The sliding disc's shadow natively too: it moves on every tab change.
  const discShadow = boxShadowParts(shadowOff, a.discShadow, s.tab / 2);
  const glass = !opaque && !glassOff && TAB_BAR_GLASS && blursBehind(Platform.OS, Platform.Version);
  return (
    <View
      accessibilityRole="tablist"
      style={{
        width,
        height: s.height,
        borderRadius: s.height / 2,
        boxShadow: barShadow.boxShadow,
      }}
    >
      {barShadow.node}
      <View style={[StyleSheet.absoluteFill, { borderRadius: s.height / 2, overflow: 'hidden' }]}>
        {glass && glassTarget ? (
          <LiquidGlass
            targetId={glassTarget}
            cornerRadius={s.height / 2}
            ground={AURA[scheme].ground}
            blurRadius={TAB_GLASS.blur}
            refraction={TAB_GLASS.refraction}
            depth={TAB_GLASS.depth}
            dispersion={TAB_GLASS.dispersion}
            highlight={TAB_GLASS.highlight}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: glass ? a.fill : AURA[scheme].ground,
              borderRadius: s.height / 2,
              borderWidth: AURA.card.edgeWidth,
              borderColor: a.edge,
            },
          ]}
        />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            top: (s.height - s.tab) / 2,
            width: s.tab,
            height: s.tab,
            borderRadius: s.tab / 2,
            backgroundColor: a.disc,
            boxShadow: discShadow.boxShadow,
          },
          disc,
        ]}
      >
        {discShadow.node}
      </Animated.View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: s.padding,
        }}
      >
        {items.map((item) => (
          <Tab
            key={item.key}
            item={item}
            active={item.key === selected}
            color={a.off}
            onPress={() => onPress(item.key)}
          />
        ))}
      </View>
    </View>
  );
}

function Tab({
  item,
  active,
  color,
  onPress,
}: {
  item: AuraTabItem;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const press = (to: number) =>
    to < 1
      ? Animated.timing(scale, {
          toValue: to,
          duration: MOTION.press.downMs,
          useNativeDriver: true,
        }).start()
      : Animated.spring(scale, { ...springConfig(MOTION.springs.press), toValue: 1 }).start();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      testID={item.testID}
      onPress={onPress}
      onPressIn={() => press(MOTION.press.scale)}
      onPressOut={() => press(1)}
    >
      <Animated.View
        style={[
          { width: s.tab, height: s.tab, alignItems: 'center', justifyContent: 'center' },
          { transform: [{ scale }] },
        ]}
      >
        <TabGlyph tab={item.key} active={active} color={color} />
        {item.unread ? (
          <View
            style={{
              position: 'absolute',
              top: s.dotTop,
              right: s.dotRight,
              width: s.dot,
              height: s.dot,
              borderRadius: s.dot / 2,
              backgroundColor: AURA.mark.front,
              borderWidth: AURA.card.edgeWidth * 2,
              borderColor: colors.canvas,
            }}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
