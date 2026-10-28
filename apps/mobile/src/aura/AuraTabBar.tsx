import type { TabKey } from '@shared/navigation.ts';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { TAB_GLASS } from '@/theme/glass';
import { useTheme } from '@/theme/ThemeProvider';
import { TAB_BAR_GLASS, blursBehind } from '@/ui/backdrop';
import { LiquidGlass } from '@/ui/LiquidGlass';

import { ARRIVE, SPRING } from './motion';
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

  const left = useSharedValue(index < 0 ? at(0) : at(index));
  const right = useSharedValue(left.value + s.tab);
  const shown = useSharedValue(index < 0 ? 0 : 1);
  useEffect(() => {
    if (index < 0) {
      shown.value = withTiming(0, { duration: MOTION.dissolve.outMs });
      return;
    }
    const L = s.padding + index * step;
    const R = L + s.tab;
    shown.value = withTiming(1, { duration: MOTION.dissolve.outMs, easing: ARRIVE });
    if (reduce) {
      left.value = L;
      right.value = R;
      return;
    }
    // The edge that leads is the fast one.
    const toRight = L > left.value;
    left.value = withSpring(L, toRight ? SPRING.tabTrail : SPRING.tabLead);
    right.value = withSpring(R, toRight ? SPRING.tabLead : SPRING.tabTrail);
  }, [index, step, reduce, left, right, shown]);

  const disc = useAnimatedStyle(() => {
    const w = right.value - left.value;
    const stretch = Math.min(1, Math.max(0, (w - s.tab) / s.stretchFull));
    return {
      opacity: shown.value,
      left: left.value,
      width: w,
      transform: [{ scaleY: 1 - s.squash * stretch }],
    };
  });

  const glass = !opaque && TAB_BAR_GLASS && blursBehind(Platform.OS, Platform.Version);
  return (
    <View
      accessibilityRole="tablist"
      style={{ width, height: s.height, borderRadius: s.height / 2, boxShadow: a.shadow }}
    >
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
            top: (s.height - s.tab) / 2,
            height: s.tab,
            borderRadius: s.tab / 2,
            backgroundColor: a.disc,
            boxShadow: a.discShadow,
          },
          disc,
        ]}
      />
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
  const scale = useSharedValue(1);
  const pressed = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      testID={item.testID}
      onPress={onPress}
      onPressIn={() => {
        scale.set(withTiming(MOTION.press.scale, { duration: MOTION.press.downMs }));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, SPRING.press));
      }}
    >
      <Animated.View
        style={[
          { width: s.tab, height: s.tab, alignItems: 'center', justifyContent: 'center' },
          pressed,
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
