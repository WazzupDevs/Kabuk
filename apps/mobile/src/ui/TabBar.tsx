import { BlurView } from 'expo-blur';
import { type RefObject, useState } from 'react';
import { PixelRatio, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { V46_TAB_BAR, type V46TabKey } from '@/theme/parts.generated';
import { gradientStyle } from '@/theme/gradient';
import { V46_PALETTE } from '@/theme/tokens.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { androidBlur, blursBehind } from './backdrop';
import { transitionStyle } from './motion';
import { useLayoutWidth } from './narrow';
import { V46Svg } from './V46Svg';
import { VenueGlyph } from './VenueGlyph';

export type TabBarItem = {
  key: V46TabKey;
  label: string;
  // An unread dot on the icon (v46 `.tdot`: Mesajlar while something is unread).
  unread?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

type Props = {
  items: readonly TabBarItem[];
  selected: V46TabKey | null;
  onPress: (key: V46TabKey) => void;
  // What the bar blurs behind it (an expo-blur `BlurTargetView` around the screen; Android blurs
  // only a target). Without one the bar is its ground alone, as over an empty screen.
  blurTarget?: RefObject<View | null>;
  // Nothing behind that can be blurred (the Keşfet map: a GL surface Dimezis cannot capture): the
  // bar is drawn opaque, as below Android 12.
  opaque?: boolean;
};

// v46's tab bar (`nav.nav`, docs/design/v46: the inventory's alt-sekme-* and the measured Keşfet
// and Aktiviteler bars): a frosted pill as wide as the screen less its inset on each side, up to
// v46's widest; the screen behind it blurred (`backdrop-filter: blur(20px)`; expo-blur, see
// backdrop.ts), under a light gradient, a white edge and its shadows. Five tabs share it evenly:
// an icon in a pill (`.ic`) over a label. The selected tab's pill takes its gradient, edge and
// shadow (the shadow eases, 200 ms), its icon and label the ink colour and the label a heavier
// weight; Mekan's icon is the mark (VenueGlyph). A pressed tab shrinks (`.va button:active`). The
// bar sits where the caller puts it (v46: 12 above the bottom, above the safe area). Below Android
// 12 nothing blurs, so the bar is opaque: v46's screen ground under the gradient (backdrop.ts); so
// is it over what cannot be blurred (`opaque`).
export function TabBar({ items, selected, onPress, blurTarget, opaque = false }: Props) {
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const t = V46_TAB_BAR[scheme];
  const width = Math.min(t.maxWidth, useLayoutWidth() - 2 * t.inset);
  const blur = androidBlur(t.backdrop.blur, PixelRatio.get());
  const solid = opaque || !blursBehind(Platform.OS, Platform.Version);
  return (
    <View
      accessibilityRole="tablist"
      style={{
        width,
        height: t.height,
        borderRadius: t.radius,
        boxShadow: t.shadow.outer ?? undefined,
      }}
    >
      <View style={[StyleSheet.absoluteFill, { borderRadius: t.radius, overflow: 'hidden' }]}>
        {solid ? (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: V46_PALETTE[scheme].canvas }]}
          />
        ) : blurTarget ? (
          <BlurView
            blurTarget={blurTarget}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={blur.intensity}
            blurReductionFactor={blur.reductionFactor}
            tint={scheme}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            gradientStyle(t.gradient),
            {
              borderRadius: t.radius,
              borderWidth: t.border.width,
              borderColor: t.border.color,
              boxShadow: t.shadow.inset ?? undefined,
            },
          ]}
        />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          paddingTop: t.padding[0],
          paddingRight: t.padding[1],
          paddingBottom: t.padding[2],
          paddingLeft: t.padding[3],
        }}
      >
        {items.map((item) => (
          <Tab
            key={item.key}
            item={item}
            active={item.key === selected}
            reduce={reduce}
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
  reduce,
  onPress,
}: {
  item: TabBarItem;
  active: boolean;
  reduce: boolean;
  onPress: () => void;
}) {
  const { scheme } = useTheme();
  const t = V46_TAB_BAR[scheme];
  const [pressing, setPressing] = useState(false);
  const pill = active ? t.pill.active : t.pill.inactive;
  const label = active ? t.label.active : t.label.inactive;
  const iconColor = active ? t.icon.active : t.icon.inactive;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      testID={item.testID}
      onPress={onPress}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.tab.gap,
        transform: [{ scale: pressing ? t.tab.pressedScale : 1 }],
      }}
    >
      <Animated.View
        style={[
          {
            width: t.pill.size[0],
            height: t.pill.size[1],
            borderRadius: t.pill.radius,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pill.bg ?? undefined,
            ...(pill.gradient ? gradientStyle(pill.gradient) : {}),
            // v46 keeps a transparent edge on the pill not selected (`border: 1px solid
            // transparent`), so the icon does not move.
            borderWidth: pill.border?.width ?? 0,
            borderColor: pill.border?.color ?? 'transparent',
            boxShadow: pill.shadow ?? undefined,
          },
          transitionStyle(reduce ? V46_TAB_BAR.reduced.pill : t.pill.transitions),
        ]}
      >
        {item.key === 'venue' ? (
          <VenueGlyph active={active} size={t.icon.size} />
        ) : (
          <V46Svg drawing={V46_TAB_BAR.icons[item.key]} size={t.icon.size} color={iconColor} />
        )}
        {item.unread ? (
          <View style={{ position: 'absolute', top: t.dot.top, right: t.dot.right }}>
            <UnreadDot />
          </View>
        ) : null}
      </Animated.View>
      {/* One line; only where it does not fit (a 320 dp screen, the largest text) it shrinks, like
          a button's label. As wide as its tab, so the shrink has a width to fit. */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={MIN_FONT_SCALE}
        style={[
          v46FontStyle(label.font, label.letterSpacing),
          { color: label.color, textAlign: 'center', alignSelf: 'stretch' },
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

// As a button's label (Button.tsx): at most half its size.
const MIN_FONT_SCALE = 0.5;

// The unread dot on a tab's icon (v46 `.tdot`, the inventory's bildirim-noktasi): a small round
// with a ring of the bar's ground around it.
export function UnreadDot() {
  const { scheme } = useTheme();
  const d = V46_TAB_BAR[scheme].dot;
  return (
    <View
      style={{
        width: d.size[0],
        height: d.size[1],
        borderRadius: d.size[0] / 2,
        backgroundColor: d.bg,
        boxShadow: d.shadow ?? undefined,
      }}
    />
  );
}
