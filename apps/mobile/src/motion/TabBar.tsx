import type { TabKey } from '@shared/navigation.ts';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import {
  Animated as RNAnimated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { TabIcon } from '@/aura/TabGlyph';
import { shadowParts } from '@/components/NativeShadow';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useLabOff } from '@/lib/drawLab';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useReduceTransparency } from '@/lib/useReduceTransparency';
import { AURA, barEdgeCss, MOTION } from '@/theme/aura';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { tabRowShift } from './scrollMath';
import { usePress } from './Tap';

// Whether the tab bar is shrunk (1) or open (0), shared by the tabs' screens (ScrollScreen writes
// it from the scroll on the UI thread) and the bar (which springs to it). Outside the tabs: none.
const TabShrinkContext = createContext<SharedValue<number> | null>(null);

export function useTabShrink(): SharedValue<number> | null {
  return useContext(TabShrinkContext);
}

export function TabBarMotion({ children }: { children: ReactNode }) {
  const shrink = useSharedValue(0);
  return <TabShrinkContext.Provider value={shrink}>{children}</TabShrinkContext.Provider>;
}

export type TabItem = {
  key: TabKey;
  label: string;
  unread?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

type Props = {
  items: readonly TabItem[];
  selected: TabKey | null;
  onPress: (key: TabKey) => void;
  // Nothing behind that shows through (the Keşfet map): drawn on the solid ground.
  opaque?: boolean;
};

const s = AURA.tabBar;
const [OPEN_WIDTH, SHRUNK_WIDTH] = MOTION.tabMin.widths;

// The floating tab bar (docs/design/iskelet.md → 3.3): a glass capsule with labelled tabs (icon 22,
// label 10.5), the chosen one in a green-toned pill, its icon and label green. Scrolled down fast
// past MOTION.tabMin's threshold it shrinks to the chosen tab alone (350 → 76, the others fade) on
// springs.tabLead; scrolled up, near the top, on a tab change or pressed, it opens again. The glass
// is drawn, not live (theme/glass.ts → TAB_BAR_GLASS): a translucent fill, a top light and its
// shadow (tuval Kesfet: 66 high, 4 inside, the tabs 58 high); with "reduce transparency" or over the map the fill lies on the solid ground.
export function TabBar({ items, selected, onPress, opaque = false }: Props) {
  const { scheme } = useTheme();
  const a = AURA[scheme].tab;
  const reduce = useReduceMotion();
  const solid = useReduceTransparency() || opaque;
  const given = useTabShrink();
  const own = useSharedValue(0);
  const shrink = given ?? own;
  const width = Math.min(OPEN_WIDTH, useWindowDimensions().width - 2 * s.inset);
  const tabWidth = (width - 2 * s.padding) / Math.max(1, items.length);
  const index = Math.max(
    0,
    items.findIndex((i) => i.key === selected),
  );

  // The bar's fold (0 open, 1 shrunk) on its spring, and the pill under the chosen tab.
  const p = useSharedValue(0);
  const pill = useSharedValue(index * tabWidth);
  const [shrunk, setShrunk] = useState(false);
  const spring = MOTION.springs.tabLead;
  useAnimatedReaction(
    () => shrink.get(),
    (now, before) => {
      if (now === before) return;
      p.set(reduce ? now : withSpring(now, spring));
      runOnJS(setShrunk)(now === 1);
    },
    [reduce],
  );
  useEffect(() => {
    // A tab change opens the bar; the pill slides to the new tab.
    shrink.set(0);
    pill.set(reduce ? index * tabWidth : withSpring(index * tabWidth, spring));
  }, [index, tabWidth, reduce, shrink, pill, spring]);

  const barStyle = useAnimatedStyle(() => ({
    width: width + (SHRUNK_WIDTH - width) * p.get(),
  }));
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabRowShift(p.get(), index, tabWidth, s.padding, SHRUNK_WIDTH) }],
  }));
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pill.get() }] }));

  const shadowOff = useLabOff('golge');
  // The bar's glass (tuval Kesfet `.glass`): its fill, white edge, top light and shadow.
  const g = a;
  const shadow = shadowParts(shadowOff, g.shadow || undefined, undefined, s.height / 2);
  return (
    // The bar's place is as wide as the open bar: shrunk, it stays at that place's left with its
    // chosen tab (tuval Kesfet: `left: 20`, the width alone goes to 76); centred on its own width it
    // jumped to the middle of the screen (docs/denetim/pano-fark-2026-11.md → PF-03).
    <View pointerEvents="box-none" style={{ width, alignItems: 'flex-start' }}>
      <Animated.View
        accessibilityRole="tablist"
        style={[
          { height: s.height, borderRadius: s.height / 2, boxShadow: shadow.boxShadow },
          barStyle,
        ]}
      >
        {shadow.node}
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: s.height / 2, overflow: 'hidden' },
            gradientStyle(solid ? g.solid : g.fill),
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: s.height / 2,
                borderWidth: AURA.card.edgeWidth,
                borderColor: g.edge,
                boxShadow: g.inset || undefined,
              },
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: tabWidth * items.length,
                flexDirection: 'row',
                alignItems: 'center',
              },
              rowStyle,
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: (s.height - s.pillHeight) / 2,
                  width: tabWidth,
                  height: s.pillHeight,
                  borderRadius: s.pillHeight / 2,
                  backgroundColor: a.pill,
                },
                pillStyle,
              ]}
            />
            {items.map((item) => (
              <Tab
                key={item.key}
                item={item}
                width={tabWidth}
                active={item.key === selected}
                fold={p}
                onPress={() => onPress(item.key)}
              />
            ))}
          </Animated.View>
        </View>
        {shrunk ? (
          // Shrunk, a press anywhere on it opens it again (the chosen tab under it included).
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr.tabs.openBar}
            style={StyleSheet.absoluteFill}
            onPress={() => shrink.set(0)}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

function Tab({
  item,
  width,
  active,
  fold,
  onPress,
}: {
  item: TabItem;
  width: number;
  active: boolean;
  fold: SharedValue<number>;
  onPress: () => void;
}) {
  const { scheme, colors } = useTheme();
  const a = AURA[scheme].tab;
  const press = usePress();
  const ink = active ? a.onInk : a.off;
  // The others fade as the bar shrinks; the chosen one stays.
  const fade = useAnimatedStyle(() => ({ opacity: active ? 1 : 1 - fold.get() }));
  return (
    <Animated.View style={fade}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={item.accessibilityLabel ?? item.label}
        testID={item.testID}
        onPress={onPress}
        unstable_pressDelay={press.delay}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
      >
        <RNAnimated.View
          style={{
            width,
            height: s.pillHeight,
            alignItems: 'center',
            justifyContent: 'center',
            gap: s.labelGap,
            transform: [{ scale: press.scale }],
          }}
        >
          <View>
            <TabIcon tab={item.key} color={ink} size={s.iconLabelled} />
            {item.unread ? (
              <View
                style={{
                  position: 'absolute',
                  top: -s.dot / 3,
                  right: -s.dot / 3,
                  width: s.dot,
                  height: s.dot,
                  borderRadius: s.dot / 2,
                  backgroundColor: colors.buzz,
                  borderWidth: AURA.card.edgeWidth * 2,
                  borderColor: colors.canvas,
                }}
              />
            ) : null}
          </View>
          {/* One line: a long label shrinks to fit a narrow phone's tab, never cut. */}
          <View style={{ alignSelf: 'stretch', paddingHorizontal: s.labelGap }}>
            <Text
              variant="tabLabel"
              color={ink}
              align="center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={MIN_LABEL_SCALE}
            >
              {item.label}
            </Text>
          </View>
        </RNAnimated.View>
      </Pressable>
    </Animated.View>
  );
}
const MIN_LABEL_SCALE = 0.7;

// The tab bar's bottom edge (iskelet.md → 3.3): 160 high from the screen's foot, from clear to the
// ground at 92 %, so what scrolls goes under the bar without a hard cut. Drawn, not blurred.
export function TabBarEdge() {
  const { scheme } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, right: 0, bottom: 0, height: s.edgeHeight },
        gradientStyle(barEdgeCss(scheme)),
      ]}
    />
  );
}
