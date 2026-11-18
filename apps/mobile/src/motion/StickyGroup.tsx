import { type ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';

import { AURA, barBandCss, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';

import { ramp, stickyBandAt, stickyLift } from './scrollMath';
import { type ScreenScroll, useScreenScroll } from './ScrollScreen';

// Where the group pins and how far the band reaches under it (StickyField's own placing, for the
// group and what hangs under it), read when it is laid out and when the content changes size.
function place(scroll: ScreenScroll, anchor: View, extra: number) {
  anchor.measureInWindow((_x, top, _w, height) => {
    const viewport = scroll.viewportTop.get();
    const inContent = top - viewport + scroll.y.get();
    scroll.stickyAt.set(Math.max(0, inContent - KIT.size.stickyTop));
    const foot = viewport + KIT.size.stickyTop + height + extra + KIT.size.stickyBandPad;
    scroll.setReach(Math.max(0, Math.ceil(foot - AURA.topBar.bandHeight)));
  });
}

// Long enough for a screen's cascade to have ended (hareket.json → stagger, dissolve).
const SETTLED_MS = 700;

// Several parts that pin together (Keşfet's search and kind chips, yeni arayüz tuvali KesfetKaydir
// `.sbar2`; docs/decisions/kaydirma.md): StickyField's pin (the same offsets, the same band and
// status band) for a group instead of one field, and a part that hangs under the group and comes in
// as the content goes under it (Keşfet's Semte Git strip). The hanging part takes no room in the
// content, so nothing under the group moves when it comes in: it fades in linearly over the scroll
// `from` to `to` px past the pin, `height` tall and `gap` under the group, and the band reaches
// down to it as it comes.
export function StickyGroup({
  side,
  hang,
  children,
}: {
  // How far the group stands from the screen's sides, so its band reaches them.
  side: number;
  hang?: { node: ReactNode; height: number; gap: number; from: number; to: number };
  children: ReactNode;
}) {
  const scroll = useScreenScroll();
  const { scheme } = useTheme();
  const [anchor, setAnchor] = useState<View | null>(null);
  const [groupHeight, setGroupHeight] = useState(0);
  const [hangOn, setHangOn] = useState(false);
  const extra = hang ? hang.gap + hang.height : 0;
  const from = hang?.from ?? 0;
  const to = hang?.to ?? 0;
  const fadePx = MOTION.scroll.stickyFadePx;
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
  useAnimatedReaction(
    () => {
      if (!scroll) return false;
      const pinAt = scroll.stickyAt.get();
      return pinAt >= 0 && ramp(scroll.y.get(), pinAt + from, pinAt + to) > 0.6;
    },
    (on, was) => {
      if (on !== was) runOnJS(setHangOn)(on);
    },
  );
  const lift = useAnimatedStyle(() => {
    const y = scroll ? scroll.y.get() : 0;
    const pinAt = scroll ? scroll.stickyAt.get() : -1;
    return { transform: [{ translateY: stickyLift(y, pinAt) }] };
  });
  const top = KIT.size.stickyTop;
  const foot = Math.round(AURA.topBar.bandHeight * AURA.topBar.bandFade);
  const band = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 0 };
    const y = scroll.y.get();
    const pinAt = scroll.stickyAt.get();
    const arrived = pinAt < 0 ? 0 : ramp(y, pinAt + from, pinAt + to);
    return { opacity: stickyBandAt(y, pinAt, fadePx), bottom: -(foot + extra * arrived) };
  });
  const hung = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 0 };
    const pinAt = scroll.stickyAt.get();
    const arrived = pinAt < 0 ? 0 : ramp(scroll.y.get(), pinAt + from, pinAt + to);
    return { opacity: arrived, transform: [{ translateY: (arrived - 1) * extra * 0.2 }] };
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
        {children}
        {hang ? (
          <Animated.View
            pointerEvents={hangOn ? 'box-none' : 'none'}
            style={[
              { position: 'absolute', left: 0, right: 0, top: '100%', marginTop: hang.gap },
              hung,
            ]}
          >
            {hang.node}
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}
