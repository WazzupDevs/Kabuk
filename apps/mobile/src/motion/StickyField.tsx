import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';

import { AURA, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';

import { stickyFadeAt, stickyLift } from './scrollMath';
import { type ScreenScroll, useScreenScroll } from './ScrollScreen';

// Where the field pins (its top in the content less its place under the bar) and how far the band
// reaches under it, from its anchor's place in the window. Read when it is laid out and when the
// content changes size, never on a frame.
function place(scroll: ScreenScroll, anchor: View) {
  anchor.measureInWindow((_x, top, _w, height) => {
    const viewport = scroll.viewportTop.get();
    const inContent = top - viewport + scroll.y.get();
    scroll.stickyAt.set(Math.max(0, inContent - KIT.size.stickyTop));
    // From the band's own foot down to the pinned field's foot, and a little more.
    const foot = viewport + KIT.size.stickyTop + height + KIT.size.stickyBandPad;
    scroll.setReach(Math.max(0, Math.ceil(foot - AURA.topBar.bandHeight)));
  });
}

// A screen's main search or filter (docs/design/iskelet.md → 3.2: Keşfet's search capsule,
// Aktiviteler's Etkinlikler and Geçmiş, Mesajlar's search): it scrolls with the content until it
// reaches the bar (KIT.size.stickyTop under the top of the scrolling body) and stays there, with no
// title bar of its own; once pinned, the band reaches below it (TopBar → BarBand). Screen draws it
// over the parts after it. On a screen that does not scroll it stays in place.
export function StickyField({ children }: { children: ReactNode }) {
  const scroll = useScreenScroll();
  const [anchor, setAnchor] = useState<View | null>(null);
  const measure = () => {
    if (scroll && anchor) place(scroll, anchor);
  };
  // The content above it may change size without moving it within its own parent.
  useAnimatedReaction(
    () => scroll?.contentHeight.get() ?? 0,
    (now, before) => {
      if (before !== null && now !== before) runOnJS(measure)();
    },
  );
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: scroll ? stickyLift(scroll.y.get(), scroll.stickyAt.get()) : 0 }],
  }));
  return (
    // The anchor stays where the content puts it; only the field inside it moves.
    <View ref={setAnchor} collapsable={false} onLayout={measure}>
      <Animated.View style={style}>{children}</Animated.View>
    </View>
  );
}

// What is above a sticky field (Aktiviteler's gift card): over the last MOTION.scroll.stickyFadePx
// before the field pins it fades out and shrinks to 0.95.
export function StickyFade({ children }: { children: ReactNode }) {
  const scroll = useScreenScroll();
  const fadePx = MOTION.scroll.stickyFadePx;
  const scaleTo = AURA.topBar.stickyScale;
  const style = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 1, transform: [{ scale: 1 }] };
    const f = stickyFadeAt(scroll.y.get(), scroll.stickyAt.get(), fadePx, scaleTo);
    return { opacity: f.opacity, transform: [{ scale: f.scale }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}
