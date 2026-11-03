import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground, AuraBand, useGroundSize } from '@/aura/AuraBackground';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// A screen whose head partly gives way while its list is read (Kapsülün; the owner's call, 2
// Kasım, 11.5), as Telegram Android's head that slides away on scrolling: scrolling the content up,
// `hide` (and the foot) go and `stay` rises by `lift`, still in sight; scrolling back down, or at
// the top, they come back. `bar` never moves (B2). The content scrolls under the head and the foot,
// which stand on the screen's own ground (its picture cut to them, lined up with the one behind).
type Props = {
  bar: ReactNode;
  stay: ReactNode;
  hide: ReactNode;
  footer: ReactNode;
  // How far `stay` rises.
  lift: number;
  // The space between the head and the content.
  gap: number;
  children: ReactNode;
};

// A scroll this far in one event turns the head (less is a finger's wobble).
const STEP = 4;
// Never hidden this near the top.
const NEAR_TOP = SPACING[6];
const DURATION = MOTION.dissolve.outMs;
const EASE = Easing.bezier(...MOTION.curves.swap);
// The foot 12 above the bottom safe area, its parts 8 apart; the ground's soft edges.
const FOOTER_LIFT = 12;
const FOOTER_GAP = 8;
const EDGE_FADE = SPACING[5];

export function HidingHeadScreen({ bar, stay, hide, footer, lift, gap, children }: Props) {
  const { shape, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  // The ground's height, not the window's (the bands line up with it; 3 Kasım, 2.1).
  const { height: screen } = useGroundSize();
  const reduce = useReduceMotion();
  const side = shape.screenPadding;
  // The head's full height (under the status bar), where `stay` ends in it, the foot's height.
  const [head, setHead] = useState(0);
  const [stayFoot, setStayFoot] = useState(0);
  const [foot, setFoot] = useState(0);
  // `hide`'s touches stop while it is gone.
  const [gone, setGone] = useState(false);

  const target = useSharedValue(0);
  const shown = useSharedValue(0);
  const last = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    const y = e.contentOffset.y;
    const dy = y - last.get();
    last.set(y);
    let next = target.get();
    if (y <= NEAR_TOP) next = 0;
    else if (dy > STEP) next = 1;
    else if (dy < -STEP) next = 0;
    if (next === target.get()) return;
    target.set(next);
    shown.set(reduce ? next : withTiming(next, { duration: DURATION, easing: EASE }));
  });
  useAnimatedReaction(
    () => target.get() === 1,
    (now, before) => {
      if (now !== before) runOnJS(setGone)(now);
    },
  );

  const full = insets.top + head;
  const short = insets.top + stayFoot - lift + SPACING[2];
  const ground = useAnimatedStyle(() => ({
    height: interpolate(shown.get(), [0, 1], [full, Math.min(full, short)]),
  }));
  const groundEdge = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(shown.get(), [0, 1], [0, Math.min(full, short) - full]) },
    ],
  }));
  const rise = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift * shown.get() }],
  }));
  const fade = useAnimatedStyle(() => ({
    opacity: 1 - shown.get(),
    transform: [{ translateY: -lift * shown.get() }],
  }));
  const down = foot + insets.bottom;
  const footStyle = useAnimatedStyle(() => ({
    opacity: 1 - shown.get(),
    transform: [{ translateY: down * shown.get() }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: side,
          paddingTop: full + gap,
          paddingBottom: foot + insets.bottom + SPACING[4],
        }}
      >
        {head > 0 ? children : null}
      </Animated.ScrollView>

      {/* The foot's ground and the foot. */}
      {foot > 0 ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, footStyle]}>
          <AuraBand
            top={screen - down - FOOTER_LIFT}
            height={down + FOOTER_LIFT}
            fade={EDGE_FADE}
            direction="up"
          />
        </Animated.View>
      ) : null}
      <Animated.View
        pointerEvents={gone ? 'none' : 'box-none'}
        onLayout={(e) => setFoot(e.nativeEvent.layout.height)}
        style={[
          {
            position: 'absolute',
            left: side,
            right: side,
            bottom: insets.bottom + FOOTER_LIFT,
            gap: FOOTER_GAP,
          },
          footStyle,
        ]}
      >
        {footer}
      </Animated.View>

      {/* The head's ground: the screen's picture cut to the head, its foot fading out. */}
      {head > 0 ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
              ground,
            ]}
          >
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: screen }}>
              <AuraBackground />
            </View>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, groundEdge]}>
            <AuraBand top={full} height={0} fade={EDGE_FADE} direction="down" />
          </Animated.View>
        </>
      ) : null}
      <View
        pointerEvents="box-none"
        onLayout={(e) => setHead(e.nativeEvent.layout.height)}
        style={{ position: 'absolute', left: side, right: side, top: insets.top }}
      >
        {bar}
        <Animated.View
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setStayFoot(y + height);
          }}
          style={rise}
        >
          {stay}
        </Animated.View>
        <Animated.View pointerEvents={gone ? 'none' : 'box-none'} style={fade}>
          {hide}
        </Animated.View>
      </View>
    </View>
  );
}
