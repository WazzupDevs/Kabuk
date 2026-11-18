import { type ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';

import { type ScreenScroll, useScreenScroll } from '@/motion/ScrollScreen';
import { ramp, stickyBandAt, stickyLift } from '@/motion/scrollMath';
import { AURA, barBandCss } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { EXPLORE } from '@/theme/explore';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

// Keşfet's pinned head (yeni arayüz tuvali KesfetKaydir `.sbar2`; docs/decisions/kaydirma.md: Keşfet
// stays as the board draws it): the search and the chips pin together under the top once they reach
// it, and Semte Git's small strip comes in under them as its card goes under the band. It is
// StickyField's pin (the same offsets, the same status band) for a group of parts instead of one
// field; the strip hangs under the group without taking room in the list, so nothing under moves
// when it comes in.
function place(scroll: ScreenScroll, anchor: View, extra: number) {
  anchor.measureInWindow((_x, top, _w, height) => {
    const viewport = scroll.viewportTop.get();
    const inContent = top - viewport + scroll.y.get();
    scroll.stickyAt.set(Math.max(0, inContent - KIT.size.stickyTop));
    const foot = viewport + KIT.size.stickyTop + height + extra + KIT.size.stickyBandPad;
    scroll.setReach(Math.max(0, Math.ceil(foot - AURA.topBar.bandHeight)));
  });
}

// Long enough for the screen's cascade to have ended (hareket.json → stagger, dissolve).
const SETTLED_MS = 700;

export function ExploreStickyHead({
  group,
  strip,
  side,
}: {
  group: ReactNode;
  // Semte Git's strip; null when the card has none to give (shut, outside, not read).
  strip: ReactNode;
  side: number;
}) {
  const scroll = useScreenScroll();
  const { scheme } = useTheme();
  const k = EXPLORE.sticky;
  const [anchor, setAnchor] = useState<View | null>(null);
  const [groupHeight, setGroupHeight] = useState(0);
  const [stripOn, setStripOn] = useState(false);
  const extra = strip ? k.stripGap + k.stripHeight : 0;
  const measure = () => {
    if (scroll && anchor) place(scroll, anchor, extra);
  };
  useEffect(() => {
    if (!scroll || !anchor) return undefined;
    const timer = setTimeout(() => place(scroll, anchor, extra), SETTLED_MS);
    return () => clearTimeout(timer);
  }, [scroll, anchor, extra]);
  // The content above may change size without moving the group within its own parent.
  useAnimatedReaction(
    () => scroll?.contentHeight.get() ?? 0,
    (now, before) => {
      if (before !== null && now !== before) runOnJS(measure)();
    },
  );
  // How far the strip has come in: from `from` to `to` past the pin, linear.
  const arrived = (): number => {
    'worklet';
    if (!scroll) return 0;
    const pinAt = scroll.stickyAt.get();
    return pinAt < 0 ? 0 : ramp(scroll.y.get(), pinAt + k.from, pinAt + k.to);
  };
  useAnimatedReaction(
    () => arrived() > 0.6,
    (on, was) => {
      if (on !== was) runOnJS(setStripOn)(on);
    },
  );
  const lift = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    const pinAt = scroll ? scroll.stickyAt.get() : -1;
    return { transform: [{ translateY: stickyLift(y, pinAt) }] };
  });
  const fadePx = 80;
  const top = KIT.size.stickyTop;
  const foot = Math.round(AURA.topBar.bandHeight * AURA.topBar.bandFade);
  const band = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 0 };
    return {
      opacity: stickyBandAt(scroll.y.get(), scroll.stickyAt.get(), fadePx),
      bottom: -(foot + extra * arrived()),
    };
  });
  const stripStyle = useAnimatedStyle(() => {
    const t = arrived();
    return { opacity: t, transform: [{ translateY: (1 - t) * -k.stripGap }] };
  });
  return (
    <View
      ref={setAnchor}
      collapsable={false}
      onLayout={(e) => {
        setGroupHeight(e.nativeEvent.layout.height);
        measure();
      }}
    >
      <Animated.View style={lift}>
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: -side, right: -side, top: -top },
            gradientStyle(barBandCss(scheme, top + groupHeight + foot)),
            band,
          ]}
        />
        {group}
        {strip ? (
          <Animated.View
            pointerEvents={stripOn ? 'box-none' : 'none'}
            style={[
              { position: 'absolute', left: 0, right: 0, top: '100%', marginTop: k.stripGap },
              stripStyle,
            ]}
          >
            {strip}
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}
